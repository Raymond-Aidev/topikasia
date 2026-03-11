import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RegistrationHeader from '../components/RegistrationHeader';
import { useRegistrationStore } from '../store/registrationStore';
import { applyRegistration } from '../api/registrationApi';

const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#F5F5F5',
    fontFamily: 'sans-serif',
    paddingTop: 56,
  },
  content: {
    maxWidth: 720,
    margin: '0 auto',
    padding: '40px 24px',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 32,
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
  },
  title: {
    fontSize: 24,
    fontWeight: 700 as const,
    color: '#212121',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#616161',
    marginBottom: 28,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
  },
  label: {
    width: 160,
    padding: '14px 20px',
    fontSize: 14,
    fontWeight: 600 as const,
    color: '#616161',
    backgroundColor: '#FAFAFA',
    borderBottom: '1px solid #F0F0F0',
  },
  value: {
    padding: '14px 20px',
    fontSize: 15,
    color: '#212121',
    borderBottom: '1px solid #F0F0F0',
  },
  btnRow: {
    display: 'flex',
    gap: 16,
    marginTop: 28,
    justifyContent: 'center',
  },
  editBtn: {
    padding: '14px 40px',
    fontSize: 16,
    fontWeight: 600 as const,
    color: '#616161',
    backgroundColor: '#FFFFFF',
    border: '1px solid #BDBDBD',
    borderRadius: 8,
    cursor: 'pointer',
  },
  submitBtn: {
    padding: '14px 40px',
    fontSize: 16,
    fontWeight: 700 as const,
    color: '#FFFFFF',
    backgroundColor: '#1565C0',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
  },
  submitDisabled: {
    backgroundColor: '#90CAF9',
    cursor: 'not-allowed' as const,
  },
  error: {
    marginTop: 16,
    padding: '10px 14px',
    backgroundColor: '#FFEBEE',
    color: '#C62828',
    fontSize: 13,
    borderRadius: 8,
    border: '1px solid #FFCDD2',
    textAlign: 'center' as const,
  },
};

export default function RegistrationConfirmPage() {
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
    if (!selectedSchedule || !formData.gender || formData.gender === '') return;

    setLoading(true);
    setError('');
    try {
      const result = await applyRegistration({
        scheduleId: selectedSchedule.id,
        venueId: formData.venueId,
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
      const msg = err?.response?.data?.message;
      setError(msg || '접수 신청에 실패했습니다. 잠시 후 다시 시도하세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <RegistrationHeader showTimer />

      <div style={styles.content}>
        <div style={styles.card}>
          <div style={styles.title}>접수 확인</div>
          <div style={styles.subtitle}>
            아래 내용을 최종 확인한 후 제출 버튼을 눌러주세요.
          </div>

          <table style={styles.table}>
            <tbody>
              <tr>
                <td style={styles.label}>시험</td>
                <td style={styles.value}>
                  {selectedSchedule
                    ? `${selectedSchedule.examName} (${selectedSchedule.examType === 'TOPIK_I' ? 'TOPIK I' : 'TOPIK II'})`
                    : '-'}
                </td>
              </tr>
              <tr>
                <td style={styles.label}>시험일</td>
                <td style={styles.value}>{selectedSchedule?.examDate || '-'}</td>
              </tr>
              <tr>
                <td style={styles.label}>영문 성명</td>
                <td style={styles.value}>{formData.englishName}</td>
              </tr>
              <tr>
                <td style={styles.label}>생년월일</td>
                <td style={styles.value}>
                  {formData.birthYear}-{String(formData.birthMonth).padStart(2, '0')}-{String(formData.birthDay).padStart(2, '0')}
                </td>
              </tr>
              <tr>
                <td style={styles.label}>성별</td>
                <td style={styles.value}>
                  {formData.gender === 'MALE' ? '남자' : formData.gender === 'FEMALE' ? '여자' : '-'}
                </td>
              </tr>
              <tr>
                <td style={styles.label}>시험장</td>
                <td style={styles.value}>{formData.venueName}</td>
              </tr>
              <tr>
                <td style={styles.label}>연락처</td>
                <td style={styles.value}>{formData.phone}</td>
              </tr>
              <tr>
                <td style={styles.label}>주소</td>
                <td style={styles.value}>{formData.address}</td>
              </tr>
              <tr>
                <td style={styles.label}>국적</td>
                <td style={styles.value}>{formData.nationality}</td>
              </tr>
              <tr>
                <td style={styles.label}>한국어 학습기간</td>
                <td style={styles.value}>{formData.studyPeriod || '-'}</td>
              </tr>
              <tr>
                <td style={styles.label}>사진</td>
                <td style={styles.value}>
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

          <div style={styles.btnRow}>
            <button style={styles.editBtn} onClick={handleEdit}>
              수정하기
            </button>
            <button
              style={{ ...styles.submitBtn, ...(loading ? styles.submitDisabled : {}) }}
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? '제출 중...' : '최종 제출'}
            </button>
          </div>

          {error && <div style={styles.error}>{error}</div>}
        </div>
      </div>
    </div>
  );
}
