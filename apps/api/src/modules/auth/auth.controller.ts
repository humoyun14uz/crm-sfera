import { Controller, Get, Post, Body, Headers, UseGuards, UsePipes, ForbiddenException } from '@nestjs/common'
import { AuthService } from './auth.service'
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard'
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator'
import { Public } from '../../common/decorators/require-permission.decorator'
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe'
import { loginSchema, LoginDto, syncClerkSchema, SyncClerkDto } from '@sfera/contracts'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'

@ApiTags('Authentication & Identity')
@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Public()
  @UsePipes(new ZodValidationPipe(loginSchema))
  @ApiOperation({ summary: 'Login with academy email and password' })
  async login(@Body() body: LoginDto) {
    return this.authService.login(body.email, body.password)
  }

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(ClerkAuthGuard)
  @ApiOperation({ summary: 'Get current authenticated user profile, roles, and permissions' })
  async getMe(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.getMe(user.id, user.academyId)
  }

  @Post('sync-clerk')
  @Public()
  @UsePipes(new ZodValidationPipe(syncClerkSchema))
  @ApiOperation({ summary: 'Sync user record from Clerk webhook or client login' })
  async syncClerk(
    @Body() body: SyncClerkDto,
    @Headers() headers: Record<string, string | undefined>
  ) {
    // When CLERK_WEBHOOK_SECRET is configured in production, require it on the
    // request so that unauthenticated visitors cannot provision themselves into
    // the tenant. Kept optional so the demo pipeline keeps working out of the box.
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET
    if (webhookSecret) {
      const presented = headers['x-clerk-webhook-secret'] || headers['x-webhook-secret']
      if (!presented || presented !== webhookSecret) {
        throw new ForbiddenException('Invalid or missing Clerk webhook secret')
      }
    }

    return this.authService.syncClerkUser(body)
  }
}

