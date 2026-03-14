/**
 * 시험별 안내 페이지
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GlobalNavigationBar, { GNB_HEIGHT, GNB_HEIGHT_MOBILE } from '../../shared/components/GlobalNavigationBar';
import { useResponsive } from '../../shared/hooks/useResponsive';
import Footer from '../../shared/components/Footer';
import { fetchSchedules, fetchMyRegistrations, checkEligibility } from '../api/registrationApi';
import { useRegistrationStore } from '../store/registrationStore';
import type { ExamSchedule } from '../types/registration.types';
import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/button';

const STATUS_LABELS: Record<string, string> = {
  UPCOMING: '예정',
  OPEN: '접수중',
  CLOSED: '마감',
  COMPLETED: '종료',
};

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-green-500',
  CLOSED: 'bg-gray-400',
  UPCOMING: 'bg-gray-200',
  COMPLETED: 'bg-gray-300',
};

const EXAM_INFO = [
  { icon: '📝', title: 'TOPIK I (초급)', desc: '듣기 40분 + 읽기 60분 = 100분, 200점 만점', level: '1급~2급' },
  { icon: '📚', title: 'TOPIK II (중·고급)', desc: '듣기 60분 + 쓰기 50분 + 읽기 70분 = 180분, 300점 만점', level: '3급~6급' },
];

export default function ExamSchedulePage() {
  const { isMobile, isTablet } = useResponsive();
  const compact = isMobile || isTablet;
  const topPad = compact ? GNB_HEIGHT_MOBILE : GNB_HEIGHT;
  const navigate = useNavigate();
  const selectSchedule = useRegistrationStore((s) => s.selectSchedule);
  const isLoggedIn = useRegistrationStore((s) => s.isLoggedIn);

  const [schedules, setSchedules] = useState<ExamSchedule[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSchedules()
      .then(setSchedules)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleRowClick = (sch: ExamSchedule) => {
    if (sch.status !== 'OPEN') return;
    setSelectedId(sch.id);
  };

  const handleApply = async () => {
    const sch = schedules.find((s) => s.id === selectedId);
    if (!sch) return;
    if (!isLoggedIn) {
      selectSchedule(sch);
      navigate('/registration/login');
      return;
    }
    try {
      // 중복 접수 체크
      const regs = await fetchMyRegistrations();
      const existing = regs.find(
        (r) => r.scheduleId === sch.id && r.status !== 'CANCELLED'
      );
      if (existing) {
        alert('이미 접수한 신청입니다');
        return;
      }
      // 응시 대상자 체크
      const { eligible } = await checkEligibility(sch.id);
      if (!eligible) {
        alert('응시대상이 아닙니다');
        return;
      }
    } catch {
      // 조회 실패 시 서버 중복/대상자 체크에 의존
    }
    selectSchedule(sch);
    navigate('/registration/apply');
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans" style={{ paddingTop: topPad }}>
      <GlobalNavigationBar />

      {/* 히어로 */}
      <div className={cn(
        'bg-gradient-to-br from-[#1565C0] via-[#0D47A1] to-[#1A237E] text-white text-center',
        isMobile ? 'px-4 py-12' : 'px-6 py-16'
      )}>
        <div className={cn('font-extrabold mb-3', isMobile ? 'text-[28px]' : 'text-[40px]')}>시험별 안내</div>
        <div className={cn('opacity-90 leading-relaxed', isMobile ? 'text-sm' : 'text-lg')}>
          TOPIK I · TOPIK II 시험 일정을 확인하고 접수하세요
        </div>
      </div>

      {/* 시험 유형 소개 카드 */}
      <div className={cn('max-w-[1100px] mx-auto', isMobile ? 'px-4 py-12' : 'px-6 py-12')}>
        <div className={cn('font-extrabold text-gray-900 text-center mb-8', isMobile ? 'text-[22px]' : 'text-[28px]')}>
          시험 유형
        </div>
        <div className={cn('grid gap-6', isMobile ? 'grid-cols-1' : 'grid-cols-2')}>
          {EXAM_INFO.map((info) => (
            <div key={info.title} className={cn(
              'bg-white rounded-2xl shadow-sm',
              isMobile ? 'px-5 py-6' : 'px-7 py-8'
            )}>
              <div className="text-4xl mb-3">{info.icon}</div>
              <div className={cn('font-bold text-[#1565C0] mb-2', isMobile ? 'text-lg' : 'text-xl')}>{info.title}</div>
              <div className="text-sm text-gray-600 leading-relaxed mb-3">{info.desc}</div>
              <span className="inline-block px-3.5 py-1 rounded-xl text-[13px] font-semibold bg-blue-50 text-[#1565C0]">
                {info.level}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 시험 일정 테이블 */}
      <div className={cn('bg-white', isMobile ? 'px-4 py-14' : 'px-6 py-14')}>
        <div className="max-w-[1100px] mx-auto">
          <div className={cn('font-extrabold text-gray-900 mb-8', isMobile ? 'text-[22px]' : 'text-[28px]')}>
            시험 일정
          </div>

          {loading && (
            <div className="text-center p-10 text-gray-400 text-[15px]">불러오는 중...</div>
          )}

          {!loading && schedules.length === 0 && (
            <div className="text-center p-16 text-gray-400 text-[15px]">
              등록된 시험 일정이 없습니다.
            </div>
          )}

          {!loading && schedules.length > 0 && (
            <>
              <div className={cn(isMobile && 'overflow-x-auto')}>
                <table className={cn(
                  'w-full border-collapse bg-white rounded-xl overflow-hidden shadow-sm',
                  isMobile && 'min-w-[600px]'
                )}>
                  <thead>
                    <tr>
                      {['회차', '시험유형', '시험일', '접수마감', '잔여석', '상태'].map((h) => (
                        <th key={h} className="px-4 py-3.5 bg-gray-100 font-semibold text-[13px] text-gray-600 text-left border-b border-gray-200">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {schedules.map((sch) => {
                      const venues = sch.venues || [];
                      const totalSeats = venues.reduce((a, v) => a + (v.capacity || 0), 0);
                      const remaining = venues.reduce((a, v) => a + (v.remainingSeats || 0), 0);
                      const formatDate = (d: string) => {
                        try { return new Date(d).toLocaleDateString('ko-KR'); } catch { return d; }
                      };
                      return (
                        <tr
                          key={sch.id}
                          className={cn(
                            'transition-colors duration-150',
                            selectedId === sch.id ? 'bg-blue-50' : 'bg-white',
                            sch.status === 'OPEN' ? 'cursor-pointer' : 'cursor-default'
                          )}
                          onClick={() => handleRowClick(sch)}
                        >
                          <td className="px-4 py-3.5 text-sm text-gray-900 border-b border-gray-100">제{sch.examNumber}회</td>
                          <td className="px-4 py-3.5 text-sm text-gray-900 border-b border-gray-100">
                            {sch.examType === 'TOPIK_I' ? 'TOPIK I' : 'TOPIK II'}
                          </td>
                          <td className="px-4 py-3.5 text-sm text-gray-900 border-b border-gray-100">{formatDate(sch.examDate)}</td>
                          <td className="px-4 py-3.5 text-sm text-gray-900 border-b border-gray-100">{formatDate(sch.registrationEndDate)}</td>
                          <td className="px-4 py-3.5 text-sm text-gray-900 border-b border-gray-100">
                            {sch.status === 'OPEN' ? (totalSeats > 0 ? `${remaining}/${totalSeats}` : '접수 가능') : '-'}
                          </td>
                          <td className="px-4 py-3.5 text-sm border-b border-gray-100">
                            <span className={cn(
                              'inline-block px-3 py-1 rounded-xl text-xs font-semibold',
                              STATUS_COLORS[sch.status] || 'bg-gray-200',
                              (sch.status === 'OPEN' || sch.status === 'CLOSED') ? 'text-white' : 'text-gray-500'
                            )}>
                              {STATUS_LABELS[sch.status] || sch.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="text-center mt-8">
                <Button
                  className={cn(
                    'px-12 py-3.5 text-base font-bold rounded-lg',
                    selectedId ? 'bg-[#1565C0] hover:bg-[#1256A8] text-white cursor-pointer' : 'bg-blue-300 text-white cursor-not-allowed'
                  )}
                  onClick={handleApply}
                  disabled={!selectedId}
                >
                  접수하기
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 접수 안내 */}
      <div className={cn('max-w-[1100px] mx-auto', isMobile ? 'px-4 py-12' : 'px-6 py-12')}>
        <div className={cn('font-extrabold text-gray-900 mb-6', isMobile ? 'text-[22px]' : 'text-[28px]')}>
          접수 안내
        </div>
        {[
          '접수중인 시험을 선택한 후 "접수하기" 버튼을 클릭하세요.',
          '로그인 후 개인정보 입력 → 시험장 선택 → 사진 업로드 → 최종 확인 순서로 진행됩니다.',
          '접수 완료 후 마이페이지에서 수험표를 다운로드할 수 있습니다.',
          '접수 취소는 시험일 3일 전까지 가능합니다.',
        ].map((text, i) => (
          <div key={i} className={cn(
            'bg-white rounded-xl shadow-sm mb-3 text-[15px] text-gray-700 leading-relaxed',
            isMobile ? 'p-4' : 'px-7 py-5'
          )}>
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#1565C0] text-white text-xs font-bold mr-3">{i + 1}</span>
            {text}
          </div>
        ))}
      </div>

      <Footer />
    </div>
  );
}
