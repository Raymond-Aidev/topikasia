/**
 * SCR-Q06: 시험세트 미리보기
 * QUESTION-08: 실제 응시 화면처럼 세트 전체 프리뷰
 */
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminApi } from '../../api/adminApi';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Textarea } from '../../components/ui/textarea';
import { cn } from '../../lib/utils';

interface QuestionItem {
  bankId: string;
  typeCode: string;
  questionIndex: number;
  correctAnswer?: any;
  points?: number;
}

interface SectionData {
  section: string;
  sectionCode?: string;
  sectionName?: string;
  durationMinutes?: number;
  timeLimitMinutes?: number;
  questionCount: number;
  questions: QuestionItem[];
}

interface ExamSetDetail {
  id: string;
  name: string;
  examType: string;
  examSetNumber: string;
  status: string;
  sectionsJson: Record<string, SectionData> | SectionData[];
}

const SECTION_LABELS: Record<string, string> = {
  LISTENING: '듣기', WRITING: '쓰기', READING: '읽기',
};

const ExamSetPreviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [examSet, setExamSet] = useState<ExamSetDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentSectionIdx, setCurrentSectionIdx] = useState(0);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, any>>({});

  useEffect(() => {
    if (!id) return;
    adminApi.get(`/admin/exam-sets/${id}`)
      .then(res => {
        const data = res.data.data || res.data;
        setExamSet(data);
      })
      .catch(err => setError(err.response?.data?.message || '시험세트를 불러올 수 없습니다'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="flex h-screen items-center justify-center text-muted-foreground">불러오는 중...</div>;
  }

  if (error || !examSet) {
    return (
      <div className="flex h-screen flex-col items-center justify-center">
        <div className="mb-4 text-base text-destructive">{error || '시험세트를 찾을 수 없습니다'}</div>
        <Button variant="outline" onClick={() => navigate(-1)}>뒤로가기</Button>
      </div>
    );
  }

  // sectionsJson 정규화
  const sections: { key: string; data: SectionData }[] = [];
  const sj = examSet.sectionsJson;
  if (Array.isArray(sj)) {
    sj.forEach(s => sections.push({ key: s.sectionCode || s.section, data: s }));
  } else {
    Object.entries(sj).forEach(([key, data]) => sections.push({ key, data }));
  }

  const currentSection = sections[currentSectionIdx];
  const questions = currentSection?.data.questions || [];
  const currentQuestion = questions[currentQuestionIdx];
  const totalQuestions = questions.length;

  const handleSelectAnswer = (bankId: string, answer: any) => {
    setSelectedAnswers(prev => ({ ...prev, [bankId]: answer }));
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="flex h-14 items-center justify-between bg-blue-700 px-6 text-white">
        <div className="flex items-center gap-4">
          <span className="text-xs opacity-70">미리보기</span>
          <span className="font-bold">{examSet.name}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[13px] opacity-80">
            {examSet.examType === 'TOPIK_I' ? 'TOPIK I' : 'TOPIK II'}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="border-white/40 bg-transparent text-white hover:bg-white/10"
            onClick={() => navigate(-1)}
          >
            닫기
          </Button>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex border-b border-border bg-background">
        {sections.map((sec, idx) => (
          <button
            key={sec.key}
            onClick={() => { setCurrentSectionIdx(idx); setCurrentQuestionIdx(0); }}
            className={cn(
              'border-b-[3px] px-6 py-3 text-sm font-semibold transition-colors',
              idx === currentSectionIdx
                ? 'border-blue-700 bg-blue-700 text-white'
                : 'border-transparent text-muted-foreground hover:bg-muted'
            )}
          >
            {SECTION_LABELS[sec.key] || sec.data.sectionName || sec.key}
            <span className="ml-1.5 text-[11px] opacity-70">
              ({sec.data.questions.length}문항, {sec.data.durationMinutes || sec.data.timeLimitMinutes || 0}분)
            </span>
          </button>
        ))}
      </div>

      {/* Question Content */}
      <div className="mx-auto max-w-[800px] px-6 py-8">
        {/* Question nav */}
        <div className="mb-6 flex items-center justify-between">
          <div className="text-lg font-bold text-blue-700">
            문제 {currentQuestionIdx + 1} / {totalQuestions}
          </div>
          <div className="text-[13px] text-muted-foreground">
            {currentQuestion?.typeCode || '-'} | bankId: {currentQuestion?.bankId || '-'}
          </div>
        </div>

        {/* Question card */}
        {currentQuestion ? (
          <Card className="mb-6 shadow-sm">
            <CardContent>
              <div className="mb-4 text-[15px] font-semibold text-foreground">
                {currentQuestion.bankId}
              </div>

              {/* MCQ simulation */}
              {(currentQuestion.typeCode.includes('MCQ') || currentQuestion.typeCode.includes('LISTEN') || currentQuestion.typeCode.includes('READ')) && (
                <div className="flex flex-col gap-2">
                  {[1, 2, 3, 4].map(opt => {
                    const isSelected = selectedAnswers[currentQuestion.bankId] === opt;
                    const isCorrect = currentQuestion.correctAnswer === opt;
                    return (
                      <button
                        key={opt}
                        onClick={() => handleSelectAnswer(currentQuestion.bankId, opt)}
                        className={cn(
                          'flex items-center gap-3 rounded-lg border-2 px-4 py-3 text-left text-sm transition-colors',
                          isSelected
                            ? 'border-blue-700 bg-blue-50'
                            : 'border-border bg-background hover:bg-muted/50'
                        )}
                      >
                        <span className={cn(
                          'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold',
                          isSelected
                            ? 'bg-blue-700 text-white'
                            : 'bg-muted text-muted-foreground'
                        )}>
                          {opt}
                        </span>
                        <span>보기 {opt}</span>
                        {isCorrect && (
                          <span className="ml-auto text-[11px] font-semibold text-green-600">정답</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Writing simulation */}
              {(currentQuestion.typeCode.includes('WRITE') || currentQuestion.typeCode.includes('ESSAY')) && (
                <div>
                  <Textarea
                    placeholder="(쓰기 문항 - 미리보기)"
                    rows={6}
                    className="resize-y"
                  />
                </div>
              )}

              {/* Points info */}
              {currentQuestion.points != null && (
                <div className="mt-3 text-xs text-muted-foreground">
                  배점: {currentQuestion.points}점
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="py-10 text-center text-muted-foreground">문항이 없습니다.</div>
        )}

        {/* Question grid */}
        <div className="mb-6">
          <div className="mb-2 text-[13px] font-semibold text-foreground">문항 번호</div>
          <div className="flex flex-wrap gap-1">
            {questions.map((q, idx) => {
              const answered = selectedAnswers[q.bankId] != null;
              return (
                <button
                  key={q.bankId}
                  onClick={() => setCurrentQuestionIdx(idx)}
                  className={cn(
                    'h-8 w-8 rounded border text-xs font-semibold transition-colors',
                    idx === currentQuestionIdx
                      ? 'border-blue-700 bg-blue-700 text-white'
                      : answered
                        ? 'border-green-200 bg-green-100 text-foreground'
                        : 'border-border bg-background text-foreground hover:bg-muted'
                  )}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* Nav buttons */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            size="lg"
            disabled={currentQuestionIdx === 0}
            onClick={() => setCurrentQuestionIdx(i => i - 1)}
            className="font-semibold"
          >
            이전
          </Button>
          <Button
            size="lg"
            disabled={currentQuestionIdx >= totalQuestions - 1}
            onClick={() => setCurrentQuestionIdx(i => i + 1)}
            className="bg-blue-700 font-semibold hover:bg-blue-800"
          >
            다음
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ExamSetPreviewPage;
