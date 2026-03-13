/**
 * SCR-HOME-01: 메인 홈페이지 (공식 TOPIK 스타일 리디자인)
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GlobalNavigationBar, { GNB_HEIGHT } from '../../shared/components/GlobalNavigationBar';
import BannerCarousel from '../../shared/components/BannerCarousel';
import type { BannerSlide } from '../../shared/components/BannerCarousel';
import Footer from '../../shared/components/Footer';
import { fetchSchedules } from '../api/registrationApi';
import { useRegistrationStore } from '../store/registrationStore';
import type { ExamSchedule } from '../types/registration.types';

// ── 배너 슬라이드 데이터 ──
const BANNER_SLIDES: BannerSlide[] = [
  {
    id: '1',
    title: 'TOPIK Asia에 오신 것을\n환영합니다',
    subtitle: '한국어능력시험 최고의 모의시험 플랫폼에서 실전처럼 연습하세요',
    bgGradient: 'linear-gradient(135deg, #1565C0 0%, #0D47A1 60%, #1A237E 100%)',
    ctaText: '자세히 보기',
    ctaLink: '/about',
  },
  {
    id: '2',
    title: '시험 접수 안내',
    subtitle: '회원가입부터 접수까지 3분이면 완료!\n간편한 온라인 접수 시스템을 이용해보세요',
    bgGradient: 'linear-gradient(135deg, #00695C 0%, #004D40 100%)',
    ctaText: '접수하기',
    ctaLink: '/registration/schedules',
  },
  {
    id: '3',
    title: 'AI 학습 분석',
    subtitle: '시험 후 유형별 강점/약점을 AI가 분석하고\n문항별 상세 해설을 제공합니다',
    bgGradient: 'linear-gradient(135deg, #4A148C 0%, #311B92 100%)',
    ctaText: '학습하기',
    ctaLink: '/lms',
  },
];

// ── 공지사항 (하드코딩, Phase 3에서 API 연동) ──
const NOTICES = [
  { id: '1', title: 'TOPIK Asia 서비스 오픈 안내', date: '2026-03-01' },
  { id: '2', title: '모의시험 응시 방법 안내', date: '2026-03-05' },
  { id: '3', title: '시험 접수 방법 안내', date: '2026-03-10' },
  { id: '4', title: 'LMS 학습 분석 기능 안내', date: '2026-03-12' },
];

// ── 상태 뱃지 ──
const STATUS_CONFIG: Record<string, { label: string; bg: string }> = {
  OPEN: { label: '접수중', bg: '#4CAF50' },
  UPCOMING: { label: '접수전', bg: '#757575' },
  CLOSED: { label: '마감', bg: '#9E9E9E' },
  COMPLETED: { label: '종료', bg: '#BDBDBD' },
};

// ── 스타일 ──
const s = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#F0F4F8',
    fontFamily: 'sans-serif',
    paddingTop: GNB_HEIGHT,
  },
  container: { maxWidth: 1200, margin: '0 auto', padding: '0 24px' },

  // 히어로
  heroSection: {
    display: 'flex' as const,
    gap: 24,
    maxWidth: 1200,
    margin: '0 auto',
    padding: '28px 24px',
  },
  heroLeft: { flex: '0 0 48%' },
  heroRight: { flex: 1 },
  scheduleHeader: {
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 16,
  },
  scheduleTitle: { fontSize: 17, fontWeight: 700 as const, color: '#111827' },
  scheduleCards: {
    display: 'flex' as const,
    gap: 14,
    overflow: 'hidden' as const,
  },
  scheduleCard: {
    flex: '1 1 0',
    minWidth: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    border: '1px solid #E0E0E0',
    padding: '16px 18px',
  },
  badge: {
    display: 'inline-block' as const,
    padding: '3px 12px',
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 600 as const,
    color: '#FFFFFF',
    marginBottom: 10,
  },
  schedCardTitle: { fontSize: 15, fontWeight: 700 as const, color: '#111827', marginBottom: 12 },
  schedRow: {
    display: 'flex' as const,
    justifyContent: 'space-between' as const,
    fontSize: 13,
    marginBottom: 4,
  },
  schedLabel: { color: '#6B7280' },
  schedValue: { color: '#111827', fontWeight: 500 as const },
  applyBtn: {
    marginTop: 12,
    width: '100%',
    padding: '8px 0',
    backgroundColor: '#1565C0',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 600 as const,
    cursor: 'pointer',
  },

  // 퀵 액세스
  quickSection: {
    display: 'flex' as const,
    gap: 16,
    maxWidth: 1200,
    margin: '0 auto',
    padding: '0 24px 24px',
  },
  quickMember: {
    flex: 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: '24px 28px',
    border: '1px solid #E0E0E0',
    display: 'flex' as const,
    alignItems: 'center' as const,
    gap: 0,
  },
  quickGuest: {
    flex: 1,
    backgroundColor: '#FFF9C4',
    borderRadius: 12,
    padding: '24px 28px',
    border: '1px solid #E0E0E0',
  },
  quickTitle: { fontSize: 14, fontWeight: 700 as const, color: '#374151', marginBottom: 4 },
  quickSubtitle: { fontSize: 16, fontWeight: 700 as const, color: '#111827', marginBottom: 16 },
  quickItem: {
    flex: 1,
    display: 'flex' as const,
    flexDirection: 'column' as const,
    alignItems: 'center' as const,
    gap: 8,
    cursor: 'pointer',
    padding: '8px 4px',
    borderRadius: 8,
  },
  quickIcon: { fontSize: 32 },
  quickLabel: { fontSize: 13, fontWeight: 600 as const, color: '#374151', textAlign: 'center' as const },
  quickArrow: { fontSize: 20, color: '#BDBDBD', display: 'flex' as const, alignItems: 'center' as const },
  quickNote: { fontSize: 12, color: '#1976D2', marginBottom: 12 },
  quickGuestItems: { display: 'flex' as const, gap: 16 },

  // 정보 링크
  infoLinks: {
    display: 'grid' as const,
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 0,
    maxWidth: 1200,
    margin: '0 auto 24px',
    padding: '0 24px',
  },
  infoLink: {
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    backgroundColor: '#FFFFFF',
    border: '1px solid #E0E0E0',
    padding: '16px 20px',
    cursor: 'pointer',
    fontSize: 15,
    fontWeight: 600 as const,
    color: '#374151',
  },

  // 하단 3컬럼
  bottomSection: {
    display: 'flex' as const,
    gap: 16,
    maxWidth: 1200,
    margin: '0 auto',
    padding: '0 24px 40px',
  },
  bottomLeft: {
    flex: '0 0 240px',
    backgroundColor: '#FFE0E0',
    borderRadius: 16,
    padding: '28px 24px',
    textAlign: 'center' as const,
    cursor: 'pointer',
  },
  bottomCenter: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: '24px 28px',
    border: '1px solid #E0E0E0',
  },
  bottomRight: {
    flex: '0 0 240px',
    backgroundColor: '#FFF9C4',
    borderRadius: 16,
    padding: '28px 24px',
    textAlign: 'center' as const,
    cursor: 'pointer',
  },
  noticeHeader: {
    display: 'flex' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 16,
  },
  noticeTitle: { fontSize: 17, fontWeight: 700 as const, color: '#111827' },
  noticeMore: {
    fontSize: 13, color: '#6B7280', cursor: 'pointer',
    border: 'none', background: 'none', fontFamily: 'inherit',
  },
  noticeItem: {
    fontSize: 14,
    color: '#374151',
    padding: '8px 0',
    borderBottom: '1px solid #F0F0F0',
    display: 'flex' as const,
    justifyContent: 'space-between' as const,
  },
};

export default function LandingPage() {
  const navigate = useNavigate();
  const isLoggedIn = useRegistrationStore((s) => s.isLoggedIn);
  const setSchedules = useRegistrationStore((s) => s.setSchedules);
  const selectSchedule = useRegistrationStore((s) => s.selectSchedule);

  const [schedules, setLocalSchedules] = useState<ExamSchedule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSchedules()
      .then((data) => {
        setLocalSchedules(data);
        setSchedules(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [setSchedules]);

  const handleApply = (schedule: ExamSchedule) => {
    selectSchedule(schedule);
    if (!isLoggedIn) {
      navigate('/registration/login');
    } else {
      navigate('/registration/apply');
    }
  };

  const handleBannerCta = (link: string) => {
    navigate(link);
  };

  const displaySchedules = schedules.slice(0, 3);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}.`;
  };

  return (
    <div style={s.page}>
      <GlobalNavigationBar />

      {/* ── 히어로: 배너 + 일정 카드 ── */}
      <div style={s.heroSection}>
        <div style={s.heroLeft}>
          <BannerCarousel
            slides={BANNER_SLIDES}
            height={320}
            onCtaClick={handleBannerCta}
          />
        </div>
        <div style={s.heroRight}>
          <div style={s.scheduleHeader}>
            <span style={s.scheduleTitle}>
              📅 2026년도 한국어능력시험 일정 보기
            </span>
          </div>
          <div style={s.scheduleCards}>
            {loading ? (
              <div style={{ padding: 40, color: '#9E9E9E', fontSize: 14 }}>
                불러오는 중...
              </div>
            ) : displaySchedules.length === 0 ? (
              <div style={{ padding: 40, color: '#9E9E9E', fontSize: 14 }}>
                등록된 시험 일정이 없습니다
              </div>
            ) : (
              displaySchedules.map((sch) => {
                const cfg = STATUS_CONFIG[sch.status] || STATUS_CONFIG.UPCOMING;
                return (
                  <div key={sch.id} style={s.scheduleCard}>
                    <div style={{ ...s.badge, backgroundColor: cfg.bg }}>
                      {cfg.label}
                    </div>
                    <div style={s.schedCardTitle}>{sch.examName}</div>
                    <div style={s.schedRow}>
                      <span style={s.schedLabel}>시험일</span>
                      <span style={s.schedValue}>{formatDate(sch.examDate)}</span>
                    </div>
                    <div style={s.schedRow}>
                      <span style={s.schedLabel}>접수기간</span>
                      <span style={s.schedValue}>
                        {formatDate(sch.registrationStartDate)} ~{' '}
                        {formatDate(sch.registrationEndDate)}
                      </span>
                    </div>
                    {sch.status === 'OPEN' && (
                      <button
                        style={s.applyBtn}
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
      <div style={s.quickSection}>
        {/* 회원 */}
        <div style={s.quickMember}>
          <div style={{ marginRight: 20 }}>
            <div style={s.quickTitle}>회원</div>
          </div>
          <div
            style={s.quickItem}
            onClick={() =>
              isLoggedIn
                ? navigate('/registration/schedules')
                : navigate('/registration/login')
            }
          >
            <div style={s.quickIcon}>📝</div>
            <div style={s.quickLabel}>접수 바로가기</div>
          </div>
          <div style={s.quickArrow}>›</div>
          <div
            style={s.quickItem}
            onClick={() =>
              isLoggedIn
                ? navigate('/registration/mypage')
                : navigate('/registration/login')
            }
          >
            <div style={s.quickIcon}>✅</div>
            <div style={s.quickLabel}>접수확인{'\n'}수험표 출력</div>
          </div>
          <div style={s.quickArrow}>›</div>
          <div
            style={s.quickItem}
            onClick={() => navigate('/exam/score')}
          >
            <div style={s.quickIcon}>📊</div>
            <div style={s.quickLabel}>성적 확인{'\n'}성적증명서</div>
          </div>
        </div>

        {/* 비회원 */}
        <div style={s.quickGuest}>
          <div style={s.quickTitle}>비회원</div>
          <div style={s.quickNote}>※ 국외 응시자는 비회원 메뉴 이용</div>
          <div style={s.quickGuestItems}>
            <div style={s.quickItem} onClick={() => navigate('/login')}>
              <div style={s.quickIcon}>📋</div>
              <div style={s.quickLabel}>수험표 출력</div>
            </div>
            <div style={s.quickArrow}>›</div>
            <div style={s.quickItem} onClick={() => navigate('/exam/score')}>
              <div style={s.quickIcon}>📄</div>
              <div style={s.quickLabel}>성적증명서 출력</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 정보 링크 바 ── */}
      <div style={s.infoLinks}>
        <div style={s.infoLink} onClick={() => navigate('/about#rules')}>
          <span>응시 규정</span><span style={{ color: '#BDBDBD' }}>›</span>
        </div>
        <div style={s.infoLink} onClick={() => navigate('/about#how-to-apply')}>
          <span>시험 신청 방법</span><span style={{ color: '#BDBDBD' }}>›</span>
        </div>
        <div style={s.infoLink}>
          <span>환불신청</span><span style={{ color: '#BDBDBD' }}>›</span>
        </div>
        <div style={s.infoLink}>
          <span>성적증명서 진위확인</span><span style={{ color: '#BDBDBD' }}>›</span>
        </div>
      </div>

      {/* ── 하단 3컬럼 ── */}
      <div style={s.bottomSection}>
        {/* 좌: 안내 배너 */}
        <div style={s.bottomLeft}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#C62828' }}>
            부정행위
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#C62828' }}>
            조치 기준
          </div>
        </div>

        {/* 중: 공지사항 */}
        <div style={s.bottomCenter}>
          <div style={s.noticeHeader}>
            <span style={s.noticeTitle}>공지사항</span>
            <button style={s.noticeMore}>더보기</button>
          </div>
          {NOTICES.map((n) => (
            <div key={n.id} style={s.noticeItem}>
              <span>· {n.title}</span>
              <span style={{ color: '#9E9E9E', fontSize: 12 }}>{n.date}</span>
            </div>
          ))}
        </div>

        {/* 우: FAQ */}
        <div style={s.bottomRight}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#F57F17' }}>
            TOPIK FAQ
          </div>
          <div style={{ fontSize: 13, color: '#9E9E9E', marginTop: 8 }}>
            자주 묻는 질문
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
