/**
 * SCR-S01: 성적표 화면
 * SCORE-01~05: 성적 조회 및 인쇄
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { examApi } from '../../api/examApi';

interface SectionScore {
  raw: number;
  scaled: number;
  maxScore: number;
}

interface ScoreData {
  id: string;
  examSetName: string;
  examType: string;
  examDate: string;
  sectionScores: Record<string, SectionScore>;
  totalScore: number;
  maxTotalScore: number;
  grade: number | null;
  publishedAt: string;
}

const GRADE_LABELS: Record<number, string> = {
  1: '1급', 2: '2급', 3: '3급', 4: '4급', 5: '5급', 6: '6급',
};

const SECTION_LABELS: Record<string, string> = {
  LISTENING: '듣기',
  WRITING: '쓰기',
  READING: '읽기',
};

export default function ScoreReportScreen() {
  const navigate = useNavigate();
  const [scores, setScores] = useState<ScoreData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    examApi.get('/exam/score')
      .then(res => {
        const data = res.data.data;
        setScores(Array.isArray(data) ? data : data ? [data] : []);
      })
      .catch(err => {
        if (err.response?.status === 401) return;
        setError(err.response?.data?.message || '성적을 불러올 수 없습니다');
      })
      .finally(() => setLoading(false));
  }, []);

  const handlePrint = () => window.print();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#9ca3af' }}>
        불러오는 중...
      </div>
    );
  }

  if (error || scores.length === 0) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>-</div>
        <div style={{ fontSize: 18, color: '#6b7280', marginBottom: 24 }}>{error || '공개된 성적이 없습니다'}</div>
        <button
          onClick={() => navigate('/login')}
          style={{ padding: '10px 24px', borderRadius: 8, border: 'none', backgroundColor: '#2563eb', color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}
        >
          돌아가기
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f4f8', padding: '40px 20px' }}>
      {scores.map(score => (
        <div key={score.id} style={{
          maxWidth: 600, margin: '0 auto 32px', backgroundColor: '#fff', borderRadius: 16,
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)', overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            backgroundColor: '#1565C0', color: '#fff', padding: '28px 32px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 14, opacity: 0.8, marginBottom: 4 }}>한국어능력시험</div>
            <div style={{ fontSize: 24, fontWeight: 800 }}>TOPIK 성적표</div>
            <div style={{ fontSize: 13, marginTop: 8, opacity: 0.7 }}>
              Test of Proficiency in Korean
            </div>
          </div>

          {/* Exam Info */}
          <div style={{ padding: '24px 32px', borderBottom: '1px solid #e5e7eb' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px', fontSize: 14 }}>
              <div>
                <span style={{ color: '#6b7280' }}>시험명</span>
                <div style={{ fontWeight: 600, marginTop: 2 }}>{score.examSetName}</div>
              </div>
              <div>
                <span style={{ color: '#6b7280' }}>시험유형</span>
                <div style={{ fontWeight: 600, marginTop: 2 }}>
                  {score.examType === 'TOPIK_I' ? 'TOPIK I' : 'TOPIK II'}
                </div>
              </div>
              <div>
                <span style={{ color: '#6b7280' }}>시험일</span>
                <div style={{ fontWeight: 600, marginTop: 2 }}>
                  {new Date(score.examDate).toLocaleDateString('ko-KR')}
                </div>
              </div>
              <div>
                <span style={{ color: '#6b7280' }}>성적공개일</span>
                <div style={{ fontWeight: 600, marginTop: 2 }}>
                  {new Date(score.publishedAt).toLocaleDateString('ko-KR')}
                </div>
              </div>
            </div>
          </div>

          {/* Section Scores */}
          <div style={{ padding: '24px 32px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20 }}>
              <thead>
                <tr>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#374151', borderBottom: '2px solid #e5e7eb' }}>
                    영역
                  </th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#374151', borderBottom: '2px solid #e5e7eb' }}>
                    점수
                  </th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#374151', borderBottom: '2px solid #e5e7eb' }}>
                    만점
                  </th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(score.sectionScores).map(([section, data]) => (
                  <tr key={section}>
                    <td style={{ padding: '12px', fontSize: 15, fontWeight: 500, borderBottom: '1px solid #f3f4f6' }}>
                      {SECTION_LABELS[section] || section}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', fontSize: 18, fontWeight: 700, color: '#1565C0', borderBottom: '1px solid #f3f4f6' }}>
                      {data.raw}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', fontSize: 14, color: '#9ca3af', borderBottom: '1px solid #f3f4f6' }}>
                      {data.maxScore}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Total & Grade */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '16px 20px', backgroundColor: '#f0f4f8', borderRadius: 12,
            }}>
              <div>
                <div style={{ fontSize: 13, color: '#6b7280' }}>총점</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#111827' }}>
                  {score.totalScore}
                  <span style={{ fontSize: 16, fontWeight: 400, color: '#9ca3af' }}>/{score.maxTotalScore}</span>
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 13, color: '#6b7280' }}>TOPIK 등급</div>
                <div style={{
                  fontSize: 32, fontWeight: 800,
                  color: score.grade ? '#1565C0' : '#d1d5db',
                }}>
                  {score.grade ? GRADE_LABELS[score.grade] : '미달'}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Actions */}
      <div style={{ maxWidth: 600, margin: '0 auto', display: 'flex', gap: 12, justifyContent: 'center' }}>
        <button
          onClick={handlePrint}
          style={{
            padding: '12px 32px', borderRadius: 8, border: 'none',
            backgroundColor: '#1565C0', color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer',
          }}
        >
          인쇄하기
        </button>
        <button
          onClick={() => navigate('/login')}
          style={{
            padding: '12px 32px', borderRadius: 8, border: '1px solid #d1d5db',
            backgroundColor: '#fff', color: '#374151', fontSize: 15, fontWeight: 600, cursor: 'pointer',
          }}
        >
          돌아가기
        </button>
      </div>
    </div>
  );
}
