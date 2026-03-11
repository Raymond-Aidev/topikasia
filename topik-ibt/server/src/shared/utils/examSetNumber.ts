import { prisma } from '../../config/database';

/**
 * 시험세트 번호 생성 (MVP)
 * 형식: TOPIK-YYYYMMDD-NNN
 *
 * TODO: 프로덕션에서는 PostgreSQL 시퀀스를 사용하여 동시성 문제 해결
 * CREATE SEQUENCE exam_set_number_seq START 1 INCREMENT 1;
 * SELECT nextval('exam_set_number_seq');
 */
export async function generateExamSetNumber(): Promise<string> {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `TOPIK-${dateStr}`;

  const count = await prisma.examSet.count({
    where: {
      examSetNumber: { startsWith: prefix },
    },
  });

  const seq = String(count + 1).padStart(3, '0');
  return `${prefix}-${seq}`;
}
