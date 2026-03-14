import React, { useEffect, useState, useCallback } from 'react';
import AdminLayout from '../components/AdminLayout';
import StatusBadge from '../components/StatusBadge';
import ExamSessionDetailModal from '../components/ExamSessionDetailModal';
import { adminApi } from '../../api/adminApi';

interface ExamSession {
  id: string;
  examineeName: string;
  examineeLoginId: string;
  examSetName: string;
  status: string;
  startedAt: string;
  endedAt: string | null;
}

interface ExamSetOption {
  id: string;
  name: string;
}

const PAGE_SIZE = 20;

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

const formatDateTime = (v: string | null) => {
  if (!v) return '-';
  return new Date(v).toLocaleString('ko-KR');
};

const ExamSessionListPage: React.FC = () => {
  const [sessions, setSessions] = useState<ExamSession[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [examSetFilter, setExamSetFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [examSets, setExamSets] = useState<ExamSetOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  // Detail modal
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, any> = { page, limit: PAGE_SIZE };
      if (statusFilter) params.status = statusFilter;
      if (examSetFilter) params.examSetId = examSetFilter;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      const res = await adminApi.get('/admin/exam-sessions', { params });
      const body = res.data?.data || res.data;
      setSessions(body.sessions || body.data || []);
      setTotal(body.pagination?.total ?? body.total ?? 0);
    } catch (err: any) {
      setError(err.response?.data?.message || '데이터를 불러오는 데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, examSetFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  useEffect(() => {
    adminApi
      .get('/admin/exam-sets/assignable')
      .then((res) => {
        const body = res.data?.data || res.data;
        setExamSets(Array.isArray(body) ? body : []);
      })
      .catch(() => {});
  }, []);

  const handleExport = async () => {
    setExporting(true);
    try {
      const params: Record<string, any> = {};
      if (statusFilter) params.status = statusFilter;
      if (examSetFilter) params.examSetId = examSetFilter;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      const res = await adminApi.get('/admin/exam-sessions/export', {
        responseType: 'blob',
        params,
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `exam-sessions-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.response?.data?.message || '내보내기에 실패했습니다.');
    } finally {
      setExporting(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>응시내역</h1>
        <button
          onClick={handleExport}
          disabled={exporting}
          style={{
            padding: '8px 18px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: '#16a34a',
            color: '#fff',
            fontSize: '14px',
            fontWeight: 600,
            cursor: exporting ? 'not-allowed' : 'pointer',
            opacity: exporting ? 0.6 : 1,
          }}
        >
          {exporting ? '내보내기 중...' : 'Excel 내보내기'}
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>기간:</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
            style={{ padding: '7px 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '13px' }}
          />
          <span style={{ color: '#9ca3af' }}>~</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
            style={{ padding: '7px 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '13px' }}
          />
        </div>

        <select
          value={examSetFilter}
          onChange={(e) => { setExamSetFilter(e.target.value); setPage(1); }}
          style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '13px', backgroundColor: '#fff' }}
        >
          <option value="">전체 시험세트</option>
          {examSets.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '13px', backgroundColor: '#fff' }}
        >
          <option value="">전체 상태</option>
          <option value="IN_PROGRESS">진행 중</option>
          <option value="COMPLETED">완료</option>
          <option value="TIMED_OUT">시간 초과</option>
          <option value="ABANDONED">중단</option>
        </select>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', marginBottom: '16px', borderRadius: '6px', backgroundColor: '#fee2e2', color: '#991b1b', fontSize: '14px' }}>
          {error}
        </div>
      )}

      <div style={{ backgroundColor: '#fff', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={thStyle}>ID</th>
              <th style={thStyle}>성명</th>
              <th style={thStyle}>세트</th>
              <th style={thStyle}>시작시간</th>
              <th style={thStyle}>종료시간</th>
              <th style={thStyle}>상태</th>
              <th style={thStyle}>관리</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ ...tdStyle, textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                  불러오는 중...
                </td>
              </tr>
            ) : sessions.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ ...tdStyle, textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                  데이터가 없습니다.
                </td>
              </tr>
            ) : (
              sessions.map((s) => (
                <tr key={s.id}>
                  <td style={tdStyle}>
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>{s.examineeLoginId}</span>
                  </td>
                  <td style={{ ...tdStyle, fontWeight: 600 }}>{s.examineeName}</td>
                  <td style={tdStyle}>{s.examSetName}</td>
                  <td style={{ ...tdStyle, fontSize: '12px', color: '#6b7280' }}>{formatDateTime(s.startedAt)}</td>
                  <td style={{ ...tdStyle, fontSize: '12px', color: '#6b7280' }}>{formatDateTime(s.endedAt)}</td>
                  <td style={tdStyle}><StatusBadge status={s.status} type="session" /></td>
                  <td style={tdStyle}>
                    <button
                      onClick={() => setSelectedSessionId(s.id)}
                      style={{
                        padding: '4px 12px',
                        borderRadius: '4px',
                        border: '1px solid #d1d5db',
                        backgroundColor: '#fff',
                        fontSize: '12px',
                        cursor: 'pointer',
                      }}
                    >
                      보기
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginTop: '20px' }}>
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            style={{
              padding: '6px 12px',
              borderRadius: '4px',
              border: '1px solid #d1d5db',
              backgroundColor: '#fff',
              fontSize: '13px',
              cursor: page <= 1 ? 'not-allowed' : 'pointer',
              opacity: page <= 1 ? 0.5 : 1,
            }}
          >
            이전
          </button>
          {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
            const start = Math.max(1, Math.min(page - 4, totalPages - 9));
            const p = start + i;
            if (p > totalPages) return null;
            return (
              <button
                key={p}
                onClick={() => setPage(p)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '4px',
                  border: '1px solid #d1d5db',
                  backgroundColor: p === page ? '#2563eb' : '#fff',
                  color: p === page ? '#fff' : '#374151',
                  fontSize: '13px',
                  fontWeight: p === page ? 600 : 400,
                  cursor: 'pointer',
                }}
              >
                {p}
              </button>
            );
          })}
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
            style={{
              padding: '6px 12px',
              borderRadius: '4px',
              border: '1px solid #d1d5db',
              backgroundColor: '#fff',
              fontSize: '13px',
              cursor: page >= totalPages ? 'not-allowed' : 'pointer',
              opacity: page >= totalPages ? 0.5 : 1,
            }}
          >
            다음
          </button>
        </div>
      )}

      <ExamSessionDetailModal
        isOpen={!!selectedSessionId}
        sessionId={selectedSessionId}
        onClose={() => setSelectedSessionId(null)}
      />
    </AdminLayout>
  );
};

export default ExamSessionListPage;
