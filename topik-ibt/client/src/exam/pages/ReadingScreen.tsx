import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExamStore } from '../../store/examStore';
import type { AnswerValue } from '../../store/examStore';
import type { Question } from '../../types/exam.types';
import ExamHeader from '../../shared/components/ExamHeader';
import ExamNavigation from '../../shared/components/ExamNavigation';
import NetworkStatusBanner from '../../shared/components/NetworkStatusBanner';
import MCQQuestion from '../components/MCQQuestion';
import DropdownQuestion from '../components/DropdownQuestion';
import AllQuestionsPopup from '../components/AllQuestionsPopup';
import { useAutoSave } from '../hooks/useAutoSave';

// ─── Mock Data ──────────────────────────────────────────────────
const MOCK_READING_QUESTIONS: Question[] = [
  {
    questionId: 'R1',
    bankId: 'B3',
    section: 'READING',
    questionType: 'MCQ_SINGLE',
    questionNumber: 1,
    instruction: '다음 (    )에 들어갈 가장 알맞은 것을 고르십시오.',
    passageText: '저는 매일 아침 7시에 (    ). 그리고 8시에 학교에 갑니다.',
    options: [
      { id: 1, text: '일어납니다' },
      { id: 2, text: '잠을 잡니다' },
      { id: 3, text: '밥을 먹습니다' },
      { id: 4, text: '운동을 합니다' },
    ],
  },
  {
    questionId: 'R2',
    bankId: 'B3',
    section: 'READING',
    questionType: 'MCQ_SINGLE',
    questionNumber: 2,
    instruction: '다음 글의 내용과 같은 것을 고르십시오.',
    passageText:
      '한국의 사계절은 봄, 여름, 가을, 겨울로 나뉩니다. 봄에는 벚꽃이 피고 날씨가 따뜻해집니다. 여름에는 비가 많이 오고 매우 덥습니다. 가을에는 단풍이 아름답고 날씨가 선선합니다. 겨울에는 눈이 내리고 매우 춥습니다.',
    options: [
      { id: 1, text: '한국의 봄에는 눈이 내립니다.' },
      { id: 2, text: '한국의 여름에는 비가 많이 옵니다.' },
      { id: 3, text: '한국의 가을에는 날씨가 덥습니다.' },
      { id: 4, text: '한국의 겨울에는 벚꽃이 핍니다.' },
    ],
  },
  {
    questionId: 'R3',
    bankId: 'B3',
    section: 'READING',
    questionType: 'MCQ_SINGLE',
    questionNumber: 3,
    instruction: '다음 글의 주제로 가장 알맞은 것을 고르십시오.',
    passageText:
      '최근 많은 사람들이 환경 문제에 관심을 가지고 있습니다. 특히 플라스틱 사용을 줄이기 위해 텀블러를 사용하고 장바구니를 가지고 다니는 사람이 늘고 있습니다. 이러한 작은 실천이 모여 큰 변화를 만들 수 있습니다.',
    options: [
      { id: 1, text: '텀블러의 종류와 가격' },
      { id: 2, text: '환경 보호를 위한 생활 속 실천' },
      { id: 3, text: '플라스틱의 장점과 단점' },
      { id: 4, text: '장바구니를 만드는 방법' },
    ],
  },
  {
    questionId: 'R4',
    bankId: 'B3',
    section: 'READING',
    questionType: 'MCQ_SINGLE',
    questionNumber: 4,
    instruction: '다음을 읽고 중심 생각을 고르십시오.',
    passageText:
      '독서는 우리의 지식을 넓히고 사고력을 향상시킵니다. 또한 다른 사람의 경험을 간접적으로 할 수 있게 해 줍니다. 바쁜 현대인들에게도 하루 30분이라도 책을 읽는 습관을 가지는 것이 중요합니다.',
    options: [
      { id: 1, text: '독서는 시간 낭비이다.' },
      { id: 2, text: '독서 습관은 중요하다.' },
      { id: 3, text: '현대인은 바빠서 책을 읽을 수 없다.' },
      { id: 4, text: '경험이 독서보다 중요하다.' },
    ],
  },
  {
    questionId: 'R5',
    bankId: 'B3',
    section: 'READING',
    questionType: 'MCQ_SINGLE',
    questionNumber: 5,
    instruction: '다음 글에서 알 수 있는 것을 고르십시오.',
    passageText:
      '서울의 대중교통은 매우 편리합니다. 지하철은 1호선부터 9호선까지 있으며 버스도 다양한 노선이 있습니다. 교통카드 하나로 지하철과 버스를 모두 이용할 수 있어서 환승도 편리합니다.',
    options: [
      { id: 1, text: '서울에는 지하철이 10개 노선 있다.' },
      { id: 2, text: '교통카드로 지하철만 탈 수 있다.' },
      { id: 3, text: '서울의 대중교통은 환승이 편리하다.' },
      { id: 4, text: '버스는 교통카드를 사용할 수 없다.' },
    ],
  },
  // ─── DROPDOWN type questions ───
  {
    questionId: 'R6',
    bankId: 'B3',
    section: 'READING',
    questionType: 'DROPDOWN',
    questionNumber: 6,
    instruction: '다음 글의 빈칸에 들어갈 가장 알맞은 것을 고르십시오.',
    passageText:
      '한국어를 배우는 외국인들이 점점 늘고 있습니다. 한국 드라마와 K-POP의 인기 덕분에 한국 문화에 관심을 갖는 사람들이 많아졌기 때문입니다. 한국어는 [BLANK] 많은 사람들이 도전하고 있습니다.',
    options: [
      { id: 1, text: '배우기 어렵지만' },
      { id: 2, text: '배울 필요가 없지만' },
      { id: 3, text: '인기가 없지만' },
      { id: 4, text: '관심이 없지만' },
    ],
  },
  {
    questionId: 'R7',
    bankId: 'B3',
    section: 'READING',
    questionType: 'DROPDOWN',
    questionNumber: 7,
    instruction: '다음 글의 빈칸에 들어갈 가장 알맞은 것을 고르십시오.',
    passageText:
      '건강한 식습관을 갖는 것이 중요합니다. 아침 식사를 거르지 않고 규칙적으로 먹는 것이 좋습니다. 또한 채소와 과일을 [BLANK] 건강을 유지할 수 있습니다.',
    options: [
      { id: 1, text: '많이 먹으면' },
      { id: 2, text: '적게 먹으면' },
      { id: 3, text: '먹지 않으면' },
      { id: 4, text: '가끔 먹으면' },
    ],
  },
  // TODO: Phase 2 - ORDERING type questions
  // TODO: Phase 2 - INSERT_POSITION type questions
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

export default function ReadingScreen() {
  const navigate = useNavigate();
  const { saveAnswer } = useAutoSave();

  const answers = useExamStore((s) => s.answers);
  const setAnswer = useExamStore((s) => s.setAnswer);
  const remainingSeconds = useExamStore((s) => s.sectionRemainingSeconds);
  const setSectionRemainingSeconds = useExamStore((s) => s.setSectionRemainingSeconds);
  const examinee = useExamStore((s) => s.examinee);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAllPopup, setShowAllPopup] = useState(false);
  const questions = MOCK_READING_QUESTIONS;
  const question = questions[currentIndex];
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Initialize timer if not set
  useEffect(() => {
    if (remainingSeconds <= 0) {
      setSectionRemainingSeconds(70 * 60); // 70 minutes for reading
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Timer countdown
  useEffect(() => {
    timerRef.current = setInterval(() => {
      const current = useExamStore.getState().sectionRemainingSeconds;
      if (current <= 1) {
        if (timerRef.current) clearInterval(timerRef.current);
        navigate('/exam/submit/reading');
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
      saveAnswer(question.questionId, value);
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
      navigate('/exam/submit/reading');
    }
  };

  const handleNavigateToQuestion = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  const handleSubmit = useCallback(() => {
    setShowAllPopup(false);
    navigate('/exam/submit/reading');
  }, [navigate]);

  const renderQuestion = () => {
    switch (question.questionType) {
      case 'MCQ_SINGLE':
      case 'MCQ_MULTI':
        return (
          <MCQQuestion
            question={question}
            answer={answers[question.questionId]}
            onAnswer={handleAnswer}
          />
        );
      case 'DROPDOWN':
        return (
          <DropdownQuestion
            question={question}
            answer={answers[question.questionId]}
            onAnswer={handleAnswer}
          />
        );
      // TODO: Phase 2 - ORDERING
      // TODO: Phase 2 - INSERT_POSITION
      default:
        return <div>지원하지 않는 문제 유형입니다.</div>;
    }
  };

  return (
    <>
      <ExamHeader
        registrationNumber={examinee?.registrationNumber}
        examTitle="TOPIK IBT - 읽기"
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
        showAllButton
        onShowAll={() => setShowAllPopup(true)}
      />

      {showAllPopup && (
        <AllQuestionsPopup
          questions={questions}
          answers={answers}
          currentIndex={currentIndex}
          onNavigate={handleNavigateToQuestion}
          onClose={() => setShowAllPopup(false)}
          onSubmit={handleSubmit}
        />
      )}
    </>
  );
}
