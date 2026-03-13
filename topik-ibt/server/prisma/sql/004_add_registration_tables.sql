-- TASK-14: 자가접수 시스템 테이블 및 Enum 추가
-- 기존 ExamType enum 재사용, 신규 enum 3개 + 테이블 3개 생성

-- ─── 신규 Enum 타입 ──────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE "ScheduleStatus" AS ENUM ('OPEN', 'CLOSED', 'FULL');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "RegistrationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── RegistrationUser (접수 회원) ────────────────────────────

CREATE TABLE IF NOT EXISTS "RegistrationUser" (
  "id"           TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "email"        TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "name"         TEXT NOT NULL,
  "phone"        TEXT,
  "isVerified"   BOOLEAN NOT NULL DEFAULT false,
  "verifyCode"   TEXT,
  "verifyExpiry" TIMESTAMP(3),
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "RegistrationUser_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "RegistrationUser_email_key" ON "RegistrationUser"("email");

-- ─── ExamSchedule (시험 일정) ────────────────────────────────

CREATE TABLE IF NOT EXISTS "ExamSchedule" (
  "id"                   TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "examName"             TEXT NOT NULL,
  "examRound"            INTEGER NOT NULL,
  "examType"             "ExamType" NOT NULL,
  "examDate"             TIMESTAMP(3) NOT NULL,
  "registrationStartAt"  TIMESTAMP(3) NOT NULL,
  "registrationEndAt"    TIMESTAMP(3) NOT NULL,
  "venues"               JSONB NOT NULL DEFAULT '[]'::jsonb,
  "maxCapacity"          INTEGER NOT NULL,
  "currentCount"         INTEGER NOT NULL DEFAULT 0,
  "status"               "ScheduleStatus" NOT NULL DEFAULT 'OPEN',
  "createdAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ExamSchedule_pkey" PRIMARY KEY ("id")
);

-- ─── Registration (접수 신청) ────────────────────────────────

CREATE TABLE IF NOT EXISTS "Registration" (
  "id"            TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "userId"        TEXT NOT NULL,
  "scheduleId"    TEXT NOT NULL,
  "examType"      "ExamType" NOT NULL,
  "englishName"   TEXT NOT NULL,
  "birthDate"     TIMESTAMP(3) NOT NULL,
  "gender"        "Gender" NOT NULL,
  "photoUrl"      TEXT,
  "venueId"       TEXT NOT NULL,
  "venueName"     TEXT NOT NULL,
  "contactPhone"  TEXT,
  "address"       TEXT,
  "status"        "RegistrationStatus" NOT NULL DEFAULT 'PENDING',
  "examineeId"    TEXT,
  "rejectionNote" TEXT,
  "approvedAt"    TIMESTAMP(3),
  "approvedById"  TEXT,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Registration_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Registration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "RegistrationUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Registration_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "ExamSchedule"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- 동일 사용자가 동일 일정에 중복 접수 방지
CREATE UNIQUE INDEX IF NOT EXISTS "Registration_userId_scheduleId_key" ON "Registration"("userId", "scheduleId");

-- 상태별 조회 인덱스
CREATE INDEX IF NOT EXISTS "Registration_status_idx" ON "Registration"("status");
CREATE INDEX IF NOT EXISTS "Registration_scheduleId_idx" ON "Registration"("scheduleId");
