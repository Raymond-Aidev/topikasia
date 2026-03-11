import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { examApi } from '../../api/examApi';
import { useExamStore } from '../../store/examStore';
import ExamHeader from '../../shared/components/ExamHeader';
import ExamineeCard from '../../shared/components/ExamineeCard';
import CountdownOverlay from '../../shared/components/CountdownOverlay';

const WS_URL = import.meta.env.VITE_WS_URL || import.meta.env.VITE_API_URL || 'http://localhost:3000';

const SECTION_LABEL: Record<string, string> = {
  LISTENING: '듣기',
  WRITING: '쓰기',
  READING: '읽기',
};

const styles = {
  page: {
    paddingTop: 72,
    minHeight: '100vh',
    backgroundColor: '#F5F5F5',
    fontFamily: 'sans-serif',
  },
  content: {
    maxWidth: 600,
    margin: '0 auto',
    padding: '24px 16px',
  },
  heading: {
    fontSize: 20,
    fontWeight: 700 as const,
    color: '#1565C0',
    marginBottom: 20,
    textAlign: 'center' as const,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 600 as const,
    color: '#424242',
    margin: '24px 0 12px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden' as const,
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
  },
  th: {
    padding: '12px 14px',
    backgroundColor: '#E3F2FD',
    fontSize: 13,
    fontWeight: 600 as const,
    color: '#1565C0',
    textAlign: 'left' as const,
    borderBottom: '1px solid #BBDEFB',
  },
  td: {
    padding: '12px 14px',
    fontSize: 14,
    color: '#424242',
    borderBottom: '1px solid #F5F5F5',
  },
  status: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    textAlign: 'center' as const,
    fontSize: 15,
    color: '#616161',
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
  },
  dot: {
    display: 'inline-block',
    width: 8,
    height: 8,
    borderRadius: '50%',
    backgroundColor: '#4CAF50',
    marginRight: 8,
    animation: 'pulse 1.5s infinite',
  },
};

export default function WaitingRoomScreen() {
  const navigate = useNavigate();
  const examinee = useExamStore((s) => s.examinee);
  const assignedExamSet = useExamStore((s) => s.assignedExamSet);
  const countdownSeconds = useExamStore((s) => s.countdownSeconds);
  const setCountdownSeconds = useExamStore((s) => s.setCountdownSeconds);
  const setSession = useExamStore((s) => s.setSession);
  const setExamPhase = useExamStore((s) => s.setExamPhase);
  const setCurrentSection = useExamStore((s) => s.setCurrentSection);
  const setExamBlocked = useExamStore((s) => s.setExamBlocked);

  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('examToken');
    const socket = io(`${WS_URL}/exam`, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('exam:countdown', (data: { seconds: number }) => {
      setCountdownSeconds(data.seconds);
    });

    socket.on('exam:start', async () => {
      try {
        const res = await examApi.post('/exam/sessions', {
          examSetId: assignedExamSet?.examSetId,
        });
        setSession(res.data.sessionId);
        setCurrentSection('LISTENING');
        setExamPhase('IN_PROGRESS');
        setCountdownSeconds(null);
        navigate('/exam/section-waiting');
      } catch (err: any) {
        if (err?.response?.status === 403 && err?.response?.data?.code === 'EXAM_ALREADY_STARTED') {
          setExamBlocked(true);
          navigate('/exam-blocked');
        }
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  if (!examinee || !assignedExamSet) {
    return (
      <div style={styles.page}>
        <div style={styles.content}>
          <div style={styles.status}>시험 정보를 불러올 수 없습니다.</div>
        </div>
      </div>
    );
  }

  return (
    <>
      {countdownSeconds != null && countdownSeconds >= 0 && (
        <CountdownOverlay seconds={countdownSeconds} totalSeconds={10} />
      )}

      <ExamHeader
        registrationNumber={examinee.registrationNumber}
        examTitle={assignedExamSet.name}
        timerMode="clock"
      />

      <div style={styles.page}>
        <div style={styles.content}>
          <div style={styles.heading}>대기실</div>

          <ExamineeCard
            seatNumber={examinee.seatNumber}
            photoUrl={examinee.photoUrl}
            registrationNumber={examinee.registrationNumber}
            name={examinee.name}
          />

          <div style={styles.sectionTitle}>시험 영역 일정</div>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>영역</th>
                <th style={styles.th}>문항 수</th>
                <th style={styles.th}>시험 시간</th>
              </tr>
            </thead>
            <tbody>
              {assignedExamSet.sections.map((sec) => (
                <tr key={sec.section}>
                  <td style={styles.td}>{SECTION_LABEL[sec.section] || sec.section}</td>
                  <td style={styles.td}>{sec.questionCount}문항</td>
                  <td style={styles.td}>{sec.durationMinutes}분</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={styles.status}>
            <span style={styles.dot} />
            {connected ? '서버 연결됨 — 시험 시작을 기다리고 있습니다...' : '서버에 연결 중...'}
          </div>
        </div>
      </div>
    </>
  );
}
