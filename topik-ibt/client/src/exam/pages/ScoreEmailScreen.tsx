/**
 * SCR-S02: 성적표 이메일 발송 화면
 * SCORE-06: 이메일로 성적표 발송
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { examApi } from '../../api/examApi';

export default function ScoreEmailScreen() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSend = async () => {
    if (!email.trim()) {
      setError('이메일 주소를 입력해주세요');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await examApi.post('/exam/score/email', { email });
      setSuccess(true);
      setError('');
    } catch (err: any) {
      const msg = err.response?.data?.message || '이메일 발송에 실패했습니다';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f0f4f8', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        <div style={{
          maxWidth: 480, width: '100%', backgroundColor: '#fff', borderRadius: 16,
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)', padding: '48px 32px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 48, marginBottom: 16, color: '#4CAF50' }}>&#10003;</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 8 }}>
            발송 완료
          </div>
          <div style={{ fontSize: 15, color: '#6b7280', marginBottom: 32, lineHeight: 1.6 }}>
            성적표가 <strong>{email}</strong>으로<br />발송되었습니다.
          </div>
          <button
            onClick={() => navigate('/exam/score')}
            style={{
              padding: '12px 32px', borderRadius: 8, border: 'none',
              backgroundColor: '#1565C0', color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer',
            }}
          >
            성적표로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f4f8', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <div style={{
        maxWidth: 480, width: '100%', backgroundColor: '#fff', borderRadius: 16,
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)', padding: '48px 32px',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 4 }}>한국어능력시험</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#1565C0' }}>성적표 이메일 발송</div>
        </div>

        {/* Email input */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
            이메일 주소
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@email.com"
            onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
            style={{
              width: '100%', padding: '12px 16px', fontSize: 15, borderRadius: 8,
              border: '1px solid #d1d5db', outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Error */}
        {error && (
          <div style={{ marginBottom: 16, padding: '10px 14px', backgroundColor: '#FEF2F2', borderRadius: 8, fontSize: 14, color: '#DC2626' }}>
            {error}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={() => navigate('/exam/score')}
            style={{
              flex: 1, padding: '12px 0', borderRadius: 8, border: '1px solid #d1d5db',
              backgroundColor: '#fff', color: '#374151', fontSize: 15, fontWeight: 600, cursor: 'pointer',
            }}
          >
            돌아가기
          </button>
          <button
            onClick={handleSend}
            disabled={loading}
            style={{
              flex: 1, padding: '12px 0', borderRadius: 8, border: 'none',
              backgroundColor: loading ? '#93C5FD' : '#1565C0', color: '#fff',
              fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? '발송 중...' : '이메일 발송'}
          </button>
        </div>
      </div>
    </div>
  );
}
