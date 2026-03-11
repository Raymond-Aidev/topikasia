import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuestionTypes } from '../hooks/useQuestionTypes';
import { useImportedQuestionsStore } from '../store/importedQuestionsStore';
import QuestionBankImporter from '../components/QuestionBankImporter';

const SECTIONS = [
  { key: 'LISTENING' as const, label: '듣기' },
  { key: 'WRITING' as const, label: '쓰기' },
  { key: 'READING' as const, label: '읽기' },
];

const QuestionBankImportPage: React.FC = () => {
  const navigate = useNavigate();
  const allTypes = useQuestionTypes();
  const { getSelectedBySection, getAllSelected } = useImportedQuestionsStore();

  const totalSelected = getAllSelected().length;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
      <h2 style={{ margin: '0 0 8px', fontSize: 22 }}>문제 은행 불러오기</h2>
      <p style={{ margin: '0 0 24px', color: '#666', fontSize: 14 }}>
        영역별 문제 유형을 선택하여 문제를 불러옵니다.
      </p>

      {SECTIONS.map(({ key, label }) => {
        const sectionTypes = allTypes.filter((t) => t.section === key);
        return (
          <QuestionBankImporter key={key} types={sectionTypes} sectionLabel={label} />
        );
      })}

      {/* Summary footer */}
      <div
        style={{
          marginTop: 24,
          padding: 20,
          background: '#f8f9fa',
          borderRadius: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ fontSize: 14 }}>
          {SECTIONS.map(({ key, label }) => (
            <span key={key} style={{ marginRight: 20 }}>
              <strong>{label}</strong>: {getSelectedBySection(key).length}개
            </span>
          ))}
          <span style={{ marginLeft: 8, fontWeight: 700 }}>
            | 총 {totalSelected}개 선택됨
          </span>
        </div>

        <button
          onClick={() => navigate('/question-module/compose')}
          disabled={totalSelected === 0}
          style={{
            padding: '10px 24px',
            borderRadius: 8,
            border: 'none',
            background: totalSelected > 0 ? '#1a73e8' : '#ccc',
            color: '#fff',
            cursor: totalSelected > 0 ? 'pointer' : 'not-allowed',
            fontSize: 15,
            fontWeight: 600,
          }}
        >
          세트 구성으로 이동 →
        </button>
      </div>
    </div>
  );
};

export default QuestionBankImportPage;
