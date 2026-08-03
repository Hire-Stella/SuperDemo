import { Controller, Get, HttpCode, Post, Req, Res, UnauthorizedException } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { LoginInput, type LoginOutput, type SessionUser } from '@fit-ai/contracts';
import { AuthService } from './auth.service';
import { CurrentUser, Public } from './guards';
import { ZodBody } from '../shared/zod.pipe';

export const REFRESH_COOKIE = 'fitai_rt';

/**
 * Cookie path must include the global route prefix.
 *
 * main.ts sets `setGlobalPrefix('api')`, so the endpoint is `/api/auth/refresh`,
 * not `/auth/refresh`. A cookie scoped to `/auth` is never sent to `/api/auth/*`
 * — which silently broke session restore on every page reload.
 */
const REFRESH_COOKIE_PATH = '/api/auth';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /**
   * The refresh token lives in an httpOnly cookie so JavaScript — and therefore
   * XSS — cannot read it. The access token is returned in the body and the web
   * app holds it in memory only.
   */
  private setRefreshCookie(res: Response, token: string): void {
    res.cookie(REFRESH_COOKIE, token, {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      path: REFRESH_COOKIE_PATH,
      maxAge: 30 * 864e5,
    });
  }

  private readRefreshCookie(req: Request): string | undefined {
    return (req.cookies as Record<string, string> | undefined)?.[REFRESH_COOKIE];
  }

  @Public()
  @Throttle({ default: { limit: 8, ttl: 60_000 } })
  @Post('login')
  @HttpCode(200)
  async login(
    @ZodBody(LoginInput) body: LoginInput,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginOutput> {
    const user = await this.auth.validate(body.email, body.password);
    const refresh = await this.auth.issueRefreshToken(user.id, {
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    });
    this.setRefreshCookie(res, refresh);
    return { user, accessToken: this.auth.signAccessToken(user) };
  }

  @Public()
  @Post('refresh')
  @HttpCode(200)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginOutput> {
    const token = this.readRefreshCookie(req);
    // A missing cookie and an invalid one are both "sign in again" — same shape.
    if (!token) throw new UnauthorizedException('No session');

    const result = await this.auth.rotateRefreshToken(token, {
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    });
    this.setRefreshCookie(res, result.refreshToken);
    return { user: result.user, accessToken: result.accessToken };
  }

  @Public()
  @Post('logout')
  @HttpCode(204)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<void> {
    const token = this.readRefreshCookie(req);
    if (token) await this.auth.revokeRefreshToken(token);
    res.clearCookie(REFRESH_COOKIE, { path: REFRESH_COOKIE_PATH });
  }

  @Get('me')
  me(@CurrentUser() user: SessionUser): SessionUser {
    return user;
  }
}
