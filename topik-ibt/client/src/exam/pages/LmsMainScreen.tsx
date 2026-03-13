/**
 * SCR-L01: LMS 메인 — 학습 관리 시스템
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

const EXAM_TYPE_LABELS: Record<string, string> = {
  TOPIK_I: 'TOPIK I',
  TOPIK_II: 'TOPIK II',
  EPS_TOPIK: 'EPS-TOPIK',
};

const EXAM_TYPE_COLORS: Record<string, string> = {
  TOPIK_I: '#1565C0',
  TOPIK_II: '#4A148C',
  EPS_TOPIK: '#E65100',
};

const LMS_FEATURES = [
  { icon: '📊', title: '성적 분석', desc: '영역별 점수와 등급을 한눈에 확인' },
  { icon: '🔍', title: '문제 복습', desc: '틀린 문제와 정답 해설을 다시 확인' },
  { icon: '📈', title: 'AI 학습 분석', desc: '강점/약점 분석으로 효율적 학습' },
];

export default function LmsMainScreen() {
  const { isMobile, isTablet } = useResponsive();
  const compact = isMobile || isTablet;
  const topPad = compact ? GNB_HEIGHT_MOBILE : GNB_HEIGHT;
  const px = isMobile ? '16px' : '24px';
  const navigate = useNavigate();
  const [history, setHistory] = useState<ExamHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const hasToken = !!localStorage.getItem('examToken');

  useEffect(() => {
    if (!hasToken) {
      setLoading(false);
      return;
    }
    examApi.get('/lms/history')
      .then(res => setHistory(res.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [hasToken]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F5F5F5', fontFamily: 'sans-serif', paddingTop: topPad }}>
      <GlobalNavigationBar />

      {/* 히어로 */}
      <div style={{
        background: 'linear-gradient(135deg, #4A148C 0%, #311B92 60%, #1A237E 100%)',
        color: '#FFFFFF', textAlign: 'center',
        padding: isMobile ? '48px 16px' : '64px 24px',
      }}>
        <div style={{ fontSize: isMobile ? 28 : 40, fontWeight: 800, marginBottom: 12 }}>LMS</div>
        <div style={{ fontSize: isMobile ? 14 : 18, opacity: 0.9, lineHeight: 1.6 }}>
          시험 이력을 확인하고, AI 분석으로 실력을 향상하세요
        </div>
      </div>

      {/* LMS 기능 소개 카드 */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: `48px ${px}` }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
          gap: isMobile ? 16 : 24,
        }}>
          {LMS_FEATURES.map((f) => (
            <div key={f.title} style={{
              backgroundColor: '#FFFFFF', borderRadius: 16,
              padding: isMobile ? '24px 20px' : '32px 24px',
              textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
            }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>{f.icon}</div>
              <div style={{ fontSize: isMobile ? 16 : 18, fontWeight: 700, color: '#4A148C', marginBottom: 8 }}>{f.title}</div>
              <div style={{ fontSize: 14, color: '#616161', lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 시험 이력 */}
      <div style={{ backgroundColor: '#FFFFFF', padding: `56px ${px}` }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ fontSize: isMobile ? 22 : 28, fontWeight: 800, color: '#111827', marginBottom: 32 }}>
            시험 이력
          </div>

          {/* 비로그인 상태 */}
          {!hasToken && (
            <div style={{ textAlign: 'center', padding: isMobile ? '48px 16px' : '64px 24px' }}>
              <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.4 }}>🔒</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#374151', marginBottom: 8 }}>
                로그인 후 조회 가능
              </div>
              <div style={{ fontSize: 14, color: '#9ca3af', marginBottom: 28, lineHeight: 1.6 }}>
                시험에 응시한 이력을 확인하려면 로그인이 필요합니다
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  onClick={() => navigate('/registration/login')}
                  style={{
                    padding: '12px 36px', borderRadius: 8,
                    border: '2px solid #4A148C', backgroundColor: '#fff', color: '#4A148C',
                    fontSize: 15, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  로그인
                </button>
                <button
                  onClick={() => navigate('/registration/signup')}
                  style={{
                    padding: '12px 36px', borderRadius: 8, border: 'none',
                    backgroundColor: '#4A148C', color: '#fff',
                    fontSize: 15, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  회원가입
                </button>
              </div>
            </div>
          )}

          {/* 로딩 */}
          {hasToken && loading && (
            <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>불러오는 중...</div>
          )}

          {/* 이력 없음 */}
          {hasToken && !loading && history.length === 0 && (
            <div style={{ textAlign: 'center', padding: 60 }}>
              <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.4 }}>📋</div>
              <div style={{ fontSize: 16, color: '#9ca3af', marginBottom: 24 }}>완료된 시험이 없습니다.</div>
              <button
                onClick={() => navigate('/registration/schedules')}
                style={{
                  padding: '12px 32px', borderRadius: 8, border: 'none',
                  backgroundColor: '#4A148C', color: '#fff',
                  fontSize: 15, fontWeight: 600, cursor: 'pointer',
                }}
              >
                시험 접수하러 가기
              </button>
            </div>
          )}

          {/* 시험 이력 카드 */}
          {hasToken && !loading && history.length > 0 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
              gap: isMobile ? 16 : 20,
            }}>
              {history.map(item => {
                const typeLabel = EXAM_TYPE_LABELS[item.examType] || item.examType;
                const typeColor = EXAM_TYPE_COLORS[item.examType] || '#616161';

                return (
                  <div
                    key={item.sessionId}
                    style={{
                      backgroundColor: '#F9FAFB', borderRadius: 16, overflow: 'hidden',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)', cursor: 'pointer',
                      transition: 'box-shadow 0.15s, transform 0.15s',
                      border: '1px solid #F0F0F0',
                    }}
                    onClick={() => navigate(`/lms/review/${item.sessionId}`)}
                    onMouseEnter={e => {
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.12)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    {/* 카드 상단: 시험 유형 배지 */}
                    <div style={{
                      backgroundColor: typeColor, color: '#FFFFFF',
                      padding: '12px 20px',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                      <span style={{ fontSize: 14, fontWeight: 700 }}>{typeLabel}</span>
                      <span style={{ fontSize: 12, opacity: 0.85 }}>
                        {formatDate(item.completedAt)}
                      </span>
                    </div>

                    {/* 카드 본문 */}
                    <div style={{ padding: isMobile ? 16 : 20 }}>
                      <div style={{ fontSize: isMobile ? 15 : 17, fontWeight: 700, color: '#111827', marginBottom: 12 }}>
                        {item.examSetName}
                      </div>

                      {/* 점수 정보 */}
                      {item.score && item.score.isPublished ? (
                        <>
                          <div style={{
                            display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12,
                          }}>
                            <span style={{ fontSize: isMobile ? 28 : 32, fontWeight: 800, color: typeColor }}>
                              {item.score.totalScore}
                            </span>
                            <span style={{ fontSize: 14, color: '#9ca3af' }}>/ {item.score.maxTotalScore}점</span>
                            {item.score.grade && (
                              <span style={{
                                marginLeft: 'auto',
                                padding: '4px 12px', borderRadius: 12,
                                fontSize: 13, fontWeight: 700,
                                backgroundColor: '#E8F5E9', color: '#2E7D32',
                              }}>
                                {GRADE_LABELS[item.score.grade]}
                              </span>
                            )}
                          </div>

                          {/* 영역별 점수 */}
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                            {Object.entries(item.score.sectionScores).map(([section, data]: [string, any]) => (
                              <div key={section} style={{
                                flex: '1 1 0', minWidth: 70,
                                backgroundColor: '#FFFFFF', borderRadius: 8, padding: '8px 10px',
                                textAlign: 'center', border: '1px solid #F0F0F0',
                              }}>
                                <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 2 }}>
                                  {SECTION_LABELS[section] || section}
                                </div>
                                <div style={{ fontSize: 15, fontWeight: 700, color: '#374151' }}>
                                  {data.raw}<span style={{ fontSize: 10, color: '#9ca3af' }}>/{data.maxScore}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div style={{
                          padding: '12px 0', fontSize: 14, color: '#9ca3af',
                          borderTop: '1px solid #F0F0F0', marginBottom: 12,
                        }}>
                          채점 중...
                        </div>
                      )}

                      {/* 하단 정보 */}
                      <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        paddingTop: 12, borderTop: '1px solid #F0F0F0',
                      }}>
                        <span style={{ fontSize: 13, color: '#9ca3af' }}>
                          {item.answerCount}문항 응답
                        </span>
                        <span style={{ fontSize: 13, color: typeColor, fontWeight: 600 }}>
                          상세보기 →
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
