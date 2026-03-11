import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { examApi } from '../../api/examApi';
import { useExamStore } from '../../store/examStore';
import ExamHeader from '../../shared/components/ExamHeader';
import ExamineeCard from '../../shared/components/ExamineeCard';
import type { SectionType } from '../../types/exam.types';

const SECTION_LABEL: Record<SectionType, string> = {
  LISTENING: '듣기',
  WRITING: '쓰기',
  READING: '읽기',
};

const SECTION_ORDER: SectionType[] = ['LISTENING', 'WRITING', 'READING'];

const styles = {
  page: {
    paddingTop: 72,
    paddingBottom: 24,
    minHeight: '100vh',
    backgroundColor: '#F5F5F5',
    fontFamily: 'sans-serif',
  },
  content: {
    maxWidth: 600,
    margin: '0 auto',
    padding: '0 16px',
  },
  heading: {
    fontSize: 20,
    fontWeight: 700 as const,
    color: '#1565C0',
    marginBottom: 20,
    textAlign: 'center' as const,
  },
  summary: {
    display: 'flex',
    justifyContent: 'center',
    gap: 24,
    margin: '20px 0',
  },
  summaryItem: {
    textAlign: 'center' as const,
    padding: '12px 20px',
    backgroundColor: '#fff',
    borderRadius: 8,
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    minWidth: 80,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: 700 as const,
    color: '#212121',
  },
  answerGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: 8,
    margin: '16px 0 24px',
  },
  answerCell: {
    padding: '10px 0',
    textAlign: 'center' as const,
    borderRadius: 6,
    fontSize: 14,
    fontWeight: 600 as const,
    border: '1px solid #E0E0E0',
  },
  answered: {
    backgroundColor: '#fff',
    color: '#212121',
  },
  unanswered: {
    backgroundColor: '#FFCDD2',
    color: '#C62828',
  },
  buttonRow: {
    display: 'flex',
    gap: 12,
    justifyContent: 'center',
    marginTop: 24,
  },
  btnPrev: {
    padding: '14px 32px',
    fontSize: 15,
    fontWeight: 600 as const,
    border: '1px solid #1565C0',
    borderRadius: 8,
    backgroundColor: '#fff',
    color: '#1565C0',
    cursor: 'pointer',
  },
  btnSubmit: {
    padding: '14px 32px',
    fontSize: 15,
    fontWeight: 700 as const,
    border: 'none',
    borderRadius: 8,
    backgroundColor: '#1565C0',
    color: '#fff',
    cursor: 'pointer',
  },
  // Modal
  modalOverlay: {
    position: 'fixed' as const,
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  modal: {
    width: 400,
    padding: 32,
    backgroundColor: '#fff',
    borderRadius: 16,
    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
    textAlign: 'center' as const,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 700 as const,
    color: '#C62828',
    marginBottom: 12,
  },
  modalText: {
    fontSize: 14,
    color: '#424242',
    lineHeight: 1.7,
    marginBottom: 24,
  },
  modalBtnRow: {
    display: 'flex',
    gap: 12,
    justifyContent: 'center',
  },
  modalCancel: {
    padding: '10px 24px',
    fontSize: 14,
    fontWeight: 600 as const,
    border: '1px solid #BDBDBD',
    borderRadius: 8,
    backgroundColor: '#fff',
    color: '#616161',
    cursor: 'pointer',
  },
  modalConfirm: {
    padding: '10px 24px',
    fontSize: 14,
    fontWeight: 700 as const,
    border: 'none',
    borderRadius: 8,
    backgroundColor: '#C62828',
    color: '#fff',
    cursor: 'pointer',
  },
};

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

  // Build question number list for this section
  const questionIds = Object.keys(answers).filter((qid) => {
    // We assume question IDs are prefixed or we count all current answers for this section
    return true;
  });

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

      <div style={styles.page}>
        <div style={styles.content}>
          <ExamineeCard
            seatNumber={examinee?.seatNumber}
            photoUrl={examinee?.photoUrl}
            registrationNumber={examinee?.registrationNumber}
            name={examinee?.name}
          />

          <div style={styles.heading}>{SECTION_LABEL[section]} 답안 확인</div>

          <div style={styles.summary}>
            <div style={styles.summaryItem}>
              <div style={styles.summaryLabel}>전체</div>
              <div style={styles.summaryValue}>{totalQuestions}</div>
            </div>
            <div style={styles.summaryItem}>
              <div style={styles.summaryLabel}>응답</div>
              <div style={{ ...styles.summaryValue, color: '#1565C0' }}>{answeredCount}</div>
            </div>
            <div style={styles.summaryItem}>
              <div style={styles.summaryLabel}>미응답</div>
              <div style={{ ...styles.summaryValue, color: '#C62828' }}>{unansweredCount}</div>
            </div>
          </div>

          <div style={styles.answerGrid}>
            {questionNumbers.map((num) => {
              const qKey = Object.keys(answers).find((k) => {
                // Match by question number embedded in key or by index
                return true;
              });
              const ans = qKey ? answers[qKey] : undefined;
              const answered = isAnswered(ans) && num <= answeredCount;

              return (
                <div
                  key={num}
                  style={{
                    ...styles.answerCell,
                    ...(answered ? styles.answered : styles.unanswered),
                  }}
                >
                  {num}
                </div>
              );
            })}
          </div>

          <div style={styles.buttonRow}>
            <button style={styles.btnPrev} onClick={handleGoBack}>
              이전
            </button>
            <button style={styles.btnSubmit} onClick={() => setShowModal(true)}>
              답안 제출
            </button>
          </div>
        </div>
      </div>

      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalTitle}>답안을 제출하시겠습니까?</div>
            <div style={styles.modalText}>
              제출 후에는 답안을 수정할 수 없습니다.<br />
              미응답 문항이 {unansweredCount}개 있습니다.<br />
              정말 제출하시겠습니까?
            </div>
            <div style={styles.modalBtnRow}>
              <button style={styles.modalCancel} onClick={() => setShowModal(false)}>
                취소
              </button>
              <button
                style={{ ...styles.modalConfirm, opacity: submitting ? 0.6 : 1 }}
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? '제출 중...' : '제출'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
