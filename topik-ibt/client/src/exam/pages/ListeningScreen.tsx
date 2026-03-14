import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExamStore } from '../../store/examStore';
import type { AnswerValue } from '../../store/examStore';
import type { Question } from '../../types/exam.types';
import ExamHeader from '../../shared/components/ExamHeader';
import ExamNavigation from '../../shared/components/ExamNavigation';
import NetworkStatusBanner from '../../shared/components/NetworkStatusBanner';
import AudioPlayer from '../components/AudioPlayer';
import MCQQuestion from '../components/MCQQuestion';
import { useAutoSave } from '../hooks/useAutoSave';

// ─── Mock Data ──────────────────────────────────────────────────
const MOCK_LISTENING_QUESTIONS: Question[] = [
  {
    questionId: 'L1',
    bankId: 'B1',
    section: 'LISTENING',
    questionType: 'MCQ_SINGLE',
    questionNumber: 1,
    instruction: '다음을 듣고 알맞은 그림을 고르십시오.',
    audioUrl: '/audio/listening_01.mp3',
    audioMaxPlay: 2,
    options: [
      { id: 1, text: '남자는 서점에서 책을 사고 있다.' },
      { id: 2, text: '여자는 도서관에서 공부하고 있다.' },
      { id: 3, text: '남자는 카페에서 커피를 마시고 있다.' },
      { id: 4, text: '여자는 식당에서 음식을 주문하고 있다.' },
    ],
  },
  {
    questionId: 'L2',
    bankId: 'B1',
    section: 'LISTENING',
    questionType: 'MCQ_SINGLE',
    questionNumber: 2,
    instruction: '다음을 듣고 이어질 수 있는 말을 고르십시오.',
    audioUrl: '/audio/listening_02.mp3',
    audioMaxPlay: 2,
    options: [
      { id: 1, text: '네, 내일 만나요.' },
      { id: 2, text: '아니요, 어제 만났어요.' },
      { id: 3, text: '네, 지금 가고 있어요.' },
      { id: 4, text: '아니요, 다음에 갈게요.' },
    ],
  },
  {
    questionId: 'L3',
    bankId: 'B1',
    section: 'LISTENING',
    questionType: 'MCQ_SINGLE',
    questionNumber: 3,
    instruction: '다음을 듣고 남자가 하고 싶은 말을 고르십시오.',
    passageText: '남자와 여자의 대화를 잘 듣고 질문에 답하십시오.',
    audioUrl: '/audio/listening_03.mp3',
    audioMaxPlay: 2,
    options: [
      { id: 1, text: '주말에 같이 등산을 가자고 한다.' },
      { id: 2, text: '운동을 꾸준히 해야 한다고 한다.' },
      { id: 3, text: '건강을 위해 식단을 바꾸자고 한다.' },
      { id: 4, text: '스트레스를 줄여야 한다고 한다.' },
    ],
  },
  {
    questionId: 'L4',
    bankId: 'B1',
    section: 'LISTENING',
    questionType: 'MCQ_SINGLE',
    questionNumber: 4,
    instruction: '다음을 듣고 대화 내용과 같은 것을 고르십시오.',
    audioUrl: '/audio/listening_04.mp3',
    audioMaxPlay: 2,
    options: [
      { id: 1, text: '여자는 한국에 처음 왔다.' },
      { id: 2, text: '남자는 한국어를 잘 못한다.' },
      { id: 3, text: '여자는 한국에서 3년 살았다.' },
      { id: 4, text: '남자는 한국 음식을 좋아하지 않는다.' },
    ],
  },
  {
    questionId: 'L5',
    bankId: 'B1',
    section: 'LISTENING',
    questionType: 'MCQ_SINGLE',
    questionNumber: 5,
    instruction: '다음을 듣고 여자의 중심 생각을 고르십시오.',
    audioUrl: '/audio/listening_05.mp3',
    audioMaxPlay: 2,
    options: [
      { id: 1, text: '환경 보호를 위해 대중교통을 이용해야 한다.' },
      { id: 2, text: '경제적으로 자동차가 더 효율적이다.' },
      { id: 3, text: '건강을 위해 자전거를 타야 한다.' },
      { id: 4, text: '출퇴근 시간을 줄이는 것이 중요하다.' },
    ],
  },
];

export default function ListeningScreen() {
  const navigate = useNavigate();
  const { saveAnswer } = useAutoSave();

  const answers = useExamStore((s) => s.answers);
  const setAnswer = useExamStore((s) => s.setAnswer);
  const remainingSeconds = useExamStore((s) => s.sectionRemainingSeconds);
  const setSectionRemainingSeconds = useExamStore((s) => s.setSectionRemainingSeconds);
  const examinee = useExamStore((s) => s.examinee);

  const [currentIndex, setCurrentIndex] = useState(0);
  const questions = MOCK_LISTENING_QUESTIONS;
  const question = questions[currentIndex];
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Initialize timer if not set
  useEffect(() => {
    if (remainingSeconds <= 0) {
      setSectionRemainingSeconds(40 * 60); // 40 minutes for listening
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Timer countdown
  useEffect(() => {
    timerRef.current = setInterval(() => {
      const current = useExamStore.getState().sectionRemainingSeconds;
      if (current <= 1) {
        // Auto-submit on timer expiry
        if (timerRef.current) clearInterval(timerRef.current);
        navigate('/exam/submit/listening');
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
      // Last question -> submit
      navigate('/exam/submit/listening');
    }
  };

  return (
    <>
      <ExamHeader
        registrationNumber={examinee?.registrationNumber}
        examTitle="TOPIK IBT - 듣기"
        timerMode="countdown"
        remainingSeconds={remainingSeconds}
      />
      <NetworkStatusBanner />

      <div className="max-w-[800px] mx-auto px-6 pt-[72px] pb-20 font-sans">
        <div className="text-sm text-gray-500 mb-2 font-medium">
          {question.questionNumber} / {questions.length}
        </div>

        <AudioPlayer
          audioUrl={question.audioUrl ?? ''}
          maxPlays={question.audioMaxPlay ?? 2}
          questionId={question.questionId}
          autoPlay
        />

        <MCQQuestion
          question={question}
          answer={answers[question.questionId]}
          onAnswer={handleAnswer}
        />
      </div>

      <ExamNavigation
        onPrev={handlePrev}
        onNext={handleNext}
        prevDisabled={currentIndex === 0}
      />
    </>
  );
}
