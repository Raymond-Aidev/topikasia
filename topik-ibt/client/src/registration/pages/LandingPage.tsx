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
import { fetchSchedules, fetchMyRegistrations, checkEligibility } from '../api/registrationApi';
import { useRegistrationStore } from '../store/registrationStore';
import type { ExamSchedule } from '../types/registration.types';
import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/button';

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
  OPEN: { label: '접수중', bg: 'bg-green-500' },
  UPCOMING: { label: '접수전', bg: 'bg-gray-500' },
  CLOSED: { label: '마감', bg: 'bg-gray-400' },
  COMPLETED: { label: '종료', bg: 'bg-gray-300' },
};

export default function LandingPage() {
  const navigate = useNavigate();
  const { isMobile, isTablet } = useResponsive();
  const compact = isMobile || isTablet;
  const topPad = compact ? GNB_HEIGHT_MOBILE : GNB_HEIGHT;

  const isLoggedIn = useRegistrationStore((s) => s.isLoggedIn);
  const user = useRegistrationStore((s) => s.user);
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
    // 로그인 상태 + 토큰 유효성 실시간 확인
    const token = localStorage.getItem('registrationToken');
    let tokenValid = false;
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        tokenValid = !(payload.exp && payload.exp * 1000 < Date.now());
      } catch { /* invalid token */ }
    }

    if (!isLoggedIn || !user || !tokenValid) {
      selectSchedule(schedule);
      navigate('/registration/login', { state: { from: '/registration/schedules' } });
      return;
    }
    try {
      // 중복 접수 체크
      const regs = await fetchMyRegistrations();
      const existing = regs.find(
        (r) => r.scheduleId === schedule.id && r.status !== 'CANCELLED'
      );
      if (existing) {
        const goMyPage = confirm('이미 접수한 시험입니다.\n마이페이지에서 접수 내역을 확인하시겠습니까?');
        if (goMyPage) navigate('/registration/mypage');
        return;
      }
      // 응시 대상자 체크
      const { eligible } = await checkEligibility(schedule.id);
      if (!eligible) {
        alert('응시대상이 아닙니다');
        return;
      }
    } catch {
      // 조회 실패 시 서버 중복/대상자 체크에 의존
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
    <div className="min-h-screen bg-[#F0F4F8] font-sans" style={{ paddingTop: topPad }}>
      <GlobalNavigationBar />

      {/* ── 히어로: 배너 + 일정 ── */}
      <div className={cn(
        'flex max-w-[1200px] mx-auto',
        isMobile ? 'flex-col gap-4 p-4' : 'flex-row gap-6 px-6 py-7'
      )}>
        <div className={cn(isMobile ? 'w-full' : 'flex-[0_0_48%]')}>
          <BannerCarousel slides={BANNER_SLIDES} height={isMobile ? 220 : 320} onCtaClick={handleBannerCta} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <span className={cn('font-bold text-gray-900', isMobile ? 'text-[15px]' : 'text-[17px]')}>
              📅 시험 일정
            </span>
          </div>
          <div className={cn(
            'flex overflow-hidden',
            isMobile ? 'flex-col gap-3' : 'flex-row gap-3.5'
          )}>
            {loading ? (
              <div className="p-10 text-gray-400 text-sm">불러오는 중...</div>
            ) : displaySchedules.length === 0 ? (
              <div className="p-10 text-gray-400 text-sm">등록된 시험 일정이 없습니다</div>
            ) : (
              displaySchedules.map((sch) => {
                const cfg = STATUS_CONFIG[sch.status] || STATUS_CONFIG.UPCOMING;
                return (
                  <div key={sch.id} className={cn(
                    'bg-white rounded-[10px] border border-gray-200 px-[18px] py-4',
                    isMobile ? '' : 'flex-[1_1_0] min-w-0'
                  )}>
                    <span className={cn(
                      'inline-block px-3 py-[3px] rounded-xl text-xs font-semibold text-white mb-2.5',
                      cfg.bg
                    )}>
                      {cfg.label}
                    </span>
                    <div className="text-[15px] font-bold text-gray-900 mb-3">{sch.examName}</div>
                    <div className="flex justify-between text-[13px] mb-1">
                      <span className="text-gray-500">시험일</span>
                      <span className="text-gray-900 font-medium">{formatDate(sch.examDate)}</span>
                    </div>
                    <div className="flex justify-between text-[13px] mb-1">
                      <span className="text-gray-500">접수기간</span>
                      <span className="text-gray-900 font-medium">{formatDate(sch.registrationStartAt)} ~ {formatDate(sch.registrationEndAt)}</span>
                    </div>
                    {sch.status === 'OPEN' && (
                      <Button
                        className="mt-3 w-full py-2 bg-[#1565C0] hover:bg-[#1256A8] text-white text-[13px] font-semibold rounded-md"
                        onClick={() => handleApply(sch)}
                      >
                        접수하기
                      </Button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ── 퀵 액세스 ── */}
      <div className={cn(
        'flex max-w-[1200px] mx-auto gap-4 pb-6',
        isMobile ? 'flex-col px-4' : 'flex-row px-6'
      )}>
        <div className={cn(
          'bg-white rounded-xl border border-gray-200 flex items-center gap-0',
          isMobile ? 'p-5' : 'flex-[2] px-7 py-6'
        )}>
          <div className="mr-5">
            <div className="text-sm font-bold text-gray-700">회원</div>
          </div>
          {[
            { icon: '📝', label: '접수 바로가기', path: isLoggedIn ? '/registration/schedules' : '/registration/login' },
            { icon: '✅', label: '접수확인\n수험표 출력', path: isLoggedIn ? '/registration/mypage' : '/registration/login' },
            { icon: '📊', label: '성적 확인\n성적증명서', path: '/exam/score' },
          ].map((item, i) => (
            <div key={item.label} className="contents">
              {i > 0 && <div className="text-xl text-gray-300 flex items-center">›</div>}
              <div
                className="flex-1 flex flex-col items-center gap-2 cursor-pointer p-2 rounded-lg"
                onClick={() => navigate(item.path)}
              >
                <div className={cn(isMobile ? 'text-[28px]' : 'text-[32px]')}>{item.icon}</div>
                <div className={cn('font-semibold text-gray-700 text-center whitespace-pre-line', isMobile ? 'text-xs' : 'text-[13px]')}>{item.label}</div>
              </div>
            </div>
          ))}
        </div>
        <div className={cn(
          'bg-[#FFF9C4] rounded-xl border border-gray-200',
          isMobile ? 'p-5' : 'flex-1 px-7 py-6'
        )}>
          <div className="text-sm font-bold text-gray-700 mb-1">비회원</div>
          <div className="text-xs text-blue-600 mb-3">※ 국외 응시자는 비회원 메뉴 이용</div>
          <div className="flex gap-4">
            <div className="flex-1 flex flex-col items-center gap-2 cursor-pointer p-2 rounded-lg" onClick={() => navigate('/login')}>
              <div className={cn(isMobile ? 'text-[28px]' : 'text-[32px]')}>📋</div>
              <div className={cn('font-semibold text-gray-700 text-center', isMobile ? 'text-xs' : 'text-[13px]')}>수험표 출력</div>
            </div>
            <div className="text-xl text-gray-300 flex items-center">›</div>
            <div className="flex-1 flex flex-col items-center gap-2 cursor-pointer p-2 rounded-lg" onClick={() => navigate('/exam/score')}>
              <div className={cn(isMobile ? 'text-[28px]' : 'text-[32px]')}>📄</div>
              <div className={cn('font-semibold text-gray-700 text-center', isMobile ? 'text-xs' : 'text-[13px]')}>성적증명서 출력</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 정보 링크 바 ── */}
      <div className={cn(
        'grid max-w-[1200px] mx-auto mb-6',
        isMobile ? 'grid-cols-2 px-4' : 'grid-cols-4 px-6'
      )}>
        {[
          { label: '응시 규정', path: '/about#rules' },
          { label: '시험 신청 방법', path: '/about#how-to-apply' },
          { label: '환불신청', path: '' },
          { label: '성적증명서 진위확인', path: '' },
        ].map((item) => (
          <div
            key={item.label}
            onClick={() => item.path && navigate(item.path)}
            className={cn(
              'flex items-center justify-between bg-white border border-gray-200 font-semibold text-gray-700',
              isMobile ? 'px-3.5 py-3 text-[13px]' : 'px-5 py-4 text-[15px]',
              item.path ? 'cursor-pointer' : 'cursor-default'
            )}
          >
            <span>{item.label}</span><span className="text-gray-300">›</span>
          </div>
        ))}
      </div>

      {/* ── 하단 섹션 ── */}
      <div className={cn(
        'flex max-w-[1200px] mx-auto gap-4 pb-10',
        isMobile ? 'flex-col px-4' : 'flex-row px-6'
      )}>
        <div className={cn(
          'bg-[#FFE0E0] rounded-2xl px-6 py-7 text-center cursor-pointer',
          isMobile ? '' : 'flex-[0_0_240px]'
        )}>
          <div className="text-5xl mb-3">⚠️</div>
          <div className="text-base font-bold text-red-800">부정행위</div>
          <div className="text-base font-bold text-red-800">조치 기준</div>
        </div>
        <div className={cn(
          'flex-1 bg-white rounded-2xl border border-gray-200',
          isMobile ? 'p-5' : 'px-7 py-6'
        )}>
          <div className="flex justify-between items-center mb-4">
            <span className="text-[17px] font-bold text-gray-900">공지사항</span>
            <button className="text-[13px] text-gray-500 cursor-pointer border-none bg-transparent font-[inherit]">더보기</button>
          </div>
          {NOTICES.map((n) => (
            <div key={n.id} className="text-sm text-gray-700 py-2 border-b border-gray-100 flex justify-between">
              <span>· {n.title}</span>
              <span className="text-gray-400 text-xs shrink-0 ml-2">{n.date}</span>
            </div>
          ))}
        </div>
        <div className={cn(
          'bg-[#FFF9C4] rounded-2xl px-6 py-7 text-center cursor-pointer',
          isMobile ? '' : 'flex-[0_0_240px]'
        )}>
          <div className="text-5xl mb-3">💬</div>
          <div className="text-base font-bold text-[#F57F17]">TOPIK FAQ</div>
          <div className="text-[13px] text-gray-400 mt-2">자주 묻는 질문</div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
