import { useNavigate } from 'react-router-dom';
import { useExamStore } from '../../store/examStore';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';

export default function ExamineeVerifyScreen() {
  const navigate = useNavigate();
  const examinee = useExamStore((s) => s.examinee);

  if (!examinee) {
    navigate('/login', { replace: true });
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 font-sans">
      <Card className="w-[420px] p-10 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.1)] text-center">
        <CardContent className="p-0">
          <div className="text-[22px] font-bold text-blue-800 mb-8">본인 확인</div>

          {examinee.photoUrl ? (
            <img
              src={examinee.photoUrl}
              alt="응시자 사진"
              className="w-[120px] h-[120px] rounded-full object-cover border-[3px] border-blue-800 mb-5 mx-auto"
            />
          ) : (
            <div className="w-[120px] h-[120px] rounded-full bg-gray-200 border-[3px] border-blue-800 flex items-center justify-center text-5xl text-gray-400 mx-auto mb-5">
              👤
            </div>
          )}

          <div className="flex justify-center gap-8 mb-3">
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-0.5">수험번호</div>
              <div className="text-lg font-bold text-gray-900">{examinee.registrationNumber}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-0.5">이름</div>
              <div className="text-lg font-bold text-gray-900">{examinee.name}</div>
            </div>
          </div>

          <div className="text-sm text-gray-700 my-6 leading-relaxed">
            본인이 맞으면 아래에서 시험을 선택하세요.
          </div>

          <Button
            className="w-full py-3.5 text-base font-bold bg-blue-800 hover:bg-blue-900 rounded-lg h-auto"
            onClick={() => navigate('/exam/select-set')}
          >
            시험 선택하기
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
