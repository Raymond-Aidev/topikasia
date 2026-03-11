import React from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import { useDashboardPolling } from '../hooks/useDashboardPolling';

const cardStyle: React.CSSProperties = {
  padding: '24px',
  backgroundColor: '#fff',
  borderRadius: '10px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  flex: '1 1 200px',
};

const DashboardPage: React.FC = () => {
  const { data, isLoading, error, lastUpdated, refresh } = useDashboardPolling();

  return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>대시보드</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {lastUpdated && (
            <span style={{ fontSize: '12px', color: '#9ca3af' }}>
              마지막 갱신: {lastUpdated.toLocaleTimeString('ko-KR')}
            </span>
          )}
          <button
            onClick={refresh}
            disabled={isLoading}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              backgroundColor: '#fff',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            새로고침
          </button>
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: '12px 16px',
            marginBottom: '20px',
            borderRadius: '6px',
            backgroundColor: '#fee2e2',
            color: '#991b1b',
            fontSize: '14px',
          }}
        >
          {error}
        </div>
      )}

      {isLoading && !data ? (
        <p style={{ color: '#6b7280' }}>로딩 중...</p>
      ) : data ? (
        <>
          {/* Summary cards */}
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '32px' }}>
            <div style={cardStyle}>
              <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>전체 응시자</div>
              <div style={{ fontSize: '28px', fontWeight: 700, color: '#111827' }}>{data.totalMembers}</div>
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>진행 중</div>
              <div style={{ fontSize: '28px', fontWeight: 700, color: '#2563eb' }}>{data.inProgress}</div>
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>완료</div>
              <div style={{ fontSize: '28px', fontWeight: 700, color: '#16a34a' }}>{data.completed}</div>
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>미응시</div>
              <div style={{ fontSize: '28px', fontWeight: 700, color: '#374151' }}>{data.notStarted}</div>
            </div>
          </div>

          {/* Exam set stats */}
          {data.examSetStats.length > 0 && (
            <div style={{ marginBottom: '32px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px' }}>시험세트별 현황</h2>
              <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f9fafb' }}>
                    <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#374151' }}>시험세트</th>
                    <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#374151' }}>유형</th>
                    <th style={{ padding: '10px 16px', textAlign: 'right', fontSize: '13px', fontWeight: 600, color: '#374151' }}>배정</th>
                    <th style={{ padding: '10px 16px', textAlign: 'right', fontSize: '13px', fontWeight: 600, color: '#374151' }}>진행 중</th>
                    <th style={{ padding: '10px 16px', textAlign: 'right', fontSize: '13px', fontWeight: 600, color: '#374151' }}>완료</th>
                  </tr>
                </thead>
                <tbody>
                  {data.examSetStats.map((s) => (
                    <tr key={s.id} style={{ borderTop: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '10px 16px', fontSize: '14px' }}>{s.name}</td>
                      <td style={{ padding: '10px 16px', fontSize: '14px', color: '#6b7280' }}>{s.examType}</td>
                      <td style={{ padding: '10px 16px', fontSize: '14px', textAlign: 'right' }}>{s.assignedCount}</td>
                      <td style={{ padding: '10px 16px', fontSize: '14px', textAlign: 'right', color: '#2563eb' }}>{s.inProgressCount}</td>
                      <td style={{ padding: '10px 16px', fontSize: '14px', textAlign: 'right', color: '#16a34a' }}>{s.completedCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Quick links */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Link to="/admin/examinees" style={{ padding: '10px 20px', borderRadius: '6px', backgroundColor: '#1e293b', color: '#fff', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>
              회원관리
            </Link>
            <Link to="/admin/exam-sets" style={{ padding: '10px 20px', borderRadius: '6px', backgroundColor: '#1e293b', color: '#fff', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>
              시험세트
            </Link>
            <Link to="/admin/exam-sessions" style={{ padding: '10px 20px', borderRadius: '6px', backgroundColor: '#1e293b', color: '#fff', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>
              응시내역
            </Link>
          </div>
        </>
      ) : null}
    </AdminLayout>
  );
};

export default DashboardPage;
