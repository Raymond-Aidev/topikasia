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
  hero: {
    backgroundColor: '#1565C0',
    color: '#fff',
    textAlign: 'center' as const,
    padding: '64px 24px',
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: 800 as const,
    marginBottom: 12,
  },
  heroSub: {
    fontSize: 18,
    fontWeight: 400 as const,
    opacity: 0.85,
    marginBottom: 40,
  },
  heroBtns: {
    display: 'flex',
    gap: 16,
    justifyContent: 'center',
  },
  primaryBtn: {
    padding: '14px 40px',
    fontSize: 16,
    fontWeight: 700 as const,
    color: '#1565C0',
    backgroundColor: '#FFFFFF',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
  },
  secondaryBtn: {
    padding: '14px 40px',
    fontSize: 16,
    fontWeight: 700 as const,
    color: '#FFFFFF',
    backgroundColor: 'transparent',
    border: '2px solid #FFFFFF',
    borderRadius: 8,
    cursor: 'pointer',
  },
  section: {
    maxWidth: 960,
    margin: '0 auto',
    padding: '40px 24px',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 700 as const,
    color: '#212121',
    marginBottom: 24,
  },
  cardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: 700 as const,
    color: '#212121',
    marginBottom: 12,
  },
  cardRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 14,
    color: '#616161',
    marginBottom: 6,
  },
  statusBadge: (status: string) => ({
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 600 as const,
    color: status === 'OPEN' ? '#FFFFFF' : '#757575',
    backgroundColor: status === 'OPEN' ? '#4CAF50' : '#E0E0E0',
    marginTop: 12,
  }),
  cardBtn: {
    marginTop: 16,
    width: '100%',
    padding: '10px 0',
    fontSize: 14,
    fontWeight: 600 as const,
    color: '#FFFFFF',
    backgroundColor: '#1565C0',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
  },
  loading: {
    textAlign: 'center' as const,
    padding: 40,
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

export default function LandingPage() {
  const navigate = useNavigate();
  const isLoggedIn = useRegistrationStore((s) => s.isLoggedIn);
  const setSchedules = useRegistrationStore((s) => s.setSchedules);
  const selectSchedule = useRegistrationStore((s) => s.selectSchedule);

  const [schedules, setLocalSchedules] = useState<ExamSchedule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSchedules()
      .then((data) => {
        setLocalSchedules(data);
        setSchedules(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [setSchedules]);

  const handleApply = (schedule: ExamSchedule) => {
    selectSchedule(schedule);
    if (!isLoggedIn) {
      navigate('/registration/login');
    } else {
      navigate('/registration/apply');
    }
  };

  return (
    <div style={styles.page}>
      <RegistrationHeader showTimer={false} />

      <div style={styles.hero}>
        <div style={styles.heroTitle}>한국어능력시험 TOPIK IBT</div>
        <div style={styles.heroSub}>온라인 시험 접수 시스템</div>
        <div style={styles.heroBtns}>
          <button
            style={styles.primaryBtn}
            onClick={() =>
              isLoggedIn
                ? navigate('/registration/schedules')
                : navigate('/registration/login')
            }
          >
            접수하기
          </button>
          {!isLoggedIn && (
            <button
              style={styles.secondaryBtn}
              onClick={() => navigate('/registration/login')}
            >
              로그인
            </button>
          )}
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>진행 중인 시험 일정</div>

        {loading && <div style={styles.loading}>불러오는 중...</div>}

        <div style={styles.cardGrid}>
          {schedules.map((sch) => (
            <div key={sch.id} style={styles.card}>
              <div style={styles.cardTitle}>{sch.examName}</div>
              <div style={styles.cardRow}>
                <span>시험유형</span>
                <span>{sch.examType === 'TOPIK_I' ? 'TOPIK I' : 'TOPIK II'}</span>
              </div>
              <div style={styles.cardRow}>
                <span>시험일</span>
                <span>{sch.examDate}</span>
              </div>
              <div style={styles.cardRow}>
                <span>접수마감</span>
                <span>{sch.registrationEndDate}</span>
              </div>
              <div style={styles.statusBadge(sch.status)}>
                {STATUS_LABELS[sch.status] || sch.status}
              </div>
              {sch.status === 'OPEN' && (
                <button style={styles.cardBtn} onClick={() => handleApply(sch)}>
                  접수하기
                </button>
              )}
            </div>
          ))}
        </div>

        {!loading && schedules.length === 0 && (
          <div style={styles.loading}>현재 진행 중인 시험 일정이 없습니다.</div>
        )}
      </div>
    </div>
  );
}
