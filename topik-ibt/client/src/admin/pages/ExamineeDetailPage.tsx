import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import ExamSetSelector from '../components/ExamSetSelector';
import StatusBadge from '../components/StatusBadge';
import { adminApi } from '../../api/adminApi';

interface ExamineeDetail {
  id: string;
  loginId: string;
  name: string;
  registrationNumber: string;
  seatNumber: string;
  institutionName: string;
  examRoomName: string;
  status: string;
  photoUrl: string | null;
  assignedExamSet: { id: string; name: string; examSetNumber: number; examType: string } | null;
  createdAt?: string;
}

interface ExamSession {
  id: string;
  examSetName: string;
  startedAt: string;
  endedAt: string | null;
  status: string;
}

type Tab = 'info' | 'examSet' | 'sessions';

const tabBtn = (active: boolean): React.CSSProperties => ({
  padding: '10px 20px',
  fontSize: '14px',
  fontWeight: active ? 600 : 400,
  color: active ? '#2563eb' : '#6b7280',
  backgroundColor: 'transparent',
  border: 'none',
  borderBottom: active ? '2px solid #2563eb' : '2px solid transparent',
  cursor: 'pointer',
});

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: '6px',
  border: '1px solid #d1d5db',
  fontSize: '14px',
  boxSizing: 'border-box' as const,
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: '4px',
  fontSize: '13px',
  fontWeight: 600,
  color: '#374151',
};

const fieldGroup: React.CSSProperties = { marginBottom: '14px' };

const thStyle: React.CSSProperties = {
  padding: '10px 14px',
  textAlign: 'left',
  fontSize: '13px',
  fontWeight: 600,
  color: '#374151',
  borderBottom: '2px solid #e5e7eb',
};

const tdStyle: React.CSSProperties = {
  padding: '10px 14px',
  fontSize: '13px',
  color: '#111827',
  borderBottom: '1px solid #f3f4f6',
};

const ExamineeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [examinee, setExaminee] = useState<ExamineeDetail | null>(null);
  const [sessions, setSessions] = useState<ExamSession[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('info');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Editable fields
  const [name, setName] = useState('');
  const [seatNumber, setSeatNumber] = useState('');
  const [institutionName, setInstitutionName] = useState('');
  const [examRoomName, setExamRoomName] = useState('');
  const [selectedExamSetId, setSelectedExamSetId] = useState('');

  const fetchExaminee = async () => {
    try {
      setLoading(true);
      const res = await adminApi.get(`/admin/examinees/${id}`);
      const data = res.data?.data || res.data;
      setExaminee(data);
      setName(data.name);
      setSeatNumber(data.seatNumber || '');
      setInstitutionName(data.institutionName || '');
      setExamRoomName(data.examRoomName || '');
      setSelectedExamSetId(data.assignedExamSet?.id || '');
    } catch {
      setError('회원 정보를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSessions = async () => {
    try {
      const res = await adminApi.get(`/admin/examinees/${id}/sessions`);
      setSessions(res.data);
    } catch {
      // silent
    }
  };

  useEffect(() => {
    if (id) {
      fetchExaminee();
      fetchSessions();
    }
  }, [id]);

  const handleSaveInfo = async () => {
    setMessage('');
    setError('');
    setSaving(true);
    try {
      await adminApi.patch(`/admin/examinees/${id}`, { name, seatNumber, institutionName, examRoomName });
      setMessage('저장되었습니다.');
      fetchExaminee();
    } catch (err: any) {
      setError(err.response?.data?.message || '저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    const newPw = prompt('새 비밀번호를 입력하세요 (8자 이상, 영문+숫자+특수문자):');
    if (!newPw) return;
    if (!/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/.test(newPw)) {
      alert('비밀번호는 8자 이상, 영문+숫자+특수문자를 포함해야 합니다.');
      return;
    }
    try {
      await adminApi.patch(`/admin/examinees/${id}/password`, { password: newPw });
      alert('비밀번호가 변경되었습니다.');
    } catch (err: any) {
      alert(err.response?.data?.message || '비밀번호 변경에 실패했습니다.');
    }
  };

  const handleChangeExamSet = async () => {
    setMessage('');
    setError('');
    setSaving(true);
    try {
      await adminApi.patch(`/admin/examinees/${id}/exam-set`, { examSetId: selectedExamSetId || null });
      setMessage('시험세트가 변경되었습니다.');
      fetchExaminee();
    } catch (err: any) {
      if (err.response?.status === 409) {
        setError('현재 시험이 진행 중이므로 시험세트를 변경할 수 없습니다.');
      } else {
        setError(err.response?.data?.message || '시험세트 변경에 실패했습니다.');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af' }}>불러오는 중...</div>
      </AdminLayout>
    );
  }

  if (!examinee) {
    return (
      <AdminLayout>
        <div style={{ textAlign: 'center', padding: '60px', color: '#dc2626' }}>{error || '회원을 찾을 수 없습니다.'}</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <button
        onClick={() => navigate('/admin/examinees')}
        style={{ marginBottom: '16px', padding: '6px 14px', borderRadius: '6px', border: '1px solid #d1d5db', backgroundColor: '#fff', fontSize: '13px', cursor: 'pointer' }}
      >
        &larr; 목록으로
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <h1 style={{ margin: 0, fontSize: '22px', color: '#111827' }}>{examinee.name}</h1>
        <StatusBadge status={examinee.status} />
        {examinee.photoUrl && (
          <img
            src={examinee.photoUrl}
            alt="사진"
            style={{ width: '40px', height: '50px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #e5e7eb', marginLeft: '8px' }}
          />
        )}
      </div>

      {message && (
        <div style={{ padding: '10px 14px', backgroundColor: '#dcfce7', color: '#166534', borderRadius: '6px', marginBottom: '12px', fontSize: '13px' }}>
          {message}
        </div>
      )}
      {error && (
        <div style={{ padding: '10px 14px', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '6px', marginBottom: '12px', fontSize: '13px' }}>
          {error}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0', borderBottom: '1px solid #e5e7eb', marginBottom: '20px' }}>
        <button style={tabBtn(activeTab === 'info')} onClick={() => { setActiveTab('info'); setMessage(''); setError(''); }}>기본 정보</button>
        <button style={tabBtn(activeTab === 'examSet')} onClick={() => { setActiveTab('examSet'); setMessage(''); setError(''); }}>시험세트</button>
        <button style={tabBtn(activeTab === 'sessions')} onClick={() => { setActiveTab('sessions'); setMessage(''); setError(''); }}>응시 내역</button>
      </div>

      <div style={{ backgroundColor: '#fff', borderRadius: '10px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        {activeTab === 'info' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={fieldGroup}>
                <label style={labelStyle}>아이디</label>
                <input style={{ ...inputStyle, backgroundColor: '#f9fafb' }} value={examinee.loginId} disabled />
              </div>
              <div style={fieldGroup}>
                <label style={labelStyle}>수험번호</label>
                <input style={{ ...inputStyle, backgroundColor: '#f9fafb' }} value={examinee.registrationNumber} disabled />
              </div>
              <div style={fieldGroup}>
                <label style={labelStyle}>성명</label>
                <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div style={fieldGroup}>
                <label style={labelStyle}>좌석번호</label>
                <input style={inputStyle} value={seatNumber} onChange={(e) => setSeatNumber(e.target.value)} />
              </div>
              <div style={fieldGroup}>
                <label style={labelStyle}>소속기관</label>
                <input style={inputStyle} value={institutionName} onChange={(e) => setInstitutionName(e.target.value)} />
              </div>
              <div style={fieldGroup}>
                <label style={labelStyle}>시험실</label>
                <input style={inputStyle} value={examRoomName} onChange={(e) => setExamRoomName(e.target.value)} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              <button
                onClick={handleSaveInfo}
                disabled={saving}
                style={{
                  padding: '8px 20px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: '#2563eb',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: saving ? 'not-allowed' : 'pointer',
                }}
              >
                {saving ? '저장 중...' : '저장'}
              </button>
              <button
                onClick={handleResetPassword}
                style={{
                  padding: '8px 20px',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  backgroundColor: '#fff',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                비밀번호 재설정
              </button>
            </div>
          </>
        )}

        {activeTab === 'examSet' && (
          <>
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>현재 시험세트</label>
              <div style={{ fontSize: '15px', fontWeight: 600, color: '#111827', marginBottom: '16px' }}>
                {examinee.assignedExamSet
                  ? `[${examinee.assignedExamSet.examSetNumber}] ${examinee.assignedExamSet.name} (${examinee.assignedExamSet.examType})`
                  : '미배정'}
              </div>
            </div>
            <div style={fieldGroup}>
              <label style={labelStyle}>시험세트 변경</label>
              <ExamSetSelector value={selectedExamSetId} onChange={setSelectedExamSetId} />
            </div>
            <button
              onClick={handleChangeExamSet}
              disabled={saving}
              style={{
                padding: '8px 20px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: '#2563eb',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 600,
                cursor: saving ? 'not-allowed' : 'pointer',
              }}
            >
              {saving ? '변경 중...' : '변경'}
            </button>
          </>
        )}

        {activeTab === 'sessions' && (
          <>
            {sessions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#9ca3af', fontSize: '14px' }}>
                응시 내역이 없습니다.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={thStyle}>시험세트</th>
                    <th style={thStyle}>시작시간</th>
                    <th style={thStyle}>종료시간</th>
                    <th style={thStyle}>상태</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s) => (
                    <tr key={s.id}>
                      <td style={tdStyle}>{s.examSetName}</td>
                      <td style={tdStyle}>{new Date(s.startedAt).toLocaleString('ko-KR')}</td>
                      <td style={tdStyle}>{s.endedAt ? new Date(s.endedAt).toLocaleString('ko-KR') : '-'}</td>
                      <td style={tdStyle}><StatusBadge status={s.status} type="session" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default ExamineeDetailPage;
