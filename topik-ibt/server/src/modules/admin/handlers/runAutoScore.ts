/**
 * POST /api/admin/scores/auto-grade
 * 자동채점 실행 (완료된 세션 대상)
 * body: { examSetId?: string, sessionId?: string }
 */
import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../../../config/database';
import { autoGradeSession } from '../../../services/scoring.service';
import { AppError } from '../../../shared/types';

export async function runAutoScore(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { examSetId, sessionId } = req.body as { examSetId?: string; sessionId?: string };

    // 채점 대상 세션 조회
    const where: any = { status: 'COMPLETED' };
    if (sessionId) {
      where.id = sessionId;
    } else if (examSetId) {
      where.examSetId = examSetId;
    }

    const sessions = await prisma.examSession.findMany({
      where,
      include: {
        answers: true,
        examSet: true,
        examinee: true,
        score: true, // 이미 채점된 경우 확인
      },
    });

    if (sessions.length === 0) {
      throw new AppError(404, '채점 대상 세션이 없습니다');
    }

    let gradedCount = 0;
    let skippedCount = 0;

    for (const session of sessions) {
      // 이미 FULLY_GRADED인 경우 스킵
      if (session.score?.gradingStatus === 'FULLY_GRADED') {
        skippedCount++;
        continue;
      }

      const examType = session.examSet.examType;
      const sectionsJson = session.examSet.sectionsJson as Record<string, any>;

      const result = autoGradeSession(
        examType,
        sectionsJson,
        session.answers.map(a => ({
          questionBankId: a.questionBankId,
          section: a.section,
          questionIndex: a.questionIndex,
          answerJson: a.answerJson,
        })),
      );

      // 채점 결과 저장 (upsert)
      const gradingStatus = result.hasManualSections ? 'AUTO_GRADED' : 'FULLY_GRADED';

      await prisma.score.upsert({
        where: { sessionId: session.id },
        update: {
          sectionScores: result.sectionScores as any,
          totalScore: result.totalScore,
          maxTotalScore: result.maxTotalScore,
          grade: result.grade,
          gradingStatus,
          gradedAt: new Date(),
          gradedById: (req as any).admin?.sub,
          updatedAt: new Date(),
        },
        create: {
          sessionId: session.id,
          examineeId: session.examineeId,
          examSetId: session.examSetId,
          examType,
          sectionScores: result.sectionScores as any,
          totalScore: result.totalScore,
          maxTotalScore: result.maxTotalScore,
          grade: result.grade,
          gradingStatus,
          gradedAt: new Date(),
          gradedById: (req as any).admin?.sub,
        },
      });

      gradedCount++;
    }

    // 감사 로그
    await prisma.auditLog.create({
      data: {
        action: 'AUTO_GRADE',
        targetType: 'Score',
        targetId: examSetId || sessionId || 'batch',
        detail: { gradedCount, skippedCount, adminId: (req as any).admin?.sub },
      },
    });

    res.json({
      success: true,
      data: { gradedCount, skippedCount, totalSessions: sessions.length },
    });
  } catch (err) {
    next(err);
  }
}
