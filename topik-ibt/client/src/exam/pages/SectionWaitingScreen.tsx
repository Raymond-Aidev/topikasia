import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { examApi } from '../../api/examApi';
import { useExamStore } from '../../store/examStore';
import ExamHeader from '../../shared/components/ExamHeader';
import type { SectionType } from '../../types/exam.types';
import { Card, CardContent } from '../../components/ui/card';

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

  const sessionId = useExamStore((s) => s.sessionId);

  useEffect(() => {
    setCountdown(5);
    const id = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          // 서버에 섹션 시작 알림 (타이밍 기록)
          if (sessionId) {
            examApi.post(`/exam/sessions/${sessionId}/section-start`, {
              sectionName: section,
            }).catch(() => {});
          }
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
      <div className="pt-14 min-h-screen flex items-center justify-center bg-gray-100 font-sans">
        <Card className="text-center p-12 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.1)] w-[400px]">
          <CardContent className="p-0">
            <div className="text-5xl mb-4">
              {section === 'LISTENING' ? '🎧' : section === 'WRITING' ? '✏️' : '📖'}
            </div>
            <div className="text-2xl font-bold text-blue-800 mb-3">{SECTION_LABEL[section]} 시작 대기</div>
            <div className="text-[15px] text-gray-500 mb-8">
              {sectionInfo ? `${sectionInfo.questionCount}문항 / ${sectionInfo.durationMinutes}분` : ''}
            </div>
            <div className="text-[64px] font-extrabold text-blue-800 leading-none mb-2">{countdown}</div>
            <div className="text-sm text-gray-400">초 후 시작됩니다</div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
