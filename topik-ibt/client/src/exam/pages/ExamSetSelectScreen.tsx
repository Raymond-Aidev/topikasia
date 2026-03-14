import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { examApi } from '../../api/examApi';
import { useExamStore } from '../../store/examStore';
import type { AssignedExamSet } from '../../store/examStore';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';

const SECTION_LABEL: Record<string, string> = {
  LISTENING: '듣기',
  WRITING: '쓰기',
  READING: '읽기',
};

export default function ExamSetSelectScreen() {
  const navigate = useNavigate();
  const setAssignedExamSet = useExamStore((s) => s.setAssignedExamSet);
  const setExamPhase = useExamStore((s) => s.setExamPhase);

  const [examSet, setExamSet] = useState<AssignedExamSet | null>(null);
  const [loading, setLoading] = useState(true);
  const [noSet, setNoSet] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await examApi.get('/exam/assigned-set');
        if (!cancelled) {
          if (res.data) {
            setExamSet(res.data);
          } else {
            setNoSet(true);
          }
        }
      } catch {
        if (!cancelled) setNoSet(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleStart = () => {
    if (!examSet) return;
    setAssignedExamSet(examSet);
    setExamPhase('WAITING');
    navigate('/exam/waiting');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 font-sans p-6">
        <div className="text-gray-500 text-[15px]">시험세트 정보를 불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 font-sans p-6">
      <Card className="w-[480px] p-9 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.1)]">
        <CardContent className="p-0">
          <div className="text-[22px] font-bold text-blue-800 mb-6 text-center">시험 선택</div>

          {noSet || !examSet ? (
            <div className="text-center text-gray-500 text-[15px] py-10">배정된 시험세트가 없습니다.</div>
          ) : (
            <>
              <Badge className="inline-block px-3 py-1 bg-blue-50 text-blue-800 rounded-2xl text-[13px] font-semibold mb-3">
                {examSet.examType === 'TOPIK_I' ? 'TOPIK I' : 'TOPIK II'}
              </Badge>
              <div className="text-lg font-bold text-gray-900 mb-4">{examSet.name}</div>

              <table className="w-full border-collapse mb-6">
                <thead>
                  <tr>
                    <th className="px-3 py-2.5 bg-gray-100 text-[13px] font-semibold text-gray-500 text-left border-b border-gray-300">영역</th>
                    <th className="px-3 py-2.5 bg-gray-100 text-[13px] font-semibold text-gray-500 text-left border-b border-gray-300">문항 수</th>
                    <th className="px-3 py-2.5 bg-gray-100 text-[13px] font-semibold text-gray-500 text-left border-b border-gray-300">시간</th>
                  </tr>
                </thead>
                <tbody>
                  {examSet.sections.map((sec) => (
                    <tr key={sec.section}>
                      <td className="px-3 py-2.5 text-sm text-gray-700 border-b border-gray-100">{SECTION_LABEL[sec.section] || sec.section}</td>
                      <td className="px-3 py-2.5 text-sm text-gray-700 border-b border-gray-100">{sec.questionCount}문항</td>
                      <td className="px-3 py-2.5 text-sm text-gray-700 border-b border-gray-100">{sec.durationMinutes}분</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="text-sm text-gray-500 mb-6 text-right">
                총 시험시간: <strong>{examSet.totalDurationMinutes}분</strong>
              </div>

              <Button
                className="w-full py-3.5 text-base font-bold bg-blue-800 hover:bg-blue-900 rounded-lg h-auto"
                onClick={handleStart}
              >
                시험 시작
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
