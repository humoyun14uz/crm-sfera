import { Inject, Injectable } from '@nestjs/common'
import { and, desc, eq, gte, sql } from 'drizzle-orm'
import { createDb, auditLogs, attendanceRecords, debts, enrollments, groupTeachers, groups, invoices, leads, payments, students, teachers, users } from '@sfera/db'
import { ManagerDashboardStatsDto, ManagerRecentActivityDto, ManagerRevenueTrendDto } from './dto/dashboard.dto'

@Injectable()
export class ManagerService {
  constructor(@Inject('DATABASE') private readonly db: ReturnType<typeof createDb>) {}

  private async scalar(query: Promise<Array<{ value: string | number | null }>>): Promise<number> {
    const [row] = await query
    return Number(row?.value ?? 0)
  }

  async getDashboardStats(academyId: string): Promise<ManagerDashboardStatsDto> {
    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)

    const [totalStudents, totalGroups, totalTeachers, pendingApplications, monthlyRevenue, pendingDebts, averageAttendance] = await Promise.all([
      this.scalar(this.db.select({ value: sql<string>`count(*)` }).from(students).where(eq(students.academyId, academyId))),
      this.scalar(this.db.select({ value: sql<string>`count(*)` }).from(groups).where(eq(groups.academyId, academyId))),
      this.scalar(this.db.select({ value: sql<string>`count(*)` }).from(teachers).where(and(eq(teachers.academyId, academyId), eq(teachers.status, 'active')))),
      this.scalar(this.db.select({ value: sql<string>`count(*)` }).from(leads).where(and(eq(leads.academyId, academyId), sql`${leads.status} not in ('CONVERTED', 'REJECTED')`))),
      this.scalar(this.db.select({ value: sql<string>`coalesce(sum(${payments.amount}), 0)` }).from(payments).where(and(eq(payments.academyId, academyId), gte(payments.paidAt, monthStart), eq(payments.status, 'paid')))),
      this.scalar(this.db.select({ value: sql<string>`coalesce(sum(${debts.remainingAmount}), 0)` }).from(debts).where(and(eq(debts.academyId, academyId), sql`${debts.status} in ('open', 'overdue')`))),
      this.scalar(this.db.select({ value: sql<string>`coalesce(avg(case when ${attendanceRecords.status} = 'present' then 100 when ${attendanceRecords.status} = 'late' then 50 else 0 end), 0)` }).from(attendanceRecords).innerJoin(students, eq(attendanceRecords.studentId, students.id)).where(eq(students.academyId, academyId))),
    ])

    return { totalStudents, totalGroups, totalTeachers, pendingApplications, monthlyRevenue, pendingDebts, averageAttendance: Math.round(averageAttendance) }
  }

  async getRevenueTrend(academyId: string): Promise<ManagerRevenueTrendDto[]> {
    const start = new Date()
    start.setDate(start.getDate() - 30)
    const rows = await this.db
      .select({
        label: sql<string>`to_char(date_trunc('day', ${payments.paidAt}), 'DD Mon')`,
        revenue: sql<string>`coalesce(sum(${payments.amount}), 0)`,
      })
      .from(payments)
      .where(and(eq(payments.academyId, academyId), eq(payments.status, 'paid'), gte(payments.paidAt, start)))
      .groupBy(sql`date_trunc('day', ${payments.paidAt})`)
      .orderBy(sql`date_trunc('day', ${payments.paidAt})`)
    return rows.map((row) => ({ label: row.label, revenue: Number(row.revenue) }))
  }

  async getRecentActivities(academyId: string): Promise<ManagerRecentActivityDto[]> {
    const rows = await this.db.select({ id: auditLogs.id, description: auditLogs.action, timestamp: auditLogs.createdAt, type: auditLogs.entityType })
      .from(auditLogs)
      .where(eq(auditLogs.academyId, academyId))
      .orderBy(desc(auditLogs.createdAt))
      .limit(20)
    return rows.map((row) => ({ id: row.id, description: row.description, timestamp: row.timestamp.toISOString(), type: row.type }))
  }

  async getGroupsStatistics(academyId: string) {
    const [totalGroups, activeGroups, completedGroups, averageStudentsPerGroup] = await Promise.all([
      this.scalar(this.db.select({ value: sql<string>`count(*)` }).from(groups).where(eq(groups.academyId, academyId))),
      this.scalar(this.db.select({ value: sql<string>`count(*)` }).from(groups).where(and(eq(groups.academyId, academyId), eq(groups.status, 'active')))),
      this.scalar(this.db.select({ value: sql<string>`count(*)` }).from(groups).where(and(eq(groups.academyId, academyId), eq(groups.status, 'completed')))),
      this.scalar(this.db.select({ value: sql<string>`coalesce(avg(group_counts.student_count), 0)` }).from(sql`(select ${groups.id}, count(${enrollments.id})::numeric as student_count from ${groups} left join ${enrollments} on ${enrollments.groupId} = ${groups.id} where ${groups.academyId} = ${academyId} group by ${groups.id}) group_counts`)),
    ])
    return { totalGroups, activeGroups, completedGroups, averageStudentsPerGroup: Math.round(averageStudentsPerGroup) }
  }

  async getTeachersPerformance(academyId: string) {
    const rows = await this.db.select({
      id: teachers.userId,
      name: sql<string>`${users.firstName} || ' ' || ${users.lastName}`,
      groups: sql<string>`count(distinct ${groups.id})`,
      students: sql<string>`count(distinct ${enrollments.studentId})`,
      averageRating: sql<string>`coalesce(avg(case when ${attendanceRecords.status} = 'present' then 5 when ${attendanceRecords.status} = 'late' then 3 else 1 end), 0)`,
    })
      .from(teachers)
      .innerJoin(users, eq(teachers.userId, users.id))
      .leftJoin(groupTeachers, eq(groupTeachers.teacherId, teachers.userId))
      .leftJoin(groups, eq(groups.id, groupTeachers.groupId))
      .leftJoin(enrollments, eq(enrollments.groupId, groups.id))
      .leftJoin(attendanceRecords, eq(attendanceRecords.studentId, enrollments.studentId))
      .where(eq(teachers.academyId, academyId))
      .groupBy(teachers.userId, users.firstName, users.lastName)
    return rows.map((row) => ({ ...row, groups: Number(row.groups), students: Number(row.students), averageRating: Number(row.averageRating) }))
  }

  async getFinancialOverview(academyId: string) {
    const [totalRevenue, pendingPayments, outstandingDebt] = await Promise.all([
      this.scalar(this.db.select({ value: sql<string>`coalesce(sum(${payments.amount}), 0)` }).from(payments).where(and(eq(payments.academyId, academyId), eq(payments.status, 'paid')))),
      this.scalar(this.db.select({ value: sql<string>`coalesce(sum(${invoices.debtAmount}), 0)` }).from(invoices).where(and(eq(invoices.academyId, academyId), sql`${invoices.status} in ('pending', 'partially_paid', 'overdue')`))),
      this.scalar(this.db.select({ value: sql<string>`coalesce(sum(${debts.remainingAmount}), 0)` }).from(debts).where(and(eq(debts.academyId, academyId), sql`${debts.status} in ('open', 'overdue')`))),
    ])
    return { totalRevenue, totalExpenses: 0, netProfit: totalRevenue, pendingPayments, outstandingDebt }
  }
}
