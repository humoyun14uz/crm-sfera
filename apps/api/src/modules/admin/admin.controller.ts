import { Controller, Get, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { RolesAllowed } from '../../common/decorators/roles.decorator'
import { RequirePermission } from '../../common/decorators/require-permission.decorator'
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator'
import { ManagerService } from '../manager/manager.service'

@ApiTags('Admin')
@Controller('admin')
@UseGuards(ClerkAuthGuard, RolesGuard)
@RolesAllowed('Admin', 'Super Admin')
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly managerService: ManagerService) {}

  @Get('dashboard')
  @RequirePermission('dashboard.read')
  @ApiOperation({ summary: 'Get admin dashboard health and academy totals' })
  @ApiResponse({ status: 200, description: 'Admin dashboard statistics retrieved successfully' })
  getDashboard(@CurrentUser() user: AuthenticatedUser) {
    return this.managerService.getDashboardStats(user.academyId)
  }
}
