import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common'
import { createDb, tasks as tasksTable } from '@sfera/db'
import { and, desc, eq } from 'drizzle-orm'
import { SystemRole } from '@sfera/contracts'
import { CreateTaskDto, UpdateTaskDto, TaskDto, TaskStatus, TaskPriority, TaskCategory } from './dto/tasks.dto'

/** Roles that may edit/delete tasks created by anyone in the academy. */
const ADMIN_ROLES: readonly SystemRole[] = ['Super Admin', 'Admin', 'Manager']
/** Roles that may create tasks (admin/manager/teacher). Students never create. */
const STAFF_ROLES: readonly SystemRole[] = [...ADMIN_ROLES, 'Teacher']

type TaskFilters = {
  status?: TaskStatus
  priority?: TaskPriority
  category?: TaskCategory
  assigneeId?: string
  groupId?: string
}

/** Allowed status transitions for a Student on their OWN task. */
const STUDENT_FLOW: Record<string, TaskStatus[]> = {
  [TaskStatus.TODO]: [TaskStatus.IN_PROGRESS],
  [TaskStatus.IN_PROGRESS]: [TaskStatus.REVIEW, TaskStatus.COMPLETED],
  [TaskStatus.REVIEW]: [TaskStatus.COMPLETED, TaskStatus.IN_PROGRESS],
  [TaskStatus.COMPLETED]: [],
  [TaskStatus.CANCELLED]: [],
}

@Injectable()
export class TasksService {
  constructor(@Inject('DATABASE') private readonly db: ReturnType<typeof createDb>) {}

  private map(row: typeof tasksTable.$inferSelect): TaskDto {
    return { id: row.id, title: row.title, description: row.description, priority: row.priority as TaskPriority, status: row.status as TaskStatus, category: row.category as TaskCategory, dueDate: row.dueDate.toISOString(), assignees: row.assignees ?? [], groupId: row.groupId ?? undefined, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString(), createdBy: row.createdBy ?? '' }
  }

  private isAdmin(role: SystemRole): boolean {
    return ADMIN_ROLES.includes(role)
  }

  private isStaff(role: SystemRole): boolean {
    return STAFF_ROLES.includes(role)
  }

  /** Role matrix enforced on every read/action for the CRM "Vazifalar" module. */
  private canAccessTask(role: SystemRole, userId: string, task: TaskDto): boolean {
    if (role === 'Student') return (task.assignees ?? []).includes(userId)
    if (role === 'Teacher') {
      return task.createdBy === userId || (task.assignees ?? []).includes(userId)
    }
    return true
  }

  private async queryTasks(academyId: string, filters?: TaskFilters): Promise<TaskDto[]> {
    const conditions = [eq(tasksTable.academyId, academyId)]
    if (filters?.status) conditions.push(eq(tasksTable.status, filters.status))
    if (filters?.priority) conditions.push(eq(tasksTable.priority, filters.priority))
    if (filters?.category) conditions.push(eq(tasksTable.category, filters.category))
    if (filters?.groupId) conditions.push(eq(tasksTable.groupId, filters.groupId))
    const rows = await this.db.select().from(tasksTable).where(and(...conditions)).orderBy(desc(tasksTable.createdAt))
    return rows.filter((row) => !filters?.assigneeId || (row.assignees ?? []).includes(filters.assigneeId)).map((row) => this.map(row))
  }

  async findAll(academyId: string, role: SystemRole, userId: string, filters?: TaskFilters): Promise<TaskDto[]> {
    const tasks = await this.queryTasks(academyId, filters)
    if (role === 'Student') return tasks.filter((task) => (task.assignees ?? []).includes(userId))
    if (role === 'Teacher') return tasks.filter((task) => this.canAccessTask(role, userId, task))
    return tasks
  }

  async findMy(academyId: string, role: SystemRole, userId: string): Promise<TaskDto[]> {
    const tasks = await this.queryTasks(academyId)
    if (role === 'Student') return tasks.filter((task) => (task.assignees ?? []).includes(userId))
    if (role === 'Teacher') return tasks.filter((task) => task.createdBy === userId || (task.assignees ?? []).includes(userId))
    return tasks
  }

  async findOne(academyId: string, role: SystemRole, userId: string, id: string): Promise<TaskDto> {
    const [row] = await this.db.select().from(tasksTable).where(and(eq(tasksTable.id, id), eq(tasksTable.academyId, academyId))).limit(1)
    if (!row) throw new NotFoundException('Task not found')
    const task = this.map(row)
    if (!this.canAccessTask(role, userId, task)) {
      throw new ForbiddenException('Access denied: you can only view tasks assigned to you or created by you')
    }
    return task
  }

  async create(academyId: string, role: SystemRole, dto: CreateTaskDto, createdBy: string): Promise<TaskDto> {
    if (!this.isStaff(role)) throw new ForbiddenException('Students cannot create tasks')
    const [row] = await this.db.insert(tasksTable).values({ academyId, title: dto.title, description: dto.description, priority: dto.priority, category: dto.category, dueDate: new Date(dto.dueDate), assignees: dto.assignees ?? [], groupId: dto.groupId ?? null, createdBy }).returning()
    return this.map(row)
  }

  async update(academyId: string, role: SystemRole, userId: string, id: string, dto: UpdateTaskDto): Promise<TaskDto> {
    const [existingRow] = await this.db.select().from(tasksTable).where(and(eq(tasksTable.id, id), eq(tasksTable.academyId, academyId))).limit(1)
    if (!existingRow) throw new NotFoundException('Task not found')
    const existing = this.map(existingRow)

    if (role === 'Student') {
      if (!(existing.assignees ?? []).includes(userId)) {
        throw new ForbiddenException('Students may only update their own tasks')
      }
      if (!dto.status) {
        throw new ForbiddenException('Students may only change the status of their own task')
      }
      const allowed = STUDENT_FLOW[existing.status] ?? []
      if (!allowed.includes(dto.status as TaskStatus)) {
        throw new ForbiddenException('Invalid status transition for a Student')
      }
      return this.applyUpdate(academyId, id, { status: dto.status })
    }

    if (role === 'Teacher' && !this.canAccessTask(role, userId, existing)) {
      throw new ForbiddenException('Access denied: you can only update tasks you created or that are assigned to you')
    }

    return this.applyUpdate(academyId, id, dto)
  }

  private async applyUpdate(academyId: string, id: string, dto: Partial<UpdateTaskDto>): Promise<TaskDto> {
    const [row] = await this.db.update(tasksTable).set({ ...dto, dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined, updatedAt: new Date() }).where(and(eq(tasksTable.id, id), eq(tasksTable.academyId, academyId))).returning()
    if (!row) throw new NotFoundException('Task not found')
    return this.map(row)
  }

  async updateTaskStatus(academyId: string, role: SystemRole, userId: string, id: string, status: TaskStatus): Promise<TaskDto> {
    return this.update(academyId, role, userId, id, { status })
  }

  async assignTask(academyId: string, role: SystemRole, id: string, assigneeIds: string[]): Promise<TaskDto> {
    if (!this.isStaff(role)) throw new ForbiddenException('Only staff members may assign tasks')
    const [existingRow] = await this.db.select().from(tasksTable).where(and(eq(tasksTable.id, id), eq(tasksTable.academyId, academyId))).limit(1)
    if (!existingRow) throw new NotFoundException('Task not found')
    return this.applyUpdate(academyId, id, { assignees: assigneeIds })
  }

  async remove(academyId: string, role: SystemRole, id: string): Promise<{ success: boolean }> {
    if (!this.isAdmin(role)) throw new ForbiddenException('Only admins and managers may delete tasks')
    const [row] = await this.db.delete(tasksTable).where(and(eq(tasksTable.id, id), eq(tasksTable.academyId, academyId))).returning()
    if (!row) throw new NotFoundException('Task not found')
    return { success: true }
  }

  async getTaskStatistics(academyId: string) {
    const rows = await this.db.select().from(tasksTable).where(eq(tasksTable.academyId, academyId))
    const today = Date.now()
    return { total: rows.length, byStatus: { todo: rows.filter((t) => t.status === TaskStatus.TODO).length, inProgress: rows.filter((t) => t.status === TaskStatus.IN_PROGRESS).length, review: rows.filter((t) => t.status === TaskStatus.REVIEW).length, completed: rows.filter((t) => t.status === TaskStatus.COMPLETED).length }, byPriority: { low: rows.filter((t) => t.priority === TaskPriority.LOW).length, medium: rows.filter((t) => t.priority === TaskPriority.MEDIUM).length, high: rows.filter((t) => t.priority === TaskPriority.HIGH).length, urgent: rows.filter((t) => t.priority === TaskPriority.URGENT).length }, overdue: rows.filter((t) => new Date(t.dueDate).getTime() < today && t.status !== TaskStatus.COMPLETED).length }
  }
}
