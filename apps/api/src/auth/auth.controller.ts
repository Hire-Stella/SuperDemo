import { Controller, Get, HttpCode, Inject, Post, Req, Res, UnauthorizedException } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { CookieOptions, Request, Response } from 'express';
import { type ApiEnv, LoginInput, type LoginOutput, type SessionUser } from '@superdemo/contracts';
import { AuthService } from './auth.service';
import { CurrentUser, Public } from './guards';
import { ZodBody } from '../shared/zod.pipe';
import { ENV } from '../config/config.module';

export const REFRESH_COOKIE = 'fitai_rt';

/**
 * Cookie path must include the global route prefix.
 *
 * main.ts sets `setGlobalPrefix('api')`, so the endpoint is `/api/auth/refresh`,
 * not `/auth/refresh`. A cookie scoped to `/auth` is never sent to `/api/auth/*`
 * — which silently broke session restore on every page reload.
 */
const REFRESH_COOKIE_PATH = '/api/auth';

/** Hostname of a URL, or undefined if it is unset or unparseable. */
function hostOf(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    return new URL(url).hostname;
  } catch {
    return undefined;
  }
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    @Inject(ENV) private readonly env: ApiEnv,
  ) {}

  /**
   * SameSite has to follow the deployment rather than be a constant.
   *
   * `strict` is correct when the dashboard and the API are one site, which is
   * how development runs — both on localhost, different ports, still same-site.
   * In production they are not: the dashboard is on vercel.app and the API on
   * azurecontainerapps.io, different registrable domains, so the refresh cookie
   * is cross-site and a `strict` cookie is never sent back.
   *
   * The symptom is worth recognising, because it does not look like a cookie
   * problem: POST /api/auth/refresh returns 401 with no `cookie` header on the
   * request at all, which reads as an expired session on every page load.
   *
   * `none` is only honoured alongside `secure`, so the two move together.
   *
   * Putting both halves on one registrable domain — app.example.com and
   * api.example.com — is the better answer, and would let this go back to
   * `lax`. Until then this keeps sessions working across the split.
   */
  private refreshCookieOptions(): CookieOptions {
    const webHost = hostOf(this.env.WEB_ORIGIN);
    const apiHost = hostOf(this.env.PUBLIC_BASE_URL);
    const crossSite = Boolean(webHost && apiHost && webHost !== apiHost);
    return {
      httpOnly: true,
      sameSite: crossSite ? 'none' : 'strict',
      secure: crossSite || this.env.NODE_ENV === 'production',
      path: REFRESH_COOKIE_PATH,
    };
  }

  /**
   * The refresh token lives in an httpOnly cookie so JavaScript — and therefore
   * XSS — cannot read it. The access token is returned in the body and the web
   * app holds it in memory only.
   */
  private setRefreshCookie(res: Response, token: string): void {
    res.cookie(REFRESH_COOKIE, token, { ...this.refreshCookieOptions(), maxAge: 30 * 864e5 });
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
    // Same attributes it was set with, otherwise the browser keeps it: a clear
    // only matches on name, domain, path — and sameSite/secure must agree.
    res.clearCookie(REFRESH_COOKIE, this.refreshCookieOptions());
  }

  @Get('me')
  me(@CurrentUser() user: SessionUser): SessionUser {
    return user;
  }
}
