import React, { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import ExamSetStatusBadge from '../components/ExamSetStatusBadge';
import ExamSetScheduleInput from '../components/ExamSetScheduleInput';
import { adminApi } from '../../api/adminApi';

interface ExamSet {
  id: string;
  name: string;
  examType: string;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  assignedCount: number;
  questionCount?: number;
  scheduledStartAt?: string | null;
  examStartedAt?: string | null;
}

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

const ExamSetListPage: React.FC = () => {
  const [examSets, setExamSets] = useState<ExamSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingSchedule, setEditingSchedule] = useState<string | null>(null);
  const [scheduleValue, setScheduleValue] = useState('');
  const [savingSchedule, setSavingSchedule] = useState(false);

  const fetchExamSets = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.get<ExamSet[]>('/admin/exam-sets');
      const body = res.data?.data || res.data;
      setExamSets(Array.isArray(body) ? body : []);
    } catch (err: any) {
      setError(err.response?.data?.message || '데이터를 불러오는 데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExamSets();
  }, []);

  const handleScheduleSave = async (examSetId: string) => {
    setSavingSchedule(true);
    try {
      await adminApi.patch(`/admin/exam-sets/${examSetId}/schedule`, {
        scheduledStartAt: scheduleValue ? new Date(scheduleValue).toISOString() : null,
      });
      await fetchExamSets();
      setEditingSchedule(null);
    } catch (err: any) {
      alert(err.response?.data?.message || '일정 저장에 실패했습니다.');
    } finally {
      setSavingSchedule(false);
    }
  };

  const openScheduleEditor = (es: ExamSet) => {
    setEditingSchedule(es.id);
    if (es.scheduledStartAt) {
      const d = new Date(es.scheduledStartAt);
      const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      setScheduleValue(local);
    } else {
      setScheduleValue('');
    }
  };

  return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>시험세트 관리</h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={fetchExamSets}
            disabled={loading}
            style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #d1d5db', backgroundColor: '#fff', fontSize: '13px', cursor: 'pointer' }}
          >
            새로고침
          </button>
          <a
            href="/question-module/sets"
            style={{
              padding: '8px 18px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: '#2563eb',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 600,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            문제 출제 모듈
          </a>
        </div>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', marginBottom: '16px', borderRadius: '6px', backgroundColor: '#fee2e2', color: '#991b1b', fontSize: '14px' }}>
          {error}
        </div>
      )}

      <div style={{ backgroundColor: '#fff', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>불러오는 중...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>#</th>
                <th style={thStyle}>세트명</th>
                <th style={thStyle}>유형</th>
                <th style={thStyle}>상태</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>배정수</th>
                <th style={thStyle}>관리</th>
              </tr>
            </thead>
            <tbody>
              {examSets.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ ...tdStyle, textAlign: 'center', color: '#9ca3af', padding: '40px' }}>
                    시험세트가 없습니다.
                  </td>
                </tr>
              ) : (
                examSets.map((es, idx) => (
                  <React.Fragment key={es.id}>
                    <tr>
                      <td style={tdStyle}>{idx + 1}</td>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>{es.name}</td>
                      <td style={tdStyle}>{es.examType}</td>
                      <td style={tdStyle}>
                        <ExamSetStatusBadge
                          status={es.status}
                          scheduledStartAt={es.scheduledStartAt}
                          examStartedAt={es.examStartedAt}
                        />
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>{es.assignedCount ?? 0}</td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <a
                            href={`/question-module/compose/${es.id}`}
                            style={{
                              padding: '4px 12px',
                              borderRadius: '4px',
                              border: '1px solid #d1d5db',
                              backgroundColor: '#fff',
                              fontSize: '12px',
                              textDecoration: 'none',
                              color: '#374151',
                            }}
                          >
                            편집
                          </a>
                          {es.status === 'ACTIVE' && (
                            <button
                              onClick={() => openScheduleEditor(es)}
                              style={{
                                padding: '4px 12px',
                                borderRadius: '4px',
                                border: '1px solid #d1d5db',
                                backgroundColor: '#fff',
                                fontSize: '12px',
                                cursor: 'pointer',
                              }}
                            >
                              시간 설정
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {editingSchedule === es.id && (
                      <tr>
                        <td colSpan={6} style={{ padding: '16px 14px', backgroundColor: '#f9fafb', borderBottom: '1px solid #f3f4f6' }}>
                          <div style={{ maxWidth: '480px' }}>
                            <ExamSetScheduleInput
                              value={scheduleValue}
                              onChange={setScheduleValue}
                              disabled={savingSchedule}
                            />
                            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                              <button
                                onClick={() => handleScheduleSave(es.id)}
                                disabled={savingSchedule}
                                style={{
                                  padding: '8px 16px',
                                  borderRadius: '6px',
                                  border: 'none',
                                  backgroundColor: '#2563eb',
                                  color: '#fff',
                                  fontSize: '13px',
                                  fontWeight: 600,
                                  cursor: savingSchedule ? 'not-allowed' : 'pointer',
                                  opacity: savingSchedule ? 0.6 : 1,
                                }}
                              >
                                {savingSchedule ? '저장 중...' : '저장'}
                              </button>
                              <button
                                onClick={() => setEditingSchedule(null)}
                                style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #d1d5db', backgroundColor: '#fff', fontSize: '13px', cursor: 'pointer' }}
                              >
                                취소
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
  );
};

export default ExamSetListPage;
