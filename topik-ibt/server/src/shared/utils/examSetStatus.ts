import { ExamSetStatus } from '@prisma/client';
import { AppError } from '../types';

/**
 * ACID T2-03: 유효한 상태 전이 맵
 */
export const VALID_TRANSITIONS: Record<ExamSetStatus, ExamSetStatus[]> = {
  DRAFT: ['UPLOADED'],
  UPLOADED: ['ACTIVE', 'DRAFT'],
  ACTIVE: ['ARCHIVED'],
  ARCHIVED: [],
};

/**
 * ACID T2-03: 상태 전이 유효성 검증
 * @throws AppError(409) 유효하지 않은 상태 전이인 경우
 */
export function assertStatusTransition(
  current: ExamSetStatus,
  target: ExamSetStatus,
): void {
  const allowed = VALID_TRANSITIONS[current];
  if (!allowed || !allowed.includes(target)) {
    throw new AppError(
      409,
      `상태 전이가 허용되지 않습니다: ${current} → ${target}. 허용된 전이: ${current} → [${allowed?.join(', ') ?? '없음'}]`,
    );
  }
}
