-- ACID T2-04: 배정된 시험세트는 반드시 ACTIVE 상태여야 함 (CHECK constraint)
-- 참고: PostgreSQL에서 크로스 테이블 CHECK는 직접 지원되지 않으므로
-- 트리거로 구현합니다.

CREATE OR REPLACE FUNCTION check_assigned_exam_set_active()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW."assignedExamSetId" IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM "ExamSet"
      WHERE id = NEW."assignedExamSetId"
        AND status = 'ACTIVE'
    ) THEN
      RAISE EXCEPTION 'Assigned exam set must have ACTIVE status'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_assigned_exam_set ON "Examinee";
CREATE TRIGGER trg_check_assigned_exam_set
  BEFORE INSERT OR UPDATE OF "assignedExamSetId" ON "Examinee"
  FOR EACH ROW
  EXECUTE FUNCTION check_assigned_exam_set_active();
