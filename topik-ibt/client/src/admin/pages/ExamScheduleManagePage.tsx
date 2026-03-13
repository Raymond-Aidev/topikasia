import React, { useEffect, useState, useCallback } from 'react';
import AdminLayout from '../components/AdminLayout';
import { adminApi } from '../../api/adminApi';

interface ExamSchedule {
  id: string;
  examName: string;
  examRound: number;
  examType: string;
  examDate: string;
  registrationStartAt: string;
  registrationEndAt: string;
  venues: any;
  maxCapacity: number;
  currentCount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface ScheduleForm {
  examName: string;
  examRound: number;
  examType: string;
  examDate: string;
  registrationStartAt: string;
  registrationEndAt: string;
  venues: string;
  maxCapacity: number;
  status: string;
}

const EMPTY_FORM: ScheduleForm = {
  examName: '',
  examRound: 0,
  examType: 'TOPIK_II',
  examDate: '',
  registrationStartAt: '',
  registrationEndAt: '',
  venues: '[]',
  maxCapacity: 9999,
  status: 'OPEN',
};

const STATUS_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  OPEN: { bg: '#dcfce7', color: '#166534', label: '접수중' },
  CLOSED: { bg: '#fee2e2', color: '#991b1b', label: '마감' },
  UPCOMING: { bg: '#dbeafe', color: '#1e40af', label: '예정' },
  COMPLETED: { bg: '#f3f4f6', color: '#6b7280', label: '완료' },
};

const thStyle: React.CSSProperties = {
  padding: '10px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#374151',
};
const tdStyle: React.CSSProperties = {
  padding: '10px 16px', fontSize: '14px',
};
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 4, color: '#374151',
};
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db',
  fontSize: 14, boxSizing: 'border-box' as const,
};

const ExamScheduleManagePage: React.FC = () => {
  const [schedules, setSchedules] = useState<ExamSchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<ScheduleForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.get('/admin/schedules');
      setSchedules(res.data.data?.schedules || res.data.schedules || []);
    } catch (err: any) {
      setError(err.response?.data?.message || '데이터를 불러오는 데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (s: ExamSchedule) => {
    setEditId(s.id);
    setForm({
      examName: s.examName,
      examRound: s.examRound,
      examType: s.examType,
      examDate: s.examDate ? new Date(s.examDate).toISOString().slice(0, 16) : '',
      registrationStartAt: s.registrationStartAt ? new Date(s.registrationStartAt).toISOString().slice(0, 16) : '',
      registrationEndAt: s.registrationEndAt ? new Date(s.registrationEndAt).toISOString().slice(0, 16) : '',
      venues: JSON.stringify(s.venues || [], null, 2),
      maxCapacity: s.maxCapacity,
      status: s.status,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.examName || !form.examType || !form.examDate) {
      alert('시험명, 시험유형, 시험일은 필수입니다.');
      return;
    }
    setSaving(true);
    try {
      let parsedVenues: any[] = [];
      try { parsedVenues = JSON.parse(form.venues); } catch { parsedVenues = []; }

      const payload = {
        examName: form.examName,
        examRound: form.examRound,
        examType: form.examType,
        examDate: form.examDate,
        registrationStartAt: form.registrationStartAt || undefined,
        registrationEndAt: form.registrationEndAt || undefined,
        venues: parsedVenues,
        maxCapacity: form.maxCapacity,
        status: form.status,
      };

      if (editId) {
        await adminApi.put(`/admin/schedules/${editId}`, payload);
      } else {
        await adminApi.post('/admin/schedules', payload);
      }
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || '저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`"${name}" 일정을 삭제하시겠습니까?\n접수자가 있는 경우 삭제할 수 없습니다.`)) return;
    try {
      await adminApi.delete(`/admin/schedules/${id}`);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || '삭제에 실패했습니다.');
    }
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const s = STATUS_COLORS[status] || { bg: '#f3f4f6', color: '#6b7280', label: status };
    return <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600, backgroundColor: s.bg, color: s.color }}>{s.label}</span>;
  };

  const updateField = (field: keyof ScheduleForm, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>시험 일정 관리</h1>
        <button onClick={openCreate}
          style={{ padding: '8px 20px', borderRadius: 6, border: 'none', backgroundColor: '#2563eb', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          + 새 일정 등록
        </button>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', marginBottom: 16, borderRadius: 6, backgroundColor: '#fee2e2', color: '#991b1b', fontSize: 14 }}>{error}</div>
      )}

      {loading ? (
        <p style={{ color: '#6b7280' }}>로딩 중...</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <thead>
            <tr style={{ backgroundColor: '#f9fafb' }}>
              <th style={thStyle}>시험명</th>
              <th style={thStyle}>회차</th>
              <th style={thStyle}>유형</th>
              <th style={thStyle}>시험일</th>
              <th style={thStyle}>접수기간</th>
              <th style={thStyle}>정원</th>
              <th style={thStyle}>접수</th>
              <th style={thStyle}>상태</th>
              <th style={thStyle}>관리</th>
            </tr>
          </thead>
          <tbody>
            {schedules.length === 0 ? (
              <tr><td colSpan={9} style={{ ...tdStyle, textAlign: 'center', color: '#9ca3af', padding: 40 }}>등록된 시험 일정이 없습니다.</td></tr>
            ) : (
              schedules.map(s => (
                <tr key={s.id} style={{ borderTop: '1px solid #f3f4f6' }}>
                  <td style={tdStyle}>
                    <button onClick={() => openEdit(s)} style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontWeight: 500, fontSize: 14, padding: 0 }}>
                      {s.examName}
                    </button>
                  </td>
                  <td style={{ ...tdStyle, color: '#6b7280' }}>{s.examRound || '-'}</td>
                  <td style={tdStyle}>{s.examType}</td>
                  <td style={{ ...tdStyle, fontSize: 13 }}>{new Date(s.examDate).toLocaleDateString('ko')}</td>
                  <td style={{ ...tdStyle, fontSize: 12, color: '#6b7280' }}>
                    {new Date(s.registrationStartAt).toLocaleDateString('ko')} ~ {new Date(s.registrationEndAt).toLocaleDateString('ko')}
                  </td>
                  <td style={tdStyle}>{s.maxCapacity === 9999 ? '무제한' : s.maxCapacity.toLocaleString()}</td>
                  <td style={tdStyle}>{s.currentCount}</td>
                  <td style={tdStyle}><StatusBadge status={s.status} /></td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => openEdit(s)}
                        style={{ padding: '4px 12px', borderRadius: 4, border: '1px solid #d1d5db', backgroundColor: '#fff', color: '#374151', fontSize: 12, cursor: 'pointer' }}>
                        수정
                      </button>
                      <button onClick={() => handleDelete(s.id, s.examName)}
                        style={{ padding: '4px 12px', borderRadius: 4, border: '1px solid #fca5a5', backgroundColor: '#fff', color: '#dc2626', fontSize: 12, cursor: 'pointer' }}>
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ width: '100%', maxWidth: 560, padding: 32, backgroundColor: '#fff', borderRadius: 12, boxShadow: '0 4px 24px rgba(0,0,0,0.15)', maxHeight: '85vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 0, marginBottom: 20 }}>
              {editId ? '시험 일정 수정' : '새 시험 일정 등록'}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={labelStyle}>시험명 *</label>
                <input value={form.examName} onChange={e => updateField('examName', e.target.value)}
                  placeholder="예: 제106회 TOPIK" style={inputStyle} />
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>회차</label>
                  <input type="number" value={form.examRound} onChange={e => updateField('examRound', parseInt(e.target.value) || 0)}
                    style={inputStyle} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>시험유형 *</label>
                  <select value={form.examType} onChange={e => updateField('examType', e.target.value)} style={inputStyle}>
                    <option value="TOPIK_I">TOPIK I</option>
                    <option value="TOPIK_II">TOPIK II</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={labelStyle}>시험일 *</label>
                <input type="datetime-local" value={form.examDate} onChange={e => updateField('examDate', e.target.value)}
                  style={inputStyle} />
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>접수 시작일</label>
                  <input type="datetime-local" value={form.registrationStartAt}
                    onChange={e => updateField('registrationStartAt', e.target.value)} style={inputStyle} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>접수 마감일</label>
                  <input type="datetime-local" value={form.registrationEndAt}
                    onChange={e => updateField('registrationEndAt', e.target.value)} style={inputStyle} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>정원</label>
                  <input type="number" value={form.maxCapacity} onChange={e => updateField('maxCapacity', parseInt(e.target.value) || 0)}
                    style={inputStyle} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>상태</label>
                  <select value={form.status} onChange={e => updateField('status', e.target.value)} style={inputStyle}>
                    <option value="OPEN">접수중</option>
                    <option value="CLOSED">마감</option>
                    <option value="UPCOMING">예정</option>
                    <option value="COMPLETED">완료</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={labelStyle}>시험장 (JSON)</label>
                <textarea value={form.venues} onChange={e => updateField('venues', e.target.value)}
                  placeholder='[{"name": "서울시험장", "address": "..."}]'
                  style={{ ...inputStyle, minHeight: 80, resize: 'vertical', fontFamily: 'monospace', fontSize: 13 }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 24 }}>
              <button onClick={handleSave} disabled={saving}
                style={{ flex: 1, padding: '10px 0', borderRadius: 6, border: 'none', backgroundColor: '#2563eb', color: '#fff', fontSize: 14, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}>
                {saving ? '저장 중...' : (editId ? '수정' : '등록')}
              </button>
              <button onClick={() => setShowModal(false)}
                style={{ flex: 1, padding: '10px 0', borderRadius: 6, border: '1px solid #d1d5db', backgroundColor: '#fff', fontSize: 14, cursor: 'pointer' }}>
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default ExamScheduleManagePage;
