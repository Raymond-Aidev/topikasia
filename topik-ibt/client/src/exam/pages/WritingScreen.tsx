import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExamStore } from '../../store/examStore';
import type { AnswerValue } from '../../store/examStore';
import type { Question } from '../../types/exam.types';
import ExamHeader from '../../shared/components/ExamHeader';
import ExamNavigation from '../../shared/components/ExamNavigation';
import NetworkStatusBanner from '../../shared/components/NetworkStatusBanner';
import ShortAnswerQuestion from '../components/ShortAnswerQuestion';
import EssayQuestion from '../components/EssayQuestion';
import { useAutoSave } from '../hooks/useAutoSave';

// ─── Mock Data ──────────────────────────────────────────────────
const MOCK_WRITING_QUESTIONS: Question[] = [
  {
    questionId: 'W1',
    bankId: 'B2',
    section: 'WRITING',
    questionType: 'SHORT_ANSWER',
    questionNumber: 1,
    instruction: '다음을 읽고 (ㄱ)과 (ㄴ)에 들어갈 말을 각각 한 문장으로 쓰십시오.',
    passageText:
      '가: 이번 주말에 뭐 할 거예요?\n나: ( ㄱ ).\n가: 좋아요! 저도 같이 가도 돼요?\n나: ( ㄴ ).',
    gapLabels: ['ㄱ', 'ㄴ'],
  },
  {
    questionId: 'W2',
    bankId: 'B2',
    section: 'WRITING',
    questionType: 'SHORT_ANSWER',
    questionNumber: 2,
    instruction: '다음을 읽고 (ㄱ)과 (ㄴ)에 들어갈 말을 각각 한 문장으로 쓰십시오.',
    passageText:
      '요즘 건강에 관심이 많아졌습니다. 그래서 ( ㄱ ).\n운동을 시작한 지 한 달이 되었는데 ( ㄴ ).',
    gapLabels: ['ㄱ', 'ㄴ'],
  },
  {
    questionId: 'W3',
    bankId: 'B2',
    section: 'WRITING',
    questionType: 'ESSAY',
    questionNumber: 3,
    instruction:
      '다음을 주제로 하여 자신의 생각을 600~700자로 글을 쓰십시오.\n\n\'현대 사회에서 인공지능(AI)의 발전이 우리 생활에 미치는 영향\'에 대해 찬성 또는 반대 입장을 정하고, 그 이유를 구체적인 예를 들어 설명하십시오.',
    passageText:
      '최근 인공지능 기술이 빠르게 발전하면서 우리 생활의 많은 부분이 변화하고 있습니다. 의료, 교육, 교통 등 다양한 분야에서 AI가 활용되고 있으며, 이에 대한 긍정적, 부정적 의견이 공존하고 있습니다.',
    characterLimit: { min: 600, max: 700 },
  },
];

// ─── Styles ─────────────────────────────────────────────────────
const styles = {
  page: {
    paddingTop: 72,
    paddingBottom: 80,
    maxWidth: 800,
    margin: '0 auto',
    padding: '72px 24px 80px',
    fontFamily: 'sans-serif',
  },
  questionIndicator: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 12,
    fontWeight: 500 as const,
  },
};

export default function WritingScreen() {
  const navigate = useNavigate();
  const { saveAnswer } = useAutoSave();

  const answers = useExamStore((s) => s.answers);
  const setAnswer = useExamStore((s) => s.setAnswer);
  const remainingSeconds = useExamStore((s) => s.sectionRemainingSeconds);
  const setSectionRemainingSeconds = useExamStore((s) => s.setSectionRemainingSeconds);
  const examinee = useExamStore((s) => s.examinee);

  const [currentIndex, setCurrentIndex] = useState(0);
  const questions = MOCK_WRITING_QUESTIONS;
  const question = questions[currentIndex];
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Initialize timer if not set
  useEffect(() => {
    if (remainingSeconds <= 0) {
      setSectionRemainingSeconds(50 * 60); // 50 minutes for writing
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Timer countdown
  useEffect(() => {
    timerRef.current = setInterval(() => {
      const current = useExamStore.getState().sectionRemainingSeconds;
      if (current <= 1) {
        if (timerRef.current) clearInterval(timerRef.current);
        navigate('/exam/submit/writing');
        return;
      }
      setSectionRemainingSeconds(current - 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [navigate, setSectionRemainingSeconds]);

  const handleAnswer = useCallback(
    (value: AnswerValue) => {
      setAnswer(question.questionId, value);
      saveAnswer(question.questionId, question.questionNumber, value);
    },
    [question.questionId, setAnswer, saveAnswer],
  );

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      navigate('/exam/submit/writing');
    }
  };

  const renderQuestion = () => {
    switch (question.questionType) {
      case 'SHORT_ANSWER':
        return (
          <ShortAnswerQuestion
            question={question}
            answer={answers[question.questionId]}
            onAnswer={handleAnswer}
          />
        );
      case 'ESSAY':
        return (
          <EssayQuestion
            question={question}
            answer={answers[question.questionId]}
            onAnswer={handleAnswer}
          />
        );
      default:
        return <div>지원하지 않는 문제 유형입니다.</div>;
    }
  };

  return (
    <>
      <ExamHeader
        registrationNumber={examinee?.registrationNumber}
        examTitle="TOPIK IBT - 쓰기"
        timerMode="countdown"
        remainingSeconds={remainingSeconds}
      />
      <NetworkStatusBanner />

      <div style={styles.page}>
        <div style={styles.questionIndicator}>
          {question.questionNumber} / {questions.length}
        </div>

        {renderQuestion()}
      </div>

      <ExamNavigation
        onPrev={handlePrev}
        onNext={handleNext}
        prevDisabled={currentIndex === 0}
      />
    </>
  );
}
