import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import StatusBadge from '../components/StatusBadge';
import { adminApi } from '../../api/adminApi';

interface Examinee {
  id: string;
  name: string;
  loginId: string;
  status: string;
  examSetName?: string;
  seatNumber?: string;
}

interface PaginatedResponse {
  data: Examinee[];
  total: number;
  page: number;
  limit: number;
}

const PAGE_SIZE = 20;

const thStyle: React.CSSProperties = {
  padding: '10px 16px',
  textAlign: 'left',
  fontSize: '13px',
  fontWeight: 600,
  color: '#374151',
};

const tdStyle: React.CSSProperties = {
  padding: '10px 16px',
  fontSize: '14px',
};

const ExamineeListPage: React.FC = () => {
  const [examinees, setExaminees] = useState<Examinee[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', loginId: '', password: '', seatNumber: '' });
  const [creating, setCreating] = useState(false);

  const fetchExaminees = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.get<PaginatedResponse>('/admin/examinees', {
        params: { page, limit: PAGE_SIZE, search: search || undefined },
      });
      setExaminees(res.data.data);
      setTotal(res.data.total);
    } catch (err: any) {
      setError(err.response?.data?.message || '데이터를 불러오는 데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchExaminees();
  }, [fetchExaminees]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchExaminees();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await adminApi.post('/admin/examinees', createForm);
      setShowCreate(false);
      setCreateForm({ name: '', loginId: '', password: '', seatNumber: '' });
      fetchExaminees();
    } catch (err: any) {
      alert(err.response?.data?.message || '생성에 실패했습니다.');
    } finally {
      setCreating(false);
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>회원관리</h1>
        <button
          onClick={() => setShowCreate(true)}
          style={{
            padding: '8px 18px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: '#1e293b',
            color: '#fff',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          응시자 추가
        </button>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <input
          type="text"
          placeholder="이름 또는 아이디로 검색"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid #d1d5db',
            fontSize: '14px',
            flex: '1',
            maxWidth: '320px',
          }}
        />
        <button
          type="submit"
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: '1px solid #d1d5db',
            backgroundColor: '#fff',
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          검색
        </button>
      </form>

      {error && (
        <div style={{ padding: '12px 16px', marginBottom: '16px', borderRadius: '6px', backgroundColor: '#fee2e2', color: '#991b1b', fontSize: '14px' }}>
          {error}
        </div>
      )}

      {loading ? (
        <p style={{ color: '#6b7280' }}>로딩 중...</p>
      ) : (
        <>
          <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb' }}>
                <th style={thStyle}>이름</th>
                <th style={thStyle}>아이디</th>
                <th style={thStyle}>상태</th>
                <th style={thStyle}>시험세트</th>
                <th style={thStyle}>좌석번호</th>
              </tr>
            </thead>
            <tbody>
              {examinees.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ ...tdStyle, textAlign: 'center', color: '#9ca3af', padding: '40px 16px' }}>
                    데이터가 없습니다.
                  </td>
                </tr>
              ) : (
                examinees.map((ex) => (
                  <tr key={ex.id} style={{ borderTop: '1px solid #f3f4f6' }}>
                    <td style={tdStyle}>
                      <Link to={`/admin/examinees/${ex.id}`} style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 500 }}>
                        {ex.name}
                      </Link>
                    </td>
                    <td style={{ ...tdStyle, color: '#6b7280' }}>{ex.loginId}</td>
                    <td style={tdStyle}><StatusBadge status={ex.status} /></td>
                    <td style={{ ...tdStyle, color: '#6b7280' }}>{ex.examSetName || '-'}</td>
                    <td style={{ ...tdStyle, color: '#6b7280' }}>{ex.seatNumber || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '20px' }}>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #d1d5db', backgroundColor: '#fff', fontSize: '13px', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1 }}
              >
                이전
              </button>
              <span style={{ display: 'flex', alignItems: 'center', fontSize: '13px', color: '#6b7280' }}>
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #d1d5db', backgroundColor: '#fff', fontSize: '13px', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.5 : 1 }}
              >
                다음
              </button>
            </div>
          )}
        </>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <form
            onSubmit={handleCreate}
            style={{ width: '100%', maxWidth: '440px', padding: '32px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 4px 24px rgba(0,0,0,0.15)' }}
          >
            <h2 style={{ fontSize: '18px', fontWeight: 700, marginTop: 0, marginBottom: '20px' }}>응시자 추가</h2>
            {[
              { label: '이름', key: 'name' as const, type: 'text' },
              { label: '아이디', key: 'loginId' as const, type: 'text' },
              { label: '비밀번호', key: 'password' as const, type: 'password' },
              { label: '좌석번호', key: 'seatNumber' as const, type: 'text' },
            ].map((field) => (
              <div key={field.key} style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '4px', color: '#374151' }}>
                  {field.label}
                </label>
                <input
                  type={field.type}
                  required={field.key !== 'seatNumber'}
                  value={createForm[field.key]}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, [field.key]: e.target.value }))}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #d1d5db', backgroundColor: '#fff', fontSize: '14px', cursor: 'pointer' }}
              >
                취소
              </button>
              <button
                type="submit"
                disabled={creating}
                style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: '#1e293b', color: '#fff', fontSize: '14px', fontWeight: 500, cursor: creating ? 'not-allowed' : 'pointer', opacity: creating ? 0.6 : 1 }}
              >
                {creating ? '생성 중...' : '생성'}
              </button>
            </div>
          </form>
        </div>
      )}
    </AdminLayout>
  );
};

export default ExamineeListPage;
