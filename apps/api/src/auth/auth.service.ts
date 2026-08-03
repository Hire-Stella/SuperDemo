import {
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import argon2 from 'argon2';
import { createHash, randomBytes } from 'node:crypto';
import type { ApiEnv, SessionUser } from '@fit-ai/contracts';
import { ENV } from '../config/config.module';
import { PrismaService } from '../prisma/prisma.service';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  name: string;
}

/** Refresh tokens are stored hashed — a DB leak must not yield usable tokens. */
const hashToken = (t: string) => createHash('sha256').update(t).digest('hex');

@Injectable()
export class AuthService {
  private readonly log = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    @Inject(ENV) private readonly env: ApiEnv,
  ) {}

  async validate(email: string, password: string): Promise<SessionUser> {
    const user = await this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });

    // Verify against a dummy hash when the user is absent so the response time
    // doesn't reveal whether an address exists.
    if (!user) {
      await argon2.verify(
        '$argon2id$v=19$m=65536,t=3,p=4$c29tZXNhbHRzb21lc2FsdA$RdescudvJCsgt3ub+b+dWRWJTmaaJObG',
        password,
      ).catch(() => false);
      throw new UnauthorizedException('Invalid email or password');
    }

    const ok = await argon2.verify(user.passwordHash, password).catch(() => false);
    if (!ok) throw new UnauthorizedException('Invalid email or password');
    if (!user.isActive) throw new ForbiddenException('This account has been deactivated');

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      location: user.location,
      timezone: user.timezone,
      skills: user.skills,
      avatarColor: user.avatarColor,
    };
  }

  signAccessToken(user: SessionUser): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };
    return this.jwt.sign(payload, {
      secret: this.env.JWT_ACCESS_SECRET,
      // jsonwebtoken types `expiresIn` as a literal-union of duration strings.
      // The value is validated by the env schema, so widen it here rather than
      // duplicating that union in the config.
      expiresIn: this.env.ACCESS_TOKEN_TTL as `${number}${'s' | 'm' | 'h' | 'd'}`,
    });
  }

  verifyAccessToken(token: string): JwtPayload {
    return this.jwt.verify<JwtPayload>(token, { secret: this.env.JWT_ACCESS_SECRET });
  }

  /** Issue an opaque refresh token and persist only its hash. */
  async issueRefreshToken(
    userId: string,
    meta: { userAgent?: string; ip?: string },
  ): Promise<string> {
    const token = randomBytes(48).toString('base64url');
    const days = Number.parseInt(this.env.REFRESH_TOKEN_TTL, 10) || 30;
    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + days * 864e5),
        userAgent: meta.userAgent?.slice(0, 250),
        ip: meta.ip,
      },
    });
    return token;
  }

  /**
   * Rotate a refresh token.
   *
   * Reuse of an already-revoked token means it was stolen (the legitimate
   * client would hold the newer one), so every session for that user is killed.
   */
  async rotateRefreshToken(
    token: string,
    meta: { userAgent?: string; ip?: string },
  ): Promise<{ user: SessionUser; accessToken: string; refreshToken: string }> {
    const existing = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: hashToken(token) },
      include: { user: true },
    });

    if (!existing) throw new UnauthorizedException('Invalid refresh token');

    if (existing.revokedAt) {
      this.log.warn(
        `Refresh token reuse detected for user ${existing.userId} — revoking all sessions`,
      );
      await this.prisma.refreshToken.updateMany({
        where: { userId: existing.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException('Session invalidated. Please sign in again.');
    }

    if (existing.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expired');
    }
    if (!existing.user.isActive) {
      throw new ForbiddenException('This account has been deactivated');
    }

    await this.prisma.refreshToken.update({
      where: { id: existing.id },
      data: { revokedAt: new Date() },
    });

    const user: SessionUser = {
      id: existing.user.id,
      email: existing.user.email,
      name: existing.user.name,
      role: existing.user.role,
      location: existing.user.location,
      timezone: existing.user.timezone,
      skills: existing.user.skills,
      avatarColor: existing.user.avatarColor,
    };

    return {
      user,
      accessToken: this.signAccessToken(user),
      refreshToken: await this.issueRefreshToken(user.id, meta),
    };
  }

  async revokeRefreshToken(token: string): Promise<void> {
    await this.prisma.refreshToken
      .updateMany({
        where: { tokenHash: hashToken(token), revokedAt: null },
        data: { revokedAt: new Date() },
      })
      .catch(() => undefined);
  }

  async hashPassword(plain: string): Promise<string> {
    return argon2.hash(plain, { type: argon2.argon2id });
  }
}
