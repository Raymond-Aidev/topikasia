import { useNavigate } from 'react-router-dom';
import { useExamStore } from '../../store/examStore';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';

export default function ExamBlockedScreen() {
  const navigate = useNavigate();
  const reset = useExamStore((s) => s.reset);

  const handleLogout = () => {
    localStorage.removeItem('examToken');
    reset();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 font-sans">
      <Card className="w-[420px] p-12 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.1)] text-center">
        <CardContent className="p-0">
          <div className="text-[56px] mb-4">🚫</div>
          <div className="text-[22px] font-bold text-red-800 mb-3">시험이 이미 시작되었습니다</div>
          <div className="text-[15px] text-gray-500 leading-relaxed mb-8">
            시험 시작 시간이 지났습니다.<br />
            감독관에게 문의하세요.
          </div>
          <Button
            className="px-8 py-3 text-[15px] font-semibold bg-gray-500 hover:bg-gray-600 rounded-lg h-auto"
            onClick={handleLogout}
          >
            로그아웃
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
