import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api/adminApi';
import StatusBadge from './StatusBadge';
import { cn } from '../../lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';

interface ExamSessionDetailModalProps {
  isOpen: boolean;
  sessionId: string | null;
  onClose: () => void;
}

interface SectionProgress {
  section: string;
  startedAt: string | null;
  submittedAt: string | null;
  status: string;
}

interface SessionDetail {
  id: string;
  examineeName: string;
  examSetName: string;
  startedAt: string;
  endedAt: string | null;
  status: string;
  sections: SectionProgress[];
  answers?: {
    questionNumber: number;
    section: string;
    selectedAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
  }[];
}

const ExamSessionDetailModal: React.FC<ExamSessionDetailModalProps> = ({ isOpen, sessionId, onClose }) => {
  const [detail, setDetail] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);

  useEffect(() => {
    if (!isOpen || !sessionId) return;
    setLoading(true);
    setShowAnswers(false);
    adminApi
      .get(`/admin/exam-sessions/${sessionId}`)
      .then((res) => setDetail(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isOpen, sessionId]);

  if (!isOpen) return null;

  const formatDate = (d: string | null) => {
    if (!d) return '-';
    return new Date(d).toLocaleString('ko-KR');
  };

  const sectionLabel = (s: string) => {
    const map: Record<string, string> = { LISTENING: '듣기', WRITING: '쓰기', READING: '읽기' };
    return map[s] || s;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-[680px] max-h-[85vh] overflow-y-auto" showCloseButton>
        <DialogHeader>
          <DialogTitle className="text-lg text-gray-900">응시 상세</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-10 text-center text-gray-500">불러오는 중...</div>
        ) : detail ? (
          <>
            <div className="mb-6 grid grid-cols-2 gap-3">
              <div><span className="text-xs text-gray-500">응시자</span><div className="font-semibold">{detail.examineeName}</div></div>
              <div><span className="text-xs text-gray-500">시험세트</span><div className="font-semibold">{detail.examSetName}</div></div>
              <div><span className="text-xs text-gray-500">시작시간</span><div>{formatDate(detail.startedAt)}</div></div>
              <div><span className="text-xs text-gray-500">종료시간</span><div>{formatDate(detail.endedAt)}</div></div>
              <div><span className="text-xs text-gray-500">상태</span><div><StatusBadge status={detail.status} type="session" /></div></div>
            </div>

            <h3 className="mb-2.5 text-[15px] text-gray-900">영역별 진행 상황</h3>
            <table className="mb-5 w-full border-collapse">
              <thead>
                <tr>
                  <th className="border-b-2 border-gray-200 px-3 py-2 text-left text-[13px] font-semibold text-gray-700">영역</th>
                  <th className="border-b-2 border-gray-200 px-3 py-2 text-left text-[13px] font-semibold text-gray-700">시작시간</th>
                  <th className="border-b-2 border-gray-200 px-3 py-2 text-left text-[13px] font-semibold text-gray-700">제출시간</th>
                  <th className="border-b-2 border-gray-200 px-3 py-2 text-left text-[13px] font-semibold text-gray-700">상태</th>
                </tr>
              </thead>
              <tbody>
                {detail.sections.map((sec, i) => (
                  <tr key={i}>
                    <td className="border-b border-gray-100 px-3 py-2 text-[13px] text-gray-900">{sectionLabel(sec.section)}</td>
                    <td className="border-b border-gray-100 px-3 py-2 text-[13px] text-gray-900">{formatDate(sec.startedAt)}</td>
                    <td className="border-b border-gray-100 px-3 py-2 text-[13px] text-gray-900">{formatDate(sec.submittedAt)}</td>
                    <td className="border-b border-gray-100 px-3 py-2 text-[13px] text-gray-900"><StatusBadge status={sec.status} type="session" /></td>
                  </tr>
                ))}
              </tbody>
            </table>

            {detail.answers && detail.answers.length > 0 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAnswers(!showAnswers)}
                  className="mb-3"
                >
                  {showAnswers ? '답안 접기' : '답안 보기'}
                </Button>
                {showAnswers && (
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="border-b-2 border-gray-200 px-3 py-2 text-left text-[13px] font-semibold text-gray-700">#</th>
                        <th className="border-b-2 border-gray-200 px-3 py-2 text-left text-[13px] font-semibold text-gray-700">영역</th>
                        <th className="border-b-2 border-gray-200 px-3 py-2 text-left text-[13px] font-semibold text-gray-700">선택</th>
                        <th className="border-b-2 border-gray-200 px-3 py-2 text-left text-[13px] font-semibold text-gray-700">정답</th>
                        <th className="border-b-2 border-gray-200 px-3 py-2 text-left text-[13px] font-semibold text-gray-700">결과</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.answers.map((a, i) => (
                        <tr key={i}>
                          <td className="border-b border-gray-100 px-3 py-2 text-[13px] text-gray-900">{a.questionNumber}</td>
                          <td className="border-b border-gray-100 px-3 py-2 text-[13px] text-gray-900">{sectionLabel(a.section)}</td>
                          <td className="border-b border-gray-100 px-3 py-2 text-[13px] text-gray-900">{a.selectedAnswer || '-'}</td>
                          <td className="border-b border-gray-100 px-3 py-2 text-[13px] text-gray-900">{a.correctAnswer}</td>
                          <td className={cn(
                            'border-b border-gray-100 px-3 py-2 text-[13px] font-semibold',
                            a.isCorrect ? 'text-green-600' : 'text-red-600'
                          )}>
                            {a.isCorrect ? 'O' : 'X'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </>
            )}
          </>
        ) : (
          <div className="py-10 text-center text-gray-500">데이터를 불러올 수 없습니다.</div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ExamSessionDetailModal;
