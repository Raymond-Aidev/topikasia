import { useNavigate } from 'react-router-dom';
import GlobalNavigationBar, { GNB_HEIGHT, GNB_HEIGHT_MOBILE } from '../../shared/components/GlobalNavigationBar';
import { useResponsive } from '../../shared/hooks/useResponsive';
import Footer from '../../shared/components/Footer';
import { useRegistrationStore } from '../store/registrationStore';
import { downloadTicket } from '../api/registrationApi';
import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/button';

function formatDate(raw?: string): string {
  if (!raw) return '-';
  return raw.split('T')[0];
}

export default function RegistrationCompletePage() {
  const { isMobile, isTablet } = useResponsive();
  const compact = isMobile || isTablet;
  const navigate = useNavigate();
  const { currentRegistration, selectedSchedule, formData, resetForm } = useRegistrationStore();

  const isApproved = currentRegistration?.status === 'APPROVED';
  const registrationNumber = (currentRegistration as any)?.registrationNumber;

  const handleDownloadTicket = async () => {
    if (!currentRegistration) return;
    try {
      const blob = await downloadTicket(currentRegistration.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `수험표_${currentRegistration.registrationNumber || 'ticket'}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('수험표 다운로드에 실패했습니다. 마이페이지에서 다시 시도해주세요.');
    }
  };

  const handleMyPage = () => {
    resetForm();
    navigate('/registration/mypage');
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans" style={{ paddingTop: compact ? GNB_HEIGHT_MOBILE : GNB_HEIGHT }}>
      <GlobalNavigationBar />

      <div className={cn('mx-auto', isMobile ? 'max-w-full px-4 py-8' : 'max-w-[560px] px-6 py-16')}>
        <div className={cn('bg-white rounded-2xl shadow-lg text-center', isMobile ? 'px-5 py-8' : 'px-10 py-12')}>
          <div className="w-[72px] h-[72px] rounded-full bg-green-50 flex items-center justify-center mx-auto mb-6 text-4xl text-green-500">
            &#10003;
          </div>
          <div className="text-[26px] font-extrabold text-gray-900 mb-3">접수가 완료되었습니다</div>
          <div className="text-[15px] text-gray-600 mb-8 leading-relaxed">
            {isApproved ? (
              <>시험 접수가 승인되었습니다.<br />수험표를 다운로드하세요.</>
            ) : (
              <>접수가 접수되었습니다.<br />관리자 승인 후 수험번호가 발급됩니다.</>
            )}
          </div>

          <table className="w-full border-collapse mb-8 text-left">
            <tbody>
              {isApproved && registrationNumber ? (
                <tr>
                  <td className="px-4 py-2.5 text-sm font-semibold text-gray-500 w-[120px]">수험번호</td>
                  <td className="px-4 py-2.5 text-[15px] text-gray-900 font-bold font-mono tracking-wider">
                    {registrationNumber}
                  </td>
                </tr>
              ) : (
                <tr>
                  <td className="px-4 py-2.5 text-sm font-semibold text-gray-500 w-[120px]">접수상태</td>
                  <td className="px-4 py-2.5 text-[15px] text-orange-600 font-medium">
                    승인 대기중 (수험번호는 승인 후 발급)
                  </td>
                </tr>
              )}
              <tr>
                <td className="px-4 py-2.5 text-sm font-semibold text-gray-500 w-[120px]">시험</td>
                <td className="px-4 py-2.5 text-[15px] text-gray-900 font-medium">
                  {selectedSchedule
                    ? `${selectedSchedule.examName} (${selectedSchedule.examType === 'TOPIK_I' ? 'TOPIK I' : 'TOPIK II'})`
                    : '-'}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 text-sm font-semibold text-gray-500 w-[120px]">시험일</td>
                <td className="px-4 py-2.5 text-[15px] text-gray-900 font-medium">
                  {formatDate(selectedSchedule?.examDate)}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 text-sm font-semibold text-gray-500 w-[120px]">시험장</td>
                <td className="px-4 py-2.5 text-[15px] text-gray-900 font-medium">
                  {formData.venueName || currentRegistration?.venue?.name || '-'}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 text-sm font-semibold text-gray-500 w-[120px]">상태</td>
                <td className="px-4 py-2.5 text-[15px] text-gray-900 font-medium">
                  <span className={cn(
                    'inline-block px-3 py-1 rounded-xl text-xs font-semibold text-white',
                    isApproved ? 'bg-green-500' : 'bg-orange-500'
                  )}>
                    {isApproved ? '승인완료' : '승인대기'}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>

          <div className="flex gap-4 justify-center">
            {isApproved ? (
              <Button
                className="px-8 py-3.5 text-[15px] font-bold bg-green-500 hover:bg-green-600 text-white rounded-lg"
                onClick={handleDownloadTicket}
              >
                수험표 다운로드
              </Button>
            ) : (
              <div className="text-sm text-gray-400 py-3">
                수험표는 승인 후 마이페이지에서 다운로드할 수 있습니다.
              </div>
            )}
            <Button
              variant="outline"
              className="px-8 py-3.5 text-[15px] font-semibold text-[#1565C0] border-[#1565C0] rounded-lg"
              onClick={handleMyPage}
            >
              마이페이지
            </Button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
