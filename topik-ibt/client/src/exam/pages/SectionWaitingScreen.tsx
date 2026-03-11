import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExamStore } from '../../store/examStore';
import ExamHeader from '../../shared/components/ExamHeader';
import type { SectionType } from '../../types/exam.types';

const SECTION_LABEL: Record<SectionType, string> = {
  LISTENING: '듣기',
  WRITING: '쓰기',
  READING: '읽기',
};

const SECTION_ROUTE: Record<SectionType, string> = {
  LISTENING: '/exam/listening',
  WRITING: '/exam/writing',
  READING: '/exam/reading',
};

const styles = {
  page: {
    paddingTop: 56,
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
    fontFamily: 'sans-serif',
  },
  card: {
    textAlign: 'center' as const,
    padding: 48,
    backgroundColor: '#fff',
    borderRadius: 16,
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    width: 400,
  },
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 700 as const,
    color: '#1565C0',
    marginBottom: 12,
  },
  sub: {
    fontSize: 15,
    color: '#616161',
    marginBottom: 32,
  },
  countdown: {
    fontSize: 64,
    fontWeight: 800 as const,
    color: '#1565C0',
    lineHeight: 1,
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: '#9E9E9E',
  },
};

export default function SectionWaitingScreen() {
  const navigate = useNavigate();
  const currentSection = useExamStore((s) => s.currentSection);
  const examinee = useExamStore((s) => s.examinee);
  const assignedExamSet = useExamStore((s) => s.assignedExamSet);
  const setSectionStartedAt = useExamStore((s) => s.setSectionStartedAt);
  const setSectionRemainingSeconds = useExamStore((s) => s.setSectionRemainingSeconds);

  const [countdown, setCountdown] = useState(5);

  const section = currentSection || 'LISTENING';
  const sectionInfo = assignedExamSet?.sections.find((s) => s.section === section);

  useEffect(() => {
    setCountdown(5);
    const id = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          const now = new Date().toISOString();
          setSectionStartedAt(now);
          if (sectionInfo) {
            setSectionRemainingSeconds(sectionInfo.durationMinutes * 60);
          }
          navigate(SECTION_ROUTE[section], { replace: true });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [section]);

  return (
    <>
      <ExamHeader
        registrationNumber={examinee?.registrationNumber}
        examTitle={assignedExamSet?.name}
        timerMode="clock"
      />
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.icon}>
            {section === 'LISTENING' ? '🎧' : section === 'WRITING' ? '✏️' : '📖'}
          </div>
          <div style={styles.title}>{SECTION_LABEL[section]} 시작 대기</div>
          <div style={styles.sub}>
            {sectionInfo ? `${sectionInfo.questionCount}문항 / ${sectionInfo.durationMinutes}분` : ''}
          </div>
          <div style={styles.countdown}>{countdown}</div>
          <div style={styles.label}>초 후 시작됩니다</div>
        </div>
      </div>
    </>
  );
}
