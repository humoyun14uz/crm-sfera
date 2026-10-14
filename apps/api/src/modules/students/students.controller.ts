import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  UsePipes,
} from '@nestjs/common'
import { StudentsService } from './students.service'
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard'
import { RbacGuard } from '../../common/guards/rbac.guard'
import { ScopeGuard } from '../../common/guards/scope.guard'
import { RequirePermission } from '../../common/decorators/require-permission.decorator'
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator'
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe'
import {
  createStudentSchema,
  CreateStudentDto,
  updateStudentSchema,
  UpdateStudentDto,
} from '@sfera/contracts'
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger'
import { z } from 'zod'

const changeStatusSchema = z.object({
  status: z.enum(['active', 'paused', 'graduated']),
})

@ApiTags('Students')
@ApiBearerAuth()
@UseGuards(ClerkAuthGuard, RbacGuard, ScopeGuard)
@Controller('api/v1/students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get()
  @RequirePermission('students.read')
  @ApiOperation({ summary: 'List students in academy with pagination and search' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ['active', 'paused', 'graduated'] })
  async findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('search') search?: string,
    @Query('status') status?: string
  ) {
    return this.studentsService.findAll(user.academyId, {
      page: page ? parseInt(page, 10) : 1,
      pageSize: pageSize ? parseInt(pageSize, 10) : 20,
      search,
      status,
    })
  }

  @Get(':studentId')
  @RequirePermission('students.read')
  @ApiOperation({ summary: 'Get student details (scoped to student self-access if role is Student)' })
  async findById(
    @Param('studentId') studentId: string,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.studentsService.findById(user.academyId, studentId)
  }

  @Post()
  @RequirePermission('students.create')
  @UsePipes(new ZodValidationPipe(createStudentSchema))
  @ApiOperation({ summary: 'Create new student' })
  async create(
    @Body() dto: CreateStudentDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.studentsService.create(user.academyId, dto, user.id)
  }

  @Patch(':studentId')
  @RequirePermission('students.update')
  @UsePipes(new ZodValidationPipe(updateStudentSchema))
  @ApiOperation({ summary: 'Update student profile' })
  async update(
    @Param('studentId') studentId: string,
    @Body() dto: UpdateStudentDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.studentsService.update(user.academyId, studentId, dto, user.id)
  }

  @Patch(':studentId/status')
  @RequirePermission('students.change_status')
  @ApiOperation({ summary: 'Change student status (active/paused/graduated)' })
  async changeStatus(
    @Param('studentId') studentId: string,
    @Body() body: { status: 'active' | 'paused' | 'graduated' },
    @CurrentUser() user: AuthenticatedUser
  ) {
    const validated = changeStatusSchema.parse(body)
    return this.studentsService.changeStatus(
      user.academyId,
      studentId,
      validated.status,
      user.id
    )
  }
}
