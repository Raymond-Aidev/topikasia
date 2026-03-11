import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { examApi } from '../../api/examApi';
import { useExamStore } from '../../store/examStore';
import type { AssignedExamSet } from '../../store/examStore';

const SECTION_LABEL: Record<string, string> = {
  LISTENING: '듣기',
  WRITING: '쓰기',
  READING: '읽기',
};

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
    fontFamily: 'sans-serif',
    padding: 24,
  },
  card: {
    width: 480,
    padding: 36,
    backgroundColor: '#fff',
    borderRadius: 16,
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
  },
  title: {
    fontSize: 22,
    fontWeight: 700 as const,
    color: '#1565C0',
    marginBottom: 24,
    textAlign: 'center' as const,
  },
  examType: {
    display: 'inline-block',
    padding: '4px 12px',
    backgroundColor: '#E3F2FD',
    color: '#1565C0',
    borderRadius: 16,
    fontSize: 13,
    fontWeight: 600 as const,
    marginBottom: 12,
  },
  setName: {
    fontSize: 18,
    fontWeight: 700 as const,
    color: '#212121',
    marginBottom: 16,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    marginBottom: 24,
  },
  th: {
    padding: '10px 12px',
    backgroundColor: '#F5F5F5',
    fontSize: 13,
    fontWeight: 600 as const,
    color: '#616161',
    textAlign: 'left' as const,
    borderBottom: '1px solid #E0E0E0',
  },
  td: {
    padding: '10px 12px',
    fontSize: 14,
    color: '#424242',
    borderBottom: '1px solid #F5F5F5',
  },
  total: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 24,
    textAlign: 'right' as const,
  },
  button: {
    width: '100%',
    padding: '14px 0',
    fontSize: 16,
    fontWeight: 700 as const,
    color: '#fff',
    backgroundColor: '#1565C0',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
  },
  empty: {
    textAlign: 'center' as const,
    color: '#757575',
    fontSize: 15,
    padding: '40px 0',
  },
};

export default function ExamSetSelectScreen() {
  const navigate = useNavigate();
  const setAssignedExamSet = useExamStore((s) => s.setAssignedExamSet);
  const setExamPhase = useExamStore((s) => s.setExamPhase);

  const [examSet, setExamSet] = useState<AssignedExamSet | null>(null);
  const [loading, setLoading] = useState(true);
  const [noSet, setNoSet] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await examApi.get('/exam/assigned-set');
        if (!cancelled) {
          if (res.data) {
            setExamSet(res.data);
          } else {
            setNoSet(true);
          }
        }
      } catch {
        if (!cancelled) setNoSet(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleStart = () => {
    if (!examSet) return;
    setAssignedExamSet(examSet);
    setExamPhase('WAITING');
    navigate('/exam/waiting');
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={{ color: '#757575', fontSize: 15 }}>시험세트 정보를 불러오는 중...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.title}>시험 선택</div>

        {noSet || !examSet ? (
          <div style={styles.empty}>배정된 시험세트가 없습니다.</div>
        ) : (
          <>
            <div style={styles.examType}>{examSet.examType === 'TOPIK_I' ? 'TOPIK I' : 'TOPIK II'}</div>
            <div style={styles.setName}>{examSet.name}</div>

            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>영역</th>
                  <th style={styles.th}>문항 수</th>
                  <th style={styles.th}>시간</th>
                </tr>
              </thead>
              <tbody>
                {examSet.sections.map((sec) => (
                  <tr key={sec.section}>
                    <td style={styles.td}>{SECTION_LABEL[sec.section] || sec.section}</td>
                    <td style={styles.td}>{sec.questionCount}문항</td>
                    <td style={styles.td}>{sec.durationMinutes}분</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={styles.total}>
              총 시험시간: <strong>{examSet.totalDurationMinutes}분</strong>
            </div>

            <button style={styles.button} onClick={handleStart}>
              시험 시작
            </button>
          </>
        )}
      </div>
    </div>
  );
}
