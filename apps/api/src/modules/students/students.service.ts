import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common'
import { createDb, students, enrollments, groups, courses } from '@sfera/db'
import { eq, and, ilike, or, desc, sql } from 'drizzle-orm'
import { CreateStudentDto, UpdateStudentDto } from '@sfera/contracts'
import { AuditLogsService } from '../audit-logs/audit-logs.service'

@Injectable()
export class StudentsService {
  constructor(
    @Inject('DATABASE') private db: ReturnType<typeof createDb>,
    private auditLogsService: AuditLogsService
  ) {}

  async findAll(
    academyId: string,
    options: { page?: number; pageSize?: number; search?: string; status?: string } = {}
  ) {
    const page = Math.max(1, options.page ?? 1)
    const pageSize = Math.min(100, Math.max(1, options.pageSize ?? 20))
    const offset = (page - 1) * pageSize

    const conditions = [eq(students.academyId, academyId)]
    if (options.status) conditions.push(eq(students.status, options.status))
    if (options.search) {
      const searchPattern = `%${options.search}%`
      conditions.push(
        or(
          ilike(students.firstName, searchPattern),
          ilike(students.lastName, searchPattern),
          ilike(students.phone, searchPattern)
        )!
      )
    }

    const [items, countRows] = await Promise.all([
      this.db
        .select()
        .from(students)
        .where(and(...conditions))
        .orderBy(desc(students.createdAt))
        .limit(pageSize)
        .offset(offset),
      this.db
        .select({ count: sql<string>`count(*)` })
        .from(students)
        .where(and(...conditions)),
    ])

    const total = Number(countRows[0]?.count ?? 0)
    return {
      items,
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    }
  }

  async findById(academyId: string, id: string) {
    const list = await this.db
      .select()
      .from(students)
      .where(and(eq(students.academyId, academyId), eq(students.id, id)))
      .limit(1)

    if (list.length === 0) throw new NotFoundException('Student not found')
    const student = list[0]

    // Fetch student's enrollments with group and course details
    const studentEnrollments = await this.db
      .select({
        enrollmentId: enrollments.id,
        status: enrollments.status,
        enrolledAt: enrollments.enrolledAt,
        groupId: groups.id,
        groupName: groups.name,
        courseName: courses.name,
      })
      .from(enrollments)
      .innerJoin(groups, eq(enrollments.groupId, groups.id))
      .innerJoin(courses, eq(groups.courseId, courses.id))
      .where(eq(enrollments.studentId, id))

    return {
      ...student,
      enrollments: studentEnrollments,
    }
  }

  async create(academyId: string, dto: CreateStudentDto, userId?: string) {
    const [created] = await this.db
      .insert(students)
      .values({
        academyId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        email: dto.email || null,
        parentName: dto.parentName,
        parentPhone: dto.parentPhone,
        status: 'active',
      })
      .returning()

    await this.auditLogsService.log({
      academyId,
      userId,
      action: 'STUDENT_CREATED',
      entityType: 'students',
      entityId: created.id,
      payloadAfter: created,
    })

    return created
  }

  async update(academyId: string, id: string, dto: UpdateStudentDto, userId?: string) {
    const existing = await this.db
      .select()
      .from(students)
      .where(and(eq(students.academyId, academyId), eq(students.id, id)))
      .limit(1)

    if (existing.length === 0) throw new NotFoundException('Student not found')

    const [updated] = await this.db
      .update(students)
      .set({
        ...(dto.firstName !== undefined && { firstName: dto.firstName }),
        ...(dto.lastName !== undefined && { lastName: dto.lastName }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.email !== undefined && { email: dto.email || null }),
        ...(dto.parentName !== undefined && { parentName: dto.parentName }),
        ...(dto.parentPhone !== undefined && { parentPhone: dto.parentPhone }),
        updatedAt: new Date(),
      })
      .where(eq(students.id, id))
      .returning()

    await this.auditLogsService.log({
      academyId,
      userId,
      action: 'STUDENT_UPDATED',
      entityType: 'students',
      entityId: id,
      payloadBefore: existing[0],
      payloadAfter: updated,
    })

    return updated
  }

  async changeStatus(
    academyId: string,
    id: string,
    status: 'active' | 'paused' | 'graduated',
    userId?: string
  ) {
    const existing = await this.db
      .select()
      .from(students)
      .where(and(eq(students.academyId, academyId), eq(students.id, id)))
      .limit(1)

    if (existing.length === 0) throw new NotFoundException('Student not found')

    const VALID_STATUSES = ['active', 'paused', 'graduated'] as const
    if (!VALID_STATUSES.includes(status)) {
      throw new BadRequestException(`Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`)
    }

    const [updated] = await this.db
      .update(students)
      .set({ status, updatedAt: new Date() })
      .where(eq(students.id, id))
      .returning()

    await this.auditLogsService.log({
      academyId,
      userId,
      action: 'STUDENT_STATUS_CHANGED',
      entityType: 'students',
      entityId: id,
      payloadBefore: { status: existing[0].status },
      payloadAfter: { status },
    })

    return updated
  }
}
