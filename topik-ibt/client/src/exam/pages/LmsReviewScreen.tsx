/**
 * SCR-L02: 문제 복습 — 문항별 답안 비교 + LLM 해설
 */
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { examApi } from '../../api/examApi';

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

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#9ca3af' }}>불러오는 중...</div>;
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
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f4f8', fontFamily: 'sans-serif' }}>
      {/* Header */}
      <div style={{ backgroundColor: '#1565C0', color: '#fff', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>문제 복습</div>
          <div style={{ fontSize: 13, opacity: 0.8, marginTop: 2 }}>{data.examSetName}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => navigate(`/lms/analysis/${sessionId}`)} style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.4)', backgroundColor: 'transparent', color: '#fff', fontSize: 13, cursor: 'pointer' }}>
            분석 보기
          </button>
          <button onClick={() => navigate('/lms')} style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.4)', backgroundColor: 'transparent', color: '#fff', fontSize: 13, cursor: 'pointer' }}>
            목록으로
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 20px' }}>
        {/* Stats bar */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1, backgroundColor: '#fff', borderRadius: 8, padding: '12px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#6b7280' }}>전체</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#374151' }}>{stats.total}</div>
          </div>
          <div style={{ flex: 1, backgroundColor: '#fff', borderRadius: 8, padding: '12px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#16a34a' }}>정답</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#16a34a' }}>{stats.correct}</div>
          </div>
          <div style={{ flex: 1, backgroundColor: '#fff', borderRadius: 8, padding: '12px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#dc2626' }}>오답</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#dc2626' }}>{stats.wrong}</div>
          </div>
          {stats.unknown > 0 && (
            <div style={{ flex: 1, backgroundColor: '#fff', borderRadius: 8, padding: '12px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#9ca3af' }}>미채점</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#9ca3af' }}>{stats.unknown}</div>
            </div>
          )}
        </div>

        {/* Section filter */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <button onClick={() => { setSectionFilter('ALL'); setCurrentIdx(0); }}
            style={{ padding: '6px 16px', borderRadius: 20, border: 'none', backgroundColor: sectionFilter === 'ALL' ? '#1565C0' : '#e5e7eb', color: sectionFilter === 'ALL' ? '#fff' : '#374151', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>
            전체
          </button>
          {sections.map(sec => (
            <button key={sec} onClick={() => { setSectionFilter(sec); setCurrentIdx(0); }}
              style={{ padding: '6px 16px', borderRadius: 20, border: 'none', backgroundColor: sectionFilter === sec ? '#1565C0' : '#e5e7eb', color: sectionFilter === sec ? '#fff' : '#374151', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>
              {SECTION_LABELS[sec] || sec}
            </button>
          ))}
        </div>

        {/* Question grid */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 24 }}>
          {filteredQuestions.map((q, idx) => (
            <button key={q.questionBankId} onClick={() => setCurrentIdx(idx)}
              style={{
                width: 36, height: 36, borderRadius: 6, border: idx === currentIdx ? '2px solid #1565C0' : '1px solid #e5e7eb',
                backgroundColor: q.isCorrect === true ? '#dcfce7' : q.isCorrect === false ? '#fef2f2' : '#f9fafb',
                color: q.isCorrect === true ? '#16a34a' : q.isCorrect === false ? '#dc2626' : '#6b7280',
                fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
              {q.questionIndex + 1}
            </button>
          ))}
        </div>

        {/* Current question detail */}
        {current && (
          <div style={{ backgroundColor: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <span style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>
                  문항 {current.questionIndex + 1}
                </span>
                <span style={{ fontSize: 13, color: '#6b7280', marginLeft: 12 }}>
                  {SECTION_LABELS[current.section] || current.section}
                </span>
                {current.typeCode && (
                  <span style={{ fontSize: 12, color: '#9ca3af', marginLeft: 8 }}>({current.typeCode})</span>
                )}
              </div>
              {current.isCorrect !== null && (
                <span style={{
                  padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 700,
                  backgroundColor: current.isCorrect ? '#dcfce7' : '#fef2f2',
                  color: current.isCorrect ? '#16a34a' : '#dc2626',
                }}>
                  {current.isCorrect ? '정답' : '오답'}
                </span>
              )}
            </div>

            {/* 문제 내용 */}
            {current.instruction && (
              <div style={{ fontSize: 15, lineHeight: 1.7, color: '#374151', marginBottom: 12, fontWeight: 600 }}>
                {current.instruction}
              </div>
            )}
            {current.passageText && (
              <div style={{
                backgroundColor: '#FAFAFA', border: '1px solid #E0E0E0', borderRadius: 8,
                padding: '14px 18px', marginBottom: 16, fontSize: 14, lineHeight: 1.8,
                whiteSpace: 'pre-wrap', color: '#333',
              }}>
                {current.passageText}
              </div>
            )}

            {/* 선택지 + 정답/오답 표시 */}
            {current.options && current.options.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                {current.options.map(opt => {
                  const isUserAnswer = current.examineeAnswer?.selectedOptions?.includes(opt.id);
                  const isCorrectOption = opt.id === current.correctAnswer;
                  let borderColor = '#e5e7eb';
                  let bgColor = '#fff';
                  let textColor = '#374151';
                  if (isCorrectOption) { borderColor = '#16a34a'; bgColor = '#f0fdf4'; }
                  if (isUserAnswer && !isCorrectOption) { borderColor = '#dc2626'; bgColor = '#fef2f2'; }
                  if (isUserAnswer && isCorrectOption) { borderColor = '#16a34a'; bgColor = '#dcfce7'; }

                  return (
                    <div key={opt.id} style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 14px', borderRadius: 8,
                      border: `2px solid ${borderColor}`, backgroundColor: bgColor,
                    }}>
                      <span style={{
                        width: 28, height: 28, borderRadius: '50%', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700,
                        backgroundColor: isCorrectOption ? '#16a34a' : (isUserAnswer ? '#dc2626' : '#e5e7eb'),
                        color: (isCorrectOption || isUserAnswer) ? '#fff' : '#6b7280',
                        flexShrink: 0,
                      }}>
                        {opt.id}
                      </span>
                      <span style={{ fontSize: 14, color: textColor, lineHeight: 1.5 }}>{opt.text}</span>
                      {isUserAnswer && !isCorrectOption && (
                        <span style={{ marginLeft: 'auto', fontSize: 11, color: '#dc2626', fontWeight: 600 }}>내 답</span>
                      )}
                      {isCorrectOption && (
                        <span style={{ marginLeft: 'auto', fontSize: 11, color: '#16a34a', fontWeight: 600 }}>정답</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* 선택지가 없는 경우 기존 답안 비교 형식 (fallback) */}
            {(!current.options || current.options.length === 0) && (
              <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
                <div style={{ flex: 1, backgroundColor: '#f0f4f8', borderRadius: 8, padding: 16 }}>
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8, fontWeight: 600 }}>내 답안</div>
                  <div style={{ fontSize: 15, color: '#374151', wordBreak: 'break-all' }}>
                    {current.examineeAnswer != null ? (
                      typeof current.examineeAnswer === 'object'
                        ? JSON.stringify(current.examineeAnswer)
                        : String(current.examineeAnswer)
                    ) : <span style={{ color: '#9ca3af' }}>미응답</span>}
                  </div>
                </div>
                <div style={{ flex: 1, backgroundColor: '#f0fdf4', borderRadius: 8, padding: 16 }}>
                  <div style={{ fontSize: 12, color: '#16a34a', marginBottom: 8, fontWeight: 600 }}>정답</div>
                  <div style={{ fontSize: 15, color: '#374151', wordBreak: 'break-all' }}>
                    {current.correctAnswer != null ? (
                      typeof current.correctAnswer === 'object'
                        ? JSON.stringify(current.correctAnswer)
                        : String(current.correctAnswer)
                    ) : <span style={{ color: '#9ca3af' }}>정답 정보 없음</span>}
                  </div>
                </div>
              </div>
            )}

            {/* Explanation */}
            <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 8 }}>AI 해설</div>
              {current.explanation ? (
                <div style={{ fontSize: 14, color: '#374151', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                  {current.explanation}
                </div>
              ) : (
                <button
                  onClick={() => handleExplain(current.questionBankId)}
                  disabled={explanationLoading === current.questionBankId}
                  style={{
                    padding: '10px 20px', borderRadius: 8, border: 'none',
                    backgroundColor: explanationLoading === current.questionBankId ? '#9ca3af' : '#1565C0',
                    color: '#fff', fontSize: 14, cursor: 'pointer', fontWeight: 600,
                  }}>
                  {explanationLoading === current.questionBankId ? '생성 중...' : '해설 생성하기'}
                </button>
              )}
            </div>

            {/* Navigation */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
              <button onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))} disabled={currentIdx === 0}
                style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid #e5e7eb', backgroundColor: '#fff', color: currentIdx === 0 ? '#d1d5db' : '#374151', fontSize: 14, cursor: 'pointer' }}>
                이전
              </button>
              <span style={{ fontSize: 13, color: '#9ca3af', alignSelf: 'center' }}>
                {currentIdx + 1} / {filteredQuestions.length}
              </span>
              <button onClick={() => setCurrentIdx(Math.min(filteredQuestions.length - 1, currentIdx + 1))} disabled={currentIdx === filteredQuestions.length - 1}
                style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid #e5e7eb', backgroundColor: '#fff', color: currentIdx === filteredQuestions.length - 1 ? '#d1d5db' : '#374151', fontSize: 14, cursor: 'pointer' }}>
                다음
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
