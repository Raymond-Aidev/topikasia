import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { useExamStore } from '../../store/examStore';
import ExamHeader from '../../shared/components/ExamHeader';
import ExamineeCard from '../../shared/components/ExamineeCard';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const styles = {
  page: {
    paddingTop: 72,
    minHeight: '100vh',
    backgroundColor: '#F5F5F5',
    fontFamily: 'sans-serif',
  },
  content: {
    maxWidth: 500,
    margin: '0 auto',
    padding: '40px 16px',
    textAlign: 'center' as const,
  },
  icon: {
    fontSize: 56,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 700 as const,
    color: '#1565C0',
    marginBottom: 12,
  },
  message: {
    fontSize: 15,
    color: '#616161',
    lineHeight: 1.7,
    marginBottom: 32,
  },
  button: {
    padding: '14px 48px',
    fontSize: 16,
    fontWeight: 700 as const,
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    transition: 'background-color 0.2s, opacity 0.2s',
  },
  buttonEnabled: {
    backgroundColor: '#1565C0',
    color: '#fff',
  },
  buttonDisabled: {
    backgroundColor: '#BDBDBD',
    color: '#fff',
    cursor: 'not-allowed' as const,
  },
  timer: {
    fontSize: 13,
    color: '#9E9E9E',
    marginTop: 12,
  },
  cardWrapper: {
    marginBottom: 32,
    display: 'flex',
    justifyContent: 'center',
  },
};

export default function ExamEndScreen() {
  const navigate = useNavigate();
  const examinee = useExamStore((s) => s.examinee);
  const assignedExamSet = useExamStore((s) => s.assignedExamSet);
  const reset = useExamStore((s) => s.reset);

  const [canExit, setCanExit] = useState(false);
  const [waitSeconds, setWaitSeconds] = useState(60);
  const socketRef = useRef<Socket | null>(null);

  // 60-second timeout to enable exit
  useEffect(() => {
    const id = setInterval(() => {
      setWaitSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          setCanExit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // WebSocket: listen for allow-exit
  useEffect(() => {
    const token = localStorage.getItem('examToken');
    const socket = io(`${API_URL}/exam`, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('exam:allow-exit', () => {
      setCanExit(true);
      setWaitSeconds(0);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleExit = () => {
    localStorage.removeItem('examToken');
    reset();
    navigate('/login', { replace: true });
  };

  return (
    <>
      <ExamHeader
        registrationNumber={examinee?.registrationNumber}
        examTitle={assignedExamSet?.name || 'TOPIK IBT'}
        timerMode="clock"
      />

      <div style={styles.page}>
        <div style={styles.content}>
          <div style={styles.cardWrapper}>
            <ExamineeCard
              seatNumber={examinee?.seatNumber}
              photoUrl={examinee?.photoUrl}
              registrationNumber={examinee?.registrationNumber}
              name={examinee?.name}
            />
          </div>

          <div style={styles.icon}>✅</div>
          <div style={styles.title}>모든 시험이 종료되었습니다</div>
          <div style={styles.message}>
            수고하셨습니다.<br />
            감독관의 안내에 따라 퇴실하세요.
          </div>

          <button
            style={{
              ...styles.button,
              ...(canExit ? styles.buttonEnabled : styles.buttonDisabled),
            }}
            onClick={handleExit}
            disabled={!canExit}
          >
            시험 종료
          </button>

          {!canExit && (
            <div style={styles.timer}>
              {waitSeconds}초 후 버튼이 활성화됩니다
            </div>
          )}
        </div>
      </div>
    </>
  );
}
