-- 관리자 계정 시드: benedium@gmail.com / fpdlajs1*
INSERT INTO "AdminUser" ("id", "loginId", "passwordHash", "name", "role", "createdAt", "updatedAt")
VALUES (
  'cladmin_benedium2026',
  'benedium@gmail.com',
  '$2b$12$FHVvHhJL5BmZ1xyovvMw7O/CXNMttafBrt7MgbLRnM6vSUzN.ehcq',
  'Super Admin',
  'SUPER_ADMIN'::"AdminRole",
  NOW(),
  NOW()
)
ON CONFLICT ("loginId") DO NOTHING;
