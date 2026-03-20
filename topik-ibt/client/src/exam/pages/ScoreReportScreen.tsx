/**
 * SCR-S01: 성적표 화면
 * SCORE-01~05: 성적 조회 및 인쇄
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { examApi } from '../../api/examApi';
import GlobalNavigationBar, { GNB_HEIGHT, GNB_HEIGHT_MOBILE } from '../../shared/components/GlobalNavigationBar';
import { useResponsive } from '../../shared/hooks/useResponsive';
import Footer from '../../shared/components/Footer';
import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/button';

interface SectionScore {
  raw: number;
  scaled: number;
  maxScore: number;
}

interface ScoreData {
  id: string;
  examSetName: string;
  examType: string;
  examDate: string;
  sectionScores: Record<string, SectionScore>;
  totalScore: number;
  maxTotalScore: number;
  grade: number | null;
  publishedAt: string;
}

const GRADE_LABELS: Record<number, string> = {
  1: '1급', 2: '2급', 3: '3급', 4: '4급', 5: '5급', 6: '6급',
};

const SECTION_LABELS: Record<string, string> = {
  LISTENING: '듣기',
  WRITING: '쓰기',
  READING: '읽기',
};

export default function ScoreReportScreen() {
  const { isMobile, isTablet } = useResponsive();
  const compact = isMobile || isTablet;
  const navigate = useNavigate();
  const [scores, setScores] = useState<ScoreData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [needLogin, setNeedLogin] = useState(false);

  useEffect(() => {
    const hasToken = !!(localStorage.getItem('examToken') || localStorage.getItem('registrationToken'));
    if (!hasToken) {
      setNeedLogin(true);
      setLoading(false);
      return;
    }
    examApi.get('/exam/score')
      .then(res => {
        const data = res.data.data;
        setScores(Array.isArray(data) ? data : data ? [data] : []);
      })
      .catch(err => {
        if (err.response?.status === 401) {
          localStorage.removeItem('examToken');
          localStorage.removeItem('registrationToken');
          setNeedLogin(true);
          return;
        }
        setError(err.response?.data?.message || '성적을 불러올 수 없습니다');
      })
      .finally(() => setLoading(false));
  }, []);

  const handlePrint = () => window.print();

  if (loading) {
    return (
      <div className={cn('min-h-screen', compact ? `pt-[${GNB_HEIGHT_MOBILE}px]` : `pt-[${GNB_HEIGHT}px]`)}
        style={{ paddingTop: compact ? GNB_HEIGHT_MOBILE : GNB_HEIGHT }}>
        <GlobalNavigationBar />
        <div className="flex justify-center items-center text-gray-400"
          style={{ height: `calc(100vh - ${compact ? GNB_HEIGHT_MOBILE : GNB_HEIGHT}px)` }}>
          불러오는 중...
        </div>
        <Footer />
      </div>
    );
  }

  if (needLogin) {
    return (
      <div className="min-h-screen bg-gray-50"
        style={{ paddingTop: compact ? GNB_HEIGHT_MOBILE : GNB_HEIGHT }}>
        <GlobalNavigationBar />
        <div className="flex flex-col items-center justify-center"
          style={{ minHeight: `calc(100vh - ${compact ? GNB_HEIGHT_MOBILE : GNB_HEIGHT}px)` }}>
          <div className="text-5xl mb-4 opacity-40">🔒</div>
          <div className="text-lg font-bold text-gray-700 mb-2">로그인 후 조회 가능</div>
          <div className="text-sm text-gray-400 mb-7 leading-relaxed">
            성적을 확인하려면 로그인이 필요합니다
          </div>
          <div className="flex gap-3 justify-center flex-wrap">
            <Button
              variant="outline"
              onClick={() => navigate('/registration/login')}
              className="px-9 py-3 rounded-lg border-2 border-blue-800 text-blue-800 text-[15px] font-semibold h-auto"
            >
              로그인
            </Button>
            <Button
              onClick={() => navigate('/registration/signup')}
              className="px-9 py-3 rounded-lg bg-blue-800 hover:bg-blue-900 text-[15px] font-semibold h-auto"
            >
              회원가입
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || scores.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50"
        style={{ paddingTop: compact ? GNB_HEIGHT_MOBILE : GNB_HEIGHT }}>
        <GlobalNavigationBar />
        <div className="flex flex-col items-center justify-center"
          style={{ minHeight: `calc(100vh - ${compact ? GNB_HEIGHT_MOBILE : GNB_HEIGHT}px)` }}>
          <div className="text-5xl mb-4">-</div>
          <div className="text-lg text-gray-500 mb-6">{error || '공개된 성적이 없습니다'}</div>
          <Button
            onClick={() => navigate('/lms')}
            className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-[15px] font-semibold h-auto"
          >
            돌아가기
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f4f8]"
      style={{ paddingTop: compact ? GNB_HEIGHT_MOBILE : GNB_HEIGHT }}>
      <GlobalNavigationBar />
      {scores.map(score => (
        <div key={score.id} className="max-w-[600px] mx-auto mb-8 bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.08)] overflow-hidden">
          {/* Header */}
          <div className={cn('bg-blue-800 text-white text-center', isMobile ? 'px-4 py-5' : 'px-8 py-7')}>
            <div className="text-sm opacity-80 mb-1">한국어능력시험</div>
            <div className="text-2xl font-extrabold">TOPIK 성적표</div>
            <div className="text-[13px] mt-2 opacity-70">
              Test of Proficiency in Korean
            </div>
          </div>

          {/* Exam Info */}
          <div className={cn('border-b border-gray-200', isMobile ? 'p-4' : 'px-8 py-6')}>
            <div className={cn('grid gap-3 text-sm', isMobile ? 'grid-cols-1 gap-y-3' : 'grid-cols-2 gap-x-6')}>
              <div>
                <span className="text-gray-500">시험명</span>
                <div className="font-semibold mt-0.5">{score.examSetName}</div>
              </div>
              <div>
                <span className="text-gray-500">시험유형</span>
                <div className="font-semibold mt-0.5">
                  {score.examType === 'TOPIK_I' ? 'TOPIK I' : 'TOPIK II'}
                </div>
              </div>
              <div>
                <span className="text-gray-500">시험일</span>
                <div className="font-semibold mt-0.5">
                  {new Date(score.examDate).toLocaleDateString('ko-KR')}
                </div>
              </div>
              <div>
                <span className="text-gray-500">성적공개일</span>
                <div className="font-semibold mt-0.5">
                  {new Date(score.publishedAt).toLocaleDateString('ko-KR')}
                </div>
              </div>
            </div>
          </div>

          {/* Section Scores */}
          <div className={cn(isMobile ? 'p-4' : 'px-8 py-6')}>
            <table className="w-full border-collapse mb-5">
              <thead>
                <tr>
                  <th className="px-3 py-2.5 text-left text-[13px] font-semibold text-gray-700 border-b-2 border-gray-200">
                    영역
                  </th>
                  <th className="px-3 py-2.5 text-center text-[13px] font-semibold text-gray-700 border-b-2 border-gray-200">
                    점수
                  </th>
                  <th className="px-3 py-2.5 text-center text-[13px] font-semibold text-gray-700 border-b-2 border-gray-200">
                    만점
                  </th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(score.sectionScores).map(([section, data]) => (
                  <tr key={section}>
                    <td className="p-3 text-[15px] font-medium border-b border-gray-100">
                      {SECTION_LABELS[section] || section}
                    </td>
                    <td className="p-3 text-center text-lg font-bold text-blue-800 border-b border-gray-100">
                      {data.raw}
                    </td>
                    <td className="p-3 text-center text-sm text-gray-400 border-b border-gray-100">
                      {data.maxScore}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Total & Grade */}
            <div className="flex justify-between items-center px-5 py-4 bg-[#f0f4f8] rounded-xl">
              <div>
                <div className="text-[13px] text-gray-500">총점</div>
                <div className="text-[28px] font-extrabold text-gray-900">
                  {score.totalScore}
                  <span className="text-base font-normal text-gray-400">/{score.maxTotalScore}</span>
                </div>
              </div>
              <div className="text-center">
                <div className="text-[13px] text-gray-500">TOPIK 등급</div>
                <div className={cn(
                  'text-[32px] font-extrabold',
                  score.grade ? 'text-blue-800' : 'text-gray-300'
                )}>
                  {score.grade ? GRADE_LABELS[score.grade] : '미달'}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Actions */}
      <div className="max-w-[600px] mx-auto flex gap-3 justify-center">
        <Button
          onClick={handlePrint}
          className="px-8 py-3 rounded-lg bg-blue-800 hover:bg-blue-900 text-[15px] font-semibold h-auto"
        >
          인쇄하기
        </Button>
        <Button
          variant="outline"
          onClick={() => navigate('/lms')}
          className="px-8 py-3 rounded-lg border-gray-300 text-gray-700 text-[15px] font-semibold h-auto"
        >
          돌아가기
        </Button>
      </div>
      <Footer />
    </div>
  );
}
