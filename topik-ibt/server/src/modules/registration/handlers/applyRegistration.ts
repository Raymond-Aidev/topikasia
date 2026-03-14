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
 *
 * 변경: 관리자 수동 승인 → 자동 응시자 확인 + 자동 승인
 * 1. 응시자(Examinee) DB에서 이름 매칭 확인
 * 2. 매칭 성공 → APPROVED + examineeId 연결
 * 3. 매칭 실패 → 403 "응시대상이 아닙니다"
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

    // ── 응시 대상자 확인 ──
    // 1. RegistrationUser 이름 조회
    const users = await prisma.$queryRaw`
      SELECT "name" FROM "RegistrationUser" WHERE "id" = ${userId} LIMIT 1
    ` as any[];

    if (users.length === 0) {
      throw new AppError(404, '사용자를 찾을 수 없습니다');
    }
    const userName = users[0].name;

    // 2. ExamSchedule의 examSetId 조회
    const scheduleInfo = await prisma.$queryRaw`
      SELECT "examSetId" FROM "ExamSchedule" WHERE "id" = ${body.scheduleId} LIMIT 1
    ` as any[];

    const examSetId = scheduleInfo.length > 0 ? scheduleInfo[0].examSetId : null;

    // 3. 매칭 Examinee 찾기
    let matchedExamineeId: string | null = null;

    if (examSetId) {
      const examinees = await prisma.$queryRaw`
        SELECT "id" FROM "Examinee"
        WHERE "name" = ${userName}
          AND "assignedExamSetId" = ${examSetId}
          AND "status" = 'ACTIVE'::"ExamineeStatus"
        LIMIT 1
      ` as any[];

      if (examinees.length > 0) {
        matchedExamineeId = examinees[0].id;
      }
    }

    // 4. 응시 대상이 아니면 거부
    if (!matchedExamineeId) {
      throw new AppError(403, '응시대상이 아닙니다');
    }

    // ── 트랜잭션: 일정 상태 확인 + 접수 생성(APPROVED) + currentCount 증가 ──
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

      if (schedule.currentCount >= schedule.maxCapacity) {
        await tx.$executeRaw`
          UPDATE "ExamSchedule" SET "status" = 'FULL'::"ScheduleStatus", "updatedAt" = NOW()
          WHERE "id" = ${body.scheduleId}
        `;
        throw new AppError(400, '정원이 초과되었습니다');
      }

      // 2. 접수 생성 (자동 승인: APPROVED + examineeId 연결)
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
            status: 'APPROVED',
            examineeId: matchedExamineeId,
            approvedAt: new Date(),
          },
          select: { id: true, status: true, examineeId: true },
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
        examineeId: result.examineeId,
      },
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      const message = err.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      next(new AppError(400, `입력값 검증 실패: ${message}`));
    } else if (err instanceof AppError) {
      next(err);
    } else {
      next(new AppError(500, `접수 처리 중 오류: ${err?.message || '알 수 없는 오류'}`));
    }
  }
}
