/**
 * GET /api/admin/scores
 * 성적 목록 조회 (페이지네이션, 필터)
 */
import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../../../config/database';

export async function listScores(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const { examSetId, gradingStatus, isPublished, search } = req.query as Record<string, string>;

    const where: any = {};
    if (examSetId) where.examSetId = examSetId;
    if (gradingStatus) where.gradingStatus = gradingStatus;
    if (isPublished === 'true') where.isPublished = true;
    if (isPublished === 'false') where.isPublished = false;
    if (search) {
      where.examinee = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { registrationNumber: { contains: search } },
          { loginId: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    const [data, total] = await Promise.all([
      prisma.score.findMany({
        where,
        include: {
          examinee: { select: { name: true, registrationNumber: true, loginId: true } },
          examSet: { select: { name: true, examType: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.score.count({ where }),
    ]);

    res.json({
      data: data.map(s => ({
        id: s.id,
        sessionId: s.sessionId,
        examineeName: s.examinee.name,
        examineeLoginId: s.examinee.loginId,
        registrationNumber: s.examinee.registrationNumber,
        examSetName: s.examSet.name,
        examType: s.examSet.examType,
        sectionScores: s.sectionScores,
        totalScore: s.totalScore,
        maxTotalScore: s.maxTotalScore,
        grade: s.grade,
        gradingStatus: s.gradingStatus,
        isPublished: s.isPublished,
        publishedAt: s.publishedAt,
        gradedAt: s.gradedAt,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    next(err);
  }
}
