import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  SetMetadata,
  UnauthorizedException,
  ForbiddenException,
  createParamDecorator,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { Role, SessionUser } from '@fit-ai/contracts';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

export const IS_PUBLIC = 'isPublic';
export const ROLES = 'roles';

/** Skip authentication for this route. */
export const Public = () => SetMetadata(IS_PUBLIC, true);

/** Restrict a route to specific roles. */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES, roles);

export interface AuthedRequest extends Request {
  user?: SessionUser;
}

/** Injects the authenticated user into a handler parameter. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): SessionUser => {
    const req = ctx.switchToHttp().getRequest<AuthedRequest>();
    if (!req.user) throw new UnauthorizedException();
    return req.user;
  },
);

/**
 * Global auth guard. Applied app-wide so a new controller is protected by
 * default — opting out requires an explicit @Public(), which is visible in
 * review. The inverse (opt-in protection) is how endpoints get forgotten.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly auth: AuthService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    if (ctx.getType() !== 'http') return true;

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (isPublic) return true;

    const req = ctx.switchToHttp().getRequest<AuthedRequest>();
    const header = req.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
    if (!token) throw new UnauthorizedException('Missing access token');

    let payload;
    try {
      payload = this.auth.verifyAccessToken(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.isActive) throw new UnauthorizedException('Account unavailable');

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      location: user.location,
      timezone: user.timezone,
      skills: user.skills,
      avatarColor: user.avatarColor,
    };

    const required = this.reflector.getAllAndOverride<Role[]>(ROLES, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (required?.length && !required.includes(user.role)) {
      throw new ForbiddenException(
        `This action requires one of: ${required.join(', ')}. You are ${user.role}.`,
      );
    }

    return true;
  }
}
