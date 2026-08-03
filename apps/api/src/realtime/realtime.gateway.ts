import { Logger } from '@nestjs/common';
import {
  type OnGatewayConnection,
  type OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import {
  Rooms,
  type ClientToServerEvents,
  type ServerToClientEvents,
  type SocketData,
} from '@fit-ai/contracts';
import { AuthService } from '../auth/auth.service';
import { PrismaService } from '../prisma/prisma.service';

type AppServer = Server<ClientToServerEvents, ServerToClientEvents, never, SocketData>;
type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents, never, SocketData>;

/**
 * Single WebSocket gateway for the whole app.
 *
 * Auth happens in the handshake, not per-message: an unauthenticated socket is
 * disconnected before it can join any room. Room membership is derived from the
 * verified token, so a client cannot subscribe itself to another agent's feed.
 */
@WebSocketGateway({
  cors: { origin: process.env.WEB_ORIGIN ?? 'http://localhost:3000', credentials: true },
  transports: ['websocket', 'polling'],
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly log = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  server!: AppServer;

  constructor(
    private readonly auth: AuthService,
    private readonly prisma: PrismaService,
  ) {}

  async handleConnection(socket: AppSocket): Promise<void> {
    const token =
      (socket.handshake.auth as { token?: string } | undefined)?.token ??
      (typeof socket.handshake.query.token === 'string' ? socket.handshake.query.token : undefined);

    if (!token) {
      socket.emit('system.notice', { level: 'error', message: 'Authentication required' });
      socket.disconnect(true);
      return;
    }

    try {
      const payload = this.auth.verifyAccessToken(token);
      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user?.isActive) throw new Error('inactive');

      socket.data.userId = user.id;
      socket.data.role = user.role;
      socket.data.name = user.name;

      await socket.join(Rooms.user(user.id));
      await socket.join(Rooms.all);
      if (user.role === 'SUPERVISOR' || user.role === 'ADMIN') {
        await socket.join(Rooms.supervisors);
      }

      // Presence follows the socket: an agent with a live browser is reachable.
      await this.prisma.agentState.updateMany({
        where: { userId: user.id, status: 'OFFLINE' },
        data: { status: 'AVAILABLE', since: new Date(), lastSeenAt: new Date() },
      });
      await this.prisma.agentState.update({
        where: { userId: user.id },
        data: { lastSeenAt: new Date() },
      });

      this.log.log(`${user.name} connected (${socket.id})`);
    } catch {
      socket.emit('system.notice', { level: 'error', message: 'Invalid or expired session' });
      socket.disconnect(true);
    }
  }

  async handleDisconnect(socket: AppSocket): Promise<void> {
    const userId = socket.data.userId;
    if (!userId) return;

    // Only flip to OFFLINE when the agent has no other tab open — agents keep
    // several windows and we must not mark them unavailable mid-call.
    const remaining = await this.server.in(Rooms.user(userId)).fetchSockets();
    if (remaining.length === 0) {
      await this.prisma.agentState
        .update({
          where: { userId },
          data: { status: 'OFFLINE', since: new Date(), currentCallId: null },
        })
        .catch(() => undefined);
      await this.prisma.agentStateEvent
        .create({ data: { userId, to: 'OFFLINE', reason: 'socket disconnected' } })
        .catch(() => undefined);
    }
    this.log.log(`${socket.data.name ?? userId} disconnected`);
  }

  @SubscribeMessage('call.subscribe')
  async onCallSubscribe(
    @ConnectedSocket() socket: AppSocket,
    @MessageBody() body: { callId: string },
  ): Promise<void> {
    if (typeof body?.callId === 'string') await socket.join(Rooms.call(body.callId));
  }

  @SubscribeMessage('call.unsubscribe')
  async onCallUnsubscribe(
    @ConnectedSocket() socket: AppSocket,
    @MessageBody() body: { callId: string },
  ): Promise<void> {
    if (typeof body?.callId === 'string') await socket.leave(Rooms.call(body.callId));
  }

  @SubscribeMessage('conversation.subscribe')
  async onConversationSubscribe(
    @ConnectedSocket() socket: AppSocket,
    @MessageBody() body: { conversationId: string },
  ): Promise<void> {
    if (typeof body?.conversationId === 'string') {
      await socket.join(Rooms.conversation(body.conversationId));
    }
  }

  @SubscribeMessage('conversation.unsubscribe')
  async onConversationUnsubscribe(
    @ConnectedSocket() socket: AppSocket,
    @MessageBody() body: { conversationId: string },
  ): Promise<void> {
    if (typeof body?.conversationId === 'string') {
      await socket.leave(Rooms.conversation(body.conversationId));
    }
  }

  @SubscribeMessage('agent.heartbeat')
  async onHeartbeat(@ConnectedSocket() socket: AppSocket): Promise<void> {
    if (!socket.data.userId) return;
    await this.prisma.agentState
      .update({ where: { userId: socket.data.userId }, data: { lastSeenAt: new Date() } })
      .catch(() => undefined);
  }
}
