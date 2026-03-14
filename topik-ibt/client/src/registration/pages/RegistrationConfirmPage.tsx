import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GlobalNavigationBar, { GNB_HEIGHT, GNB_HEIGHT_MOBILE } from '../../shared/components/GlobalNavigationBar';
import { useResponsive } from '../../shared/hooks/useResponsive';
import Footer from '../../shared/components/Footer';
import { useRegistrationStore } from '../store/registrationStore';
import { applyRegistration } from '../api/registrationApi';
import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/button';
import { Alert, AlertDescription } from '../../components/ui/alert';

export default function RegistrationConfirmPage() {
  const { isMobile, isTablet } = useResponsive();
  const compact = isMobile || isTablet;
  const navigate = useNavigate();
  const { selectedSchedule, formData, setCurrentStep, setCurrentRegistration } =
    useRegistrationStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEdit = () => {
    setCurrentStep(1);
    navigate('/registration/apply');
  };

  const handleSubmit = async () => {
    if (!selectedSchedule || !formData.gender) return;

    setLoading(true);
    setError('');
    try {
      const result = await applyRegistration({
        scheduleId: selectedSchedule.id,
        examType: selectedSchedule.examType as 'TOPIK_I' | 'TOPIK_II',
        venueId: formData.venueId,
        venueName: formData.venueName,
        englishName: formData.englishName,
        birthYear: formData.birthYear,
        birthMonth: formData.birthMonth,
        birthDay: formData.birthDay,
        gender: formData.gender,
        phone: formData.phone,
        address: formData.address,
        nationality: formData.nationality,
        studyPeriod: formData.studyPeriod,
        photoFile: formData.photoFile || undefined,
      });
      setCurrentRegistration(result);
      navigate('/registration/complete');
    } catch (err: any) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.message;
      if (status === 403 && msg?.includes('응시대상')) {
        alert('응시대상이 아닙니다');
      } else {
        setError(msg || '접수 신청에 실패했습니다. 잠시 후 다시 시도하세요.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans" style={{ paddingTop: compact ? GNB_HEIGHT_MOBILE : GNB_HEIGHT }}>
      <GlobalNavigationBar />

      <div className={cn('mx-auto', isMobile ? 'max-w-full px-4 py-6' : 'max-w-[720px] px-6 py-10')}>
        <div className={cn('bg-white rounded-xl shadow-sm', isMobile ? 'p-5' : 'p-8')}>
          <div className="text-2xl font-bold text-gray-900 mb-2">접수 확인</div>
          <div className="text-sm text-gray-600 mb-7">
            아래 내용을 최종 확인한 후 제출 버튼을 눌러주세요.
          </div>

          <table className="w-full border-collapse">
            <tbody>
              <tr>
                <td className="w-[160px] px-5 py-3.5 text-sm font-semibold text-gray-600 bg-gray-50 border-b border-gray-100">시험</td>
                <td className="px-5 py-3.5 text-[15px] text-gray-900 border-b border-gray-100">
                  {selectedSchedule
                    ? `${selectedSchedule.examName} (${selectedSchedule.examType === 'TOPIK_I' ? 'TOPIK I' : 'TOPIK II'})`
                    : '-'}
                </td>
              </tr>
              <tr>
                <td className="w-[160px] px-5 py-3.5 text-sm font-semibold text-gray-600 bg-gray-50 border-b border-gray-100">시험일</td>
                <td className="px-5 py-3.5 text-[15px] text-gray-900 border-b border-gray-100">{selectedSchedule?.examDate || '-'}</td>
              </tr>
              <tr>
                <td className="w-[160px] px-5 py-3.5 text-sm font-semibold text-gray-600 bg-gray-50 border-b border-gray-100">영문 성명</td>
                <td className="px-5 py-3.5 text-[15px] text-gray-900 border-b border-gray-100">{formData.englishName}</td>
              </tr>
              <tr>
                <td className="w-[160px] px-5 py-3.5 text-sm font-semibold text-gray-600 bg-gray-50 border-b border-gray-100">생년월일</td>
                <td className="px-5 py-3.5 text-[15px] text-gray-900 border-b border-gray-100">
                  {formData.birthYear}-{String(formData.birthMonth).padStart(2, '0')}-{String(formData.birthDay).padStart(2, '0')}
                </td>
              </tr>
              <tr>
                <td className="w-[160px] px-5 py-3.5 text-sm font-semibold text-gray-600 bg-gray-50 border-b border-gray-100">성별</td>
                <td className="px-5 py-3.5 text-[15px] text-gray-900 border-b border-gray-100">
                  {formData.gender === 'MALE' ? '남자' : formData.gender === 'FEMALE' ? '여자' : '-'}
                </td>
              </tr>
              <tr>
                <td className="w-[160px] px-5 py-3.5 text-sm font-semibold text-gray-600 bg-gray-50 border-b border-gray-100">시험장</td>
                <td className="px-5 py-3.5 text-[15px] text-gray-900 border-b border-gray-100">{formData.venueName}</td>
              </tr>
              <tr>
                <td className="w-[160px] px-5 py-3.5 text-sm font-semibold text-gray-600 bg-gray-50 border-b border-gray-100">연락처</td>
                <td className="px-5 py-3.5 text-[15px] text-gray-900 border-b border-gray-100">{formData.phone}</td>
              </tr>
              <tr>
                <td className="w-[160px] px-5 py-3.5 text-sm font-semibold text-gray-600 bg-gray-50 border-b border-gray-100">주소</td>
                <td className="px-5 py-3.5 text-[15px] text-gray-900 border-b border-gray-100">{formData.address}</td>
              </tr>
              <tr>
                <td className="w-[160px] px-5 py-3.5 text-sm font-semibold text-gray-600 bg-gray-50 border-b border-gray-100">국적</td>
                <td className="px-5 py-3.5 text-[15px] text-gray-900 border-b border-gray-100">{formData.nationality}</td>
              </tr>
              <tr>
                <td className="w-[160px] px-5 py-3.5 text-sm font-semibold text-gray-600 bg-gray-50 border-b border-gray-100">한국어 학습기간</td>
                <td className="px-5 py-3.5 text-[15px] text-gray-900 border-b border-gray-100">{formData.studyPeriod || '-'}</td>
              </tr>
              <tr>
                <td className="w-[160px] px-5 py-3.5 text-sm font-semibold text-gray-600 bg-gray-50 border-b border-gray-100">사진</td>
                <td className="px-5 py-3.5 text-[15px] text-gray-900 border-b border-gray-100">
                  {formData.photoPreview ? (
                    <img
                      src={formData.photoPreview}
                      alt="증명사진"
                      className="w-[60px] h-[80px] object-cover rounded"
                    />
                  ) : (
                    '미첨부'
                  )}
                </td>
              </tr>
            </tbody>
          </table>

          <div className="flex gap-4 mt-7 justify-center">
            <Button
              variant="outline"
              className="px-10 py-3.5 text-base font-semibold text-gray-600 border-gray-300 rounded-lg"
              onClick={handleEdit}
            >
              수정하기
            </Button>
            <Button
              className={cn(
                'px-10 py-3.5 text-base font-bold rounded-lg',
                loading ? 'bg-blue-300 cursor-not-allowed' : 'bg-[#1565C0] hover:bg-[#1256A8] text-white'
              )}
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? '제출 중...' : '최종 제출'}
            </Button>
          </div>

          {error && (
            <Alert variant="destructive" className="mt-4 bg-red-50 border-red-200 text-center">
              <AlertDescription className="text-red-800 text-[13px]">{error}</AlertDescription>
            </Alert>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
