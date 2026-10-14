import { Inject, Injectable, BadRequestException } from '@nestjs/common'
import { and, eq, gte, lte, sql, SQL } from 'drizzle-orm'
import {
  createDb,
  groups,
  enrollments,
  students,
  teachers,
  groupTeachers,
  attendanceSessions,
  attendanceRecords,
  grades,
  assignments,
  submissions,
  invoices,
  payments,
  users,
} from '@sfera/db'
import {
  ReportFilterDto,
  AttendanceReportDto,
  FinancialReportDto,
  AcademicReportDto,
  GroupPerformanceDto,
  StudentPerformanceDto,
} from './dto/reports.dto'

const today = () => new Date().toISOString().split('T')[0]

@Injectable()
export class ReportsService {
  constructor(@Inject('DATABASE') private readonly db: ReturnType<typeof createDb>) {}

  private parseDateBoundary(
    value: string | undefined,
    field: string,
    endOfDay = false
  ): Date | undefined {
    if (!value) return undefined
    const parsed = /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? new Date(`${value}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}Z`)
      : new Date(value)

    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException(`${field} must be a valid ISO date (YYYY-MM-DD)`)
    }
    return parsed
  }

  async generateAttendanceReport(filters?: ReportFilterDto): Promise<AttendanceReportDto[]> {
    const academyId = (filters as { academyId?: string }).academyId
    if (!academyId) {
      throw new BadRequestException('academyId is required for attendance report')
    }

    const start = this.parseDateBoundary(filters?.startDate, 'startDate')
    const end = this.parseDateBoundary(filters?.endDate, 'endDate', true)

    const scope: SQL[] = [eq(groups.academyId, academyId), eq(groups.status, 'active')]
    if (filters?.groupId) scope.push(eq(groups.id, filters.groupId))

    // session_date is a DATE (string) column, so compare against YYYY-MM-DD keys.
    const sessionScope: SQL[] = []
    if (start) sessionScope.push(gte(attendanceSessions.sessionDate, start.toISOString().split('T')[0]))
    if (end) sessionScope.push(lte(attendanceSessions.sessionDate, end.toISOString().split('T')[0]))

    const rows = await this.db
      .select({
        groupId: groups.id,
        groupName: groups.name,
        totalStudents: sql<number>`count(distinct ${enrollments.studentId})`,
        presentCount: sql<number>`count(distinct ${attendanceRecords.studentId}) filter (where ${attendanceRecords.status} in ('present', 'late'))`,
      })
      .from(groups)
      .innerJoin(enrollments, eq(enrollments.groupId, groups.id))
      .leftJoin(
        attendanceSessions,
        sessionScope.length > 0
          ? and(eq(attendanceSessions.groupId, groups.id), ...sessionScope)
          : eq(attendanceSessions.groupId, groups.id)
      )
      .leftJoin(attendanceRecords, eq(attendanceRecords.sessionId, attendanceSessions.id))
      .where(and(...scope))
      .groupBy(groups.id)

    return rows.map((row) => {
      const total = Number(row.totalStudents)
      const present = Number(row.presentCount)
      const absent = Math.max(0, total - present)
      return {
        groupId: row.groupId,
        groupName: row.groupName,
        totalStudents: total,
        presentCount: present,
        absentCount: absent,
        attendanceRate: total > 0 ? Number(((present / total) * 100).toFixed(1)) : 0,
        reportDate: today(),
      }
    })
  }
  async generateFinancialReport(filters?: ReportFilterDto): Promise<FinancialReportDto> {
    const academyId = (filters as { academyId?: string }).academyId
    if (!academyId) {
      throw new BadRequestException('academyId is required for financial report')
    }

    const start = this.parseDateBoundary(filters?.startDate, 'startDate')
    const end = this.parseDateBoundary(filters?.endDate, 'endDate', true)

    const paymentDate: SQL[] = [eq(payments.academyId, academyId), eq(payments.status, 'paid')]
    if (start) paymentDate.push(gte(payments.paidAt, start))
    if (end) paymentDate.push(lte(payments.paidAt, end))

    const [paymentAgg] = await this.db
      .select({
        totalRevenue: sql<number>`coalesce(sum(${payments.amount}), 0)`,
        payingStudents: sql<number>`count(distinct ${payments.studentId})`,
      })
      .from(payments)
      .where(and(...paymentDate))

    const invoiceScope: SQL[] = [eq(invoices.academyId, academyId)]
    if (filters?.groupId) {
      invoiceScope.push(
        sql`${invoices.studentId} in (select ${enrollments.studentId} from ${enrollments} where ${enrollments.groupId} = ${filters.groupId})`
      )
    }
    const [invoiceAgg] = await this.db
      .select({
        pendingPayments: sql<number>`coalesce(sum(${invoices.debtAmount}), 0)`,
        overdueDebts: sql<number>`coalesce(sum(${invoices.debtAmount}) filter (where ${invoices.debtAmount} > 0 and ${invoices.dueDate} < current_date), 0)`,
        studentsWithDebt: sql<number>`count(distinct ${invoices.studentId}) filter (where ${invoices.debtAmount} > 0)`,
      })
      .from(invoices)
      .where(and(...invoiceScope))

    return {
      totalRevenue: Number(paymentAgg?.totalRevenue ?? 0),
      totalExpenses: 0,
      netProfit: Number(paymentAgg?.totalRevenue ?? 0),
      pendingPayments: Number(invoiceAgg?.pendingPayments ?? 0),
      overdueDebts: Number(invoiceAgg?.overdueDebts ?? 0),
      payingStudents: Number(paymentAgg?.payingStudents ?? 0),
      studentsWithDebt: Number(invoiceAgg?.studentsWithDebt ?? 0),
      reportDate: today(),
    }
  }

  async generateAcademicReport(filters?: ReportFilterDto): Promise<AcademicReportDto> {
    const academyId = (filters as { academyId?: string }).academyId
    if (!academyId) {
      throw new BadRequestException('academyId is required for academic report')
    }
    const start = this.parseDateBoundary(filters?.startDate, 'startDate')
    const end = this.parseDateBoundary(filters?.endDate, 'endDate')

    const [counts] = await this.db
      .select({
        totalStudents: sql<number>`count(distinct ${students.id})`,
        totalGroups: sql<number>`count(distinct ${groups.id})`,
        totalTeachers: sql<number>`count(distinct ${teachers.userId})`,
      })
      .from(students)
      .innerJoin(enrollments, eq(enrollments.studentId, students.id))
      .innerJoin(groups, eq(groups.id, enrollments.groupId))
      .leftJoin(groupTeachers, eq(groupTeachers.groupId, groups.id))
      .leftJoin(teachers, eq(teachers.userId, groupTeachers.teacherId))
      .where(eq(students.academyId, academyId))

    const gradeScope: SQL[] = [eq(grades.academyId, academyId)]
    if (start) gradeScope.push(gte(grades.gradedAt, start))
    if (end) gradeScope.push(lte(grades.gradedAt, end))
    const [gradeAgg] = await this.db
      .select({ averageGrade: sql<number>`coalesce(avg(${grades.score}::numeric), 0)` })
      .from(grades)
      .where(and(...gradeScope))

    const [attendanceAgg] = await this.db
      .select({
        averageAttendance: sql<number>`coalesce(avg(case when ${attendanceRecords.status} = 'present' then 100 when ${attendanceRecords.status} = 'late' then 50 else 0 end), 0)`,
      })
      .from(attendanceRecords)
      .innerJoin(attendanceSessions, eq(attendanceRecords.sessionId, attendanceSessions.id))
      .where(eq(attendanceSessions.academyId, academyId))

    const [assignmentAgg] = await this.db
      .select({
        completion: sql<number>`coalesce(100 * count(distinct ${submissions.id})::numeric / nullif(count(distinct ${assignments.id}), 0), 0)`,
      })
      .from(assignments)
      .leftJoin(submissions, eq(submissions.assignmentId, assignments.id))
      .where(eq(assignments.academyId, academyId))

    return {
      totalStudents: Number(counts?.totalStudents ?? 0),
      totalGroups: Number(counts?.totalGroups ?? 0),
      totalTeachers: Number(counts?.totalTeachers ?? 0),
      averageGrade: Number(gradeAgg?.averageGrade ?? 0),
      averageAttendance: Math.round(Number(attendanceAgg?.averageAttendance ?? 0)),
      assignmentCompletionRate: Math.round(Number(assignmentAgg?.completion ?? 0)),
      graduatedStudents: 0,
      droppedStudents: 0,
      reportDate: today(),
    }
  }
  async generateGroupPerformanceReport(filters?: ReportFilterDto): Promise<GroupPerformanceDto[]> {
    const academyId = (filters as { academyId?: string }).academyId
    if (!academyId) {
      throw new BadRequestException('academyId is required for group performance report')
    }
    const scope: SQL[] = [eq(groups.academyId, academyId), eq(groups.status, 'active')]
    if (filters?.groupId) scope.push(eq(groups.id, filters.groupId))

    const rows = await this.db
      .select({
        groupId: groups.id,
        groupName: groups.name,
        teacherName: sql<string>`coalesce(max(${users.firstName} || ' ' || ${users.lastName}), '')`,
        studentCount: sql<number>`count(distinct ${enrollments.studentId})`,
        averageGrade: sql<number>`coalesce(avg(${grades.score}::numeric), 0)`,
        attendanceRate: sql<number>`coalesce(avg(case when ${attendanceRecords.status} = 'present' then 100 when ${attendanceRecords.status} = 'late' then 50 else 0 end), 0)`,
        assignmentCompletion: sql<number>`coalesce(100 * count(distinct ${submissions.id})::numeric / nullif(count(distinct ${assignments.id}), 0), 0)`,
      })
      .from(groups)
      .leftJoin(groupTeachers, and(eq(groupTeachers.groupId, groups.id), eq(groupTeachers.isPrimary, true)))
      .leftJoin(users, eq(users.id, groupTeachers.teacherId))
      .leftJoin(enrollments, eq(enrollments.groupId, groups.id))
      .leftJoin(grades, and(eq(grades.groupId, groups.id), eq(grades.studentId, enrollments.studentId)))
      .leftJoin(attendanceSessions, eq(attendanceSessions.groupId, groups.id))
      .leftJoin(attendanceRecords, eq(attendanceRecords.sessionId, attendanceSessions.id))
      .leftJoin(assignments, eq(assignments.groupId, groups.id))
      .leftJoin(submissions, eq(submissions.assignmentId, assignments.id))
      .where(and(...scope))
      .groupBy(groups.id)

    return rows.map((row) => ({
      groupId: row.groupId,
      groupName: row.groupName,
      teacherName: row.teacherName as string,
      studentCount: Number(row.studentCount),
      averageGrade: Number(row.averageGrade ?? 0),
      attendanceRate: Math.round(Number(row.attendanceRate ?? 0)),
      assignmentCompletion: Math.round(Number(row.assignmentCompletion ?? 0)),
      reportDate: today(),
    }))
  }

  async generateStudentPerformanceReport(filters?: ReportFilterDto): Promise<StudentPerformanceDto[]> {
    const academyId = (filters as { academyId?: string }).academyId
    if (!academyId) {
      throw new BadRequestException('academyId is required for student performance report')
    }
    const scope: SQL[] = [eq(students.academyId, academyId), eq(enrollments.status, 'active')]
    if (filters?.groupId) scope.push(eq(groups.id, filters.groupId))
    if (filters?.teacherId) {
      scope.push(sql`${groups.id} in (select ${groupTeachers.groupId} from ${groupTeachers} where ${groupTeachers.teacherId} = ${filters.teacherId})`)
    }

    const rows = await this.db
      .select({
        studentId: students.id,
        studentName: sql<string>`${students.firstName} || ' ' || ${students.lastName}`,
        groupName: groups.name,
        averageGrade: sql<number>`coalesce(avg(${grades.score}::numeric), 0)`,
        attendanceRate: sql<number>`coalesce(avg(case when ${attendanceRecords.status} = 'present' then 100 when ${attendanceRecords.status} = 'late' then 50 else 0 end), 0)`,
        totalPaid: sql<number>`coalesce(sum(${payments.amount}), 0)`,
        remainingDebt: sql<number>`coalesce(max(${invoices.debtAmount}), 0)`,
      })
      .from(students)
      .innerJoin(enrollments, eq(enrollments.studentId, students.id))
      .innerJoin(groups, eq(groups.id, enrollments.groupId))
      .leftJoin(grades, and(eq(grades.studentId, students.id), eq(grades.groupId, groups.id)))
      .leftJoin(attendanceSessions, eq(attendanceSessions.groupId, groups.id))
      .leftJoin(attendanceRecords, and(eq(attendanceRecords.sessionId, attendanceSessions.id), eq(attendanceRecords.studentId, students.id)))
      .leftJoin(payments, eq(payments.studentId, students.id))
      .leftJoin(invoices, eq(invoices.studentId, students.id))
      .where(and(...scope))
      .groupBy(students.id, groups.id)

    return rows.map((row) => ({
      studentId: row.studentId,
      studentName: row.studentName as string,
      groupName: row.groupName,
      averageGrade: Number(row.averageGrade ?? 0),
      attendanceRate: Math.round(Number(row.attendanceRate ?? 0)),
      assignmentCompletion: 0,
      totalPaid: Number(row.totalPaid ?? 0),
      remainingDebt: Number(row.remainingDebt ?? 0),
      reportDate: today(),
    }))
  }

  async generateTeacherPerformanceReport(filters?: ReportFilterDto, forAcademyId?: string): Promise<any[]> {
    const academyId = forAcademyId
    if (!academyId) throw new BadRequestException('academyId is required for teacher performance report')
    const scope: SQL[] = [eq(teachers.academyId, academyId)]
    if (filters?.teacherId) scope.push(eq(teachers.userId, filters.teacherId))

    const rows = await this.db
      .select({
        teacherId: teachers.userId,
        teacherName: sql<string>`${users.firstName} || ' ' || ${users.lastName}`,
        totalGroups: sql<number>`count(distinct ${groups.id})`,
        totalStudents: sql<number>`count(distinct ${enrollments.studentId})`,
        averageStudentRating: sql<number>`coalesce(avg(case when ${attendanceRecords.status} = 'present' then 5 when ${attendanceRecords.status} = 'late' then 3 else 1 end), 0)`,
        averageAttendance: sql<number>`coalesce(avg(case when ${attendanceRecords.status} = 'present' then 100 when ${attendanceRecords.status} = 'late' then 50 else 0 end), 0)`,
        assignmentCompletionRate: sql<number>`0`,
      })
      .from(teachers)
      .innerJoin(users, eq(users.id, teachers.userId))
      .leftJoin(groupTeachers, eq(groupTeachers.teacherId, teachers.userId))
      .leftJoin(groups, eq(groups.id, groupTeachers.groupId))
      .leftJoin(enrollments, eq(enrollments.groupId, groups.id))
      .leftJoin(attendanceRecords, eq(attendanceRecords.studentId, enrollments.studentId))
      .where(and(...scope))
      .groupBy(teachers.userId, users.firstName, users.lastName)

    return rows.map((row) => ({
      teacherId: row.teacherId,
      teacherName: row.teacherName as string,
      totalGroups: Number(row.totalGroups),
      totalStudents: Number(row.totalStudents),
      averageStudentRating: Number(row.averageStudentRating ?? 0),
      averageAttendance: Math.round(Number(row.averageAttendance ?? 0)),
      assignmentCompletionRate: Math.round(Number(row.assignmentCompletionRate ?? 0)),
    }))
  }

  async exportReport(reportType: string, filters?: ReportFilterDto): Promise<any> {
    switch (reportType) {
      case 'attendance': return this.generateAttendanceReport(filters)
      case 'financial': return this.generateFinancialReport(filters)
      case 'academic': return this.generateAcademicReport(filters)
      case 'group-performance': return this.generateGroupPerformanceReport(filters)
      case 'student-performance': return this.generateStudentPerformanceReport(filters)
      default: throw new BadRequestException('Invalid report type')
    }
  }

  async getReportSummary(): Promise<any> {
    return {
      totalReports: 5,
      lastGenerated: new Date().toISOString(),
      availableReports: ['attendance', 'financial', 'academic', 'group-performance', 'student-performance'],
    }
  }
}
