import {
  BadRequestException,
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
import type { Role, SessionUser } from '@superdemo/contracts';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../tenancy/tenant-context.service';

export const IS_PUBLIC = 'isPublic';
export const ROLES = 'roles';
export const IS_PLATFORM = 'isPlatform';

/** Skip authentication for this route. */
export const Public = () => SetMetadata(IS_PUBLIC, true);

/** Restrict a route to specific roles. */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES, roles);

/**
 * Marks a route as platform-level rather than tenant-level: it manages
 * organisations themselves and is the only place a SUPERADMIN may write.
 */
export const Platform = () => SetMetadata(IS_PLATFORM, true);

/** Header a superadmin sends to read one tenant's data. */
export const ORG_HEADER = 'x-org-id';

const READ_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

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
 *
 * It is also where tenancy is decided: this is the only place that writes an
 * orgId into the request context, so there is exactly one answer to "which org
 * is this request allowed to touch".
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly auth: AuthService,
    private readonly prisma: PrismaService,
    private readonly tenants: TenantContext,
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

    // Unscoped by design: the context has no org yet, and this lookup is what
    // decides it. Reading the org from the database rather than trusting the
    // token's claim means deactivating a centre takes effect on the next
    // request instead of whenever its users' tokens happen to expire.
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        org: {
          select: {
            id: true,
            name: true,
            industry: true,
            isActive: true,
            themePreset: true,
            themeTokens: true,
            logoUrl: true,
            tagline: true,
            websiteEnabled: true,
            simulatorEnabled: true,
            demoCallsEnabled: true,
          },
        },
      },
    });
    if (!user || !user.isActive) throw new UnauthorizedException('Account unavailable');

    const isPlatformRoute =
      this.reflector.getAllAndOverride<boolean>(IS_PLATFORM, [
        ctx.getHandler(),
        ctx.getClass(),
      ]) ?? false;

    if (user.role === 'SUPERADMIN') {
      await this.applySuperadminScope(req, isPlatformRoute);
    } else {
      if (!user.orgId || !user.org) {
        throw new ForbiddenException('This account is not attached to an organisation');
      }
      if (!user.org.isActive) {
        throw new ForbiddenException(`${user.org.name} has been deactivated`);
      }
      if (isPlatformRoute) {
        throw new ForbiddenException('Platform administration is not available to this account');
      }
      this.tenants.set({ orgId: user.orgId, actorId: user.id });
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      orgId: user.orgId,
      orgName: user.org?.name ?? null,
      orgIndustry: user.org?.industry ?? null,
      orgThemePreset: (user.org?.themePreset as SessionUser['orgThemePreset']) ?? null,
      orgThemeTokens: (user.org?.themeTokens as SessionUser['orgThemeTokens']) ?? null,
      orgLogoUrl: user.org?.logoUrl ?? null,
      orgTagline: user.org?.tagline ?? null,
      orgWebsiteEnabled: user.org?.websiteEnabled ?? null,
      orgSimulatorEnabled: user.org?.simulatorEnabled ?? null,
      orgDemoCallsEnabled: user.org?.demoCallsEnabled ?? null,
      location: user.location,
      timezone: user.timezone,
      skills: user.skills,
      avatarColor: user.avatarColor,
    };

    const required = this.reflector.getAllAndOverride<Role[]>(ROLES, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);

    // A superadmin satisfies any tenant role requirement, but only for reads —
    // the write ban above is what makes that safe, so the two rules must be
    // read together.
    if (user.role === 'SUPERADMIN' && !isPlatformRoute) return true;

    if (required?.length && !required.includes(user.role)) {
      throw new ForbiddenException(
        `This action requires one of: ${required.join(', ')}. You are ${user.role}.`,
      );
    }

    return true;
  }

  /**
   * A superadmin reads a tenant by naming it in a header; the context stays
   * platform-level (orgId null) otherwise, which is what lets the management
   * page count across every org.
   *
   * Writes are refused here rather than per-route. "View as admin" is meant to
   * answer *is this centre working*, and one central rule beats hoping every
   * future controller remembers to exclude SUPERADMIN.
   */
  private async applySuperadminScope(req: AuthedRequest, isPlatformRoute: boolean): Promise<void> {
    const raw = req.headers[ORG_HEADER];
    const targetOrgId = Array.isArray(raw) ? raw[0] : raw;

    if (!isPlatformRoute && !READ_METHODS.has(req.method)) {
      throw new ForbiddenException(
        'A platform operator has read-only access to a centre. Sign in as that centre’s admin to make changes.',
      );
    }

    if (!targetOrgId) {
      // Platform scope is right for /platform/* — counting across every centre
      // is the management page's whole job. On a tenant route it would instead
      // return every org's rows merged into one list, which is nobody's
      // question and reads as a bug. Make the operator say which centre.
      if (isPlatformRoute) return;
      throw new BadRequestException(
        'Choose a contact centre first — this endpoint needs an X-Org-Id header.',
      );
    }

    const org = await this.prisma.organization.findUnique({
      where: { id: targetOrgId },
      select: { id: true, name: true },
    });
    if (!org) throw new ForbiddenException('Unknown organisation');

    this.tenants.set({ orgId: org.id, actorId: req.user?.id ?? null, impersonating: true });
  }
}
