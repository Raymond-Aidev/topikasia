import { useState, useEffect, useRef } from 'react';
import type { ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import GlobalNavigationBar, { GNB_HEIGHT } from '../../shared/components/GlobalNavigationBar';
import Footer from '../../shared/components/Footer';
import StepIndicator from '../components/StepIndicator';
import ExamSelectionPanel from '../components/ExamSelectionPanel';
import { useRegistrationStore } from '../store/registrationStore';
import { fetchVenues } from '../api/registrationApi';
import type { ExamVenue } from '../types/registration.types';

// ─── Styles ──────────────────────────────────────────────────────
const s = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#F5F5F5',
    fontFamily: 'sans-serif',
    paddingTop: GNB_HEIGHT,
  },
  body: {
    display: 'flex',
    maxWidth: 1120,
    margin: '0 auto',
    padding: '32px 24px',
    gap: 32,
  },
  main: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 32,
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 700 as const,
    color: '#212121',
    marginBottom: 4,
  },
  required: {
    fontSize: 13,
    color: '#C62828',
    marginLeft: 8,
  },
  formTable: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    marginTop: 24,
  },
  formRow: {
    borderBottom: '1px solid #F0F0F0',
  },
  formLabel: {
    width: 140,
    padding: '16px 20px',
    fontSize: 14,
    fontWeight: 600 as const,
    color: '#212121',
    backgroundColor: '#FAFAFA',
    verticalAlign: 'middle' as const,
  },
  formStar: {
    color: '#C62828',
    marginLeft: 2,
  },
  formValue: {
    padding: '16px 20px',
    verticalAlign: 'middle' as const,
  },
  input: {
    padding: '10px 14px',
    fontSize: 15,
    border: '1px solid #BDBDBD',
    borderRadius: 6,
    outline: 'none',
    boxSizing: 'border-box' as const,
    width: '100%',
    maxWidth: 400,
  },
  select: {
    padding: '10px 14px',
    fontSize: 15,
    border: '1px solid #BDBDBD',
    borderRadius: 6,
    outline: 'none',
    backgroundColor: '#fff',
    marginRight: 8,
    minWidth: 80,
  },
  toggleGroup: {
    display: 'flex',
    gap: 0,
  },
  toggleBtn: (active: boolean) => ({
    padding: '10px 28px',
    fontSize: 14,
    fontWeight: 600 as const,
    border: '1px solid #BDBDBD',
    backgroundColor: active ? '#4CAF50' : '#fff',
    color: active ? '#fff' : '#424242',
    cursor: 'pointer',
    transition: 'all 0.15s',
  }),
  toggleBtnLeft: {
    borderRadius: '6px 0 0 6px',
    borderRight: 'none',
  },
  toggleBtnRight: {
    borderRadius: '0 6px 6px 0',
  },
  warning: {
    marginTop: 24,
    padding: '16px 20px',
    fontSize: 13,
    lineHeight: 1.7,
    color: '#C62828',
    fontWeight: 500 as const,
  },
  checkbox: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: 600 as const,
  },
  // Step 2
  regionSelect: {
    padding: '10px 14px',
    fontSize: 15,
    border: '1px solid #BDBDBD',
    borderRadius: 6,
    outline: 'none',
    backgroundColor: '#fff',
    marginBottom: 16,
    minWidth: 200,
  },
  venueTable: {
    width: '100%',
    borderCollapse: 'collapse' as const,
  },
  venueTh: {
    padding: '12px 16px',
    backgroundColor: '#F5F5F5',
    fontWeight: 600 as const,
    fontSize: 13,
    color: '#616161',
    textAlign: 'left' as const,
    borderBottom: '1px solid #E0E0E0',
  },
  venueTd: {
    padding: '12px 16px',
    fontSize: 14,
    color: '#212121',
    borderBottom: '1px solid #F5F5F5',
  },
  venueRow: (selected: boolean) => ({
    backgroundColor: selected ? '#E8F5E9' : '#fff',
    cursor: 'pointer',
  }),
  selectBtn: (selected: boolean) => ({
    padding: '6px 20px',
    fontSize: 13,
    fontWeight: 600 as const,
    border: selected ? 'none' : '1px solid #1565C0',
    borderRadius: 6,
    backgroundColor: selected ? '#4CAF50' : '#fff',
    color: selected ? '#fff' : '#1565C0',
    cursor: 'pointer',
  }),
  // Step 3
  photoArea: {
    display: 'flex',
    gap: 20,
    alignItems: 'flex-start',
    marginTop: 20,
  },
  photoPreview: {
    width: 120,
    height: 160,
    border: '2px dashed #BDBDBD',
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFAFA',
    overflow: 'hidden',
  },
  photoImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const,
  },
  fileBtn: {
    padding: '10px 24px',
    fontSize: 14,
    fontWeight: 600 as const,
    border: '1px solid #1565C0',
    borderRadius: 6,
    backgroundColor: '#fff',
    color: '#1565C0',
    cursor: 'pointer',
  },
  photoHint: {
    fontSize: 12,
    color: '#9E9E9E',
    marginTop: 8,
    lineHeight: 1.5,
  },
  // Step 4
  summaryTable: {
    width: '100%',
    borderCollapse: 'collapse' as const,
  },
  summaryLabel: {
    width: 140,
    padding: '14px 20px',
    fontSize: 14,
    fontWeight: 600 as const,
    color: '#616161',
    backgroundColor: '#FAFAFA',
    borderBottom: '1px solid #F0F0F0',
  },
  summaryValue: {
    padding: '14px 20px',
    fontSize: 15,
    color: '#212121',
    borderBottom: '1px solid #F0F0F0',
  },
  submitBtn: {
    marginTop: 24,
    padding: '14px 48px',
    fontSize: 16,
    fontWeight: 700 as const,
    color: '#fff',
    backgroundColor: '#1565C0',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
  },
  errorMsg: {
    marginTop: 12,
    fontSize: 13,
    color: '#C62828',
  },
};

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load venues when schedule is selected
  useEffect(() => {
    if (!selectedSchedule) {
      navigate('/registration/schedules');
      return;
    }
    // Try to fetch venues from API; fall back to schedule.venues
    fetchVenues(selectedSchedule.id)
      .then((data) => {
        setVenues(data);
        setFilteredVenues(data);
      })
      .catch(() => {
        // fallback to embedded venues
        if (selectedSchedule.venues) {
          setVenues(selectedSchedule.venues);
          setFilteredVenues(selectedSchedule.venues);
        }
      });
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
    if (step === 1) {
      if (!formData.englishName.trim()) { setError('영문 성명을 입력하세요.'); return false; }
      if (!formData.gender) { setError('성별을 선택하세요.'); return false; }
      if (!formData.agreedToTerms) { setError('주의사항에 동의해야 합니다.'); return false; }
      return true;
    }
    if (step === 2) {
      if (!formData.venueId) { setError('시험장을 선택하세요.'); return false; }
      return true;
    }
    if (step === 3) {
      if (!formData.phone.trim()) { setError('연락처를 입력하세요.'); return false; }
      if (!formData.address.trim()) { setError('주소를 입력하세요.'); return false; }
      if (!formData.nationality) { setError('국적을 선택하세요.'); return false; }
      return true;
    }
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
      <div style={{ display: 'flex', alignItems: 'baseline' }}>
        <div style={s.sectionTitle}>기본정보 입력</div>
        <span style={s.required}>* 표시는 필수 항목입니다.</span>
      </div>

      <table style={s.formTable}>
        <tbody>
          <tr style={s.formRow}>
            <td style={s.formLabel}>
              영문 성명 <span style={s.formStar}>*</span>
            </td>
            <td style={s.formValue}>
              <input
                style={s.input}
                value={formData.englishName}
                onChange={(e) => updateFormData({ englishName: e.target.value.toUpperCase() })}
                placeholder="영문 성명 입력"
              />
            </td>
          </tr>
          <tr style={s.formRow}>
            <td style={s.formLabel}>
              생년월일 <span style={s.formStar}>*</span>
            </td>
            <td style={s.formValue}>
              <select
                style={s.select}
                value={formData.birthYear}
                onChange={(e) => updateFormData({ birthYear: Number(e.target.value) })}
              >
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <select
                style={s.select}
                value={formData.birthMonth}
                onChange={(e) => updateFormData({ birthMonth: Number(e.target.value) })}
              >
                {months.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <select
                style={s.select}
                value={formData.birthDay}
                onChange={(e) => updateFormData({ birthDay: Number(e.target.value) })}
              >
                {days.map((d) => (
                  <option key={d} value={d}>{String(d).padStart(2, '0')}</option>
                ))}
              </select>
            </td>
          </tr>
          <tr style={s.formRow}>
            <td style={s.formLabel}>
              성별 <span style={s.formStar}>*</span>
            </td>
            <td style={s.formValue}>
              <div style={s.toggleGroup}>
                <button
                  type="button"
                  style={{ ...s.toggleBtn(formData.gender === 'MALE'), ...s.toggleBtnLeft }}
                  onClick={() => updateFormData({ gender: 'MALE' })}
                >
                  남자
                </button>
                <button
                  type="button"
                  style={{ ...s.toggleBtn(formData.gender === 'FEMALE'), ...s.toggleBtnRight }}
                  onClick={() => updateFormData({ gender: 'FEMALE' })}
                >
                  여자
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div style={s.warning}>
        1. 영문 성명은 여권, 외국인등록증 등 규정 신분증에 기재된 성명과 동일하게 입력해 주시기 바랍니다. 만약 규정 신분증 영문 성명과 다를 경우 응시가 불가합니다.
        <br />
        2. 한국어능력시험 원서접수 시 작성한 지원자 정보 중 기본정보(영문 성명/생년월일/성별)는 변경이 불가합니다.
        <br />
        3. 매크로 프로그램을 사용하여 비정상적이거나 부정한 방법으로 원서를 제출한 것으로 확인된 경우, 해당 회차 접수가 취소될 수 있으며 한국어능력시험 응시에 불이익을 받을 수 있음을 확인합니다.
      </div>

      <label style={s.checkbox}>
        <input
          type="checkbox"
          checked={formData.agreedToTerms}
          onChange={(e) => updateFormData({ agreedToTerms: e.target.checked })}
        />
        <span>위 내용에 동의합니다</span>
      </label>
    </>
  );

  const renderStep2 = () => (
    <>
      <div style={s.sectionTitle}>시험장 선택</div>

      <div style={{ marginTop: 20 }}>
        <select
          style={s.regionSelect}
          value={selectedRegion}
          onChange={(e) => setSelectedRegion(e.target.value)}
        >
          <option value="">전체 지역</option>
          {regions.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      <table style={s.venueTable}>
        <thead>
          <tr>
            <th style={s.venueTh}>시험장</th>
            <th style={s.venueTh}>주소</th>
            <th style={s.venueTh}>잔여석</th>
            <th style={s.venueTh}>선택</th>
          </tr>
        </thead>
        <tbody>
          {filteredVenues.map((v) => (
            <tr
              key={v.id}
              style={s.venueRow(formData.venueId === v.id)}
              onClick={() => updateFormData({ venueId: v.id, venueName: v.name })}
            >
              <td style={s.venueTd}>{v.name}</td>
              <td style={s.venueTd}>{v.address}</td>
              <td style={s.venueTd}>{v.remainingSeats}/{v.capacity}</td>
              <td style={s.venueTd}>
                <button
                  type="button"
                  style={s.selectBtn(formData.venueId === v.id)}
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
              <td style={{ ...s.venueTd, textAlign: 'center', color: '#9E9E9E' }} colSpan={4}>
                해당 지역에 시험장이 없습니다.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </>
  );

  const renderStep3 = () => (
    <>
      <div style={s.sectionTitle}>추가 정보 입력</div>

      <table style={s.formTable}>
        <tbody>
          <tr style={s.formRow}>
            <td style={s.formLabel}>
              연락처 <span style={s.formStar}>*</span>
            </td>
            <td style={s.formValue}>
              <input
                style={s.input}
                value={formData.phone}
                onChange={(e) => updateFormData({ phone: e.target.value.replace(/[^\d-]/g, '') })}
                placeholder="010-1234-5678"
              />
            </td>
          </tr>
          <tr style={s.formRow}>
            <td style={s.formLabel}>
              주소 <span style={s.formStar}>*</span>
            </td>
            <td style={s.formValue}>
              <input
                style={s.input}
                value={formData.address}
                onChange={(e) => updateFormData({ address: e.target.value })}
                placeholder="주소 입력"
              />
            </td>
          </tr>
          <tr style={s.formRow}>
            <td style={s.formLabel}>
              국적 <span style={s.formStar}>*</span>
            </td>
            <td style={s.formValue}>
              <select
                style={s.select}
                value={formData.nationality}
                onChange={(e) => updateFormData({ nationality: e.target.value })}
              >
                <option value="">선택</option>
                {NATIONALITIES.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </td>
          </tr>
          <tr style={s.formRow}>
            <td style={s.formLabel}>한국어 학습기간</td>
            <td style={s.formValue}>
              <select
                style={s.select}
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

      <div style={{ marginTop: 28 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#212121', marginBottom: 8 }}>
          사진 업로드
        </div>
        <div style={{ fontSize: 13, color: '#9E9E9E', marginBottom: 12 }}>
          3x4cm 규격의 증명사진을 업로드하세요.
        </div>
        <div style={s.photoArea}>
          <div style={s.photoPreview}>
            {formData.photoPreview ? (
              <img src={formData.photoPreview} alt="사진 미리보기" style={s.photoImg} />
            ) : (
              <span style={{ fontSize: 12, color: '#BDBDBD' }}>미리보기</span>
            )}
          </div>
          <div>
            <button
              type="button"
              style={s.fileBtn}
              onClick={() => fileInputRef.current?.click()}
            >
              파일 선택
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handlePhotoChange}
            />
            <div style={s.photoHint}>
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
      <div style={s.sectionTitle}>입력 내용 확인</div>
      <div style={{ fontSize: 14, color: '#616161', marginTop: 8, marginBottom: 24 }}>
        아래 내용을 확인한 후 접수하기 버튼을 눌러주세요.
      </div>

      <table style={s.summaryTable}>
        <tbody>
          <tr>
            <td style={s.summaryLabel}>시험</td>
            <td style={s.summaryValue}>
              {selectedSchedule
                ? `${selectedSchedule.examName} (${selectedSchedule.examType === 'TOPIK_I' ? 'TOPIK I' : 'TOPIK II'})`
                : '-'}
            </td>
          </tr>
          <tr>
            <td style={s.summaryLabel}>영문 성명</td>
            <td style={s.summaryValue}>{formData.englishName || '-'}</td>
          </tr>
          <tr>
            <td style={s.summaryLabel}>생년월일</td>
            <td style={s.summaryValue}>
              {formData.birthYear}-{String(formData.birthMonth).padStart(2, '0')}-{String(formData.birthDay).padStart(2, '0')}
            </td>
          </tr>
          <tr>
            <td style={s.summaryLabel}>성별</td>
            <td style={s.summaryValue}>
              {formData.gender === 'MALE' ? '남자' : formData.gender === 'FEMALE' ? '여자' : '-'}
            </td>
          </tr>
          <tr>
            <td style={s.summaryLabel}>시험장</td>
            <td style={s.summaryValue}>{formData.venueName || '-'}</td>
          </tr>
          <tr>
            <td style={s.summaryLabel}>연락처</td>
            <td style={s.summaryValue}>{formData.phone || '-'}</td>
          </tr>
          <tr>
            <td style={s.summaryLabel}>주소</td>
            <td style={s.summaryValue}>{formData.address || '-'}</td>
          </tr>
          <tr>
            <td style={s.summaryLabel}>국적</td>
            <td style={s.summaryValue}>{formData.nationality || '-'}</td>
          </tr>
          <tr>
            <td style={s.summaryLabel}>한국어 학습기간</td>
            <td style={s.summaryValue}>{formData.studyPeriod || '-'}</td>
          </tr>
          <tr>
            <td style={s.summaryLabel}>사진</td>
            <td style={s.summaryValue}>
              {formData.photoPreview ? (
                <img
                  src={formData.photoPreview}
                  alt="증명사진"
                  style={{ width: 60, height: 80, objectFit: 'cover', borderRadius: 4 }}
                />
              ) : (
                '미첨부'
              )}
            </td>
          </tr>
        </tbody>
      </table>

      <button style={s.submitBtn} onClick={handleNext}>
        접수하기
      </button>
    </>
  );

  const stepContent = [renderStep1, renderStep2, renderStep3, renderStep4];

  const panelButtonLabel = currentStep === 4 ? '접수하기' : '다음 단계로';
  const panelButtonDisabled =
    (currentStep === 1 && (!formData.englishName || !formData.gender || !formData.agreedToTerms)) ||
    (currentStep === 2 && !formData.venueId);

  return (
    <div style={s.page}>
      <GlobalNavigationBar />
      <StepIndicator currentStep={currentStep} onStepClick={handleStepClick} />

      <div style={s.body}>
        <div style={s.main}>
          {stepContent[currentStep - 1]()}
          {error && <div style={s.errorMsg}>{error}</div>}
        </div>

        <ExamSelectionPanel
          schedule={selectedSchedule}
          venueName={currentStep >= 2 ? formData.venueName : undefined}
          buttonLabel={panelButtonLabel}
          onButtonClick={handleNext}
          buttonDisabled={panelButtonDisabled}
        />
      </div>
      <Footer />
    </div>
  );
}
