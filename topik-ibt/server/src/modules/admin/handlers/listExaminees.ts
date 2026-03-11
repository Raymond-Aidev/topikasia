import { Request, Response } from 'express';
import { prisma } from '../../../config/database';
import { ExamineeStatus, Prisma } from '@prisma/client';

/**
 * GET /api/admin/examinees
 * 응시자 목록 조회 - 검색, 필터, 정렬, 페이지네이션
 */
export async function listExaminees(req: Request, res: Response): Promise<void> {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const skip = (page - 1) * limit;

  const search = (req.query.search as string) || '';
  const status = req.query.status as ExamineeStatus | undefined;
  const examSetId = req.query.examSetId as string | undefined;
  const sortBy = (req.query.sortBy as string) || 'createdAt';
  const sortOrder = (req.query.sortOrder as string) === 'asc' ? 'asc' : 'desc';

  const where: Prisma.ExamineeWhereInput = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { loginId: { contains: search, mode: 'insensitive' } },
      { registrationNumber: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (status && Object.values(ExamineeStatus).includes(status)) {
    where.status = status;
  }

  if (examSetId) {
    where.assignedExamSetId = examSetId;
  }

  const allowedSortFields = ['createdAt', 'name', 'loginId', 'registrationNumber', 'seatNumber', 'status'];
  const orderField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';

  const [total, examinees] = await prisma.$transaction([
    prisma.examinee.count({ where }),
    prisma.examinee.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [orderField]: sortOrder },
      select: {
        id: true,
        loginId: true,
        name: true,
        registrationNumber: true,
        seatNumber: true,
        photoUrl: true,
        institutionName: true,
        examRoomName: true,
        status: true,
        loginFailCount: true,
        assignedExamSetId: true,
        assignedExamSet: {
          select: {
            id: true,
            name: true,
            examSetNumber: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    }),
  ]);

  res.json({
    success: true,
    data: {
      examinees,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    },
  });
}
