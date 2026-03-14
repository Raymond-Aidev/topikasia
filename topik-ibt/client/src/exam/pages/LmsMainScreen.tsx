/**
 * SCR-L01: LMS 메인 — 학습 관리 시스템
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { examApi } from '../../api/examApi';
import GlobalNavigationBar, { GNB_HEIGHT, GNB_HEIGHT_MOBILE } from '../../shared/components/GlobalNavigationBar';
import { useResponsive } from '../../shared/hooks/useResponsive';
import Footer from '../../shared/components/Footer';
import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';

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
  const navigate = useNavigate();
  const [history, setHistory] = useState<ExamHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const hasToken = !!(localStorage.getItem('examToken') || localStorage.getItem('registrationToken'));

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
    <div className="min-h-screen bg-gray-100 font-sans" style={{ paddingTop: topPad }}>
      <GlobalNavigationBar />

      {/* 히어로 */}
      <div className={cn(
        'bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 text-white text-center',
        isMobile ? 'px-4 py-12' : 'px-6 py-16'
      )}>
        <div className={cn('font-extrabold mb-3', isMobile ? 'text-[28px]' : 'text-[40px]')}>LMS</div>
        <div className={cn('opacity-90 leading-relaxed', isMobile ? 'text-sm' : 'text-lg')}>
          시험 이력을 확인하고, AI 분석으로 실력을 향상하세요
        </div>
      </div>

      {/* LMS 기능 소개 카드 */}
      <div className={cn('max-w-[1100px] mx-auto', isMobile ? 'px-4 py-12' : 'px-6 py-12')}>
        <div className={cn('grid gap-6', isMobile ? 'grid-cols-1 gap-4' : 'grid-cols-3')}>
          {LMS_FEATURES.map((f) => (
            <Card key={f.title} className={cn(
              'rounded-2xl text-center shadow-[0_2px_12px_rgba(0,0,0,0.06)]',
              isMobile ? 'px-5 py-6' : 'px-6 py-8'
            )}>
              <CardContent className="p-0">
                <div className="text-4xl mb-3">{f.icon}</div>
                <div className={cn('font-bold text-purple-900 mb-2', isMobile ? 'text-base' : 'text-lg')}>{f.title}</div>
                <div className="text-sm text-gray-500 leading-relaxed">{f.desc}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* 시험 이력 */}
      <div className={cn('bg-white', isMobile ? 'px-4 py-14' : 'px-6 py-14')}>
        <div className="max-w-[1100px] mx-auto">
          <div className={cn('font-extrabold text-gray-900 mb-8', isMobile ? 'text-[22px]' : 'text-[28px]')}>
            시험 이력
          </div>

          {/* 비로그인 상태 */}
          {!hasToken && (
            <div className={cn('text-center', isMobile ? 'px-4 py-12' : 'px-6 py-16')}>
              <div className="text-5xl mb-4 opacity-40">🔒</div>
              <div className="text-lg font-bold text-gray-700 mb-2">
                로그인 후 조회 가능
              </div>
              <div className="text-sm text-gray-400 mb-7 leading-relaxed">
                시험에 응시한 이력을 확인하려면 로그인이 필요합니다
              </div>
              <div className="flex gap-3 justify-center flex-wrap">
                <Button
                  variant="outline"
                  onClick={() => navigate('/registration/login')}
                  className="px-9 py-3 rounded-lg border-2 border-purple-900 text-purple-900 text-[15px] font-semibold h-auto"
                >
                  로그인
                </Button>
                <Button
                  onClick={() => navigate('/registration/signup')}
                  className="px-9 py-3 rounded-lg bg-purple-900 hover:bg-purple-950 text-[15px] font-semibold h-auto"
                >
                  회원가입
                </Button>
              </div>
            </div>
          )}

          {/* 로딩 */}
          {hasToken && loading && (
            <div className="text-center py-10 text-gray-400">불러오는 중...</div>
          )}

          {/* 이력 없음 */}
          {hasToken && !loading && history.length === 0 && (
            <div className="text-center py-16">
              <div className="text-5xl mb-4 opacity-40">📋</div>
              <div className="text-base text-gray-400 mb-6">완료된 시험이 없습니다.</div>
              <Button
                onClick={() => navigate('/registration/schedules')}
                className="px-8 py-3 rounded-lg bg-purple-900 hover:bg-purple-950 text-[15px] font-semibold h-auto"
              >
                시험 접수하러 가기
              </Button>
            </div>
          )}

          {/* 시험 이력 카드 */}
          {hasToken && !loading && history.length > 0 && (
            <div className={cn('grid gap-5', isMobile ? 'grid-cols-1 gap-4' : 'grid-cols-2')}>
              {history.map(item => {
                const typeLabel = EXAM_TYPE_LABELS[item.examType] || item.examType;
                const typeColor = EXAM_TYPE_COLORS[item.examType] || '#616161';

                return (
                  <div
                    key={item.sessionId}
                    className="bg-gray-50 rounded-2xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.06)] cursor-pointer transition-all duration-150 border border-gray-100 hover:shadow-[0_6px_20px_rgba(0,0,0,0.12)] hover:-translate-y-0.5"
                    onClick={() => navigate(`/lms/review/${item.sessionId}`)}
                  >
                    {/* 카드 상단: 시험 유형 배지 */}
                    <div className="text-white px-5 py-3 flex justify-between items-center"
                      style={{ backgroundColor: typeColor }}>
                      <span className="text-sm font-bold">{typeLabel}</span>
                      <span className="text-xs opacity-85">
                        {formatDate(item.completedAt)}
                      </span>
                    </div>

                    {/* 카드 본문 */}
                    <div className={cn(isMobile ? 'p-4' : 'p-5')}>
                      <div className={cn('font-bold text-gray-900 mb-3', isMobile ? 'text-[15px]' : 'text-[17px]')}>
                        {item.examSetName}
                      </div>

                      {/* 점수 정보 */}
                      {item.score && item.score.isPublished ? (
                        <>
                          <div className="flex items-baseline gap-2 mb-3">
                            <span className={cn('font-extrabold', isMobile ? 'text-[28px]' : 'text-[32px]')}
                              style={{ color: typeColor }}>
                              {item.score.totalScore}
                            </span>
                            <span className="text-sm text-gray-400">/ {item.score.maxTotalScore}점</span>
                            {item.score.grade && (
                              <Badge className="ml-auto px-3 py-1 rounded-xl text-[13px] font-bold bg-green-50 text-green-700 border-0">
                                {GRADE_LABELS[item.score.grade]}
                              </Badge>
                            )}
                          </div>

                          {/* 영역별 점수 */}
                          <div className="flex gap-2 flex-wrap mb-3">
                            {Object.entries(item.score.sectionScores).map(([section, data]: [string, any]) => (
                              <div key={section} className="flex-1 min-w-[70px] bg-white rounded-lg px-2.5 py-2 text-center border border-gray-100">
                                <div className="text-[11px] text-gray-500 mb-0.5">
                                  {SECTION_LABELS[section] || section}
                                </div>
                                <div className="text-[15px] font-bold text-gray-700">
                                  {data.raw}<span className="text-[10px] text-gray-400">/{data.maxScore}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="py-3 text-sm text-gray-400 border-t border-gray-100 mb-3">
                          채점 중...
                        </div>
                      )}

                      {/* 하단 정보 */}
                      <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                        <span className="text-[13px] text-gray-400">
                          {item.answerCount}문항 응답
                        </span>
                        <span className="text-[13px] font-semibold" style={{ color: typeColor }}>
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
