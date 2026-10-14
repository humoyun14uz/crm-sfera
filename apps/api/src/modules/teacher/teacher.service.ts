import { Inject, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { and, desc, eq, gte, lte, sql } from 'drizzle-orm'
import { createDb, assignments, attendanceRecords, attendanceSessions, courses, enrollments, grades, groupTeachers, groups, lessons, students, submissions, teachers, users } from '@sfera/db'
import {
  TeacherDashboardDto,
  TeacherGroupDto,
  TeacherScheduleDto,
  AttendanceRecordDto,
  TeacherAssignmentDto,
  TeacherGradeDto,
} from './dto/teacher.dto'
import type {
  AuthenticatedUser,
} from '../../common/decorators/current-user.decorator'
import type {
  CreateTeacherAssignmentDto,
  UpdateTeacherAssignmentDto,
  UpdateTeacherGradeDto,
  UpdateTeacherProfileDto,
  UpdateTeacherPreferencesDto,
} from '@sfera/contracts'

@Injectable()
export class TeacherService {
  constructor(@Inject('DATABASE') private readonly db: ReturnType<typeof createDb>) {}

  /**
   * Multi-tenant boundary for the workspace. Resolves the effective teacher
   * identity from the authenticated user instead of trusting a client-supplied
   * `teacherId`:
   * - A Teacher may only ever act as themselves;
   * - Other roles may request a `teacherId` but ONLY if that teacher belongs to
   *   the caller's academy, otherwise access is denied.
   */
  async resolveTeacherAccess(
    user: AuthenticatedUser,
    requestedTeacherId?: string
  ): Promise<string> {
    if (user.role === 'Teacher') {
      const profile = await this.db
        .select({ id: teachers.id })
        .from(teachers)
        .where(and(eq(teachers.userId, user.id), eq(teachers.academyId, user.academyId)))
        .limit(1)
      if (profile.length === 0) {
        throw new ForbiddenException('Teacher profile not found in this academy')
      }
      return user.id
    }

    // Admin / Super Admin / Manager impersonation path — locked to the academy.
    const teacherId = requestedTeacherId || user.id
    const profile = await this.db
      .select({ id: teachers.id })
      .from(teachers)
      .where(and(eq(teachers.userId, teacherId), eq(teachers.academyId, user.academyId)))
      .limit(1)
    if (profile.length === 0) {
      throw new ForbiddenException('Requested teacher does not belong to your academy')
    }
    return teacherId
  }

  private async scalar(query: Promise<Array<{ value: string | number | null }>>): Promise<number> {
    const [row] = await query
    return Number(row?.value ?? 0)
  }

  async getDashboard(teacherId: string): Promise<TeacherDashboardDto> {
    const [totalGroups, totalStudents, averageGrade, assignmentCompletionRate, attendanceRate] = await Promise.all([
      this.scalar(this.db.select({ value: sql<string>`count(distinct ${groupTeachers.groupId})` }).from(groupTeachers).where(eq(groupTeachers.teacherId, teacherId))),
      this.scalar(this.db.select({ value: sql<string>`count(distinct ${enrollments.studentId})` }).from(enrollments).innerJoin(groupTeachers, eq(enrollments.groupId, groupTeachers.groupId)).where(eq(groupTeachers.teacherId, teacherId))),
      this.scalar(this.db.select({ value: sql<string>`coalesce(avg(${grades.score}), 0)` }).from(grades).where(eq(grades.teacherId, teacherId))),
      this.scalar(this.db.select({ value: sql<string>`coalesce(100 * count(distinct ${submissions.id})::numeric / nullif(count(distinct ${assignments.id}), 0), 0)` }).from(assignments).leftJoin(submissions, eq(submissions.assignmentId, assignments.id)).where(eq(assignments.teacherId, teacherId))),
      this.scalar(this.db.select({ value: sql<string>`coalesce(avg(case when ${attendanceRecords.status} = 'present' then 100 when ${attendanceRecords.status} = 'late' then 50 else 0 end), 0)` }).from(attendanceRecords).innerJoin(attendanceSessions, eq(attendanceRecords.sessionId, attendanceSessions.id)).where(eq(attendanceSessions.teacherId, teacherId))),
    ])
    return { totalGroups, totalStudents, averageGrade, assignmentCompletionRate: Math.round(assignmentCompletionRate), attendanceRate: Math.round(attendanceRate) }
  }

  async getGroups(teacherId: string): Promise<TeacherGroupDto[]> {
    const rows = await this.db.select({ id: groups.id, name: groups.name, courseName: courses.name, room: groups.room, status: groups.status, days: groups.scheduleDays, startTime: groups.startTime, endTime: groups.endTime, studentCount: sql<string>`count(distinct case when ${enrollments.status} = 'active' then ${enrollments.studentId} end)` })
      .from(groupTeachers)
      .innerJoin(groups, eq(groupTeachers.groupId, groups.id))
      .innerJoin(courses, eq(groups.courseId, courses.id))
      .leftJoin(enrollments, eq(enrollments.groupId, groups.id))
      .where(and(eq(groupTeachers.teacherId, teacherId), eq(groups.status, 'active')))
      .groupBy(groups.id, courses.id)
    return rows.map((row) => ({ id: row.id, name: row.name, courseName: row.courseName, room: row.room, schedule: `${Array.isArray(row.days) ? row.days.join('-') : ''}${row.startTime ? ` · ${row.startTime}` : ''}${row.endTime ? `-${row.endTime}` : ''}`, studentCount: Number(row.studentCount), status: row.status }))
  }

  async getSchedule(teacherId: string, from?: string, to?: string): Promise<TeacherScheduleDto[]> {
    const conditions = [eq(lessons.teacherId, teacherId)]
    if (from) conditions.push(gte(lessons.lessonDate, from))
    if (to) conditions.push(lte(lessons.lessonDate, to))
    const rows = await this.db.select({ id: lessons.id, groupName: groups.name, lessonDate: lessons.lessonDate, startTime: lessons.startTime, endTime: lessons.endTime, room: lessons.room, topic: lessons.title })
      .from(lessons).innerJoin(groups, eq(lessons.groupId, groups.id)).where(and(...conditions)).orderBy(lessons.lessonDate, lessons.startTime)
    return rows.map((row) => ({ id: row.id, groupName: row.groupName, startTime: `${row.lessonDate}T${row.startTime || '00:00'}:00Z`, endTime: `${row.lessonDate}T${row.endTime || row.startTime || '00:00'}:00Z`, room: row.room || '', topic: row.topic }))
  }

  async getTodayLessons(teacherId: string): Promise<TeacherScheduleDto[]> {
    const today = new Date().toISOString().slice(0, 10)
    return this.getSchedule(teacherId, today, today)
  }

  async getAttendance(lessonId: string): Promise<AttendanceRecordDto[]> {
    const rows = await this.db.select({ studentId: students.id, studentName: sql<string>`${students.firstName} || ' ' || ${students.lastName}`, status: attendanceRecords.status, timestamp: attendanceRecords.markedAt })
      .from(attendanceRecords).innerJoin(attendanceSessions, eq(attendanceRecords.sessionId, attendanceSessions.id)).innerJoin(students, eq(attendanceRecords.studentId, students.id)).where(eq(attendanceSessions.lessonId, lessonId))
    return rows.map((row) => ({ studentId: row.studentId, studentName: row.studentName, status: row.status, timestamp: row.timestamp.toISOString() }))
  }

  async updateAttendance(lessonId: string, academyId: string, records: Array<{ studentId: string; status: string }>): Promise<{ updated: number }> {
    const [lesson] = await this.db
      .select({ id: lessons.id, groupId: lessons.groupId, teacherId: lessons.teacherId, lessonDate: lessons.lessonDate, groupAcademyId: groups.academyId })
      .from(lessons)
      .innerJoin(groups, eq(lessons.groupId, groups.id))
      .where(eq(lessons.id, lessonId))
      .limit(1)
    if (!lesson) throw new NotFoundException('Lesson not found')
    // Lesson's group must belong to the caller's academy (tenant boundary).
    if (lesson.groupAcademyId !== academyId) {
      throw new ForbiddenException('Lesson does not belong to your academy')
    }
    let [session] = await this.db
      .select()
      .from(attendanceSessions)
      .where(eq(attendanceSessions.lessonId, lessonId))
      .limit(1)
    if (!session) {
      ;[session] = await this.db
        .insert(attendanceSessions)
        .values({
          academyId,
          groupId: lesson.groupId,
          lessonId,
          teacherId: lesson.teacherId,
          sessionDate: lesson.lessonDate,
        })
        .returning()
    }
    for (const record of records) {
      await this.db
        .insert(attendanceRecords)
        .values({ sessionId: session.id, studentId: record.studentId, status: record.status, markedBy: lesson.teacherId })
        .onConflictDoUpdate({
          target: [attendanceRecords.sessionId, attendanceRecords.studentId],
          set: { status: record.status, markedAt: new Date(), markedBy: lesson.teacherId },
        })
    }
    return { updated: records.length }
  }

  async getStudents(teacherId: string): Promise<any[]> {
    const rows = await this.db.select({ id: students.id, name: sql<string>`${students.firstName} || ' ' || ${students.lastName}`, email: students.email, phone: students.phone, group: groups.name, attendanceRate: sql<string>`0`, averageGrade: sql<string>`coalesce(avg(${grades.score}), 0)` })
      .from(groupTeachers).innerJoin(groups, eq(groupTeachers.groupId, groups.id)).innerJoin(enrollments, eq(enrollments.groupId, groups.id)).innerJoin(students, eq(enrollments.studentId, students.id)).leftJoin(grades, eq(grades.studentId, students.id)).where(eq(groupTeachers.teacherId, teacherId)).groupBy(students.id, groups.id)
    return rows.map((row) => ({ ...row, attendanceRate: Number(row.attendanceRate), averageGrade: Number(row.averageGrade) }))
  }

  async getAssignments(teacherId: string): Promise<TeacherAssignmentDto[]> {
    const rows = await this.db.select().from(assignments).where(eq(assignments.teacherId, teacherId)).orderBy(desc(assignments.dueDate))
    return rows.map((row) => ({ id: row.id, title: row.title, description: row.description || '', dueDate: row.dueDate?.toISOString() || '', maxPoints: row.maxScore, status: 'active' }))
  }

  async createAssignment(teacherId: string, academyId: string, dto: CreateTeacherAssignmentDto): Promise<TeacherAssignmentDto> {
    // academyId for the new row always comes from the verified caller scope,
    // never from the request body, so a client cannot cross tenants.
    const [row] = await this.db
      .insert(assignments)
      .values({
        academyId,
        groupId: dto.groupId,
        teacherId,
        title: dto.title,
        description: dto.description || null,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        maxScore: dto.maxPoints ?? 100,
      })
      .returning()
    return { id: row.id, title: row.title, description: row.description || '', dueDate: row.dueDate?.toISOString() || '', maxPoints: row.maxScore, status: 'active' }
  }

  async updateAssignment(assignmentId: string, dto: UpdateTeacherAssignmentDto): Promise<TeacherAssignmentDto> {
    const values = {
      ...(dto.title !== undefined ? { title: dto.title } : {}),
      ...(dto.description !== undefined ? { description: dto.description || null } : {}),
      ...(dto.dueDate !== undefined ? { dueDate: new Date(dto.dueDate) } : {}),
      ...(dto.maxPoints !== undefined ? { maxScore: dto.maxPoints } : {}),
    }
    const [row] = await this.db.update(assignments).set(values).where(eq(assignments.id, assignmentId)).returning()
    if (!row) throw new NotFoundException('Assignment not found')
    return { id: row.id, title: row.title, description: row.description || '', dueDate: row.dueDate?.toISOString() || '', maxPoints: row.maxScore, status: 'active' }
  }

  async deleteAssignment(assignmentId: string): Promise<void> { await this.db.delete(assignments).where(eq(assignments.id, assignmentId)) }

  async getGrades(teacherId: string, groupId?: string): Promise<TeacherGradeDto[]> {
    const conditions = [eq(grades.teacherId, teacherId)]
    if (groupId) conditions.push(eq(grades.groupId, groupId))
    const rows = await this.db.select({ studentId: students.id, studentName: sql<string>`${students.firstName} || ' ' || ${students.lastName}`, grade: grades.score, feedback: grades.feedback }).from(grades).innerJoin(students, eq(grades.studentId, students.id)).where(and(...conditions)).orderBy(desc(grades.updatedAt))
    return rows.map((row) => ({ studentId: row.studentId, studentName: row.studentName, grade: Number(row.grade), feedback: row.feedback || '' }))
  }

  async updateGrade(teacherId: string, academyId: string, dto: UpdateTeacherGradeDto): Promise<TeacherGradeDto> {
    const scoreValue = String(dto.grade ?? dto.score ?? 0)
    const [existing] = await this.db
      .select()
      .from(grades)
      .where(
        and(
          eq(grades.teacherId, teacherId),
          eq(grades.studentId, dto.studentId),
          eq(grades.groupId, dto.groupId),
          ...(dto.assignmentId ? [eq(grades.assignmentId, dto.assignmentId)] : [])
        )
      )
      .limit(1)
    const values = { score: scoreValue, feedback: dto.feedback || '', updatedAt: new Date() }
    let row
    if (existing) {
      ;[row] = await this.db.update(grades).set(values).where(eq(grades.id, existing.id)).returning()
    } else {
      ;[row] = await this.db
        .insert(grades)
        .values({
          academyId,
          assignmentId: dto.assignmentId,
          studentId: dto.studentId,
          groupId: dto.groupId,
          teacherId,
          score: scoreValue,
          feedback: dto.feedback || null,
        })
        .returning()
    }
    const [student] = await this.db.select({ name: sql<string>`${students.firstName} || ' ' || ${students.lastName}` }).from(students).where(eq(students.id, row.studentId)).limit(1)
    return { studentId: row.studentId, studentName: student?.name || '', grade: Number(row.score), feedback: row.feedback || '' }
  }

  async getProfile(teacherId: string): Promise<any> {
    const [row] = await this.db.select({ id: users.id, name: sql<string>`${users.firstName} || ' ' || ${users.lastName}`, email: users.email, phone: users.phone, specialization: teachers.specialization }).from(teachers).innerJoin(users, eq(teachers.userId, users.id)).where(eq(teachers.userId, teacherId)).limit(1)
    if (!row) throw new NotFoundException('Teacher profile not found')
    const groupsCount = await this.scalar(this.db.select({ value: sql<string>`count(distinct ${groupTeachers.groupId})` }).from(groupTeachers).where(eq(groupTeachers.teacherId, teacherId)))
    const studentsCount = await this.scalar(this.db.select({ value: sql<string>`count(distinct ${enrollments.studentId})` }).from(enrollments).innerJoin(groupTeachers, eq(enrollments.groupId, groupTeachers.groupId)).where(eq(groupTeachers.teacherId, teacherId)))
    return { ...row, experience: 0, groups: groupsCount, students: studentsCount }
  }

  async updateProfile(teacherId: string, dto: UpdateTeacherProfileDto): Promise<any> {
    const userValues = {
      ...(dto.firstName !== undefined ? { firstName: dto.firstName } : {}),
      ...(dto.lastName !== undefined ? { lastName: dto.lastName } : {}),
      ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
      updatedAt: new Date(),
    }
    await this.db.update(users).set(userValues).where(eq(users.id, teacherId))
    const teacherValues = {
      ...(dto.specialization !== undefined ? { specialization: dto.specialization } : {}),
      ...(dto.bio !== undefined ? { bio: dto.bio } : {}),
      updatedAt: new Date(),
    }
    await this.db.update(teachers).set(teacherValues).where(eq(teachers.userId, teacherId))
    return this.getProfile(teacherId)
  }

  async getPreferences(teacherId: string): Promise<any> { return { userId: teacherId, language: 'uz', timezone: 'Asia/Tashkent', notifications: true, emailAlerts: true } }
  async updatePreferences(teacherId: string, preferences: UpdateTeacherPreferencesDto): Promise<any> {
    // Preferences are stored as a default object for now. `userId` is derived
    // server-side; the validated corpus is echoed back so clients get a stable
    // contract without trusting client-side persistence.
    return {
      userId: teacherId,
      language: preferences.language ?? 'uz',
      timezone: preferences.timezone ?? 'Asia/Tashkent',
      notifications: preferences.notifications ?? true,
      emailAlerts: preferences.emailAlerts ?? true,
    }
  }
}
