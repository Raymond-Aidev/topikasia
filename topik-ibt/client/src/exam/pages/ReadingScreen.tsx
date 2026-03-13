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
import OrderingQuestion from '../components/OrderingQuestion';
import InsertPositionQuestion from '../components/InsertPositionQuestion';
import AllQuestionsPopup from '../components/AllQuestionsPopup';
import { useAutoSave } from '../hooks/useAutoSave';
import { examApi } from '../../api/examApi';

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
  const sessionId = useExamStore((s) => s.sessionId);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAllPopup, setShowAllPopup] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const question = questions[currentIndex];
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 서버에서 읽기 문제 로드
  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;

    (async () => {
      try {
        const res = await examApi.get(`/exam/sessions/${sessionId}/questions`, {
          params: { section: 'READING' },
        });
        if (cancelled) return;
        const data = res.data?.data || res.data;
        setQuestions(data.questions || []);
      } catch (err: any) {
        if (cancelled) return;
        setFetchError(err.response?.data?.message || '문제를 불러올 수 없습니다.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [sessionId]);

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
      case 'ORDERING':
        return (
          <OrderingQuestion
            question={question}
            answer={answers[question.questionId]}
            onAnswer={handleAnswer}
          />
        );
      case 'INSERT_POSITION':
        return (
          <InsertPositionQuestion
            question={question}
            answer={answers[question.questionId]}
            onAnswer={handleAnswer}
          />
        );
      default:
        return <div>지원하지 않는 문제 유형입니다.</div>;
    }
  };

  if (loading) {
    return (
      <>
        <ExamHeader
          registrationNumber={examinee?.registrationNumber}
          examTitle="TOPIK IBT - 읽기"
          timerMode="countdown"
          remainingSeconds={remainingSeconds}
        />
        <div style={{ ...styles.page, textAlign: 'center' as const, paddingTop: 160 }}>
          <div style={{ fontSize: 18, color: '#757575' }}>문제를 불러오는 중...</div>
        </div>
      </>
    );
  }

  if (fetchError || questions.length === 0) {
    return (
      <>
        <ExamHeader
          registrationNumber={examinee?.registrationNumber}
          examTitle="TOPIK IBT - 읽기"
          timerMode="countdown"
          remainingSeconds={remainingSeconds}
        />
        <div style={{ ...styles.page, textAlign: 'center' as const, paddingTop: 160 }}>
          <div style={{ fontSize: 18, color: '#C62828' }}>
            {fetchError || '문제 데이터가 없습니다.'}
          </div>
        </div>
      </>
    );
  }

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
