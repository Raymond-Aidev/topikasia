import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../../../config/database';
import { AppError } from '../../../shared/types';

const applySchema = z.object({
  scheduleId: z.string().min(1, '시험 일정을 선택해주세요'),
  examType: z.enum(['TOPIK_I', 'TOPIK_II'], { message: '시험 유형을 선택해주세요' }),
  englishName: z.string().min(1, '영문 이름을 입력해주세요'),
  birthDate: z.string().min(1, '생년월일을 입력해주세요'),
  gender: z.enum(['MALE', 'FEMALE'], { message: '성별을 선택해주세요' }),
  photoUrl: z.string().optional(),
  venueId: z.string().min(1, '시험장을 선택해주세요'),
  venueName: z.string().min(1, '시험장 이름이 필요합니다'),
  contactPhone: z.string().optional(),
  address: z.string().optional(),
});

/**
 * POST /api/registration/apply
 * 접수 신청 (registrationAuth 필요)
 * ACID: 트랜잭션 내에서 일정 상태 확인 + 접수 생성 + currentCount 증가
 */
export async function applyRegistration(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = applySchema.parse(req.body);
    const userId = req.registrationUser!.sub;

    const birthDate = new Date(body.birthDate);
    if (isNaN(birthDate.getTime())) {
      throw new AppError(400, '유효한 생년월일을 입력해주세요');
    }

    // 기존 접수 확인 (중복 접수 방지 — 멱등성)
    const existing = await prisma.registration.findFirst({
      where: { userId, scheduleId: body.scheduleId },
      select: { id: true, status: true },
    });
    if (existing) {
      res.status(200).json({
        success: true,
        data: { registrationId: existing.id, status: existing.status },
        message: '이미 접수된 시험입니다',
      });
      return;
    }

    // 트랜잭션: 일정 상태 확인 + 접수 생성 + currentCount 증가
    const result = await prisma.$transaction(async (tx) => {
      // 1. 일정 확인 (FOR UPDATE로 잠금)
      const schedules = await tx.$queryRaw`
        SELECT "id", "status", "maxCapacity", "currentCount", "registrationStartAt", "registrationEndAt"
        FROM "ExamSchedule"
        WHERE "id" = ${body.scheduleId}
        FOR UPDATE
      ` as any[];

      if (schedules.length === 0) {
        throw new AppError(404, '시험 일정을 찾을 수 없습니다');
      }

      const schedule = schedules[0];

      if (schedule.status !== 'OPEN') {
        throw new AppError(400, '접수가 마감된 시험 일정입니다');
      }

      const now = new Date();
      if (now < new Date(schedule.registrationStartAt)) {
        throw new AppError(400, '아직 접수 기간이 아닙니다');
      }
      if (now > new Date(schedule.registrationEndAt)) {
        throw new AppError(400, '접수 기간이 종료되었습니다');
      }

      if (schedule.currentCount >= schedule.maxCapacity) {
        // 정원 초과 시 상태를 FULL로 변경
        await tx.$executeRaw`
          UPDATE "ExamSchedule" SET "status" = 'FULL'::"ScheduleStatus", "updatedAt" = NOW()
          WHERE "id" = ${body.scheduleId}
        `;
        throw new AppError(400, '정원이 초과되었습니다');
      }

      // 2. 접수 생성 (중복 접수 방지는 unique constraint에 의존)
      let registration;
      try {
        registration = await tx.registration.create({
          data: {
            userId,
            scheduleId: body.scheduleId,
            examType: body.examType as any,
            englishName: body.englishName,
            birthDate,
            gender: body.gender as any,
            photoUrl: body.photoUrl || null,
            venueId: body.venueId,
            venueName: body.venueName,
            contactPhone: body.contactPhone || null,
            address: body.address || null,
            status: 'PENDING',
          },
          select: { id: true, status: true },
        });
      } catch (err: any) {
        if (err.code === 'P2002' || err.code === '23505' || err.code === 'P2010') {
          throw new AppError(409, '이미 해당 시험에 접수하셨습니다');
        }
        throw err;
      }

      // 3. currentCount 증가
      await tx.$executeRaw`
        UPDATE "ExamSchedule"
        SET "currentCount" = "currentCount" + 1, "updatedAt" = NOW()
        WHERE "id" = ${body.scheduleId}
      `;

      return registration;
    });

    res.status(201).json({
      success: true,
      data: {
        registrationId: result.id,
        status: result.status,
      },
    });
  } catch (err: any) {
    console.error('[applyRegistration] Error:', err?.message, err?.code, err?.meta, err?.stack?.slice(0, 500));
    if (err instanceof z.ZodError) {
      const message = err.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      next(new AppError(400, `입력값 검증 실패: ${message}`));
    } else if (err instanceof AppError) {
      next(err);
    } else {
      // 디버그용: 실제 에러 메시지 포함
      next(new AppError(500, `접수 처리 중 오류: ${err?.message || '알 수 없는 오류'}`));
    }
  }
}
