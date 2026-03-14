/**
 * SCR-HOME-01: 메인 홈페이지 — 반응형
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GlobalNavigationBar, { GNB_HEIGHT, GNB_HEIGHT_MOBILE } from '../../shared/components/GlobalNavigationBar';
import BannerCarousel from '../../shared/components/BannerCarousel';
import type { BannerSlide } from '../../shared/components/BannerCarousel';
import Footer from '../../shared/components/Footer';
import { useResponsive } from '../../shared/hooks/useResponsive';
import { fetchSchedules, fetchMyRegistrations } from '../api/registrationApi';
import { useRegistrationStore } from '../store/registrationStore';
import type { ExamSchedule } from '../types/registration.types';

const BANNER_SLIDES: BannerSlide[] = [
  { id: '1', title: 'TOPIK Asia에 오신 것을\n환영합니다', subtitle: '한국어능력시험 최고의 모의시험 플랫폼에서 실전처럼 연습하세요', bgGradient: 'linear-gradient(135deg, #1565C0 0%, #0D47A1 60%, #1A237E 100%)', ctaText: '자세히 보기', ctaLink: '/about' },
  { id: '2', title: '시험 접수 안내', subtitle: '회원가입부터 접수까지 3분이면 완료!\n간편한 온라인 접수 시스템을 이용해보세요', bgGradient: 'linear-gradient(135deg, #00695C 0%, #004D40 100%)', ctaText: '접수하기', ctaLink: '/registration/schedules' },
  { id: '3', title: 'AI 학습 분석', subtitle: '시험 후 유형별 강점/약점을 AI가 분석하고\n문항별 상세 해설을 제공합니다', bgGradient: 'linear-gradient(135deg, #4A148C 0%, #311B92 100%)', ctaText: '학습하기', ctaLink: '/lms' },
];

const NOTICES = [
  { id: '1', title: 'TOPIK Asia 서비스 오픈 안내', date: '2026-03-01' },
  { id: '2', title: '모의시험 응시 방법 안내', date: '2026-03-05' },
  { id: '3', title: '시험 접수 방법 안내', date: '2026-03-10' },
  { id: '4', title: 'LMS 학습 분석 기능 안내', date: '2026-03-12' },
];

const STATUS_CONFIG: Record<string, { label: string; bg: string }> = {
  OPEN: { label: '접수중', bg: '#4CAF50' },
  UPCOMING: { label: '접수전', bg: '#757575' },
  CLOSED: { label: '마감', bg: '#9E9E9E' },
  COMPLETED: { label: '종료', bg: '#BDBDBD' },
};

export default function LandingPage() {
  const navigate = useNavigate();
  const { isMobile, isTablet } = useResponsive();
  const compact = isMobile || isTablet;
  const topPad = compact ? GNB_HEIGHT_MOBILE : GNB_HEIGHT;
  const px = isMobile ? 16 : 24;

  const isLoggedIn = useRegistrationStore((s) => s.isLoggedIn);
  const setSchedules = useRegistrationStore((s) => s.setSchedules);
  const selectSchedule = useRegistrationStore((s) => s.selectSchedule);

  const [schedules, setLocalSchedules] = useState<ExamSchedule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSchedules()
      .then((data) => { setLocalSchedules(data); setSchedules(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [setSchedules]);

  const handleApply = async (schedule: ExamSchedule) => {
    if (!isLoggedIn) {
      selectSchedule(schedule);
      navigate('/registration/login');
      return;
    }
    try {
      const regs = await fetchMyRegistrations();
      const existing = regs.find(
        (r) => r.scheduleId === schedule.id && r.status !== 'CANCELLED'
      );
      if (existing) {
        alert('이미 접수한 신청입니다');
        return;
      }
    } catch {
      // 조회 실패 시 서버 중복 체크에 의존
    }
    selectSchedule(schedule);
    navigate('/registration/apply');
  };

  const handleBannerCta = (link: string) => navigate(link);
  const displaySchedules = schedules.slice(0, 3);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}.`;
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F0F4F8', fontFamily: 'sans-serif', paddingTop: topPad }}>
      <GlobalNavigationBar />

      {/* ── 히어로: 배너 + 일정 ── */}
      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? 16 : 24,
        maxWidth: 1200, margin: '0 auto',
        padding: `${isMobile ? 16 : 28}px ${px}px`,
      }}>
        <div style={{ flex: isMobile ? 'none' : '0 0 48%', width: isMobile ? '100%' : undefined }}>
          <BannerCarousel slides={BANNER_SLIDES} height={isMobile ? 220 : 320} onCtaClick={handleBannerCta} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <span style={{ fontSize: isMobile ? 15 : 17, fontWeight: 700, color: '#111827' }}>
              📅 시험 일정
            </span>
          </div>
          <div style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? 12 : 14,
            overflow: 'hidden',
          }}>
            {loading ? (
              <div style={{ padding: 40, color: '#9E9E9E', fontSize: 14 }}>불러오는 중...</div>
            ) : displaySchedules.length === 0 ? (
              <div style={{ padding: 40, color: '#9E9E9E', fontSize: 14 }}>등록된 시험 일정이 없습니다</div>
            ) : (
              displaySchedules.map((sch) => {
                const cfg = STATUS_CONFIG[sch.status] || STATUS_CONFIG.UPCOMING;
                return (
                  <div key={sch.id} style={{
                    flex: isMobile ? 'none' : '1 1 0', minWidth: 0,
                    backgroundColor: '#FFFFFF', borderRadius: 10,
                    border: '1px solid #E0E0E0', padding: '16px 18px',
                  }}>
                    <div style={{ display: 'inline-block', padding: '3px 12px', borderRadius: 12, fontSize: 12, fontWeight: 600, color: '#FFFFFF', backgroundColor: cfg.bg, marginBottom: 10 }}>
                      {cfg.label}
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 12 }}>{sch.examName}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                      <span style={{ color: '#6B7280' }}>시험일</span>
                      <span style={{ color: '#111827', fontWeight: 500 }}>{formatDate(sch.examDate)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                      <span style={{ color: '#6B7280' }}>접수기간</span>
                      <span style={{ color: '#111827', fontWeight: 500 }}>{formatDate(sch.registrationStartDate)} ~ {formatDate(sch.registrationEndDate)}</span>
                    </div>
                    {sch.status === 'OPEN' && (
                      <button
                        style={{ marginTop: 12, width: '100%', padding: '8px 0', backgroundColor: '#1565C0', color: '#FFFFFF', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                        onClick={() => handleApply(sch)}
                      >
                        접수하기
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ── 퀵 액세스 ── */}
      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        gap: 16, maxWidth: 1200, margin: '0 auto',
        padding: `0 ${px}px 24px`,
      }}>
        <div style={{
          flex: isMobile ? 'none' : 2, backgroundColor: '#FFFFFF', borderRadius: 12,
          padding: isMobile ? '20px 16px' : '24px 28px', border: '1px solid #E0E0E0',
          display: 'flex', alignItems: 'center', gap: 0,
        }}>
          <div style={{ marginRight: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#374151' }}>회원</div>
          </div>
          {[
            { icon: '📝', label: '접수 바로가기', path: isLoggedIn ? '/registration/schedules' : '/registration/login' },
            { icon: '✅', label: '접수확인\n수험표 출력', path: isLoggedIn ? '/registration/mypage' : '/registration/login' },
            { icon: '📊', label: '성적 확인\n성적증명서', path: '/exam/score' },
          ].map((item, i) => (
            <div key={item.label} style={{ display: 'contents' }}>
              {i > 0 && <div style={{ fontSize: 20, color: '#BDBDBD', display: 'flex', alignItems: 'center' }}>›</div>}
              <div
                style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '8px 4px', borderRadius: 8 }}
                onClick={() => navigate(item.path)}
              >
                <div style={{ fontSize: isMobile ? 28 : 32 }}>{item.icon}</div>
                <div style={{ fontSize: isMobile ? 12 : 13, fontWeight: 600, color: '#374151', textAlign: 'center', whiteSpace: 'pre-line' }}>{item.label}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{
          flex: isMobile ? 'none' : 1, backgroundColor: '#FFF9C4', borderRadius: 12,
          padding: isMobile ? '20px 16px' : '24px 28px', border: '1px solid #E0E0E0',
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#374151', marginBottom: 4 }}>비회원</div>
          <div style={{ fontSize: 12, color: '#1976D2', marginBottom: 12 }}>※ 국외 응시자는 비회원 메뉴 이용</div>
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '8px 4px', borderRadius: 8 }} onClick={() => navigate('/login')}>
              <div style={{ fontSize: isMobile ? 28 : 32 }}>📋</div>
              <div style={{ fontSize: isMobile ? 12 : 13, fontWeight: 600, color: '#374151', textAlign: 'center' }}>수험표 출력</div>
            </div>
            <div style={{ fontSize: 20, color: '#BDBDBD', display: 'flex', alignItems: 'center' }}>›</div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '8px 4px', borderRadius: 8 }} onClick={() => navigate('/exam/score')}>
              <div style={{ fontSize: isMobile ? 28 : 32 }}>📄</div>
              <div style={{ fontSize: isMobile ? 12 : 13, fontWeight: 600, color: '#374151', textAlign: 'center' }}>성적증명서 출력</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 정보 링크 바 ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
        gap: 0, maxWidth: 1200, margin: '0 auto 24px',
        padding: `0 ${px}px`,
      }}>
        {[
          { label: '응시 규정', path: '/about#rules' },
          { label: '시험 신청 방법', path: '/about#how-to-apply' },
          { label: '환불신청', path: '' },
          { label: '성적증명서 진위확인', path: '' },
        ].map((item) => (
          <div
            key={item.label}
            onClick={() => item.path && navigate(item.path)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              backgroundColor: '#FFFFFF', border: '1px solid #E0E0E0',
              padding: isMobile ? '12px 14px' : '16px 20px',
              cursor: item.path ? 'pointer' : 'default',
              fontSize: isMobile ? 13 : 15, fontWeight: 600, color: '#374151',
            }}
          >
            <span>{item.label}</span><span style={{ color: '#BDBDBD' }}>›</span>
          </div>
        ))}
      </div>

      {/* ── 하단 섹션 ── */}
      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        gap: 16, maxWidth: 1200, margin: '0 auto',
        padding: `0 ${px}px 40px`,
      }}>
        <div style={{
          flex: isMobile ? 'none' : '0 0 240px',
          backgroundColor: '#FFE0E0', borderRadius: 16,
          padding: '28px 24px', textAlign: 'center', cursor: 'pointer',
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#C62828' }}>부정행위</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#C62828' }}>조치 기준</div>
        </div>
        <div style={{
          flex: 1, backgroundColor: '#FFFFFF', borderRadius: 16,
          padding: isMobile ? '20px 16px' : '24px 28px', border: '1px solid #E0E0E0',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 17, fontWeight: 700, color: '#111827' }}>공지사항</span>
            <button style={{ fontSize: 13, color: '#6B7280', cursor: 'pointer', border: 'none', background: 'none', fontFamily: 'inherit' }}>더보기</button>
          </div>
          {NOTICES.map((n) => (
            <div key={n.id} style={{ fontSize: 14, color: '#374151', padding: '8px 0', borderBottom: '1px solid #F0F0F0', display: 'flex', justifyContent: 'space-between' }}>
              <span>· {n.title}</span>
              <span style={{ color: '#9E9E9E', fontSize: 12, flexShrink: 0, marginLeft: 8 }}>{n.date}</span>
            </div>
          ))}
        </div>
        <div style={{
          flex: isMobile ? 'none' : '0 0 240px',
          backgroundColor: '#FFF9C4', borderRadius: 16,
          padding: '28px 24px', textAlign: 'center', cursor: 'pointer',
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#F57F17' }}>TOPIK FAQ</div>
          <div style={{ fontSize: 13, color: '#9E9E9E', marginTop: 8 }}>자주 묻는 질문</div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
