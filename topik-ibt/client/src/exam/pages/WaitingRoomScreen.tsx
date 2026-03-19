import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { examApi } from '../../api/examApi';
import { useExamStore } from '../../store/examStore';
import ExamHeader from '../../shared/components/ExamHeader';
import ExamineeCard from '../../shared/components/ExamineeCard';
import CountdownOverlay from '../../shared/components/CountdownOverlay';
import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/button';

const WS_URL = import.meta.env.VITE_WS_URL || import.meta.env.VITE_API_URL || 'http://localhost:3000';

const SECTION_LABEL: Record<string, string> = {
  LISTENING: '듣기',
  WRITING: '쓰기',
  READING: '읽기',
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
  const [manualStarting, setManualStarting] = useState(false);

  // SYNC-08: scheduledStartAt가 없으면 수동 시작 가능
  const isManualStart = assignedExamSet != null && !assignedExamSet.scheduledStartAt;

  const handleManualStart = async () => {
    if (manualStarting) return;
    setManualStarting(true);
    try {
      const res = await examApi.post('/exam/sessions', {
        examSetId: assignedExamSet?.examSetId,
      });
      const sessionData = res.data?.data || res.data;
      setSession(sessionData.id || sessionData.sessionId);
      setCurrentSection('LISTENING');
      setExamPhase('IN_PROGRESS');
      setCountdownSeconds(null);
      navigate('/exam/section-waiting');
    } catch (err: any) {
      if (err?.response?.status === 403 && err?.response?.data?.code === 'EXAM_ALREADY_STARTED') {
        setExamBlocked(true);
        navigate('/exam-blocked');
      }
      setManualStarting(false);
    }
  };

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
        const wsSessionData = res.data?.data || res.data;
        setSession(wsSessionData.id || wsSessionData.sessionId);
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
      <div className="pt-[72px] min-h-screen bg-gray-100 font-sans">
        <div className="max-w-[600px] mx-auto px-4 py-6">
          <div className="mt-6 p-4 bg-white rounded-lg text-center text-[15px] text-gray-500 shadow-[0_1px_4px_rgba(0,0,0,0.08)]">
            시험 정보를 불러올 수 없습니다.
          </div>
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

      <div className="pt-[72px] min-h-screen bg-gray-100 font-sans">
        <div className="max-w-[600px] mx-auto px-4 py-6">
          <div className="text-xl font-bold text-blue-800 mb-5 text-center">대기실</div>

          <ExamineeCard
            seatNumber={examinee.seatNumber}
            photoUrl={examinee.photoUrl}
            registrationNumber={examinee.registrationNumber}
            name={examinee.name}
          />

          <div className="text-base font-semibold text-gray-700 mt-6 mb-3">시험 영역 일정</div>
          <table className="w-full border-collapse bg-white rounded-lg overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.08)]">
            <thead>
              <tr>
                <th className="px-3.5 py-3 bg-blue-50 text-[13px] font-semibold text-blue-800 text-left border-b border-blue-100">영역</th>
                <th className="px-3.5 py-3 bg-blue-50 text-[13px] font-semibold text-blue-800 text-left border-b border-blue-100">문항 수</th>
                <th className="px-3.5 py-3 bg-blue-50 text-[13px] font-semibold text-blue-800 text-left border-b border-blue-100">시험 시간</th>
              </tr>
            </thead>
            <tbody>
              {assignedExamSet.sections.map((sec) => (
                <tr key={sec.section}>
                  <td className="px-3.5 py-3 text-sm text-gray-700 border-b border-gray-100">{SECTION_LABEL[sec.section] || sec.section}</td>
                  <td className="px-3.5 py-3 text-sm text-gray-700 border-b border-gray-100">{sec.questionCount}문항</td>
                  <td className="px-3.5 py-3 text-sm text-gray-700 border-b border-gray-100">{sec.durationMinutes}분</td>
                </tr>
              ))}
            </tbody>
          </table>

          {isManualStart ? (
            <div className="mt-6 text-center">
              <div className="p-4 bg-white rounded-lg shadow-[0_1px_4px_rgba(0,0,0,0.08)] mb-4 text-sm text-gray-500">
                감독관 수동 시작 모드입니다. 준비가 되면 아래 버튼을 눌러 시험을 시작하세요.
              </div>
              <Button
                onClick={handleManualStart}
                disabled={manualStarting}
                className={cn(
                  'px-12 py-3.5 rounded-lg text-[17px] font-bold shadow-[0_2px_8px_rgba(21,101,192,0.3)] h-auto',
                  manualStarting ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-800 hover:bg-blue-900'
                )}
              >
                {manualStarting ? '시작하는 중...' : '시험 시작'}
              </Button>
            </div>
          ) : (
            <div className="mt-6 p-4 bg-white rounded-lg text-center text-[15px] text-gray-500 shadow-[0_1px_4px_rgba(0,0,0,0.08)]">
              <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse" />
              {connected ? '서버 연결됨 — 시험 시작을 기다리고 있습니다...' : '서버에 연결 중...'}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
