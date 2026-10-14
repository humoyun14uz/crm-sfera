import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common'
import { createDb, grades, gradeHistory, groupTeachers } from '@sfera/db'
import type { InferSelectModel } from 'drizzle-orm'

import { eq, and, isNull } from 'drizzle-orm'
import { CreateGradeDto, UpdateGradeDto, BulkGradeDto } from '@sfera/contracts'
import { AuditLogsService } from '../audit-logs/audit-logs.service'

@Injectable()
export class GradesService {
  constructor(
    @Inject('DATABASE') private db: ReturnType<typeof createDb>,
    private auditLogsService: AuditLogsService
  ) {}

  async createGrade(
    academyId: string,
    dto: CreateGradeDto,
    userId: string,
    userRole: string
  ) {
    if (userRole === 'Teacher') {
      const assigned = await this.db
        .select()
        .from(groupTeachers)
        .where(
          and(
            eq(groupTeachers.groupId, dto.groupId),
            eq(groupTeachers.teacherId, userId)
          )
        )
        .limit(1)

      if (assigned.length === 0) {
        throw new ForbiddenException(
          'Teachers can only assign grades to their assigned groups'
        )
      }
    }

    const [created] = await this.db
      .insert(grades)
      .values({
        academyId,
        studentId: dto.studentId,
        groupId: dto.groupId,
        assignmentId: dto.assignmentId || null,
        teacherId: userId,
        score: dto.score.toString(),
        feedback: dto.feedback || null,
      })
      .returning()

    await this.auditLogsService.log({
      academyId,
      userId,
      action: 'GRADE_RECORDED',
      entityType: 'grades',
      entityId: created.id,
      payloadAfter: created,
    })

    return created
  }

  async bulkCreateGrades(academyId: string, dto: BulkGradeDto, userId: string, userRole: string) {
    if (userRole === 'Teacher') {
      const assigned = await this.db.select().from(groupTeachers).where(and(eq(groupTeachers.groupId, dto.groupId), eq(groupTeachers.teacherId, userId))).limit(1)
      if (!assigned.length) throw new ForbiddenException('Teachers can only grade their assigned groups')
    }
    const result = await this.db.transaction(async (tx) => {
      const saved: InferSelectModel<typeof grades>[] = []
      for (const item of dto.records) {
        // When assignmentId is absent the matching row is the one whose
        // assignment_id IS NULL — previously this spilled over to *any* row of
        // the same student, silently overwriting another assignment's grade.
        const assignmentScope = item.assignmentId
          ? eq(grades.assignmentId, item.assignmentId)
          : isNull(grades.assignmentId)
        const existing = await tx
          .select()
          .from(grades)
          .where(
            and(
              eq(grades.academyId, academyId),
              eq(grades.groupId, dto.groupId),
              eq(grades.studentId, item.studentId),
              assignmentScope
            )
          )
          .limit(1)
        if (existing.length) {
          const [row] = await tx.update(grades).set({ score: String(item.score), feedback: item.feedback ?? null, teacherId: userId, updatedAt: new Date() }).where(eq(grades.id, existing[0].id)).returning()
          saved.push(row)
        } else {
          const [row] = await tx.insert(grades).values({ academyId, groupId: dto.groupId, studentId: item.studentId, assignmentId: item.assignmentId ?? null, teacherId: userId, score: String(item.score), feedback: item.feedback ?? null }).returning()
          saved.push(row)
        }
      }
      return saved
    })
    await this.auditLogsService.log({ academyId, userId, action: 'GRADES_BULK_RECORDED', entityType: 'grades', entityId: dto.groupId, payloadAfter: { recordsCount: result.length } })
    return { groupId: dto.groupId, records: result }
  }

  async updateGrade(
    academyId: string,
    gradeId: string,
    dto: UpdateGradeDto,
    userId: string
  ) {
    const list = await this.db
      .select()
      .from(grades)
      .where(and(eq(grades.id, gradeId), eq(grades.academyId, academyId)))
      .limit(1)

    if (list.length === 0) throw new NotFoundException('Grade record not found')
    const currentGrade = list[0]
    const oldScore = currentGrade.score

    // Transaction: update grade + insert grade_history
    const result = await this.db.transaction(async (tx) => {
      const [updated] = await tx
        .update(grades)
        .set({
          score: dto.score.toString(),
          updatedAt: new Date(),
        })
        .where(eq(grades.id, gradeId))
        .returning()

      const [historyEntry] = await tx
        .insert(gradeHistory)
        .values({
          gradeId,
          oldScore,
          newScore: dto.score.toString(),
          changedBy: userId,
          reason: dto.reason,
        })
        .returning()

      return {
        grade: updated,
        history: historyEntry,
      }
    })

    await this.auditLogsService.log({
      academyId,
      userId,
      action: 'GRADE_UPDATED',
      entityType: 'grades',
      entityId: gradeId,
      payloadBefore: { score: oldScore },
      payloadAfter: { score: dto.score, reason: dto.reason },
    })

    return result
  }

  async getStudentGrades(academyId: string, studentId: string) {
    return this.db
      .select()
      .from(grades)
      .where(and(eq(grades.academyId, academyId), eq(grades.studentId, studentId)))
  }

  async getGradeHistory(gradeId: string) {
    return this.db
      .select()
      .from(gradeHistory)
      .where(eq(gradeHistory.gradeId, gradeId))
  }
}

