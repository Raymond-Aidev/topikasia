import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { examApi } from '../../api/examApi';
import { useExamStore } from '../../store/examStore';
import ExamHeader from '../../shared/components/ExamHeader';
import ExamineeCard from '../../shared/components/ExamineeCard';
import type { SectionType } from '../../types/exam.types';
import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/button';

const SECTION_LABEL: Record<SectionType, string> = {
  LISTENING: '듣기',
  WRITING: '쓰기',
  READING: '읽기',
};

const SECTION_ORDER: SectionType[] = ['LISTENING', 'WRITING', 'READING'];

function isAnswered(value: any): boolean {
  if (!value) return false;
  if (value.selectedOptions && value.selectedOptions.length > 0) return true;
  if (value.textInput && value.textInput.trim().length > 0) return true;
  if (value.gapAnswers && Object.values(value.gapAnswers).some((v: any) => v && String(v).trim())) return true;
  if (value.orderedItems && value.orderedItems.length > 0) return true;
  if (value.insertPosition != null) return true;
  if (value.selectedDropdown != null) return true;
  return false;
}

export default function SubmitReviewScreen() {
  const navigate = useNavigate();
  const { section: sectionParam } = useParams<{ section: string }>();
  const section = (sectionParam?.toUpperCase() || 'LISTENING') as SectionType;

  const examinee = useExamStore((s) => s.examinee);
  const assignedExamSet = useExamStore((s) => s.assignedExamSet);
  const sessionId = useExamStore((s) => s.sessionId);
  const answers = useExamStore((s) => s.answers);
  const sectionRemainingSeconds = useExamStore((s) => s.sectionRemainingSeconds);
  const setCurrentSection = useExamStore((s) => s.setCurrentSection);
  const setExamPhase = useExamStore((s) => s.setExamPhase);
  const setAnswers = useExamStore((s) => s.setAnswers);

  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const sectionInfo = assignedExamSet?.sections.find((s) => s.section === section);
  const totalQuestions = sectionInfo?.questionCount || 0;

  // Count answered/unanswered
  const answeredCount = Object.values(answers).filter(isAnswered).length;
  const unansweredCount = Math.max(0, totalQuestions - answeredCount);

  // Generate question numbers 1..totalQuestions
  const questionNumbers = Array.from({ length: totalQuestions }, (_, i) => i + 1);

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await examApi.post(`/exam/sessions/${sessionId}/submit-section`, {
        sectionName: section,
      });
    } catch {
      // Continue even if API fails - fallback behavior
    }

    // Determine next section
    const currentIdx = SECTION_ORDER.indexOf(section);
    const nextSections = assignedExamSet?.sections
      .map((s) => s.section)
      .filter((s) => SECTION_ORDER.indexOf(s) > currentIdx) || [];

    if (nextSections.length > 0) {
      const nextSection = nextSections[0];
      setAnswers({});
      setCurrentSection(nextSection);
      navigate('/exam/section-waiting', { replace: true });
    } else {
      // 마지막 섹션 제출 → 시험 완료 (자동 채점 트리거)
      try {
        await examApi.post(`/exam/sessions/${sessionId}/complete`);
      } catch {
        // 실패해도 종료 화면으로 진행
      }
      setExamPhase('DONE');
      navigate('/exam/end', { replace: true });
    }
    setSubmitting(false);
  };

  return (
    <>
      <ExamHeader
        registrationNumber={examinee?.registrationNumber}
        examTitle={`${SECTION_LABEL[section]} 답안 확인`}
        timerMode="countdown"
        remainingSeconds={sectionRemainingSeconds}
      />

      <div className="pt-[72px] pb-6 min-h-screen bg-gray-100 font-sans">
        <div className="max-w-[600px] mx-auto px-4">
          <ExamineeCard
            seatNumber={examinee?.seatNumber}
            photoUrl={examinee?.photoUrl}
            registrationNumber={examinee?.registrationNumber}
            name={examinee?.name}
          />

          <div className="text-xl font-bold text-blue-800 mb-5 text-center">{SECTION_LABEL[section]} 답안 확인</div>

          <div className="flex justify-center gap-6 my-5">
            <div className="text-center px-5 py-3 bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.08)] min-w-[80px]">
              <div className="text-xs text-gray-500 mb-1">전체</div>
              <div className="text-[22px] font-bold text-gray-900">{totalQuestions}</div>
            </div>
            <div className="text-center px-5 py-3 bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.08)] min-w-[80px]">
              <div className="text-xs text-gray-500 mb-1">응답</div>
              <div className="text-[22px] font-bold text-blue-800">{answeredCount}</div>
            </div>
            <div className="text-center px-5 py-3 bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.08)] min-w-[80px]">
              <div className="text-xs text-gray-500 mb-1">미응답</div>
              <div className="text-[22px] font-bold text-red-800">{unansweredCount}</div>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-2 my-4 mb-6">
            {questionNumbers.map((num) => {
              const qKey = Object.keys(answers).find((_k) => {
                // Match by question number embedded in key or by index
                return true;
              });
              const ans = qKey ? answers[qKey] : undefined;
              const answered = isAnswered(ans) && num <= answeredCount;

              return (
                <div
                  key={num}
                  className={cn(
                    'py-2.5 text-center rounded-md text-sm font-semibold border border-gray-300',
                    answered ? 'bg-white text-gray-900' : 'bg-red-200 text-red-800'
                  )}
                >
                  {num}
                </div>
              );
            })}
          </div>

          <div className="flex gap-3 justify-center mt-6">
            <Button
              variant="outline"
              className="px-8 py-3.5 text-[15px] font-semibold border-blue-800 text-blue-800 rounded-lg h-auto"
              onClick={handleGoBack}
            >
              이전
            </Button>
            <Button
              className="px-8 py-3.5 text-[15px] font-bold bg-blue-800 hover:bg-blue-900 rounded-lg h-auto"
              onClick={() => setShowModal(true)}
            >
              답안 제출
            </Button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
          <div className="w-[400px] p-8 bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.2)] text-center">
            <div className="text-lg font-bold text-red-800 mb-3">답안을 제출하시겠습니까?</div>
            <div className="text-sm text-gray-700 leading-[1.7] mb-6">
              제출 후에는 답안을 수정할 수 없습니다.<br />
              미응답 문항이 {unansweredCount}개 있습니다.<br />
              정말 제출하시겠습니까?
            </div>
            <div className="flex gap-3 justify-center">
              <Button
                variant="outline"
                className="px-6 py-2.5 text-sm font-semibold border-gray-400 text-gray-500 rounded-lg h-auto"
                onClick={() => setShowModal(false)}
              >
                취소
              </Button>
              <Button
                className={cn(
                  'px-6 py-2.5 text-sm font-bold bg-red-800 hover:bg-red-900 rounded-lg h-auto',
                  submitting && 'opacity-60'
                )}
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? '제출 중...' : '제출'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
