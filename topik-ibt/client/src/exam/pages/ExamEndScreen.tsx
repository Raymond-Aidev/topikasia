import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { useExamStore } from '../../store/examStore';
import ExamHeader from '../../shared/components/ExamHeader';
import ExamineeCard from '../../shared/components/ExamineeCard';
import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/button';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

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

      <div className="pt-[72px] min-h-screen bg-gray-100 font-sans">
        <div className="max-w-[500px] mx-auto px-4 py-10 text-center">
          <div className="mb-8 flex justify-center">
            <ExamineeCard
              seatNumber={examinee?.seatNumber}
              photoUrl={examinee?.photoUrl}
              registrationNumber={examinee?.registrationNumber}
              name={examinee?.name}
            />
          </div>

          <div className="text-[56px] mb-4">✅</div>
          <div className="text-2xl font-bold text-blue-800 mb-3">모든 시험이 종료되었습니다</div>
          <div className="text-[15px] text-gray-500 leading-[1.7] mb-8">
            수고하셨습니다.<br />
            감독관의 안내에 따라 퇴실하세요.
          </div>

          <Button
            className={cn(
              'px-12 py-3.5 text-base font-bold rounded-lg transition-all h-auto',
              canExit
                ? 'bg-blue-800 hover:bg-blue-900 text-white'
                : 'bg-gray-400 text-white cursor-not-allowed'
            )}
            onClick={handleExit}
            disabled={!canExit}
          >
            시험 종료
          </Button>

          {!canExit && (
            <div className="text-[13px] text-gray-400 mt-3">
              {waitSeconds}초 후 버튼이 활성화됩니다
            </div>
          )}
        </div>
      </div>
    </>
  );
}
