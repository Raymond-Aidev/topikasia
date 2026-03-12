/**
 * SCR-L03: 유형별 강점/약점 분석
 */
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { examApi } from '../../api/examApi';

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

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#9ca3af' }}>분석 중...</div>;
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

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f4f8', fontFamily: 'sans-serif' }}>
      {/* Header */}
      <div style={{ backgroundColor: '#1565C0', color: '#fff', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 16, fontWeight: 700 }}>강점/약점 분석</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => navigate(`/lms/review/${sessionId}`)} style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.4)', backgroundColor: 'transparent', color: '#fff', fontSize: 13, cursor: 'pointer' }}>
            복습으로
          </button>
          <button onClick={() => navigate('/lms')} style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.4)', backgroundColor: 'transparent', color: '#fff', fontSize: 13, cursor: 'pointer' }}>
            목록으로
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 20px' }}>
        {/* Overall score */}
        <div style={{ backgroundColor: '#fff', borderRadius: 12, padding: 24, marginBottom: 24, textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 4 }}>전체 정답률</div>
          <div style={{ fontSize: 48, fontWeight: 800, color: getAccuracyColor(overallAccuracy) }}>
            {overallAccuracy}%
          </div>
          <div style={{ fontSize: 14, color: '#9ca3af' }}>
            {overallCorrect} / {overallTotal} 문항 정답
          </div>
        </div>

        {/* Strengths & Weaknesses */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
          <div style={{ flex: 1, backgroundColor: '#f0fdf4', borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#16a34a', marginBottom: 12 }}>강점 유형 (70%+)</div>
            {data.strengths.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {data.strengths.map(s => (
                  <span key={s} style={{ padding: '4px 12px', borderRadius: 20, backgroundColor: '#dcfce7', color: '#16a34a', fontSize: 13, fontWeight: 600 }}>{s}</span>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: 13, color: '#9ca3af' }}>해당 유형이 없습니다</div>
            )}
          </div>
          <div style={{ flex: 1, backgroundColor: '#fef2f2', borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#dc2626', marginBottom: 12 }}>약점 유형 (50% 미만)</div>
            {data.weaknesses.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {data.weaknesses.map(w => (
                  <span key={w} style={{ padding: '4px 12px', borderRadius: 20, backgroundColor: '#fef2f2', color: '#dc2626', fontSize: 13, fontWeight: 600 }}>{w}</span>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: 13, color: '#9ca3af' }}>해당 유형이 없습니다</div>
            )}
          </div>
        </div>

        {/* Type breakdown bars */}
        <div style={{ backgroundColor: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 20 }}>유형별 정답률</div>
          {entries.length === 0 && (
            <div style={{ fontSize: 14, color: '#9ca3af', textAlign: 'center', padding: 20 }}>분석할 데이터가 없습니다</div>
          )}
          {entries.map(([type, stats]) => (
            <div key={type} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>{type}</div>
                <div style={{ fontSize: 13, color: '#6b7280' }}>
                  {stats.correct}/{stats.total} ({stats.accuracy}%)
                </div>
              </div>
              <div style={{ width: '100%', height: 12, backgroundColor: '#f3f4f6', borderRadius: 6, overflow: 'hidden' }}>
                <div style={{
                  width: `${stats.accuracy}%`,
                  height: '100%',
                  backgroundColor: getAccuracyColor(stats.accuracy),
                  borderRadius: 6,
                  transition: 'width 0.5s ease',
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
