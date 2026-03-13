-- ACID T1-06: 시험세트 번호 시퀀스 채번
-- 운영 환경에서 generateExamSetNumber() 대신 사용
CREATE SEQUENCE IF NOT EXISTS exam_set_number_seq START 1;

-- 사용 예:
-- SELECT nextval('exam_set_number_seq');
-- examSetNumber = 'TOPIK-' || LPAD(nextval('exam_set_number_seq')::text, 6, '0');
