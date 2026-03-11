import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/adminApi';

interface ExamineeCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

interface ExamSetOption {
  id: string;
  examSetNumber: number;
  name: string;
  examType: string;
}

const modalOverlay: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.5)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000,
};

const modalContent: React.CSSProperties = {
  backgroundColor: '#fff',
  borderRadius: '12px',
  padding: '32px',
  width: '520px',
  maxHeight: '85vh',
  overflowY: 'auto',
  boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: '6px',
  border: '1px solid #d1d5db',
  fontSize: '14px',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: '4px',
  fontSize: '13px',
  fontWeight: 600,
  color: '#374151',
};

const errorTextStyle: React.CSSProperties = {
  color: '#dc2626',
  fontSize: '12px',
  marginTop: '2px',
};

const fieldGroup: React.CSSProperties = {
  marginBottom: '14px',
};

const ExamineeCreateModal: React.FC<ExamineeCreateModalProps> = ({ isOpen, onClose, onCreated }) => {
  const [form, setForm] = useState({
    loginId: '',
    password: '',
    name: '',
    registrationNumber: '',
    seatNumber: '',
    institutionName: '',
    examRoomName: '',
    assignedExamSetId: '',
  });
  const [photo, setPhoto] = useState<File | null>(null);
  const [examSets, setExamSets] = useState<ExamSetOption[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    adminApi.get('/admin/exam-sets/assignable').then((res) => setExamSets(res.data)).catch(() => {});
  }, [isOpen]);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!/^[a-zA-Z0-9]{6,20}$/.test(form.loginId)) {
      e.loginId = '아이디는 6~20자 영문/숫자만 가능합니다.';
    }
    if (!/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/.test(form.password)) {
      e.password = '비밀번호는 8자 이상, 영문+숫자+특수문자를 포함해야 합니다.';
    }
    if (!form.name.trim()) e.name = '성명을 입력하세요.';
    if (!/^\d{9}$/.test(form.registrationNumber)) {
      e.registrationNumber = '수험번호는 9자리 숫자여야 합니다.';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setServerError('');
    if (!validate()) return;

    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => {
      if (v) fd.append(k, v);
    });
    if (photo) fd.append('photo', photo);

    try {
      setSubmitting(true);
      await adminApi.post('/admin/examinees', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onCreated();
      onClose();
      setForm({
        loginId: '',
        password: '',
        name: '',
        registrationNumber: '',
        seatNumber: '',
        institutionName: '',
        examRoomName: '',
        assignedExamSetId: '',
      });
      setPhoto(null);
    } catch (err: any) {
      if (err.response?.status === 409) {
        setServerError('이미 존재하는 아이디 또는 수험번호입니다.');
      } else {
        setServerError(err.response?.data?.message || '회원 생성에 실패했습니다.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={modalOverlay} onClick={onClose}>
      <div style={modalContent} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '18px', color: '#111827' }}>회원 생성</h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#6b7280' }}
          >
            x
          </button>
        </div>

        {serverError && (
          <div style={{ padding: '10px 14px', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '6px', marginBottom: '16px', fontSize: '13px' }}>
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={fieldGroup}>
            <label style={labelStyle}>아이디 *</label>
            <input style={inputStyle} value={form.loginId} onChange={(e) => setForm({ ...form, loginId: e.target.value })} placeholder="6~20자 영문/숫자" />
            {errors.loginId && <div style={errorTextStyle}>{errors.loginId}</div>}
          </div>

          <div style={fieldGroup}>
            <label style={labelStyle}>비밀번호 *</label>
            <input style={inputStyle} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="8자 이상 (영문+숫자+특수문자)" />
            {errors.password && <div style={errorTextStyle}>{errors.password}</div>}
          </div>

          <div style={fieldGroup}>
            <label style={labelStyle}>성명 *</label>
            <input style={inputStyle} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            {errors.name && <div style={errorTextStyle}>{errors.name}</div>}
          </div>

          <div style={fieldGroup}>
            <label style={labelStyle}>수험번호 *</label>
            <input style={inputStyle} value={form.registrationNumber} onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })} placeholder="9자리 숫자" />
            {errors.registrationNumber && <div style={errorTextStyle}>{errors.registrationNumber}</div>}
          </div>

          <div style={fieldGroup}>
            <label style={labelStyle}>좌석번호</label>
            <input style={inputStyle} value={form.seatNumber} onChange={(e) => setForm({ ...form, seatNumber: e.target.value })} />
          </div>

          <div style={fieldGroup}>
            <label style={labelStyle}>사진</label>
            <input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files?.[0] || null)} style={{ fontSize: '14px' }} />
          </div>

          <div style={fieldGroup}>
            <label style={labelStyle}>소속기관</label>
            <input style={inputStyle} value={form.institutionName} onChange={(e) => setForm({ ...form, institutionName: e.target.value })} />
          </div>

          <div style={fieldGroup}>
            <label style={labelStyle}>시험실</label>
            <input style={inputStyle} value={form.examRoomName} onChange={(e) => setForm({ ...form, examRoomName: e.target.value })} />
          </div>

          <div style={fieldGroup}>
            <label style={labelStyle}>시험세트</label>
            <select
              style={{ ...inputStyle }}
              value={form.assignedExamSetId}
              onChange={(e) => setForm({ ...form, assignedExamSetId: e.target.value })}
            >
              <option value="">시험세트 선택</option>
              {examSets.map((s) => (
                <option key={s.id} value={s.id}>
                  [{s.examSetNumber}] {s.name} ({s.examType})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 20px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                backgroundColor: '#fff',
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              취소
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: '8px 20px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: '#2563eb',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 600,
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.7 : 1,
              }}
            >
              {submitting ? '생성 중...' : '생성'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExamineeCreateModal;
