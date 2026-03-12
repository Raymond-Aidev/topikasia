import React, { useEffect, useState, useCallback } from 'react';
import AdminLayout from '../components/AdminLayout';
import { adminApi } from '../../api/adminApi';

interface Registration {
  id: string;
  englishName: string;
  birthDate: string;
  gender: string;
  status: string;
  examName: string;
  examType: string;
  examDate: string;
  venueName: string;
  userName: string;
  userEmail: string;
  createdAt: string;
  rejectionNote?: string;
}

interface PaginatedResponse {
  data: Registration[];
  total: number;
  page: number;
  totalPages: number;
}

const PAGE_SIZE = 20;

const STATUS_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  PENDING: { bg: '#fef3c7', color: '#92400e', label: '대기' },
  APPROVED: { bg: '#dcfce7', color: '#166534', label: '승인' },
  REJECTED: { bg: '#fee2e2', color: '#991b1b', label: '반려' },
  CANCELLED: { bg: '#f3f4f6', color: '#6b7280', label: '취소' },
};

const thStyle: React.CSSProperties = {
  padding: '10px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#374151',
};
const tdStyle: React.CSSProperties = {
  padding: '10px 16px', fontSize: '14px',
};

const RegistrationListPage: React.FC = () => {
  const [items, setItems] = useState<Registration[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [processing, setProcessing] = useState(false);

  // Detail modal
  const [detail, setDetail] = useState<Registration | null>(null);
  const [rejectNote, setRejectNote] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.get<PaginatedResponse>('/admin/registrations', {
        params: { page, limit: PAGE_SIZE, search: search || undefined, status: statusFilter || undefined },
      });
      setItems(res.data.data);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
    } catch (err: any) {
      setError(err.response?.data?.message || '데이터를 불러오는 데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const pendingIds = items.filter((r) => r.status === 'PENDING').map((r) => r.id);
    if (pendingIds.every((id) => selected.has(id))) {
      setSelected((prev) => { const next = new Set(prev); pendingIds.forEach((id) => next.delete(id)); return next; });
    } else {
      setSelected((prev) => { const next = new Set(prev); pendingIds.forEach((id) => next.add(id)); return next; });
    }
  };

  const handleApprove = async (id: string) => {
    if (!confirm('이 접수를 승인하시겠습니까? 응시자 계정이 자동 생성됩니다.')) return;
    setProcessing(true);
    try {
      const res = await adminApi.put(`/admin/registrations/${id}/approve`);
      const data = res.data.data;
      alert(`승인 완료!\n\n로그인 ID: ${data.loginId}\n임시 비밀번호: ${data.temporaryPassword}\n수험번호: ${data.registrationNumber}`);
      fetchData();
      setDetail(null);
    } catch (err: any) {
      alert(err.response?.data?.message || '승인 처리에 실패했습니다.');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (id: string) => {
    if (!rejectNote.trim()) { alert('반려 사유를 입력해주세요.'); return; }
    setProcessing(true);
    try {
      await adminApi.put(`/admin/registrations/${id}/reject`, { rejectionNote: rejectNote });
      alert('반려 처리 완료');
      fetchData();
      setDetail(null);
      setRejectNote('');
    } catch (err: any) {
      alert(err.response?.data?.message || '반려 처리에 실패했습니다.');
    } finally {
      setProcessing(false);
    }
  };

  const handleBatchApprove = async () => {
    const ids = Array.from(selected);
    if (ids.length === 0) { alert('선택된 접수가 없습니다.'); return; }
    if (!confirm(`${ids.length}건을 일괄 승인하시겠습니까?`)) return;
    setProcessing(true);
    try {
      const res = await adminApi.post('/admin/registrations/batch-approve', { registrationIds: ids });
      const approved = res.data.data;
      const summary = approved.map((a: any) => `${a.englishName}: ${a.loginId} / ${a.temporaryPassword}`).join('\n');
      alert(`${approved.length}건 일괄 승인 완료!\n\n${summary}`);
      setSelected(new Set());
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || '일괄 승인에 실패했습니다.');
    } finally {
      setProcessing(false);
    }
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const s = STATUS_COLORS[status] || { bg: '#f3f4f6', color: '#6b7280', label: status };
    return <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600, backgroundColor: s.bg, color: s.color }}>{s.label}</span>;
  };

  return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>접수 관리</h1>
        <div style={{ fontSize: 14, color: '#6b7280' }}>총 {total}건</div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8 }}>
          <input
            type="text" placeholder="이름 또는 이메일 검색" value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 14, width: 240 }}
          />
          <button type="submit" style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #d1d5db', backgroundColor: '#fff', fontSize: 14, cursor: 'pointer' }}>
            검색
          </button>
        </form>
        <select
          value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 14 }}
        >
          <option value="">전체 상태</option>
          <option value="PENDING">대기</option>
          <option value="APPROVED">승인</option>
          <option value="REJECTED">반려</option>
          <option value="CANCELLED">취소</option>
        </select>
        {selected.size > 0 && (
          <button
            onClick={handleBatchApprove} disabled={processing}
            style={{ padding: '8px 18px', borderRadius: 6, border: 'none', backgroundColor: '#16a34a', color: '#fff', fontSize: 14, fontWeight: 600, cursor: processing ? 'not-allowed' : 'pointer', opacity: processing ? 0.6 : 1 }}
          >
            {processing ? '처리 중...' : `선택 일괄 승인 (${selected.size}건)`}
          </button>
        )}
      </div>

      {error && (
        <div style={{ padding: '12px 16px', marginBottom: 16, borderRadius: 6, backgroundColor: '#fee2e2', color: '#991b1b', fontSize: 14 }}>{error}</div>
      )}

      {loading ? (
        <p style={{ color: '#6b7280' }}>로딩 중...</p>
      ) : (
        <>
          <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb' }}>
                <th style={{ ...thStyle, width: 40 }}>
                  <input type="checkbox" onChange={toggleSelectAll}
                    checked={items.filter((r) => r.status === 'PENDING').length > 0 && items.filter((r) => r.status === 'PENDING').every((r) => selected.has(r.id))}
                  />
                </th>
                <th style={thStyle}>영문이름</th>
                <th style={thStyle}>이메일</th>
                <th style={thStyle}>시험</th>
                <th style={thStyle}>시험장</th>
                <th style={thStyle}>상태</th>
                <th style={thStyle}>신청일</th>
                <th style={thStyle}>처리</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan={8} style={{ ...tdStyle, textAlign: 'center', color: '#9ca3af', padding: 40 }}>데이터가 없습니다.</td></tr>
              ) : (
                items.map((r) => (
                  <tr key={r.id} style={{ borderTop: '1px solid #f3f4f6', backgroundColor: selected.has(r.id) ? '#eff6ff' : undefined }}>
                    <td style={tdStyle}>
                      {r.status === 'PENDING' && (
                        <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggleSelect(r.id)} />
                      )}
                    </td>
                    <td style={tdStyle}>
                      <button onClick={() => { setDetail(r); setRejectNote(''); }} style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontWeight: 500, fontSize: 14, padding: 0 }}>
                        {r.englishName}
                      </button>
                    </td>
                    <td style={{ ...tdStyle, color: '#6b7280', fontSize: 13 }}>{r.userEmail}</td>
                    <td style={{ ...tdStyle, fontSize: 13 }}>{r.examName}</td>
                    <td style={{ ...tdStyle, color: '#6b7280', fontSize: 13 }}>{r.venueName}</td>
                    <td style={tdStyle}><StatusBadge status={r.status} /></td>
                    <td style={{ ...tdStyle, color: '#6b7280', fontSize: 13 }}>{new Date(r.createdAt).toLocaleDateString('ko')}</td>
                    <td style={tdStyle}>
                      {r.status === 'PENDING' && (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => handleApprove(r.id)} disabled={processing}
                            style={{ padding: '4px 12px', borderRadius: 4, border: 'none', backgroundColor: '#16a34a', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                            승인
                          </button>
                          <button onClick={() => { setDetail(r); setRejectNote(''); }}
                            style={{ padding: '4px 12px', borderRadius: 4, border: '1px solid #d1d5db', backgroundColor: '#fff', color: '#6b7280', fontSize: 12, cursor: 'pointer' }}>
                            반려
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #d1d5db', backgroundColor: '#fff', fontSize: 13, cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1 }}>
                이전
              </button>
              <span style={{ display: 'flex', alignItems: 'center', fontSize: 13, color: '#6b7280' }}>{page} / {totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #d1d5db', backgroundColor: '#fff', fontSize: 13, cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.5 : 1 }}>
                다음
              </button>
            </div>
          )}
        </>
      )}

      {/* Detail / Reject Modal */}
      {detail && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ width: '100%', maxWidth: 520, padding: 32, backgroundColor: '#fff', borderRadius: 12, boxShadow: '0 4px 24px rgba(0,0,0,0.15)', maxHeight: '80vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 0, marginBottom: 20 }}>접수 상세</h2>

            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '10px 16px', fontSize: 14, marginBottom: 24 }}>
              <span style={{ color: '#6b7280', fontWeight: 600 }}>영문이름</span><span>{detail.englishName}</span>
              <span style={{ color: '#6b7280', fontWeight: 600 }}>회원이름</span><span>{detail.userName}</span>
              <span style={{ color: '#6b7280', fontWeight: 600 }}>이메일</span><span>{detail.userEmail}</span>
              <span style={{ color: '#6b7280', fontWeight: 600 }}>생년월일</span><span>{detail.birthDate ? new Date(detail.birthDate).toLocaleDateString('ko') : '-'}</span>
              <span style={{ color: '#6b7280', fontWeight: 600 }}>성별</span><span>{detail.gender === 'MALE' ? '남성' : '여성'}</span>
              <span style={{ color: '#6b7280', fontWeight: 600 }}>시험</span><span>{detail.examName} ({detail.examType})</span>
              <span style={{ color: '#6b7280', fontWeight: 600 }}>시험일</span><span>{detail.examDate ? new Date(detail.examDate).toLocaleDateString('ko') : '-'}</span>
              <span style={{ color: '#6b7280', fontWeight: 600 }}>시험장</span><span>{detail.venueName}</span>
              <span style={{ color: '#6b7280', fontWeight: 600 }}>상태</span><span><StatusBadge status={detail.status} /></span>
              <span style={{ color: '#6b7280', fontWeight: 600 }}>신청일</span><span>{new Date(detail.createdAt).toLocaleString('ko')}</span>
              {detail.rejectionNote && (
                <><span style={{ color: '#6b7280', fontWeight: 600 }}>반려사유</span><span style={{ color: '#991b1b' }}>{detail.rejectionNote}</span></>
              )}
            </div>

            {detail.status === 'PENDING' && (
              <>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 4, color: '#374151' }}>반려 사유 (반려 시 필수)</label>
                  <textarea
                    value={rejectNote} onChange={(e) => setRejectNote(e.target.value)}
                    placeholder="반려 사유를 입력하세요"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 14, minHeight: 80, boxSizing: 'border-box', resize: 'vertical' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => handleApprove(detail.id)} disabled={processing}
                    style={{ flex: 1, padding: '10px 0', borderRadius: 6, border: 'none', backgroundColor: '#16a34a', color: '#fff', fontSize: 14, fontWeight: 600, cursor: processing ? 'not-allowed' : 'pointer' }}>
                    {processing ? '처리 중...' : '승인 (계정 생성)'}
                  </button>
                  <button onClick={() => handleReject(detail.id)} disabled={processing}
                    style={{ flex: 1, padding: '10px 0', borderRadius: 6, border: '1px solid #dc2626', backgroundColor: '#fff', color: '#dc2626', fontSize: 14, fontWeight: 600, cursor: processing ? 'not-allowed' : 'pointer' }}>
                    {processing ? '처리 중...' : '반려'}
                  </button>
                </div>
              </>
            )}

            <button onClick={() => setDetail(null)}
              style={{ marginTop: 16, width: '100%', padding: '10px 0', borderRadius: 6, border: '1px solid #d1d5db', backgroundColor: '#fff', fontSize: 14, cursor: 'pointer' }}>
              닫기
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default RegistrationListPage;
