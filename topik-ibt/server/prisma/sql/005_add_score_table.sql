-- Score table for storing grading results
CREATE TABLE IF NOT EXISTS "Score" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "examineeId" TEXT NOT NULL,
  "examSetId" TEXT NOT NULL,
  "examType" "ExamType" NOT NULL,
  "sectionScores" JSONB NOT NULL,
  "totalScore" INTEGER NOT NULL DEFAULT 0,
  "maxTotalScore" INTEGER NOT NULL DEFAULT 200,
  "grade" INTEGER,
  "gradingStatus" TEXT NOT NULL DEFAULT 'PENDING',
  "isPublished" BOOLEAN NOT NULL DEFAULT false,
  "publishedAt" TIMESTAMPTZ,
  "publishedById" TEXT,
  "gradedAt" TIMESTAMPTZ,
  "gradedById" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "Score_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Score_sessionId_key" UNIQUE ("sessionId"),
  CONSTRAINT "Score_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ExamSession"("id") ON DELETE CASCADE,
  CONSTRAINT "Score_examineeId_fkey" FOREIGN KEY ("examineeId") REFERENCES "Examinee"("id") ON DELETE CASCADE,
  CONSTRAINT "Score_examSetId_fkey" FOREIGN KEY ("examSetId") REFERENCES "ExamSet"("id") ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS "Score_examineeId_idx" ON "Score"("examineeId");
CREATE INDEX IF NOT EXISTS "Score_examSetId_idx" ON "Score"("examSetId");
CREATE INDEX IF NOT EXISTS "Score_gradingStatus_idx" ON "Score"("gradingStatus");
