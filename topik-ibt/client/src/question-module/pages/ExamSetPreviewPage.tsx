/**
 * SCR-Q06: 시험세트 미리보기
 * QUESTION-08: 실제 응시 화면처럼 세트 전체 프리뷰
 */
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminApi } from '../../api/adminApi';

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
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#9ca3af' }}>불러오는 중...</div>;
  }

  if (error || !examSet) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div style={{ fontSize: 16, color: '#991b1b', marginBottom: 16 }}>{error || '시험세트를 찾을 수 없습니다'}</div>
        <button onClick={() => navigate(-1)} style={{ padding: '8px 20px', borderRadius: 6, border: '1px solid #d1d5db', backgroundColor: '#fff', cursor: 'pointer' }}>뒤로가기</button>
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
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f4f8' }}>
      {/* Header */}
      <div style={{
        height: 56, backgroundColor: '#1565C0', color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 12, opacity: 0.7 }}>미리보기</span>
          <span style={{ fontWeight: 700 }}>{examSet.name}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 13, opacity: 0.8 }}>
            {examSet.examType === 'TOPIK_I' ? 'TOPIK I' : 'TOPIK II'}
          </span>
          <button
            onClick={() => navigate(-1)}
            style={{
              padding: '6px 16px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.4)',
              backgroundColor: 'transparent', color: '#fff', fontSize: 13, cursor: 'pointer',
            }}
          >
            닫기
          </button>
        </div>
      </div>

      {/* Section Tabs */}
      <div style={{ display: 'flex', backgroundColor: '#fff', borderBottom: '1px solid #e5e7eb' }}>
        {sections.map((sec, idx) => (
          <button
            key={sec.key}
            onClick={() => { setCurrentSectionIdx(idx); setCurrentQuestionIdx(0); }}
            style={{
              padding: '12px 24px', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer',
              backgroundColor: idx === currentSectionIdx ? '#1565C0' : '#fff',
              color: idx === currentSectionIdx ? '#fff' : '#6b7280',
              borderBottom: idx === currentSectionIdx ? '3px solid #1565C0' : '3px solid transparent',
            }}
          >
            {SECTION_LABELS[sec.key] || sec.data.sectionName || sec.key}
            <span style={{ fontSize: 11, marginLeft: 6, opacity: 0.7 }}>
              ({sec.data.questions.length}문항, {sec.data.durationMinutes || sec.data.timeLimitMinutes || 0}분)
            </span>
          </button>
        ))}
      </div>

      {/* Question Content */}
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 24px' }}>
        {/* Question nav */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#1565C0' }}>
            문제 {currentQuestionIdx + 1} / {totalQuestions}
          </div>
          <div style={{ fontSize: 13, color: '#6b7280' }}>
            {currentQuestion?.typeCode || '-'} | bankId: {currentQuestion?.bankId || '-'}
          </div>
        </div>

        {/* Question card */}
        {currentQuestion ? (
          <div style={{ backgroundColor: '#fff', borderRadius: 12, padding: 28, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: 24 }}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, color: '#111827' }}>
              {currentQuestion.bankId}
            </div>

            {/* MCQ simulation */}
            {(currentQuestion.typeCode.includes('MCQ') || currentQuestion.typeCode.includes('LISTEN') || currentQuestion.typeCode.includes('READ')) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[1, 2, 3, 4].map(opt => {
                  const isSelected = selectedAnswers[currentQuestion.bankId] === opt;
                  const isCorrect = currentQuestion.correctAnswer === opt;
                  return (
                    <button
                      key={opt}
                      onClick={() => handleSelectAnswer(currentQuestion.bankId, opt)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                        borderRadius: 8, border: `2px solid ${isSelected ? '#1565C0' : '#e5e7eb'}`,
                        backgroundColor: isSelected ? '#e8f0fe' : '#fff',
                        cursor: 'pointer', textAlign: 'left', fontSize: 14,
                      }}
                    >
                      <span style={{
                        width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        backgroundColor: isSelected ? '#1565C0' : '#f3f4f6', color: isSelected ? '#fff' : '#6b7280',
                        fontSize: 13, fontWeight: 600, flexShrink: 0,
                      }}>
                        {opt}
                      </span>
                      <span>보기 {opt}</span>
                      {isCorrect && (
                        <span style={{ marginLeft: 'auto', fontSize: 11, color: '#16a34a', fontWeight: 600 }}>정답</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Writing simulation */}
            {(currentQuestion.typeCode.includes('WRITE') || currentQuestion.typeCode.includes('ESSAY')) && (
              <div>
                <textarea
                  placeholder="(쓰기 문항 - 미리보기)"
                  rows={6}
                  style={{
                    width: '100%', padding: 12, borderRadius: 8, border: '1px solid #d1d5db',
                    fontSize: 14, resize: 'vertical', boxSizing: 'border-box',
                  }}
                />
              </div>
            )}

            {/* Points info */}
            {currentQuestion.points != null && (
              <div style={{ marginTop: 12, fontSize: 12, color: '#9ca3af' }}>
                배점: {currentQuestion.points}점
              </div>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>문항이 없습니다.</div>
        )}

        {/* Question grid */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>문항 번호</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {questions.map((q, idx) => {
              const answered = selectedAnswers[q.bankId] != null;
              return (
                <button
                  key={q.bankId}
                  onClick={() => setCurrentQuestionIdx(idx)}
                  style={{
                    width: 32, height: 32, borderRadius: 4, border: '1px solid #d1d5db',
                    backgroundColor: idx === currentQuestionIdx ? '#1565C0' : answered ? '#d1fae5' : '#fff',
                    color: idx === currentQuestionIdx ? '#fff' : '#374151',
                    fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* Nav buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <button
            disabled={currentQuestionIdx === 0}
            onClick={() => setCurrentQuestionIdx(i => i - 1)}
            style={{
              padding: '10px 24px', borderRadius: 8, border: '1px solid #d1d5db',
              backgroundColor: '#fff', fontSize: 14, fontWeight: 600,
              cursor: currentQuestionIdx === 0 ? 'not-allowed' : 'pointer',
              opacity: currentQuestionIdx === 0 ? 0.5 : 1,
            }}
          >
            이전
          </button>
          <button
            disabled={currentQuestionIdx >= totalQuestions - 1}
            onClick={() => setCurrentQuestionIdx(i => i + 1)}
            style={{
              padding: '10px 24px', borderRadius: 8, border: 'none',
              backgroundColor: '#1565C0', color: '#fff', fontSize: 14, fontWeight: 600,
              cursor: currentQuestionIdx >= totalQuestions - 1 ? 'not-allowed' : 'pointer',
              opacity: currentQuestionIdx >= totalQuestions - 1 ? 0.5 : 1,
            }}
          >
            다음
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExamSetPreviewPage;
