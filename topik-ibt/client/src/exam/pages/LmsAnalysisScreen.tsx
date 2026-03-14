/**
 * SCR-L03: 유형별 강점/약점 분석
 */
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { examApi } from '../../api/examApi';
import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface TypeStats {
  total: number;
  correct: number;
  accuracy: number;
}

interface AnalysisData {
  typeBreakdown: Record<string, TypeStats>;
  strengths: string[];
  weaknesses: string[];
  cached: boolean;
}

export default function LmsAnalysisScreen() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    examApi.get(`/lms/sessions/${sessionId}/analysis`)
      .then(res => setData(res.data))
      .catch(() => navigate('/lms'))
      .finally(() => setLoading(false));
  }, [sessionId, navigate]);

  if (loading) return <div className="flex justify-center items-center h-screen text-gray-400">분석 중...</div>;
  if (!data) return null;

  const entries = Object.entries(data.typeBreakdown).sort((a, b) => b[1].accuracy - a[1].accuracy);
  const overallCorrect = entries.reduce((s, [, v]) => s + v.correct, 0);
  const overallTotal = entries.reduce((s, [, v]) => s + v.total, 0);
  const overallAccuracy = overallTotal > 0 ? Math.round((overallCorrect / overallTotal) * 100) : 0;

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 70) return '#16a34a';
    if (accuracy >= 50) return '#f59e0b';
    return '#dc2626';
  };

  const getAccuracyTextClass = (accuracy: number) => {
    if (accuracy >= 70) return 'text-green-600';
    if (accuracy >= 50) return 'text-amber-500';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans">
      {/* Header */}
      <div className="bg-blue-800 text-white px-6 py-4 flex justify-between items-center">
        <div className="text-base font-bold">강점/약점 분석</div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-white/40 bg-transparent text-white hover:bg-white/10"
            onClick={() => navigate(`/lms/review/${sessionId}`)}
          >
            복습으로
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-white/40 bg-transparent text-white hover:bg-white/10"
            onClick={() => navigate('/lms')}
          >
            목록으로
          </Button>
        </div>
      </div>

      <div className="max-w-[800px] mx-auto px-5 py-8">
        {/* Overall score */}
        <Card className="mb-6 text-center shadow-sm">
          <CardContent>
            <div className="text-[13px] text-gray-500 mb-1">전체 정답률</div>
            <div className={cn('text-5xl font-extrabold', getAccuracyTextClass(overallAccuracy))}>
              {overallAccuracy}%
            </div>
            <div className="text-sm text-gray-400">
              {overallCorrect} / {overallTotal} 문항 정답
            </div>
          </CardContent>
        </Card>

        {/* Strengths & Weaknesses */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 bg-green-50 rounded-xl p-5">
            <div className="text-sm font-bold text-green-600 mb-3">강점 유형 (70%+)</div>
            {data.strengths.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {data.strengths.map(s => (
                  <Badge key={s} variant="secondary" className="bg-green-100 text-green-600 font-semibold">
                    {s}
                  </Badge>
                ))}
              </div>
            ) : (
              <div className="text-[13px] text-gray-400">해당 유형이 없습니다</div>
            )}
          </div>
          <div className="flex-1 bg-red-50 rounded-xl p-5">
            <div className="text-sm font-bold text-red-600 mb-3">약점 유형 (50% 미만)</div>
            {data.weaknesses.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {data.weaknesses.map(w => (
                  <Badge key={w} variant="secondary" className="bg-red-50 text-red-600 font-semibold">
                    {w}
                  </Badge>
                ))}
              </div>
            ) : (
              <div className="text-[13px] text-gray-400">해당 유형이 없습니다</div>
            )}
          </div>
        </div>

        {/* Type breakdown chart */}
        <Card className="shadow-sm">
          <CardContent>
            <div className="text-base font-bold text-gray-900 mb-5">유형별 정답률</div>
            {entries.length === 0 ? (
              <div className="text-sm text-gray-400 text-center py-5">분석할 데이터가 없습니다</div>
            ) : (
              <ResponsiveContainer width="100%" height={entries.length * 50 + 20}>
                <BarChart
                  data={entries.map(([type, stats]) => ({ name: type, accuracy: stats.accuracy, correct: stats.correct, total: stats.total }))}
                  layout="vertical"
                  margin={{ top: 0, right: 40, left: 0, bottom: 0 }}
                >
                  <XAxis type="number" domain={[0, 100]} tickFormatter={(v: number) => `${v}%`} fontSize={12} />
                  <YAxis type="category" dataKey="name" width={120} fontSize={13} tick={{ fill: '#374151', fontWeight: 600 }} />
                  <Tooltip formatter={(value: any, _name: any, props: any) => [`${value}% (${props.payload.correct}/${props.payload.total})`, '정답률']} />
                  <Bar dataKey="accuracy" barSize={20} radius={[0, 4, 4, 0]} label={{ position: 'right', formatter: (v: any) => `${v}%`, fontSize: 12, fill: '#374151' }}>
                    {entries.map(([type, stats]) => (
                      <Cell key={type} fill={getAccuracyColor(stats.accuracy)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
