/**
 * SCR-L01: LMS 메인 — 시험 이력 카드 목록
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { examApi } from '../../api/examApi';
import GlobalNavigationBar, { GNB_HEIGHT, GNB_HEIGHT_MOBILE } from '../../shared/components/GlobalNavigationBar';
import { useResponsive } from '../../shared/hooks/useResponsive';
import Footer from '../../shared/components/Footer';

interface ExamHistoryItem {
  sessionId: string;
  examSetName: string;
  examType: string;
  startedAt: string;
  completedAt: string;
  answerCount: number;
  score: {
    totalScore: number;
    maxTotalScore: number;
    grade: number | null;
    sectionScores: Record<string, { raw: number; maxScore: number }>;
    isPublished: boolean;
  } | null;
}

const GRADE_LABELS: Record<number, string> = { 1: '1급', 2: '2급', 3: '3급', 4: '4급', 5: '5급', 6: '6급' };
const SECTION_LABELS: Record<string, string> = { LISTENING: '듣기', WRITING: '쓰기', READING: '읽기' };

export default function LmsMainScreen() {
  const { isMobile, isTablet } = useResponsive();
  const compact = isMobile || isTablet;
  const navigate = useNavigate();
  const [history, setHistory] = useState<ExamHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    examApi.get('/lms/history')
      .then(res => setHistory(res.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f4f8', fontFamily: 'sans-serif', paddingTop: compact ? GNB_HEIGHT_MOBILE : GNB_HEIGHT }}>
      <GlobalNavigationBar />

      <div style={{ maxWidth: 800, margin: '0 auto', padding: isMobile ? '24px 16px' : '32px 20px' }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24, color: '#111827' }}>시험 이력</h2>

        {loading && <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>불러오는 중...</div>}

        {!loading && history.length === 0 && (
          <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af', fontSize: 15 }}>
            완료된 시험이 없습니다.
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {history.map(item => (
            <div key={item.sessionId} style={{
              backgroundColor: '#fff', borderRadius: 12, padding: 24,
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)', cursor: 'pointer',
              transition: 'box-shadow 0.15s',
            }}
              onClick={() => navigate(`/lms/review/${item.sessionId}`)}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)')}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.08)')}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: '#111827' }}>{item.examSetName}</div>
                  <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
                    {item.examType === 'TOPIK_I' ? 'TOPIK I' : 'TOPIK II'} | {new Date(item.completedAt).toLocaleDateString('ko-KR')}
                  </div>
                </div>
                {item.score && item.score.isPublished && (
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: '#1565C0' }}>
                      {item.score.totalScore}<span style={{ fontSize: 14, color: '#9ca3af' }}>/{item.score.maxTotalScore}</span>
                    </div>
                    {item.score.grade && (
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#16a34a' }}>
                        {GRADE_LABELS[item.score.grade]}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Section scores mini bar */}
              {item.score && item.score.isPublished && (
                <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                  {Object.entries(item.score.sectionScores).map(([section, data]: [string, any]) => (
                    <div key={section} style={{ flex: 1, backgroundColor: '#f0f4f8', borderRadius: 8, padding: '8px 12px' }}>
                      <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 2 }}>{SECTION_LABELS[section] || section}</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#374151' }}>
                        {data.raw}<span style={{ fontSize: 11, color: '#9ca3af' }}>/{data.maxScore}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: '#9ca3af' }}>
                  {item.answerCount}문항 응답
                </span>
                <span style={{ fontSize: 13, color: '#1565C0', fontWeight: 600 }}>
                  문제 복습 →
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}
