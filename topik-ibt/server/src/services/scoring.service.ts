/**
 * 자동채점 엔진
 * SCORE-08: 객관식·드롭다운·순서 배열 문항 자동 채점
 * SCORE-10: TOPIK 등급 기준 적용
 */

// ─── 등급 기준 (SCORE-10) ───────────────────────────────────
const TOPIK_I_GRADES = [
  { grade: 2, minScore: 140 },
  { grade: 1, minScore: 80 },
];

const TOPIK_II_GRADES = [
  { grade: 6, minScore: 230 },
  { grade: 5, minScore: 190 },
  { grade: 4, minScore: 150 },
  { grade: 3, minScore: 120 },
];

export function calculateGrade(examType: string, totalScore: number): number | null {
  const grades = examType === 'TOPIK_I' ? TOPIK_I_GRADES : TOPIK_II_GRADES;
  for (const g of grades) {
    if (totalScore >= g.minScore) return g.grade;
  }
  return null; // 등급 미달
}

// ─── 자동채점 로직 ──────────────────────────────────────────
interface AnswerRecord {
  questionBankId: string;
  section: string;
  questionIndex: number;
  answerJson: any;
}

interface QuestionDef {
  bankId: string;
  typeCode: string;
  questionIndex: number;
  correctAnswer?: any; // 정답 (MCQ: number, ordering: number[], dropdown: number)
  points?: number;     // 배점 (기본값 사용)
}

interface SectionDef {
  section: string;
  durationMinutes: number;
  questionCount: number;
  questions: QuestionDef[];
}

interface SectionScoreResult {
  raw: number;
  scaled: number;
  maxScore: number;
  autoGraded: boolean;
  questionResults?: Array<{
    bankId: string;
    correct: boolean | null; // null = 수동채점 필요
    points: number;
    earnedPoints: number;
  }>;
}

/**
 * 자동채점 가능 유형인지 확인
 */
function isAutoGradable(typeCode: string): boolean {
  return ['LISTEN_MCQ', 'READ_MCQ', 'MCQ', 'DROPDOWN', 'ORDERING'].includes(typeCode);
}

/**
 * 개별 문항 채점
 */
function gradeQuestion(
  question: QuestionDef,
  answer: AnswerRecord | undefined,
  pointsPerQuestion: number,
): { correct: boolean | null; earnedPoints: number } {
  if (!isAutoGradable(question.typeCode)) {
    // 수동채점 대상 (쓰기)
    return { correct: null, earnedPoints: 0 };
  }

  if (!answer || answer.answerJson == null) {
    return { correct: false, earnedPoints: 0 };
  }

  const correctAnswer = question.correctAnswer;
  if (correctAnswer == null) {
    // 정답 미설정 → 임시로 정답 처리 (시뮬레이션 모드)
    // 실제 운영에서는 정답이 반드시 설정되어야 함
    return { correct: null, earnedPoints: 0 };
  }

  const userAnswer = answer.answerJson;
  let correct = false;

  if (question.typeCode === 'ORDERING') {
    // 순서 배열: 배열 비교
    correct = Array.isArray(userAnswer) && Array.isArray(correctAnswer) &&
      userAnswer.length === correctAnswer.length &&
      userAnswer.every((v: number, i: number) => v === correctAnswer[i]);
  } else {
    // MCQ, DROPDOWN: 단일값 비교
    let userVal: any;
    if (typeof userAnswer === 'object') {
      // { selectedOptions: [2] } 또는 { selectedDropdown: 3 } 또는 { selected: 1 }
      if (Array.isArray(userAnswer.selectedOptions) && userAnswer.selectedOptions.length > 0) {
        userVal = userAnswer.selectedOptions[0];
      } else if (userAnswer.selectedDropdown != null) {
        userVal = userAnswer.selectedDropdown;
      } else if (userAnswer.selected != null) {
        userVal = userAnswer.selected;
      } else {
        userVal = userAnswer;
      }
    } else {
      userVal = userAnswer;
    }
    correct = userVal === correctAnswer;
  }

  return { correct, earnedPoints: correct ? pointsPerQuestion : 0 };
}

/**
 * 영역별 자동채점
 */
export function gradeSection(
  sectionDef: SectionDef,
  answers: AnswerRecord[],
  sectionMaxScore: number,
): SectionScoreResult {
  const questions = sectionDef.questions;
  const autoGradableCount = questions.filter(q => isAutoGradable(q.typeCode)).length;
  const hasManualQuestions = autoGradableCount < questions.length;

  // 배점 계산: 문항에 개별 배점(points)이 있으면 사용, 없으면 균등 배분
  const hasIndividualPoints = questions.some(q => q.points && q.points > 0);
  const pointsPerQuestion = !hasIndividualPoints && autoGradableCount > 0
    ? Math.floor(sectionMaxScore / (hasManualQuestions ? autoGradableCount : questions.length))
    : 0;

  const answerMap = new Map(answers.map(a => [a.questionBankId, a]));

  const questionResults = questions.map(q => {
    const answer = answerMap.get(q.bankId);
    const points = q.points && q.points > 0
      ? q.points
      : (isAutoGradable(q.typeCode) ? pointsPerQuestion : 0);
    const result = gradeQuestion(q, answer, points);
    return {
      bankId: q.bankId,
      correct: result.correct,
      points,
      earnedPoints: result.earnedPoints,
    };
  });

  const raw = questionResults.reduce((sum, r) => sum + r.earnedPoints, 0);
  const autoGraded = !hasManualQuestions;

  return {
    raw,
    scaled: raw, // 현재 원점수 = 표준점수 (향후 확장)
    maxScore: sectionMaxScore,
    autoGraded,
    questionResults,
  };
}

/**
 * 영역별 만점 기준
 */
export function getSectionMaxScores(examType: string): Record<string, number> {
  if (examType === 'TOPIK_I') {
    return { LISTENING: 100, READING: 100 };
  }
  return { LISTENING: 100, WRITING: 100, READING: 100 };
}

/**
 * 전체 세션 자동채점
 */
export function autoGradeSession(
  examType: string,
  sectionsJson: Record<string, SectionDef>,
  answers: AnswerRecord[],
): {
  sectionScores: Record<string, SectionScoreResult>;
  totalScore: number;
  maxTotalScore: number;
  grade: number | null;
  hasManualSections: boolean;
} {
  const maxScores = getSectionMaxScores(examType);
  const sectionScores: Record<string, SectionScoreResult> = {};
  let totalScore = 0;
  let hasManualSections = false;

  for (const [sectionKey, sectionDef] of Object.entries(sectionsJson)) {
    const sectionAnswers = answers.filter(a => a.section === sectionKey);
    const maxScore = maxScores[sectionKey] || 100;
    const result = gradeSection(sectionDef, sectionAnswers, maxScore);
    sectionScores[sectionKey] = result;
    totalScore += result.raw;
    if (!result.autoGraded) hasManualSections = true;
  }

  const maxTotalScore = examType === 'TOPIK_I' ? 200 : 300;
  const grade = hasManualSections ? null : calculateGrade(examType, totalScore);

  return { sectionScores, totalScore, maxTotalScore, grade, hasManualSections };
}
