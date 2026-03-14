/**
 * SCR-S02: 성적표 이메일 발송 화면
 * SCORE-06: 이메일로 성적표 발송
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { examApi } from '../../api/examApi';
import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent } from '../../components/ui/card';

export default function ScoreEmailScreen() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSend = async () => {
    if (!email.trim()) {
      setError('이메일 주소를 입력해주세요');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await examApi.post('/exam/score/email', { email });
      setSuccess(true);
      setError('');
    } catch (err: any) {
      const msg = err.response?.data?.message || '이메일 발송에 실패했습니다';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#f0f4f8] flex flex-col items-center justify-center px-5 py-10">
        <Card className="max-w-[480px] w-full rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.08)] px-8 py-12 text-center">
          <CardContent className="p-0">
            <div className="text-5xl mb-4 text-green-500">&#10003;</div>
            <div className="text-xl font-bold text-gray-900 mb-2">
              발송 완료
            </div>
            <div className="text-[15px] text-gray-500 mb-8 leading-relaxed">
              성적표가 <strong>{email}</strong>으로<br />발송되었습니다.
            </div>
            <Button
              onClick={() => navigate('/exam/score')}
              className="px-8 py-3 rounded-lg bg-blue-800 hover:bg-blue-900 text-[15px] font-semibold h-auto"
            >
              성적표로 돌아가기
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f4f8] flex flex-col items-center justify-center px-5 py-10">
      <Card className="max-w-[480px] w-full rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.08)] px-8 py-12">
        <CardContent className="p-0">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-sm text-gray-500 mb-1">한국어능력시험</div>
            <div className="text-[22px] font-extrabold text-blue-800">성적표 이메일 발송</div>
          </div>

          {/* Email input */}
          <div className="mb-6">
            <Label className="block text-sm font-semibold text-gray-700 mb-2">
              이메일 주소
            </Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
              className="w-full px-4 py-3 text-[15px] rounded-lg border border-gray-300 h-auto"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 px-3.5 py-2.5 bg-red-50 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => navigate('/exam/score')}
              className="flex-1 py-3 rounded-lg border-gray-300 text-gray-700 text-[15px] font-semibold h-auto"
            >
              돌아가기
            </Button>
            <Button
              onClick={handleSend}
              disabled={loading}
              className={cn(
                'flex-1 py-3 rounded-lg text-[15px] font-semibold h-auto',
                loading ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-800 hover:bg-blue-900'
              )}
            >
              {loading ? '발송 중...' : '이메일 발송'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
