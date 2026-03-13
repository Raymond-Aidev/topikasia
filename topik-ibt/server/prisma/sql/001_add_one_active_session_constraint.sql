-- ACID T1-02: 응시자 당 IN_PROGRESS 세션 1개 제한 (Partial Unique Index)
-- Prisma migrate dev 이후 수동 실행 필요
CREATE UNIQUE INDEX IF NOT EXISTS uq_one_active_session
  ON "ExamSession" ("examineeId")
  WHERE status = 'IN_PROGRESS';
