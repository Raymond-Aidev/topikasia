import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../../config/database';

/**
 * GET /api/admin/registrations
 * 접수 목록 조회 (어드민)
 * Query params: status, search, page, limit, sortBy, sortOrder
 */
export async function listRegistrations(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const status = req.query.status as string | undefined;
    const search = (req.query.search as string) || '';
    const scheduleId = req.query.scheduleId as string | undefined;
    const sortBy = (req.query.sortBy as string) || 'createdAt';
    const sortOrder = (req.query.sortOrder as string) === 'asc' ? 'ASC' : 'DESC';

    const conditions: string[] = ['1=1'];
    const params: any[] = [];
    let paramIndex = 1;

    if (status && ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'].includes(status)) {
      conditions.push(`r."status" = $${paramIndex}::"RegistrationStatus"`);
      params.push(status);
      paramIndex++;
    }

    if (scheduleId) {
      conditions.push(`r."scheduleId" = $${paramIndex}`);
      params.push(scheduleId);
      paramIndex++;
    }

    if (search) {
      conditions.push(`(r."englishName" ILIKE $${paramIndex} OR u."name" ILIKE $${paramIndex} OR u."email" ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');

    // 허용된 정렬 필드
    const allowedSortFields: Record<string, string> = {
      createdAt: 'r."createdAt"',
      englishName: 'r."englishName"',
      status: 'r."status"',
      examDate: 's."examDate"',
    };
    const orderField = allowedSortFields[sortBy] || 'r."createdAt"';

    const countResult = await prisma.$queryRawUnsafe(
      `SELECT COUNT(*)::int as total
       FROM "Registration" r
       JOIN "RegistrationUser" u ON r."userId" = u."id"
       JOIN "ExamSchedule" s ON r."scheduleId" = s."id"
       WHERE ${whereClause}`,
      ...params,
    ) as any[];

    const total = countResult[0]?.total || 0;

    const registrations = await prisma.$queryRawUnsafe(
      `SELECT r."id", r."userId", r."scheduleId", r."examType", r."englishName",
              r."birthDate", r."gender", r."photoUrl", r."venueId", r."venueName",
              r."contactPhone", r."address", r."status", r."examineeId",
              r."rejectionNote", r."approvedAt", r."approvedById", r."createdAt",
              u."email" as "userEmail", u."name" as "userName", u."phone" as "userPhone",
              s."examName", s."examRound", s."examDate"
       FROM "Registration" r
       JOIN "RegistrationUser" u ON r."userId" = u."id"
       JOIN "ExamSchedule" s ON r."scheduleId" = s."id"
       WHERE ${whereClause}
       ORDER BY ${orderField} ${sortOrder}
       LIMIT ${limit} OFFSET ${offset}`,
      ...params,
    ) as any[];

    res.json({
      success: true,
      data: {
        registrations,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err) {
    next(err);
  }
}
