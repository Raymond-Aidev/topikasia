import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RegistrationHeader from '../components/RegistrationHeader';
import { fetchSchedules } from '../api/registrationApi';
import { useRegistrationStore } from '../store/registrationStore';
import type { ExamSchedule } from '../types/registration.types';

const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#F5F5F5',
    fontFamily: 'sans-serif',
    paddingTop: 56,
  },
  content: {
    maxWidth: 1000,
    margin: '0 auto',
    padding: '32px 24px',
  },
  title: {
    fontSize: 24,
    fontWeight: 700 as const,
    color: '#212121',
    marginBottom: 24,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
  },
  th: {
    padding: '14px 16px',
    backgroundColor: '#F5F5F5',
    fontWeight: 600 as const,
    fontSize: 13,
    color: '#616161',
    textAlign: 'left' as const,
    borderBottom: '1px solid #E0E0E0',
  },
  td: {
    padding: '14px 16px',
    fontSize: 14,
    color: '#212121',
    borderBottom: '1px solid #F5F5F5',
  },
  row: (selected: boolean) => ({
    backgroundColor: selected ? '#E3F2FD' : '#fff',
    cursor: 'pointer',
    transition: 'background-color 0.15s',
  }),
  badge: (status: string) => ({
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 600 as const,
    color: status === 'OPEN' ? '#fff' : status === 'CLOSED' ? '#fff' : '#757575',
    backgroundColor:
      status === 'OPEN' ? '#4CAF50' : status === 'CLOSED' ? '#9E9E9E' : '#E0E0E0',
  }),
  applyBtn: (disabled: boolean) => ({
    padding: '12px 40px',
    fontSize: 16,
    fontWeight: 700 as const,
    color: '#fff',
    backgroundColor: disabled ? '#90CAF9' : '#1565C0',
    border: 'none',
    borderRadius: 8,
    cursor: disabled ? 'not-allowed' : 'pointer',
    marginTop: 24,
  }),
  loading: {
    textAlign: 'center' as const,
    padding: 40,
    color: '#9E9E9E',
    fontSize: 15,
  },
  empty: {
    textAlign: 'center' as const,
    padding: 60,
    color: '#9E9E9E',
    fontSize: 15,
  },
};

const STATUS_LABELS: Record<string, string> = {
  UPCOMING: '예정',
  OPEN: '접수중',
  CLOSED: '마감',
  COMPLETED: '종료',
};

export default function ExamSchedulePage() {
  const navigate = useNavigate();
  const selectSchedule = useRegistrationStore((s) => s.selectSchedule);

  const [schedules, setSchedules] = useState<ExamSchedule[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSchedules()
      .then(setSchedules)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleRowClick = (sch: ExamSchedule) => {
    if (sch.status !== 'OPEN') return;
    setSelectedId(sch.id);
  };

  const handleApply = () => {
    const sch = schedules.find((s) => s.id === selectedId);
    if (!sch) return;
    selectSchedule(sch);
    navigate('/registration/apply');
  };

  return (
    <div style={styles.page}>
      <RegistrationHeader showTimer />

      <div style={styles.content}>
        <div style={styles.title}>시험 일정 조회</div>

        {loading && <div style={styles.loading}>불러오는 중...</div>}

        {!loading && schedules.length === 0 && (
          <div style={styles.empty}>등록된 시험 일정이 없습니다.</div>
        )}

        {!loading && schedules.length > 0 && (
          <>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>회차</th>
                  <th style={styles.th}>시험유형</th>
                  <th style={styles.th}>시험일</th>
                  <th style={styles.th}>접수마감</th>
                  <th style={styles.th}>잔여석</th>
                  <th style={styles.th}>상태</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map((sch) => {
                  const totalSeats = sch.venues.reduce((a, v) => a + v.capacity, 0);
                  const remaining = sch.venues.reduce((a, v) => a + v.remainingSeats, 0);
                  return (
                    <tr
                      key={sch.id}
                      style={styles.row(selectedId === sch.id)}
                      onClick={() => handleRowClick(sch)}
                    >
                      <td style={styles.td}>제{sch.examNumber}회</td>
                      <td style={styles.td}>
                        {sch.examType === 'TOPIK_I' ? 'TOPIK I' : 'TOPIK II'}
                      </td>
                      <td style={styles.td}>{sch.examDate}</td>
                      <td style={styles.td}>{sch.registrationEndDate}</td>
                      <td style={styles.td}>
                        {sch.status === 'OPEN'
                          ? `${remaining}/${totalSeats}`
                          : '-'}
                      </td>
                      <td style={styles.td}>
                        <span style={styles.badge(sch.status)}>
                          {STATUS_LABELS[sch.status] || sch.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <button
              style={styles.applyBtn(!selectedId)}
              onClick={handleApply}
              disabled={!selectedId}
            >
              접수하기
            </button>
          </>
        )}
      </div>
    </div>
  );
}
