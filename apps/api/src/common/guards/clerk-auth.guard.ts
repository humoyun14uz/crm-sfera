import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
  Inject,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { createClerkClient, verifyToken } from '@clerk/backend'
import { IS_PUBLIC_KEY, PERMISSIONS_KEY, ROLES_KEY } from '../decorators/require-permission.decorator'
import { createDb, users, academyMemberships, roles, rolePermissions, permissions } from '@sfera/db'
import { eq, and } from 'drizzle-orm'
import { AuthenticatedUser } from '../decorators/current-user.decorator'
import { SystemPermission, SystemRole } from '@sfera/contracts'
import { verifyLocalToken } from '../../modules/auth/local-token'

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  private clerkClient: ReturnType<typeof createClerkClient> | null = null
  private clerkSecretKey: string | null = null
  /**
   * Impersonation tokens of the form `test-token-<role>` are a development and
   * E2E convenience. They are refused unless BOTH conditions hold, so they can
   * never be used to authenticate against a production deployment.
   */
  private readonly allowTestTokens: boolean

  constructor(
    private reflector: Reflector,
    @Inject('DATABASE') private db: ReturnType<typeof createDb>
  ) {
    const secretKey = process.env.CLERK_SECRET_KEY
    this.clerkSecretKey = secretKey || null
    if (secretKey) {
      this.clerkClient = createClerkClient({ secretKey })
    }
    this.allowTestTokens =
      process.env.NODE_ENV !== 'production' &&
      process.env.ALLOW_TEST_AUTH_TOKENS !== 'false'
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (isPublic) return true

    const request = context.switchToHttp().getRequest()
    const authHeader = request.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Authorization header with Bearer token is required')
    }

    const token = authHeader.split(' ')[1]
    const localSession = verifyLocalToken(token)
    let clerkUserId: string | null = null
    let tokenEmail: string | null = null

    // 1. Real Clerk verification takes priority.
    if (localSession) {
      clerkUserId = null
      tokenEmail = null
    } else if (this.clerkClient && !token.startsWith('test-token-')) {
      try {
        const verified = await verifyToken(token, {
          secretKey: this.clerkSecretKey as string,
        })
        clerkUserId = verified.sub
      } catch (err: any) {
        throw new UnauthorizedException(`Invalid or expired session token: ${err.message}`)
      }
    } else if (token.startsWith('test-token-')) {
      if (!this.allowTestTokens) {
        throw new UnauthorizedException('Test session tokens are not accepted')
      }
      // Development or test tokens: 'test-token-admin', 'test-token-teacher', etc.
      if (token === 'test-token-superadmin' || token === 'test-token-admin') {
        tokenEmail = 'admin@gmail.com'
      } else if (token === 'test-token-manager') {
        tokenEmail = 'manager@gmail.com'
      } else if (token === 'test-token-teacher') {
        tokenEmail = 'temurbek@sfera.uz'
      } else if (token === 'test-token-finance') {
        tokenEmail = 'finance@gmail.com'
      } else if (token === 'test-token-student') {
        tokenEmail = 'student@gmail.com'
      } else {
        throw new UnauthorizedException('Invalid or unrecognized test session token')
      }
    } else if (token.startsWith('user_')) {
      clerkUserId = token
    } else {
      throw new UnauthorizedException(
        'No authentication provider is configured for this token'
      )
    }

    // 2. Resolve user from database
    let dbUser: any = null
    if (localSession) {
      const found = await this.db.select().from(users).where(eq(users.id, localSession.userId)).limit(1)
      if (found.length > 0) dbUser = found[0]
    } else if (clerkUserId) {
      const found = await this.db.select().from(users).where(eq(users.clerkId, clerkUserId)).limit(1)
      if (found.length > 0) dbUser = found[0]
    } else if (tokenEmail) {
      const found = await this.db.select().from(users).where(eq(users.email, tokenEmail)).limit(1)
      if (found.length > 0) dbUser = found[0]
    }

    if (!dbUser) {
      throw new UnauthorizedException('User account does not exist or has not been provisioned')
    }

    if (dbUser.status !== 'active') {
      throw new UnauthorizedException('User account is suspended or inactive')
    }

    // 3. Resolve active academy membership and role
    const headerAcademyId = request.headers['x-academy-id'] as string | undefined

    const membershipsQuery = this.db
      .select({
        academyId: academyMemberships.academyId,
        roleName: roles.name,
      })
      .from(academyMemberships)
      .innerJoin(roles, eq(academyMemberships.roleId, roles.id))
      .where(and(eq(academyMemberships.userId, dbUser.id), eq(academyMemberships.isActive, true)))

    const memberships = await membershipsQuery

    if (memberships.length === 0) {
      throw new UnauthorizedException('User has no active academy memberships')
    }

    // Pick requested academy or first membership
    const activeMembership = headerAcademyId
      ? memberships.find((m) => m.academyId === headerAcademyId) || memberships[0]
      : memberships[0]

    const userRole = activeMembership.roleName as SystemRole

    // 4. Resolve permissions for the role
    const perms = await this.db
      .select({ code: permissions.code })
      .from(roles)
      .innerJoin(rolePermissions, eq(roles.id, rolePermissions.roleId))
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(roles.name, userRole))

    const permissionCodes = perms.map((p) => p.code)

    const authenticatedUser: AuthenticatedUser = {
      id: dbUser.id,
      clerkId: dbUser.clerkId,
      email: dbUser.email,
      firstName: dbUser.firstName,
      lastName: dbUser.lastName,
      role: userRole,
      academyId: activeMembership.academyId,
      permissions: permissionCodes,
    }

    request.user = authenticatedUser

    // Enforce endpoint metadata here because most CRM controllers use the
    // authentication guard directly rather than registering a second global
    // RBAC guard. This keeps JWT verification and permission resolution in one
    // request pipeline and prevents accidental permission bypasses.
    if (userRole !== 'Super Admin') {
      const requiredPermissions = this.reflector.getAllAndOverride<SystemPermission[]>(
        PERMISSIONS_KEY,
        [context.getHandler(), context.getClass()],
      ) ?? []
      const requiredRoles = this.reflector.getAllAndOverride<SystemRole[]>(
        ROLES_KEY,
        [context.getHandler(), context.getClass()],
      ) ?? []

      if (requiredRoles.length > 0 && !requiredRoles.includes(userRole)) {
        throw new ForbiddenException(
          `Action requires one of the following roles: [${requiredRoles.join(', ')}]`,
        )
      }

      const missing = requiredPermissions.filter((permission) => !permissionCodes.includes(permission))
      if (missing.length > 0) {
        throw new ForbiddenException(
          `Forbidden: you lack the required permission(s): [${missing.join(', ')}]`,
        )
      }
    }

    return true
  }
}
