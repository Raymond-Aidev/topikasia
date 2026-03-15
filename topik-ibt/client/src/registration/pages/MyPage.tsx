import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GlobalNavigationBar, { GNB_HEIGHT, GNB_HEIGHT_MOBILE } from '../../shared/components/GlobalNavigationBar';
import { useResponsive } from '../../shared/hooks/useResponsive';
import Footer from '../../shared/components/Footer';
import { useRegistrationStore } from '../store/registrationStore';
import { fetchMyRegistrations, downloadTicket, cancelRegistration } from '../api/registrationApi';
import type { Registration } from '../types/registration.types';
import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/button';

const STATUS_LABELS: Record<string, string> = {
  PENDING: '접수대기',
  APPROVED: '접수완료',
  REJECTED: '반려',
  CANCELLED: '취소됨',
};

const STATUS_BG: Record<string, string> = {
  APPROVED: 'bg-green-500',
  PENDING: 'bg-orange-500',
  REJECTED: 'bg-red-500',
  CANCELLED: 'bg-gray-400',
};

export default function MyPage() {
  const { isMobile, isTablet } = useResponsive();
  const compact = isMobile || isTablet;
  const navigate = useNavigate();
  const { setMyRegistrations, resetForm } = useRegistrationStore();

  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLoginInfo, setShowLoginInfo] = useState<string | null>(null);

  useEffect(() => {
    fetchMyRegistrations()
      .then((data) => {
        setRegistrations(data);
        setMyRegistrations(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [setMyRegistrations]);

  const handleDownload = async (reg: Registration) => {
    try {
      const blob = await downloadTicket(reg.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `수험표_${reg.registrationNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('수험표 다운로드에 실패했습니다.');
    }
  };

  const handleCancel = async (reg: Registration) => {
    if (!confirm('접수를 취소하시겠습니까? 취소 후 복구할 수 없습니다.')) return;
    try {
      await cancelRegistration(reg.id);
      setRegistrations((prev) => prev.map((r) => r.id === reg.id ? { ...r, status: 'CANCELLED' } : r));
      alert('접수가 취소되었습니다.');
    } catch {
      alert('접수 취소에 실패했습니다.');
    }
  };

  const handleNewRegistration = () => {
    resetForm();
    navigate('/registration/schedules');
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans" style={{ paddingTop: compact ? GNB_HEIGHT_MOBILE : GNB_HEIGHT }}>
      <GlobalNavigationBar />

      <div className={cn('max-w-[1000px] mx-auto', isMobile ? 'px-4 py-6' : 'px-6 py-8')}>
        <div className="text-2xl font-bold text-gray-900 mb-6">내 접수 내역</div>

        {loading && <div className="text-center p-10 text-gray-400 text-[15px]">불러오는 중...</div>}

        {!loading && registrations.length === 0 && (
          <div className="text-center p-16 text-gray-400 text-[15px]">접수 내역이 없습니다.</div>
        )}

        {!loading && registrations.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className={cn(isMobile && 'overflow-x-auto')}>
            <table className={cn('w-full border-collapse', isMobile && 'min-w-[700px]')}>
              <thead>
                <tr>
                  <th className="px-4 py-3.5 bg-gray-100 font-semibold text-[13px] text-gray-600 text-left border-b border-gray-200">접수번호</th>
                  <th className="px-4 py-3.5 bg-gray-100 font-semibold text-[13px] text-gray-600 text-left border-b border-gray-200">시험</th>
                  <th className="px-4 py-3.5 bg-gray-100 font-semibold text-[13px] text-gray-600 text-left border-b border-gray-200">시험일</th>
                  <th className="px-4 py-3.5 bg-gray-100 font-semibold text-[13px] text-gray-600 text-left border-b border-gray-200">시험장</th>
                  <th className="px-4 py-3.5 bg-gray-100 font-semibold text-[13px] text-gray-600 text-left border-b border-gray-200">영문 성명</th>
                  <th className="px-4 py-3.5 bg-gray-100 font-semibold text-[13px] text-gray-600 text-left border-b border-gray-200">상태</th>
                  <th className="px-4 py-3.5 bg-gray-100 font-semibold text-[13px] text-gray-600 text-left border-b border-gray-200"></th>
                </tr>
              </thead>
              <tbody>
                {registrations.map((reg) => (
                  <React.Fragment key={reg.id}>
                  <tr>
                    <td className="px-4 py-3.5 text-sm text-gray-900 border-b border-gray-100">{reg.registrationNumber}</td>
                    <td className="px-4 py-3.5 text-sm text-gray-900 border-b border-gray-100">
                      {reg.examSchedule
                        ? `${reg.examSchedule.examName}`
                        : '-'}
                    </td>
                    <td className="px-4 py-3.5 text-sm text-gray-900 border-b border-gray-100">{reg.examSchedule?.examDate || '-'}</td>
                    <td className="px-4 py-3.5 text-sm text-gray-900 border-b border-gray-100">{reg.venue?.name || '-'}</td>
                    <td className="px-4 py-3.5 text-sm text-gray-900 border-b border-gray-100">{reg.englishName}</td>
                    <td className="px-4 py-3.5 text-sm border-b border-gray-100">
                      <span className={cn(
                        'inline-block px-3 py-1 rounded-xl text-xs font-semibold text-white',
                        STATUS_BG[reg.status] || 'bg-gray-400'
                      )}>
                        {STATUS_LABELS[reg.status] || reg.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-sm border-b border-gray-100">
                      {reg.status === 'APPROVED' && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <Button
                            className="px-4 py-1.5 text-xs font-semibold bg-[#1565C0] hover:bg-[#1256A8] text-white rounded-md"
                            onClick={() => {
                              if ((reg as any).examineeLoginId) {
                                setShowLoginInfo(showLoginInfo === reg.id ? null : reg.id);
                              } else {
                                navigate('/login');
                              }
                            }}
                          >
                            응시하기
                          </Button>
                          <Button
                            variant="secondary"
                            className="px-4 py-1.5 text-xs font-semibold text-[#1565C0] bg-blue-50 hover:bg-blue-100 rounded-md"
                            onClick={() => handleDownload(reg)}
                          >
                            수험표
                          </Button>
                        </div>
                      )}
                      {reg.status === 'PENDING' && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs text-gray-400">승인 대기중</span>
                          <Button
                            variant="secondary"
                            className="px-3 py-1 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-md"
                            onClick={() => handleCancel(reg)}
                          >
                            취소
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                  {showLoginInfo === reg.id && (reg as any).examineeLoginId && (
                  <tr key={`${reg.id}-info`}>
                    <td colSpan={7} className="px-4 py-4 bg-blue-50 border-b border-gray-100">
                      <div className="flex items-center gap-6 text-sm">
                        <div>
                          <span className="text-gray-500 font-medium">수험번호: </span>
                          <span className="font-bold text-gray-900 font-mono tracking-wider">{(reg as any).examineeLoginId}</span>
                        </div>
                        <div className="text-gray-400 text-xs">
                          이 수험번호로 시험에 입장하세요
                        </div>
                        <Button
                          className="px-4 py-1.5 text-xs font-bold bg-[#1565C0] hover:bg-[#1256A8] text-white rounded-md ml-auto"
                          onClick={() => navigate('/login')}
                        >
                          시험 입장
                        </Button>
                      </div>
                    </td>
                  </tr>
                  )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        )}

        <Button
          className="mt-6 px-8 py-3 text-[15px] font-bold bg-[#1565C0] hover:bg-[#1256A8] text-white rounded-lg"
          onClick={handleNewRegistration}
        >
          새 시험 접수하기
        </Button>
      </div>
      <Footer />
    </div>
  );
}
