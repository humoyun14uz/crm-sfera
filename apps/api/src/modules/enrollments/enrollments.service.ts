import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
} from '@nestjs/common'
import {
  createDb,
  enrollments,
  students,
  groups,
  courses,
  invoices,
  invoiceCounters,
} from '@sfera/db'
import { eq, and, sql } from 'drizzle-orm'
import { CreateEnrollmentDto } from '@sfera/contracts'
import { AuditLogsService } from '../audit-logs/audit-logs.service'

@Injectable()
export class EnrollmentsService {
  constructor(
    @Inject('DATABASE') private db: ReturnType<typeof createDb>,
    private auditLogsService: AuditLogsService
  ) {}

  async enrollStudent(
    academyId: string,
    dto: CreateEnrollmentDto,
    userId?: string
  ) {
    // 1. Verify Student exists in academy
    const studentList = await this.db
      .select()
      .from(students)
      .where(
        and(eq(students.id, dto.studentId), eq(students.academyId, academyId))
      )
      .limit(1)

    if (studentList.length === 0) {
      throw new NotFoundException('Student not found in this academy')
    }

    // 2. Verify Group exists and get course price
    const groupList = await this.db
      .select({
        groupId: groups.id,
        groupName: groups.name,
        capacity: groups.capacity,
        courseId: courses.id,
        coursePrice: courses.price,
      })
      .from(groups)
      .innerJoin(courses, eq(groups.courseId, courses.id))
      .where(and(eq(groups.id, dto.groupId), eq(groups.academyId, academyId)))
      .limit(1)

    if (groupList.length === 0) {
      throw new NotFoundException('Group not found in this academy')
    }
    const groupInfo = groupList[0]

    // 3. Check for existing active enrollment
    const existing = await this.db
      .select()
      .from(enrollments)
      .where(
        and(
          eq(enrollments.studentId, dto.studentId),
          eq(enrollments.groupId, dto.groupId)
        )
      )
      .limit(1)

    if (existing.length > 0) {
      throw new ConflictException('Student is already enrolled in this group')
    }

    // 4. Execute Transaction: Enrollment + Initial Invoice (atomic counter)
    const result = await this.db.transaction(async (tx) => {
      const [newEnrollment] = await tx
        .insert(enrollments)
        .values({
          academyId,
          studentId: dto.studentId,
          groupId: dto.groupId,
          status: 'active',
        })
        .returning()

      // Atomic per-academy invoice counter — avoids duplicates under concurrency
      const [counter] = await tx
        .insert(invoiceCounters)
        .values({ academyId, lastValue: 1 })
        .onConflictDoUpdate({
          target: invoiceCounters.academyId,
          set: {
            lastValue: sql`${invoiceCounters.lastValue} + 1`,
            updatedAt: new Date(),
          },
        })
        .returning()

      const invoiceNumber = `INV-${new Date().getUTCFullYear()}-${String(
        counter.lastValue
      ).padStart(6, '0')}`

      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + 10)
      const dueDateStr = dueDate.toISOString().split('T')[0]

      const [newInvoice] = await tx
        .insert(invoices)
        .values({
          academyId,
          studentId: dto.studentId,
          enrollmentId: newEnrollment.id,
          invoiceNumber,
          amount: groupInfo.coursePrice,
          paidAmount: 0,
          debtAmount: groupInfo.coursePrice,
          status: groupInfo.coursePrice === 0 ? 'paid' : 'pending',
          dueDate: dueDateStr,
          description: `Initial tuition fee for group ${groupInfo.groupName}`,
          createdBy: userId ?? null,
        })
        .returning()

      return {
        enrollment: newEnrollment,
        invoice: newInvoice,
      }
    })

    await this.auditLogsService.log({
      academyId,
      userId,
      action: 'STUDENT_ENROLLED',
      entityType: 'enrollments',
      entityId: result.enrollment.id,
      payloadAfter: result,
    })

    return result
  }

  async listEnrollments(academyId: string, groupId?: string, studentId?: string) {
    const conditions = [eq(enrollments.academyId, academyId)]
    if (groupId) conditions.push(eq(enrollments.groupId, groupId))
    if (studentId) conditions.push(eq(enrollments.studentId, studentId))

    return this.db
      .select({
        enrollmentId: enrollments.id,
        studentId: students.id,
        studentFirstName: students.firstName,
        studentLastName: students.lastName,
        studentPhone: students.phone,
        groupId: groups.id,
        groupName: groups.name,
        courseName: courses.name,
        status: enrollments.status,
        enrolledAt: enrollments.enrolledAt,
      })
      .from(enrollments)
      .innerJoin(students, eq(enrollments.studentId, students.id))
      .innerJoin(groups, eq(enrollments.groupId, groups.id))
      .innerJoin(courses, eq(groups.courseId, courses.id))
      .where(and(...conditions))
  }

  async updateStatus(
    academyId: string,
    enrollmentId: string,
    status: string,
    userId?: string
  ) {
    const VALID_STATUSES = ['active', 'completed', 'paused', 'cancelled'] as const
    const existing = await this.db
      .select()
      .from(enrollments)
      .where(and(eq(enrollments.id, enrollmentId), eq(enrollments.academyId, academyId)))
      .limit(1)

    if (!existing.length) throw new NotFoundException('Enrollment not found')

    const [updated] = await this.db
      .update(enrollments)
      .set({ status })
      .where(eq(enrollments.id, enrollmentId))
      .returning()

    await this.auditLogsService.log({
      academyId,
      userId,
      action: 'ENROLLMENT_STATUS_CHANGED',
      entityType: 'enrollments',
      entityId: enrollmentId,
      payloadBefore: { status: existing[0].status },
      payloadAfter: { status },
    })

    return updated
  }
}
