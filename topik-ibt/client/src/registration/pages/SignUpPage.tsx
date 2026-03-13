import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import GlobalNavigationBar, { GNB_HEIGHT, GNB_HEIGHT_MOBILE } from '../../shared/components/GlobalNavigationBar';
import { useResponsive } from '../../shared/hooks/useResponsive';
import Footer from '../../shared/components/Footer';
import LegalModal from '../../shared/components/LegalModal';
import { signUp } from '../api/registrationApi';

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
    fontFamily: 'sans-serif',
    paddingTop: GNB_HEIGHT,
  },
  card: {
    width: 440,
    padding: 40,
    backgroundColor: '#fff',
    borderRadius: 16,
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
  },
  title: {
    fontSize: 24,
    fontWeight: 800 as const,
    color: '#1565C0',
    textAlign: 'center' as const,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center' as const,
    marginBottom: 32,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    display: 'block',
    fontSize: 13,
    fontWeight: 600 as const,
    color: '#424242',
    marginBottom: 6,
  },
  input: {
    width: '100%',
    padding: '12px 14px',
    fontSize: 15,
    border: '1px solid #BDBDBD',
    borderRadius: 8,
    outline: 'none',
    boxSizing: 'border-box' as const,
  },
  inputError: {
    borderColor: '#C62828',
  },
  fieldError: {
    fontSize: 12,
    color: '#C62828',
    marginTop: 4,
  },
  button: {
    width: '100%',
    padding: '14px 0',
    fontSize: 16,
    fontWeight: 700 as const,
    color: '#fff',
    backgroundColor: '#1565C0',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    marginTop: 8,
  },
  buttonDisabled: {
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
  },
  linkRow: {
    marginTop: 20,
    textAlign: 'center' as const,
    fontSize: 14,
    color: '#757575',
  },
  link: {
    color: '#1565C0',
    fontWeight: 600 as const,
    cursor: 'pointer',
    textDecoration: 'underline',
    background: 'none',
    border: 'none',
    fontSize: 14,
  },
};

export default function SignUpPage() {
  const { isMobile, isTablet } = useResponsive();
  const compact = isMobile || isTablet;
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [phone, setPhone] = useState('');
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedPrivacy, setAgreedPrivacy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalType, setModalType] = useState<'terms' | 'privacy' | null>(null);

  const allAgreed = agreedTerms && agreedPrivacy;

  const handleAllAgree = (checked: boolean) => {
    setAgreedTerms(checked);
    setAgreedPrivacy(checked);
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = '이름을 입력하세요.';
    if (!email.trim()) errs.email = '이메일을 입력하세요.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = '올바른 이메일 형식이 아닙니다.';
    if (!password) errs.password = '비밀번호를 입력하세요.';
    else if (password.length < 8) errs.password = '8자 이상 입력하세요.';
    else if (!/(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*])/.test(password))
      errs.password = '영문, 숫자, 특수문자를 포함해야 합니다.';
    if (password !== passwordConfirm) errs.passwordConfirm = '비밀번호가 일치하지 않습니다.';
    if (!phone.trim()) errs.phone = '연락처를 입력하세요.';
    if (!agreedTerms) errs.agreedTerms = '이용약관에 동의해야 합니다.';
    if (!agreedPrivacy) errs.agreedPrivacy = '개인정보 수집·이용에 동의해야 합니다.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;

    setLoading(true);
    try {
      const result = await signUp({ name, email, password, phone });
      navigate('/registration/verify-email', { state: { email: result.email || email } });
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setServerError(msg || '회원가입에 실패했습니다. 잠시 후 다시 시도하세요.');
    } finally {
      setLoading(false);
    }
  };

  const viewBtnStyle: React.CSSProperties = {
    fontSize: 12, color: '#1565C0', cursor: 'pointer',
    background: 'none', border: 'none', padding: 0,
    textDecoration: 'underline', fontFamily: 'inherit',
    flexShrink: 0,
  };

  return (
    <div style={{ ...styles.page, paddingTop: compact ? GNB_HEIGHT_MOBILE : GNB_HEIGHT }}>
      <GlobalNavigationBar />
      <form style={{ ...styles.card, width: isMobile ? '90%' : 440, maxWidth: 440, boxSizing: 'border-box' as const, padding: isMobile ? 24 : 40 }} onSubmit={handleSubmit}>
        <div style={styles.title}>
          <img src="/logo_topikasia.png" alt="TOPIK Asia" style={{ height: 36, objectFit: 'contain' as const, marginRight: 8, verticalAlign: 'middle' }} />
          <span style={{ verticalAlign: 'middle' }}>회원가입</span>
        </div>
        <div style={styles.subtitle}>시험 접수를 위한 계정을 생성합니다</div>

        <div style={styles.fieldGroup}>
          <label style={styles.label}>이름</label>
          <input
            style={{ ...styles.input, ...(errors.name ? styles.inputError : {}) }}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="이름 입력"
          />
          {errors.name && <div style={styles.fieldError}>{errors.name}</div>}
        </div>

        <div style={styles.fieldGroup}>
          <label style={styles.label}>이메일</label>
          <input
            style={{ ...styles.input, ...(errors.email ? styles.inputError : {}) }}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@email.com"
          />
          {errors.email && <div style={styles.fieldError}>{errors.email}</div>}
        </div>

        <div style={styles.fieldGroup}>
          <label style={styles.label}>비밀번호</label>
          <input
            style={{ ...styles.input, ...(errors.password ? styles.inputError : {}) }}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="8자 이상, 영문+숫자+특수문자"
          />
          {errors.password && <div style={styles.fieldError}>{errors.password}</div>}
        </div>

        <div style={styles.fieldGroup}>
          <label style={styles.label}>비밀번호 확인</label>
          <input
            style={{ ...styles.input, ...(errors.passwordConfirm ? styles.inputError : {}) }}
            type="password"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            placeholder="비밀번호 재입력"
          />
          {errors.passwordConfirm && <div style={styles.fieldError}>{errors.passwordConfirm}</div>}
        </div>

        <div style={styles.fieldGroup}>
          <label style={styles.label}>연락처</label>
          <input
            style={{ ...styles.input, ...(errors.phone ? styles.inputError : {}) }}
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/[^\d-]/g, ''))}
            placeholder="010-1234-5678"
          />
          {errors.phone && <div style={styles.fieldError}>{errors.phone}</div>}
        </div>

        {/* 약관 동의 영역 */}
        <div style={{
          border: '1px solid #E0E0E0', borderRadius: 12, padding: 16,
          marginBottom: 20, backgroundColor: '#FAFAFA',
        }}>
          {/* 전체 동의 */}
          <label style={{
            display: 'flex', alignItems: 'center', gap: 8,
            cursor: 'pointer', paddingBottom: 12, marginBottom: 12,
            borderBottom: '1px solid #E0E0E0',
            fontSize: 15, fontWeight: 700, color: '#111827',
          }}>
            <input
              type="checkbox"
              checked={allAgreed}
              onChange={(e) => handleAllAgree(e.target.checked)}
              style={{ width: 18, height: 18, accentColor: '#1565C0' }}
            />
            전체 동의
          </label>

          {/* 이용약관 동의 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <label style={{
              display: 'flex', alignItems: 'center', gap: 8,
              cursor: 'pointer', fontSize: 13, color: '#424242', flex: 1,
            }}>
              <input
                type="checkbox"
                checked={agreedTerms}
                onChange={(e) => setAgreedTerms(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: '#1565C0' }}
              />
              이용약관 동의 <span style={{ color: '#C62828', fontSize: 12 }}>(필수)</span>
            </label>
            <button type="button" style={viewBtnStyle} onClick={() => setModalType('terms')}>
              약관보기
            </button>
          </div>
          {errors.agreedTerms && <div style={{ ...styles.fieldError, marginLeft: 24, marginBottom: 8 }}>{errors.agreedTerms}</div>}

          {/* 개인정보 수집·이용 동의 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label style={{
              display: 'flex', alignItems: 'center', gap: 8,
              cursor: 'pointer', fontSize: 13, color: '#424242', flex: 1,
            }}>
              <input
                type="checkbox"
                checked={agreedPrivacy}
                onChange={(e) => setAgreedPrivacy(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: '#1565C0' }}
              />
              개인정보 수집·이용 동의 <span style={{ color: '#C62828', fontSize: 12 }}>(필수)</span>
            </label>
            <button type="button" style={viewBtnStyle} onClick={() => setModalType('privacy')}>
              약관보기
            </button>
          </div>
          {errors.agreedPrivacy && <div style={{ ...styles.fieldError, marginLeft: 24, marginTop: 8 }}>{errors.agreedPrivacy}</div>}
        </div>

        <button
          type="submit"
          style={{ ...styles.button, ...(loading ? styles.buttonDisabled : {}) }}
          disabled={loading}
        >
          {loading ? '처리 중...' : '가입하기'}
        </button>

        {serverError && <div style={styles.error}>{serverError}</div>}

        <div style={styles.linkRow}>
          이미 계정이 있으신가요?{' '}
          <button
            type="button"
            style={styles.link}
            onClick={() => navigate('/registration/login')}
          >
            로그인
          </button>
        </div>
      </form>

      {modalType && <LegalModal type={modalType} onClose={() => setModalType(null)} />}
      <Footer />
    </div>
  );
}
