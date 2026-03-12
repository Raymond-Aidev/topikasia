-- QuestionExplanation: LLM 해설 캐시
CREATE TABLE IF NOT EXISTS "QuestionExplanation" (
  "id" TEXT NOT NULL,
  "questionBankId" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "examineeAnswer" JSONB,
  "correctAnswer" JSONB,
  "explanation" TEXT NOT NULL,
  "llmModel" TEXT NOT NULL,
  "generatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "QuestionExplanation_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "QuestionExplanation_sessionId_questionBankId_key" UNIQUE ("sessionId", "questionBankId"),
  CONSTRAINT "QuestionExplanation_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ExamSession"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "QuestionExplanation_questionBankId_idx" ON "QuestionExplanation"("questionBankId");

-- LmsAnalysis: 유형별 분석 스냅샷
CREATE TABLE IF NOT EXISTS "LmsAnalysis" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "examineeId" TEXT NOT NULL,
  "typeBreakdown" JSONB NOT NULL,
  "strengths" JSONB NOT NULL,
  "weaknesses" JSONB NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "LmsAnalysis_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "LmsAnalysis_sessionId_key" UNIQUE ("sessionId"),
  CONSTRAINT "LmsAnalysis_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ExamSession"("id") ON DELETE CASCADE,
  CONSTRAINT "LmsAnalysis_examineeId_fkey" FOREIGN KEY ("examineeId") REFERENCES "Examinee"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "LmsAnalysis_examineeId_idx" ON "LmsAnalysis"("examineeId");
