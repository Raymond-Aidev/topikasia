import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useImportedQuestionsStore } from '../store/importedQuestionsStore';
import type { QuestionBankItem } from '../api/questionBankApi';
import { createExamSet, updateExamSet, getExamSet } from '../api/examSetApi';
import type { ExamSetPayload } from '../api/examSetApi';
import ExamSetComposer from '../components/ExamSetComposer';

interface SectionState {
  duration: number;
  targetCount: number;
  items: QuestionBankItem[];
}

const SECTION_DEFS = [
  { key: 'LISTENING' as const, label: '듣기', defaultDuration: 60, defaultTarget: 20 },
  { key: 'WRITING' as const, label: '쓰기', defaultDuration: 50, defaultTarget: 4 },
  { key: 'READING' as const, label: '읽기', defaultDuration: 70, defaultTarget: 30 },
];

const ExamSetComposePage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { getSelectedBySection } = useImportedQuestionsStore();

  const [name, setName] = useState('');
  const [examType, setExamType] = useState<'TOPIK_I' | 'TOPIK_II'>('TOPIK_II');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [sections, setSections] = useState<Record<string, SectionState>>(() => {
    const init: Record<string, SectionState> = {};
    SECTION_DEFS.forEach((s) => {
      init[s.key] = {
        duration: s.defaultDuration,
        targetCount: s.defaultTarget,
        items: [],
      };
    });
    return init;
  });

  // 기존 세트 로드
  useEffect(() => {
    if (id) {
      getExamSet(id)
        .then((data) => {
          setName(data.name);
          setExamType(data.examType);
          setDescription(data.description);
          // 세션 데이터는 서버에서 가져온 것 사용
          data.sections?.forEach((sec) => {
            setSections((prev) => ({
              ...prev,
              [sec.section]: {
                duration: sec.duration,
                targetCount: sec.targetCount,
                items: prev[sec.section]?.items ?? [],
              },
            }));
          });
        })
        .catch(() => {
          // 새 세트 구성 모드로 진행
        });
    }
  }, [id]);

  // 스토어에서 가져온 문항을 pool 초기값으로 사용
  const poolBySection: Record<string, QuestionBankItem[]> = {
    LISTENING: getSelectedBySection('LISTENING'),
    WRITING: getSelectedBySection('WRITING'),
    READING: getSelectedBySection('READING'),
  };

  const updateSectionField = (
    section: string,
    field: keyof SectionState,
    value: number | QuestionBankItem[]
  ) => {
    setSections((prev) => ({
      ...prev,
      [section]: { ...prev[section], [field]: value },
    }));
  };

  const handleSave = async (status: 'DRAFT' | 'ACTIVE' = 'DRAFT') => {
    if (!name.trim()) {
      setError('세트 이름을 입력하세요.');
      return;
    }
    setSaving(true);
    setError('');

    const payload: ExamSetPayload = {
      name,
      examType,
      description,
      status,
      sections: SECTION_DEFS.map((s) => ({
        section: s.key,
        duration: sections[s.key].duration,
        targetCount: sections[s.key].targetCount,
        questionBankIds: sections[s.key].items.map((q) => q.bankId),
      })),
    };

    try {
      if (id) {
        await updateExamSet(id, payload);
      } else {
        const result = await createExamSet(payload);
        navigate(`/question-module/compose/${result.id}`, { replace: true });
      }
    } catch {
      setError('저장에 실패했습니다. 다시 시도해 주세요.');
    } finally {
      setSaving(false);
    }
  };

  const totalQuestions = SECTION_DEFS.reduce(
    (sum, s) => sum + sections[s.key].items.length,
    0
  );

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
      <h2 style={{ margin: '0 0 24px', fontSize: 22 }}>
        {id ? '시험 세트 편집' : '새 시험 세트 구성'}
      </h2>

      {/* 기본 정보 */}
      <div
        style={{
          background: '#f8f9fa',
          padding: 20,
          borderRadius: 10,
          marginBottom: 28,
        }}
      >
        <div style={{ display: 'flex', gap: 16, marginBottom: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 2, minWidth: 200 }}>
            <label style={{ display: 'block', fontSize: 13, color: '#555', marginBottom: 4 }}>
              세트 이름
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 2026년 제1회 TOPIK II 모의시험"
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 6,
                border: '1px solid #ccc',
                fontSize: 14,
                boxSizing: 'border-box',
              }}
            />
          </div>
          <div style={{ minWidth: 160 }}>
            <label style={{ display: 'block', fontSize: 13, color: '#555', marginBottom: 4 }}>
              시험 유형
            </label>
            <select
              value={examType}
              onChange={(e) => setExamType(e.target.value as 'TOPIK_I' | 'TOPIK_II')}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 6,
                border: '1px solid #ccc',
                fontSize: 14,
              }}
            >
              <option value="TOPIK_I">TOPIK I</option>
              <option value="TOPIK_II">TOPIK II</option>
            </select>
          </div>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 13, color: '#555', marginBottom: 4 }}>
            설명
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: 6,
              border: '1px solid #ccc',
              fontSize: 14,
              resize: 'vertical',
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      {/* 영역별 설정 & 구성 */}
      {SECTION_DEFS.map((s) => (
        <div key={s.key}>
          <div
            style={{
              display: 'flex',
              gap: 16,
              marginBottom: 12,
              alignItems: 'center',
            }}
          >
            <div>
              <label style={{ fontSize: 13, color: '#555' }}>시간(분)</label>
              <input
                type="number"
                value={sections[s.key].duration}
                onChange={(e) =>
                  updateSectionField(s.key, 'duration', Number(e.target.value))
                }
                min={1}
                style={{
                  display: 'block',
                  width: 80,
                  padding: '6px 8px',
                  borderRadius: 6,
                  border: '1px solid #ccc',
                  fontSize: 14,
                  marginTop: 2,
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: 13, color: '#555' }}>목표 문항수</label>
              <input
                type="number"
                value={sections[s.key].targetCount}
                onChange={(e) =>
                  updateSectionField(s.key, 'targetCount', Number(e.target.value))
                }
                min={1}
                style={{
                  display: 'block',
                  width: 80,
                  padding: '6px 8px',
                  borderRadius: 6,
                  border: '1px solid #ccc',
                  fontSize: 14,
                  marginTop: 2,
                }}
              />
            </div>
          </div>

          <ExamSetComposer
            section={s.key}
            sectionLabel={s.label}
            setItems={sections[s.key].items}
            poolItems={poolBySection[s.key]}
            targetCount={sections[s.key].targetCount}
            onSetItemsChange={(items) => updateSectionField(s.key, 'items', items)}
          />
        </div>
      ))}

      {/* Footer */}
      {error && (
        <p style={{ color: '#d93025', fontSize: 14, marginBottom: 12 }}>{error}</p>
      )}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 16,
          padding: '16px 0',
          borderTop: '1px solid #e0e0e0',
        }}
      >
        <span style={{ fontSize: 14, color: '#555' }}>
          총 {totalQuestions}개 문항 구성됨
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => navigate('/question-module/sets')}
            style={{
              padding: '10px 20px',
              borderRadius: 6,
              border: '1px solid #ccc',
              background: '#fff',
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            목록으로
          </button>
          <button
            onClick={() => handleSave('DRAFT')}
            disabled={saving}
            style={{
              padding: '10px 20px',
              borderRadius: 6,
              border: 'none',
              background: '#5f6368',
              color: '#fff',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontSize: 14,
            }}
          >
            {saving ? '저장 중...' : '임시 저장'}
          </button>
          {id && (
            <button
              onClick={() => navigate(`/question-module/upload/${id}`)}
              style={{
                padding: '10px 20px',
                borderRadius: 6,
                border: 'none',
                background: '#1a73e8',
                color: '#fff',
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              업로드
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExamSetComposePage;
