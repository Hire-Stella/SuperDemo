import { Injectable, Logger } from '@nestjs/common';
import { Rooms, type ServerToClientEvents } from '@fit-ai/contracts';
import { RealtimeGateway } from './realtime.gateway';

type EventName = keyof ServerToClientEvents;
type PayloadOf<E extends EventName> = Parameters<ServerToClientEvents[E]>[0];

/**
 * Typed emitter used by every other module.
 *
 * Services depend on this rather than on the gateway directly, so nothing
 * outside `realtime/` touches socket.io. The generic signature means a wrong
 * payload for an event is a compile error.
 */
@Injectable()
export class RealtimeService {
  private readonly log = new Logger(RealtimeService.name);

  constructor(private readonly gateway: RealtimeGateway) {}

  private emit<E extends EventName>(room: string, event: E, payload: PayloadOf<E>): void {
    // The gateway's server is undefined until Nest has bootstrapped the adapter;
    // during startup (e.g. the autopilot firing early) that is harmless.
    if (!this.gateway.server) {
      this.log.debug(`dropped ${String(event)} — gateway not ready`);
      return;
    }
    // socket.io's emit signature reconstructs acknowledgement types that don't
    // apply to fire-and-forget events. The public methods below are fully typed,
    // so the cast is confined to this one line.
    const emitter = this.gateway.server.to(room) as unknown as {
      emit: (event: string, payload: unknown) => void;
    };
    emitter.emit(event as string, payload);
  }

  toUser<E extends EventName>(userId: string, event: E, payload: PayloadOf<E>): void {
    this.emit(Rooms.user(userId), event, payload);
  }

  toSupervisors<E extends EventName>(event: E, payload: PayloadOf<E>): void {
    this.emit(Rooms.supervisors, event, payload);
  }

  toAll<E extends EventName>(event: E, payload: PayloadOf<E>): void {
    this.emit(Rooms.all, event, payload);
  }

  toCall<E extends EventName>(callId: string, event: E, payload: PayloadOf<E>): void {
    this.emit(Rooms.call(callId), event, payload);
  }

  toConversation<E extends EventName>(
    conversationId: string,
    event: E,
    payload: PayloadOf<E>,
  ): void {
    this.emit(Rooms.conversation(conversationId), event, payload);
  }

  /** How many live sockets a user has. Used to decide reachability. */
  async socketCount(userId: string): Promise<number> {
    if (!this.gateway.server) return 0;
    const sockets = await this.gateway.server.in(Rooms.user(userId)).fetchSockets();
    return sockets.length;
  }
}
