import { useState, useEffect, useRef } from 'react';
import type { ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import GlobalNavigationBar, { GNB_HEIGHT, GNB_HEIGHT_MOBILE } from '../../shared/components/GlobalNavigationBar';
import { useResponsive } from '../../shared/hooks/useResponsive';
import Footer from '../../shared/components/Footer';
import StepIndicator from '../components/StepIndicator';
import ExamSelectionPanel from '../components/ExamSelectionPanel';
import { useRegistrationStore } from '../store/registrationStore';
import type { ExamVenue } from '../types/registration.types';
import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';

// ─── Helpers ─────────────────────────────────────────────────────
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 80 }, (_, i) => currentYear - i);
const months = Array.from({ length: 12 }, (_, i) => i + 1);
const days = Array.from({ length: 31 }, (_, i) => i + 1);

const NATIONALITIES = [
  '대한민국', '중국', '일본', '베트남', '태국', '인도네시아',
  '미국', '캐나다', '프랑스', '독일', '영국', '러시아', '기타',
];
const STUDY_PERIODS = ['6개월 미만', '6개월~1년', '1~2년', '2~3년', '3~5년', '5년 이상'];

// ─── Component ───────────────────────────────────────────────────
export default function RegistrationFormPage() {
  const { isMobile, isTablet } = useResponsive();
  const compact = isMobile || isTablet;
  const navigate = useNavigate();
  const {
    selectedSchedule,
    currentStep,
    formData,
    setCurrentStep,
    updateFormData,
  } = useRegistrationStore();

  const [venues, setVenues] = useState<ExamVenue[]>([]);
  const [filteredVenues, setFilteredVenues] = useState<ExamVenue[]>([]);
  const [selectedRegion, setSelectedRegion] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load venues from selected schedule
  useEffect(() => {
    if (!selectedSchedule) {
      navigate('/registration/schedules');
      return;
    }
    // venues are already embedded in the schedule data
    const scheduleVenues = Array.isArray(selectedSchedule.venues)
      ? selectedSchedule.venues
      : typeof selectedSchedule.venues === 'string'
        ? JSON.parse(selectedSchedule.venues)
        : [];
    setVenues(scheduleVenues);
    setFilteredVenues(scheduleVenues);
  }, [selectedSchedule, navigate]);

  // Region filter
  useEffect(() => {
    if (!selectedRegion) {
      setFilteredVenues(venues);
    } else {
      setFilteredVenues(venues.filter((v) => v.region === selectedRegion));
    }
  }, [selectedRegion, venues]);

  const regions = [...new Set(venues.map((v) => v.region))];

  // ── Validation per step ────────────────────────────────────────
  const validateStep = (step: number): boolean => {
    setError('');
    const errors: Record<string, string> = {};
    if (step === 1) {
      if (!formData.englishName.trim()) errors.englishName = '영문 성명을 입력하세요';
      if (!formData.gender) errors.gender = '성별을 선택하세요';
      if (!formData.agreedToTerms) errors.agreedToTerms = '주의사항에 동의해야 합니다';
      setFieldErrors(errors);
      if (Object.keys(errors).length > 0) { setError('필수 항목을 확인해주세요.'); return false; }
      return true;
    }
    if (step === 2) {
      if (!formData.venueId) errors.venueId = '시험장을 선택하세요';
      setFieldErrors(errors);
      if (Object.keys(errors).length > 0) { setError('시험장을 선택하세요.'); return false; }
      return true;
    }
    if (step === 3) {
      if (!formData.phone.trim()) errors.phone = '연락처를 입력하세요';
      if (!formData.address.trim()) errors.address = '주소를 입력하세요';
      if (!formData.nationality) errors.nationality = '국적을 선택하세요';
      setFieldErrors(errors);
      if (Object.keys(errors).length > 0) { setError('필수 항목을 확인해주세요.'); return false; }
      return true;
    }
    setFieldErrors({});
    return true;
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) return;
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      // Step 4: go to confirmation
      navigate('/registration/confirm');
    }
  };

  const handleStepClick = (step: number) => {
    if (step < currentStep) setCurrentStep(step);
  };

  // ── Photo upload ───────────────────────────────────────────────
  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      updateFormData({ photoFile: file, photoPreview: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  // ── Render steps ───────────────────────────────────────────────
  const renderStep1 = () => (
    <>
      <div className="flex items-baseline">
        <div className="text-[22px] font-bold text-gray-900 mb-1">기본정보 입력</div>
        <span className="text-[13px] text-red-800 ml-2">* 표시는 필수 항목입니다.</span>
      </div>

      <table className="w-full border-collapse mt-6">
        <tbody>
          <tr className="border-b border-gray-100">
            <td className="w-[140px] px-5 py-4 text-sm font-semibold text-gray-900 bg-gray-50 align-middle">
              영문 성명 <span className="text-red-800 ml-0.5">*</span>
            </td>
            <td className="px-5 py-4 align-middle">
              <Input
                className={cn('w-full max-w-[400px] px-3.5 py-2.5 text-[15px] rounded-md', fieldErrors.englishName && 'border-red-800')}
                value={formData.englishName}
                onChange={(e) => { updateFormData({ englishName: e.target.value.toUpperCase() }); setFieldErrors(prev => ({ ...prev, englishName: '' })); }}
                placeholder="영문 성명 입력"
              />
              <div className={cn('text-xs mt-1', fieldErrors.englishName ? 'text-red-800' : 'text-gray-400')}>
                {fieldErrors.englishName || '여권/신분증에 기재된 영문 성명 (대문자 자동 변환)'}
              </div>
            </td>
          </tr>
          <tr className="border-b border-gray-100">
            <td className="w-[140px] px-5 py-4 text-sm font-semibold text-gray-900 bg-gray-50 align-middle">
              생년월일 <span className="text-red-800 ml-0.5">*</span>
            </td>
            <td className="px-5 py-4 align-middle">
              <select
                className="px-3.5 py-2.5 text-[15px] border border-gray-300 rounded-md outline-none bg-white mr-2 min-w-[80px]"
                value={formData.birthYear}
                onChange={(e) => updateFormData({ birthYear: Number(e.target.value) })}
              >
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <select
                className="px-3.5 py-2.5 text-[15px] border border-gray-300 rounded-md outline-none bg-white mr-2 min-w-[80px]"
                value={formData.birthMonth}
                onChange={(e) => updateFormData({ birthMonth: Number(e.target.value) })}
              >
                {months.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <select
                className="px-3.5 py-2.5 text-[15px] border border-gray-300 rounded-md outline-none bg-white min-w-[80px]"
                value={formData.birthDay}
                onChange={(e) => updateFormData({ birthDay: Number(e.target.value) })}
              >
                {days.map((d) => (
                  <option key={d} value={d}>{String(d).padStart(2, '0')}</option>
                ))}
              </select>
            </td>
          </tr>
          <tr className="border-b border-gray-100">
            <td className="w-[140px] px-5 py-4 text-sm font-semibold text-gray-900 bg-gray-50 align-middle">
              성별 <span className="text-red-800 ml-0.5">*</span>
            </td>
            <td className="px-5 py-4 align-middle">
              <div className="flex gap-0">
                <button
                  type="button"
                  className={cn(
                    'px-7 py-2.5 text-sm font-semibold border border-gray-300 cursor-pointer transition-all rounded-l-md border-r-0',
                    formData.gender === 'MALE' ? 'bg-green-500 text-white' : 'bg-white text-gray-700'
                  )}
                  onClick={() => { updateFormData({ gender: 'MALE' }); setFieldErrors(prev => ({ ...prev, gender: '' })); }}
                >
                  남자
                </button>
                <button
                  type="button"
                  className={cn(
                    'px-7 py-2.5 text-sm font-semibold border border-gray-300 cursor-pointer transition-all rounded-r-md',
                    formData.gender === 'FEMALE' ? 'bg-green-500 text-white' : 'bg-white text-gray-700'
                  )}
                  onClick={() => { updateFormData({ gender: 'FEMALE' }); setFieldErrors(prev => ({ ...prev, gender: '' })); }}
                >
                  여자
                </button>
              </div>
              {fieldErrors.gender && <div className="text-xs text-red-800 mt-1">{fieldErrors.gender}</div>}
            </td>
          </tr>
        </tbody>
      </table>

      <div className="mt-6 px-5 py-4 text-[13px] leading-[1.7] text-red-800 font-medium">
        1. 영문 성명은 여권, 외국인등록증 등 규정 신분증에 기재된 성명과 동일하게 입력해 주시기 바랍니다. 만약 규정 신분증 영문 성명과 다를 경우 응시가 불가합니다.
        <br />
        2. 한국어능력시험 원서접수 시 작성한 지원자 정보 중 기본정보(영문 성명/생년월일/성별)는 변경이 불가합니다.
        <br />
        3. 매크로 프로그램을 사용하여 비정상적이거나 부정한 방법으로 원서를 제출한 것으로 확인된 경우, 해당 회차 접수가 취소될 수 있으며 한국어능력시험 응시에 불이익을 받을 수 있음을 확인합니다.
      </div>

      <label className="flex items-center gap-2 mt-3 text-sm text-green-600 font-semibold cursor-pointer">
        <input
          type="checkbox"
          checked={formData.agreedToTerms}
          onChange={(e) => { updateFormData({ agreedToTerms: e.target.checked }); setFieldErrors(prev => ({ ...prev, agreedToTerms: '' })); }}
        />
        <span>위 내용에 동의합니다</span>
      </label>
      {fieldErrors.agreedToTerms && <div className="text-xs text-red-800 mt-1">{fieldErrors.agreedToTerms}</div>}
    </>
  );

  const renderStep2 = () => (
    <>
      <div className="text-[22px] font-bold text-gray-900 mb-1">시험장 선택</div>

      <div className="mt-5">
        <select
          className="px-3.5 py-2.5 text-[15px] border border-gray-300 rounded-md outline-none bg-white mb-4 min-w-[200px]"
          value={selectedRegion}
          onChange={(e) => setSelectedRegion(e.target.value)}
        >
          <option value="">전체 지역</option>
          {regions.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="px-4 py-3 bg-gray-100 font-semibold text-[13px] text-gray-600 text-left border-b border-gray-200">시험장</th>
            <th className="px-4 py-3 bg-gray-100 font-semibold text-[13px] text-gray-600 text-left border-b border-gray-200">주소</th>
            <th className="px-4 py-3 bg-gray-100 font-semibold text-[13px] text-gray-600 text-left border-b border-gray-200">잔여석</th>
            <th className="px-4 py-3 bg-gray-100 font-semibold text-[13px] text-gray-600 text-left border-b border-gray-200">선택</th>
          </tr>
        </thead>
        <tbody>
          {filteredVenues.map((v) => (
            <tr
              key={v.id}
              className={cn(
                'cursor-pointer',
                formData.venueId === v.id ? 'bg-green-50' : 'bg-white'
              )}
              onClick={() => updateFormData({ venueId: v.id, venueName: v.name })}
            >
              <td className="px-4 py-3 text-sm text-gray-900 border-b border-gray-100">{v.name}</td>
              <td className="px-4 py-3 text-sm text-gray-900 border-b border-gray-100">{v.address}</td>
              <td className="px-4 py-3 text-sm text-gray-900 border-b border-gray-100">{v.remainingSeats}/{v.capacity}</td>
              <td className="px-4 py-3 text-sm text-gray-900 border-b border-gray-100">
                <button
                  type="button"
                  className={cn(
                    'px-5 py-1.5 text-[13px] font-semibold rounded-md cursor-pointer',
                    formData.venueId === v.id
                      ? 'bg-green-500 text-white border-none'
                      : 'bg-white text-[#1565C0] border border-[#1565C0]'
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    updateFormData({ venueId: v.id, venueName: v.name });
                  }}
                >
                  {formData.venueId === v.id ? '선택됨' : '선택'}
                </button>
              </td>
            </tr>
          ))}
          {filteredVenues.length === 0 && (
            <tr>
              <td className="px-4 py-3 text-sm text-gray-400 text-center border-b border-gray-100" colSpan={4}>
                해당 지역에 시험장이 없습니다.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {fieldErrors.venueId && <div className="text-xs text-red-800 mt-3">{fieldErrors.venueId}</div>}
    </>
  );

  const renderStep3 = () => (
    <>
      <div className="text-[22px] font-bold text-gray-900 mb-1">추가 정보 입력</div>

      <table className="w-full border-collapse mt-6">
        <tbody>
          <tr className="border-b border-gray-100">
            <td className="w-[140px] px-5 py-4 text-sm font-semibold text-gray-900 bg-gray-50 align-middle">
              연락처 <span className="text-red-800 ml-0.5">*</span>
            </td>
            <td className="px-5 py-4 align-middle">
              <Input
                className={cn('w-full max-w-[400px] px-3.5 py-2.5 text-[15px] rounded-md', fieldErrors.phone && 'border-red-800')}
                value={formData.phone}
                onChange={(e) => { updateFormData({ phone: e.target.value.replace(/[^\d-]/g, '') }); setFieldErrors(prev => ({ ...prev, phone: '' })); }}
                placeholder="010-1234-5678"
              />
              <div className={cn('text-xs mt-1', fieldErrors.phone ? 'text-red-800' : 'text-gray-400')}>
                {fieldErrors.phone || '숫자와 하이픈(-)만 입력 가능'}
              </div>
            </td>
          </tr>
          <tr className="border-b border-gray-100">
            <td className="w-[140px] px-5 py-4 text-sm font-semibold text-gray-900 bg-gray-50 align-middle">
              주소 <span className="text-red-800 ml-0.5">*</span>
            </td>
            <td className="px-5 py-4 align-middle">
              <Input
                className={cn('w-full max-w-[400px] px-3.5 py-2.5 text-[15px] rounded-md', fieldErrors.address && 'border-red-800')}
                value={formData.address}
                onChange={(e) => { updateFormData({ address: e.target.value }); setFieldErrors(prev => ({ ...prev, address: '' })); }}
                placeholder="주소 입력"
              />
              {fieldErrors.address && <div className="text-xs text-red-800 mt-1">{fieldErrors.address}</div>}
            </td>
          </tr>
          <tr className="border-b border-gray-100">
            <td className="w-[140px] px-5 py-4 text-sm font-semibold text-gray-900 bg-gray-50 align-middle">
              국적 <span className="text-red-800 ml-0.5">*</span>
            </td>
            <td className="px-5 py-4 align-middle">
              <select
                className={cn('px-3.5 py-2.5 text-[15px] border border-gray-300 rounded-md outline-none bg-white mr-2 min-w-[80px]', fieldErrors.nationality && 'border-red-800')}
                value={formData.nationality}
                onChange={(e) => { updateFormData({ nationality: e.target.value }); setFieldErrors(prev => ({ ...prev, nationality: '' })); }}
              >
                <option value="">선택</option>
                {NATIONALITIES.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              {fieldErrors.nationality && <div className="text-xs text-red-800 mt-1">{fieldErrors.nationality}</div>}
            </td>
          </tr>
          <tr className="border-b border-gray-100">
            <td className="w-[140px] px-5 py-4 text-sm font-semibold text-gray-900 bg-gray-50 align-middle">한국어 학습기간</td>
            <td className="px-5 py-4 align-middle">
              <select
                className="px-3.5 py-2.5 text-[15px] border border-gray-300 rounded-md outline-none bg-white mr-2 min-w-[80px]"
                value={formData.studyPeriod}
                onChange={(e) => updateFormData({ studyPeriod: e.target.value })}
              >
                <option value="">선택</option>
                {STUDY_PERIODS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </td>
          </tr>
        </tbody>
      </table>

      <div className="mt-7">
        <div className="text-base font-bold text-gray-900 mb-2">
          사진 업로드
        </div>
        <div className="text-[13px] text-gray-400 mb-3">
          3x4cm 규격의 증명사진을 업로드하세요.
        </div>
        <div className="flex gap-5 items-start mt-5">
          <div className="w-[120px] h-[160px] border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden">
            {formData.photoPreview ? (
              <img src={formData.photoPreview} alt="사진 미리보기" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs text-gray-300">미리보기</span>
            )}
          </div>
          <div>
            <Button
              type="button"
              variant="outline"
              className="px-6 py-2.5 text-sm font-semibold border-[#1565C0] text-[#1565C0]"
              onClick={() => fileInputRef.current?.click()}
            >
              파일 선택
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoChange}
            />
            <div className="text-xs text-gray-400 mt-2 leading-relaxed">
              - JPG, PNG 형식<br />
              - 최대 2MB<br />
              - 최근 6개월 이내 촬영
            </div>
          </div>
        </div>
      </div>
    </>
  );

  const renderStep4 = () => (
    <>
      <div className="text-[22px] font-bold text-gray-900 mb-1">입력 내용 확인</div>
      <div className="text-sm text-gray-600 mt-2 mb-6">
        아래 내용을 확인한 후 접수하기 버튼을 눌러주세요.
      </div>

      <table className="w-full border-collapse">
        <tbody>
          <tr>
            <td className="w-[140px] px-5 py-3.5 text-sm font-semibold text-gray-600 bg-gray-50 border-b border-gray-100">시험</td>
            <td className="px-5 py-3.5 text-[15px] text-gray-900 border-b border-gray-100">
              {selectedSchedule
                ? `${selectedSchedule.examName} (${selectedSchedule.examType === 'TOPIK_I' ? 'TOPIK I' : 'TOPIK II'})`
                : '-'}
            </td>
          </tr>
          <tr>
            <td className="w-[140px] px-5 py-3.5 text-sm font-semibold text-gray-600 bg-gray-50 border-b border-gray-100">영문 성명</td>
            <td className="px-5 py-3.5 text-[15px] text-gray-900 border-b border-gray-100">{formData.englishName || '-'}</td>
          </tr>
          <tr>
            <td className="w-[140px] px-5 py-3.5 text-sm font-semibold text-gray-600 bg-gray-50 border-b border-gray-100">생년월일</td>
            <td className="px-5 py-3.5 text-[15px] text-gray-900 border-b border-gray-100">
              {formData.birthYear}-{String(formData.birthMonth).padStart(2, '0')}-{String(formData.birthDay).padStart(2, '0')}
            </td>
          </tr>
          <tr>
            <td className="w-[140px] px-5 py-3.5 text-sm font-semibold text-gray-600 bg-gray-50 border-b border-gray-100">성별</td>
            <td className="px-5 py-3.5 text-[15px] text-gray-900 border-b border-gray-100">
              {formData.gender === 'MALE' ? '남자' : formData.gender === 'FEMALE' ? '여자' : '-'}
            </td>
          </tr>
          <tr>
            <td className="w-[140px] px-5 py-3.5 text-sm font-semibold text-gray-600 bg-gray-50 border-b border-gray-100">시험장</td>
            <td className="px-5 py-3.5 text-[15px] text-gray-900 border-b border-gray-100">{formData.venueName || '-'}</td>
          </tr>
          <tr>
            <td className="w-[140px] px-5 py-3.5 text-sm font-semibold text-gray-600 bg-gray-50 border-b border-gray-100">연락처</td>
            <td className="px-5 py-3.5 text-[15px] text-gray-900 border-b border-gray-100">{formData.phone || '-'}</td>
          </tr>
          <tr>
            <td className="w-[140px] px-5 py-3.5 text-sm font-semibold text-gray-600 bg-gray-50 border-b border-gray-100">주소</td>
            <td className="px-5 py-3.5 text-[15px] text-gray-900 border-b border-gray-100">{formData.address || '-'}</td>
          </tr>
          <tr>
            <td className="w-[140px] px-5 py-3.5 text-sm font-semibold text-gray-600 bg-gray-50 border-b border-gray-100">국적</td>
            <td className="px-5 py-3.5 text-[15px] text-gray-900 border-b border-gray-100">{formData.nationality || '-'}</td>
          </tr>
          <tr>
            <td className="w-[140px] px-5 py-3.5 text-sm font-semibold text-gray-600 bg-gray-50 border-b border-gray-100">한국어 학습기간</td>
            <td className="px-5 py-3.5 text-[15px] text-gray-900 border-b border-gray-100">{formData.studyPeriod || '-'}</td>
          </tr>
          <tr>
            <td className="w-[140px] px-5 py-3.5 text-sm font-semibold text-gray-600 bg-gray-50 border-b border-gray-100">사진</td>
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

      <Button
        className="mt-6 px-12 py-3.5 text-base font-bold bg-[#1565C0] hover:bg-[#1256A8] text-white rounded-lg"
        onClick={handleNext}
      >
        접수하기
      </Button>
    </>
  );

  const stepContent = [renderStep1, renderStep2, renderStep3, renderStep4];

  const panelButtonLabel = currentStep === 4 ? '접수하기' : '다음 단계로';
  const panelButtonDisabled =
    (currentStep === 1 && (!formData.englishName || !formData.gender || !formData.agreedToTerms)) ||
    (currentStep === 2 && !formData.venueId);

  return (
    <div className="min-h-screen bg-gray-100 font-sans" style={{ paddingTop: compact ? GNB_HEIGHT_MOBILE : GNB_HEIGHT }}>
      <GlobalNavigationBar />
      <StepIndicator currentStep={currentStep} onStepClick={handleStepClick} />

      <div className={cn(
        'flex max-w-[1120px] mx-auto gap-8',
        isMobile ? 'flex-col px-4 py-6' : 'flex-row px-6 py-8'
      )}>
        <div className={cn('flex-1 bg-white rounded-xl shadow-sm', isMobile ? 'p-5' : 'p-8')}>
          {stepContent[currentStep - 1]()}
          {error && <div className="mt-3 text-[13px] text-red-800">{error}</div>}
        </div>

        {!isMobile && <ExamSelectionPanel
          schedule={selectedSchedule}
          venueName={currentStep >= 2 ? formData.venueName : undefined}
          buttonLabel={panelButtonLabel}
          onButtonClick={handleNext}
          buttonDisabled={panelButtonDisabled}
        />}
        {isMobile && (
          <Button
            className={cn(
              'w-full mt-4 px-12 py-3.5 text-base font-bold rounded-lg',
              panelButtonDisabled ? 'bg-blue-300 cursor-not-allowed' : 'bg-[#1565C0] hover:bg-[#1256A8] text-white'
            )}
            onClick={handleNext}
            disabled={panelButtonDisabled}
          >
            {panelButtonLabel}
          </Button>
        )}
      </div>
      <Footer />
    </div>
  );
}
