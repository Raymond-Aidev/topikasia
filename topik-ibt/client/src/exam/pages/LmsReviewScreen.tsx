/**
 * SCR-L02: 문제 복습 — 문항별 답안 비교 + LLM 해설
 */
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { examApi } from '../../api/examApi';
import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Separator } from '../../components/ui/separator';

interface ReviewQuestion {
  answerId: string;
  questionBankId: string;
  section: string;
  questionIndex: number;
  examineeAnswer: any;
  correctAnswer: any;
  typeCode: string | null;
  isCorrect: boolean | null;
  explanation: string | null;
  instruction: string | null;
  passageText: string | null;
  options: Array<{ id: number; text: string }> | null;
}

interface ReviewData {
  sessionId: string;
  examSetName: string;
  examType: string;
  questions: ReviewQuestion[];
}

const SECTION_LABELS: Record<string, string> = { LISTENING: '듣기', WRITING: '쓰기', READING: '읽기' };

export default function LmsReviewScreen() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<ReviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [explanationLoading, setExplanationLoading] = useState<string | null>(null);
  const [sectionFilter, setSectionFilter] = useState<string>('ALL');

  useEffect(() => {
    examApi.get(`/lms/sessions/${sessionId}/review`)
      .then(res => setData(res.data))
      .catch(() => navigate('/lms'))
      .finally(() => setLoading(false));
  }, [sessionId, navigate]);

  if (loading) return <div className="flex justify-center items-center h-screen text-gray-400">불러오는 중...</div>;
  if (!data) return null;

  const filteredQuestions = sectionFilter === 'ALL' ? data.questions : data.questions.filter(q => q.section === sectionFilter);
  const current = filteredQuestions[currentIdx];
  const sections = [...new Set(data.questions.map(q => q.section))];

  const handleExplain = async (questionBankId: string) => {
    setExplanationLoading(questionBankId);
    try {
      const res = await examApi.post(`/lms/sessions/${sessionId}/explain/${questionBankId}`);
      setData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          questions: prev.questions.map(q =>
            q.questionBankId === questionBankId ? { ...q, explanation: res.data.explanation } : q
          ),
        };
      });
    } catch { /* ignore */ }
    setExplanationLoading(null);
  };

  const stats = {
    total: filteredQuestions.length,
    correct: filteredQuestions.filter(q => q.isCorrect === true).length,
    wrong: filteredQuestions.filter(q => q.isCorrect === false).length,
    unknown: filteredQuestions.filter(q => q.isCorrect === null).length,
  };

  return (
    <div className="min-h-screen bg-[#f0f4f8] font-sans">
      {/* Header */}
      <div className="bg-blue-800 text-white px-6 py-4 flex justify-between items-center">
        <div>
          <div className="text-base font-bold">문제 복습</div>
          <div className="text-[13px] opacity-80 mt-0.5">{data.examSetName}</div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate(`/lms/analysis/${sessionId}`)}
            className="px-3.5 py-1.5 rounded-md border border-white/40 bg-transparent text-white text-[13px] h-auto hover:bg-white/10"
          >
            분석 보기
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/lms')}
            className="px-3.5 py-1.5 rounded-md border border-white/40 bg-transparent text-white text-[13px] h-auto hover:bg-white/10"
          >
            목록으로
          </Button>
        </div>
      </div>

      <div className="max-w-[900px] mx-auto px-5 py-6">
        {/* Stats bar */}
        <div className="flex gap-3 mb-5">
          <div className="flex-1 bg-white rounded-lg px-4 py-3 text-center">
            <div className="text-[11px] text-gray-500">전체</div>
            <div className="text-xl font-bold text-gray-700">{stats.total}</div>
          </div>
          <div className="flex-1 bg-white rounded-lg px-4 py-3 text-center">
            <div className="text-[11px] text-green-600">정답</div>
            <div className="text-xl font-bold text-green-600">{stats.correct}</div>
          </div>
          <div className="flex-1 bg-white rounded-lg px-4 py-3 text-center">
            <div className="text-[11px] text-red-600">오답</div>
            <div className="text-xl font-bold text-red-600">{stats.wrong}</div>
          </div>
          {stats.unknown > 0 && (
            <div className="flex-1 bg-white rounded-lg px-4 py-3 text-center">
              <div className="text-[11px] text-gray-400">미채점</div>
              <div className="text-xl font-bold text-gray-400">{stats.unknown}</div>
            </div>
          )}
        </div>

        {/* Section filter */}
        <div className="flex gap-2 mb-5">
          <button
            onClick={() => { setSectionFilter('ALL'); setCurrentIdx(0); }}
            className={cn(
              'px-4 py-1.5 rounded-full border-none text-[13px] cursor-pointer font-semibold',
              sectionFilter === 'ALL' ? 'bg-blue-800 text-white' : 'bg-gray-200 text-gray-700'
            )}
          >
            전체
          </button>
          {sections.map(sec => (
            <button
              key={sec}
              onClick={() => { setSectionFilter(sec); setCurrentIdx(0); }}
              className={cn(
                'px-4 py-1.5 rounded-full border-none text-[13px] cursor-pointer font-semibold',
                sectionFilter === sec ? 'bg-blue-800 text-white' : 'bg-gray-200 text-gray-700'
              )}
            >
              {SECTION_LABELS[sec] || sec}
            </button>
          ))}
        </div>

        {/* Question grid */}
        <div className="flex flex-wrap gap-1.5 mb-6">
          {filteredQuestions.map((q, idx) => (
            <button
              key={q.questionBankId}
              onClick={() => setCurrentIdx(idx)}
              className={cn(
                'w-9 h-9 rounded-md flex items-center justify-center text-xs font-semibold cursor-pointer',
                idx === currentIdx ? 'border-2 border-blue-800' : 'border border-gray-200',
                q.isCorrect === true ? 'bg-green-100 text-green-600' :
                q.isCorrect === false ? 'bg-red-50 text-red-600' :
                'bg-gray-50 text-gray-500'
              )}
            >
              {q.questionIndex + 1}
            </button>
          ))}
        </div>

        {/* Current question detail */}
        {current && (
          <Card className="rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.08)] p-6">
            <CardContent className="p-0">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <span className="text-lg font-bold text-gray-900">
                    문항 {current.questionIndex + 1}
                  </span>
                  <span className="text-[13px] text-gray-500 ml-3">
                    {SECTION_LABELS[current.section] || current.section}
                  </span>
                  {current.typeCode && (
                    <span className="text-xs text-gray-400 ml-2">({current.typeCode})</span>
                  )}
                </div>
                {current.isCorrect !== null && (
                  <Badge className={cn(
                    'px-3 py-1 rounded-full text-[13px] font-bold border-0',
                    current.isCorrect ? 'bg-green-100 text-green-600' : 'bg-red-50 text-red-600'
                  )}>
                    {current.isCorrect ? '정답' : '오답'}
                  </Badge>
                )}
              </div>

              {/* 문제 내용 */}
              {current.instruction && (
                <div className="text-[15px] leading-[1.7] text-gray-700 mb-3 font-semibold">
                  {current.instruction}
                </div>
              )}
              {current.passageText && (
                <div className="bg-gray-50 border border-gray-300 rounded-lg px-[18px] py-3.5 mb-4 text-sm leading-[1.8] whitespace-pre-wrap text-gray-800">
                  {current.passageText}
                </div>
              )}

              {/* 선택지 + 정답/오답 표시 */}
              {current.options && current.options.length > 0 && (
                <div className="flex flex-col gap-2 mb-5">
                  {current.options.map(opt => {
                    const isUserAnswer = current.examineeAnswer?.selectedOptions?.includes(opt.id);
                    const isCorrectOption = opt.id === current.correctAnswer;
                    let borderColor = 'border-gray-200';
                    let bgColor = 'bg-white';
                    if (isCorrectOption) { borderColor = 'border-green-600'; bgColor = 'bg-green-50'; }
                    if (isUserAnswer && !isCorrectOption) { borderColor = 'border-red-600'; bgColor = 'bg-red-50'; }
                    if (isUserAnswer && isCorrectOption) { borderColor = 'border-green-600'; bgColor = 'bg-green-100'; }

                    return (
                      <div key={opt.id} className={cn(
                        'flex items-center gap-3 px-3.5 py-2.5 rounded-lg border-2',
                        borderColor, bgColor
                      )}>
                        <span className={cn(
                          'w-7 h-7 rounded-full flex items-center justify-center text-[13px] font-bold shrink-0',
                          isCorrectOption ? 'bg-green-600 text-white' :
                          isUserAnswer ? 'bg-red-600 text-white' :
                          'bg-gray-200 text-gray-500'
                        )}>
                          {opt.id}
                        </span>
                        <span className="text-sm text-gray-700 leading-normal">{opt.text}</span>
                        {isUserAnswer && !isCorrectOption && (
                          <span className="ml-auto text-[11px] text-red-600 font-semibold">내 답</span>
                        )}
                        {isCorrectOption && (
                          <span className="ml-auto text-[11px] text-green-600 font-semibold">정답</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 선택지가 없는 경우 기존 답안 비교 형식 (fallback) */}
              {(!current.options || current.options.length === 0) && (
                <div className="flex gap-4 mb-5">
                  <div className="flex-1 bg-[#f0f4f8] rounded-lg p-4">
                    <div className="text-xs text-gray-500 mb-2 font-semibold">내 답안</div>
                    <div className="text-[15px] text-gray-700 break-all">
                      {current.examineeAnswer != null ? (
                        typeof current.examineeAnswer === 'object'
                          ? JSON.stringify(current.examineeAnswer)
                          : String(current.examineeAnswer)
                      ) : <span className="text-gray-400">미응답</span>}
                    </div>
                  </div>
                  <div className="flex-1 bg-green-50 rounded-lg p-4">
                    <div className="text-xs text-green-600 mb-2 font-semibold">정답</div>
                    <div className="text-[15px] text-gray-700 break-all">
                      {current.correctAnswer != null ? (
                        typeof current.correctAnswer === 'object'
                          ? JSON.stringify(current.correctAnswer)
                          : String(current.correctAnswer)
                      ) : <span className="text-gray-400">정답 정보 없음</span>}
                    </div>
                  </div>
                </div>
              )}

              {/* Explanation */}
              <Separator className="mb-4" />
              <div className="pt-0">
                <div className="text-sm font-semibold text-gray-900 mb-2">AI 해설</div>
                {current.explanation ? (
                  <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {current.explanation}
                  </div>
                ) : (
                  <Button
                    onClick={() => handleExplain(current.questionBankId)}
                    disabled={explanationLoading === current.questionBankId}
                    className={cn(
                      'px-5 py-2.5 rounded-lg text-sm font-semibold h-auto',
                      explanationLoading === current.questionBankId
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-800 hover:bg-blue-900'
                    )}
                  >
                    {explanationLoading === current.questionBankId ? '생성 중...' : '해설 생성하기'}
                  </Button>
                )}
              </div>

              {/* Navigation */}
              <div className="flex justify-between mt-6">
                <Button
                  variant="outline"
                  onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
                  disabled={currentIdx === 0}
                  className={cn(
                    'px-5 py-2 rounded-lg border border-gray-200 text-sm h-auto',
                    currentIdx === 0 ? 'text-gray-300' : 'text-gray-700'
                  )}
                >
                  이전
                </Button>
                <span className="text-[13px] text-gray-400 self-center">
                  {currentIdx + 1} / {filteredQuestions.length}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setCurrentIdx(Math.min(filteredQuestions.length - 1, currentIdx + 1))}
                  disabled={currentIdx === filteredQuestions.length - 1}
                  className={cn(
                    'px-5 py-2 rounded-lg border border-gray-200 text-sm h-auto',
                    currentIdx === filteredQuestions.length - 1 ? 'text-gray-300' : 'text-gray-700'
                  )}
                >
                  다음
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
