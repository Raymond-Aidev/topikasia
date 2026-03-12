/**
 * SCR-A08: 실시간 모니터링
 * MONITOR-05: 현재 시험중 응시자 실시간 상태
 */
import React, { useEffect, useState, useCallback } from 'react';
import AdminLayout from '../components/AdminLayout';
import { adminApi } from '../../api/adminApi';

interface LiveExaminee {
  sessionId: string;
  examinee: {
    name: string;
    loginId: string;
    registrationNumber: string;
    seatNumber: number | null;
    examRoomName: string | null;
  };
  examSet: { name: string; examSetNumber: string };
  startedAt: string;
  currentSection: string | null;
  completedSections: string[];
  submittedAnswerCount: number;
  totalAnswerCount: number;
  status: string;
}

interface CompletedExaminee {
  sessionId: string;
  examinee: {
    name: string;
    loginId: string;
    registrationNumber: string;
    seatNumber: number | null;
  };
  examSet: { name: string; examSetNumber: string };
  startedAt: string;
  completedAt: string;
  status: string;
}

interface MonitorData {
  stats: { inProgress: number; completedRecent: number; totalActive: number };
  liveExaminees: LiveExaminee[];
  completedExaminees: CompletedExaminee[];
}

const SECTION_LABELS: Record<string, string> = {
  LISTENING: '듣기', WRITING: '쓰기', READING: '읽기',
};

const thStyle: React.CSSProperties = {
  padding: '10px 12px', textAlign: 'left', fontSize: '12px',
  fontWeight: 600, color: '#374151', borderBottom: '2px solid #e5e7eb',
};
const tdStyle: React.CSSProperties = {
  padding: '10px 12px', fontSize: '13px', color: '#111827', borderBottom: '1px solid #f3f4f6',
};

const formatTime = (v: string) => new Date(v).toLocaleTimeString('ko-KR');

const RealtimeMonitorPage: React.FC = () => {
  const [data, setData] = useState<MonitorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await adminApi.get('/admin/monitor/realtime');
      setData(res.data.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || '데이터 로딩 실패');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    if (!autoRefresh) return;
    const interval = setInterval(fetchData, 5000); // 5초 폴링
    return () => clearInterval(interval);
  }, [fetchData, autoRefresh]);

  const sectionBadge = (section: string | null, completed: string[]) => {
    if (!section && completed.length === 0) return <span style={{ color: '#9ca3af' }}>대기</span>;
    return (
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {completed.map(s => (
          <span key={s} style={{
            padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600,
            backgroundColor: '#d1fae5', color: '#065f46',
          }}>
            {SECTION_LABELS[s] || s}
          </span>
        ))}
        {section && (
          <span style={{
            padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600,
            backgroundColor: '#dbeafe', color: '#1e40af',
            animation: 'pulse 2s infinite',
          }}>
            {SECTION_LABELS[section] || section} 진행중
          </span>
        )}
      </div>
    );
  };

  return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>실시간 모니터링</h1>
          <span style={{ fontSize: 12, color: '#9ca3af' }}>
            {autoRefresh ? '5초 간격 자동 새로고침' : '자동 새로고침 중지'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
            <input type="checkbox" checked={autoRefresh} onChange={e => setAutoRefresh(e.target.checked)} />
            자동 새로고침
          </label>
          <button
            onClick={fetchData}
            style={{
              padding: '8px 18px', borderRadius: 6, border: '1px solid #d1d5db',
              backgroundColor: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}
          >
            새로고침
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {data && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
          <div style={{ backgroundColor: '#fff', borderRadius: 10, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 4 }}>시험 진행중</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#2563eb' }}>{data.stats.inProgress}</div>
          </div>
          <div style={{ backgroundColor: '#fff', borderRadius: 10, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 4 }}>최근 완료 (2시간)</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#16a34a' }}>{data.stats.completedRecent}</div>
          </div>
          <div style={{ backgroundColor: '#fff', borderRadius: 10, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 4 }}>전체 활동</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#374151' }}>{data.stats.totalActive}</div>
          </div>
        </div>
      )}

      {error && (
        <div style={{ padding: '12px 16px', marginBottom: 16, borderRadius: 6, backgroundColor: '#fee2e2', color: '#991b1b', fontSize: 14 }}>
          {error}
        </div>
      )}

      {/* Live Examinees */}
      <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>
        진행중 응시자 {data ? `(${data.liveExaminees.length}명)` : ''}
      </h2>
      <div style={{ backgroundColor: '#fff', borderRadius: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'auto', marginBottom: 32 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
          <thead>
            <tr>
              <th style={thStyle}>좌석</th>
              <th style={thStyle}>성명</th>
              <th style={thStyle}>수험번호</th>
              <th style={thStyle}>시험세트</th>
              <th style={thStyle}>시작시간</th>
              <th style={thStyle}>현재 영역</th>
              <th style={thStyle}>답안 저장</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ ...tdStyle, textAlign: 'center', padding: 40, color: '#9ca3af' }}>불러오는 중...</td></tr>
            ) : !data || data.liveExaminees.length === 0 ? (
              <tr><td colSpan={7} style={{ ...tdStyle, textAlign: 'center', padding: 40, color: '#9ca3af' }}>현재 시험 진행중인 응시자가 없습니다.</td></tr>
            ) : data.liveExaminees.map(e => (
              <tr key={e.sessionId}>
                <td style={{ ...tdStyle, fontWeight: 600 }}>{e.examinee.seatNumber ?? '-'}</td>
                <td style={{ ...tdStyle, fontWeight: 600 }}>{e.examinee.name}</td>
                <td style={{ ...tdStyle, fontSize: 12, color: '#6b7280' }}>{e.examinee.registrationNumber}</td>
                <td style={{ ...tdStyle, fontSize: 12 }}>{e.examSet.name}</td>
                <td style={{ ...tdStyle, fontSize: 12, color: '#6b7280' }}>{formatTime(e.startedAt)}</td>
                <td style={tdStyle}>{sectionBadge(e.currentSection, e.completedSections)}</td>
                <td style={tdStyle}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>
                    {e.submittedAnswerCount}/{e.totalAnswerCount}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Recently Completed */}
      {data && data.completedExaminees.length > 0 && (
        <>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>
            최근 완료 ({data.completedExaminees.length}명)
          </h2>
          <div style={{ backgroundColor: '#fff', borderRadius: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle}>좌석</th>
                  <th style={thStyle}>성명</th>
                  <th style={thStyle}>수험번호</th>
                  <th style={thStyle}>시험세트</th>
                  <th style={thStyle}>시작</th>
                  <th style={thStyle}>완료</th>
                </tr>
              </thead>
              <tbody>
                {data.completedExaminees.map(e => (
                  <tr key={e.sessionId}>
                    <td style={tdStyle}>{e.examinee.seatNumber ?? '-'}</td>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{e.examinee.name}</td>
                    <td style={{ ...tdStyle, fontSize: 12, color: '#6b7280' }}>{e.examinee.registrationNumber}</td>
                    <td style={{ ...tdStyle, fontSize: 12 }}>{e.examSet.name}</td>
                    <td style={{ ...tdStyle, fontSize: 12, color: '#6b7280' }}>{formatTime(e.startedAt)}</td>
                    <td style={{ ...tdStyle, fontSize: 12, color: '#16a34a', fontWeight: 600 }}>{formatTime(e.completedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </AdminLayout>
  );
};

export default RealtimeMonitorPage;
