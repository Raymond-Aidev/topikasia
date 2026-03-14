-- ExamSchedule에 examSetId 컬럼 추가 (시험 일정 ↔ 시험세트 연결)
ALTER TABLE "ExamSchedule" ADD COLUMN IF NOT EXISTS "examSetId" TEXT REFERENCES "ExamSet"("id") ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS "ExamSchedule_examSetId_idx" ON "ExamSchedule"("examSetId");
