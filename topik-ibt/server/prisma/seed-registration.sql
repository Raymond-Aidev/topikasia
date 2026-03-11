-- 시험 일정 시드 데이터
INSERT INTO "ExamSchedule" (id, "examName", "examRound", "examType", "examDate", "registrationStartAt", "registrationEndAt", venues, "maxCapacity", "currentCount", status, "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), '2026년도 제106회 한국어능력시험', 106, 'TOPIK_I',
   '2026-05-17 09:00:00+09', '2026-03-01 00:00:00+09', '2026-04-15 23:59:59+09',
   '[{"id":"v1","name":"서울 TOPIK Asia 시험센터","address":"서울특별시 강남구 테헤란로 123","capacity":200,"currentCount":0},{"id":"v2","name":"부산 TOPIK Asia 시험센터","address":"부산광역시 해운대구 센텀중앙로 55","capacity":150,"currentCount":0}]',
   350, 0, 'OPEN', NOW(), NOW()),
  (gen_random_uuid(), '2026년도 제106회 한국어능력시험', 106, 'TOPIK_II',
   '2026-05-17 14:00:00+09', '2026-03-01 00:00:00+09', '2026-04-15 23:59:59+09',
   '[{"id":"v1","name":"서울 TOPIK Asia 시험센터","address":"서울특별시 강남구 테헤란로 123","capacity":200,"currentCount":0},{"id":"v2","name":"부산 TOPIK Asia 시험센터","address":"부산광역시 해운대구 센텀중앙로 55","capacity":150,"currentCount":0}]',
   350, 0, 'OPEN', NOW(), NOW()),
  (gen_random_uuid(), '2026년도 제107회 한국어능력시험', 107, 'TOPIK_I',
   '2026-07-12 09:00:00+09', '2026-05-01 00:00:00+09', '2026-06-15 23:59:59+09',
   '[{"id":"v3","name":"서울 TOPIK Asia 시험센터","address":"서울특별시 강남구 테헤란로 123","capacity":200,"currentCount":0}]',
   200, 0, 'OPEN', NOW(), NOW())
ON CONFLICT DO NOTHING;
