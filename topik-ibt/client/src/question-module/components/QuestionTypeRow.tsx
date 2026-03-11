import React from 'react';
import { QuestionTypeConfig } from '../config/questionTypes.config';
import { QuestionBankItem } from '../api/questionBankApi';

interface Props {
  config: QuestionTypeConfig;
  loadedCount: number;
  selectedCount: number;
  onImport: () => void;
  loading: boolean;
}

const QuestionTypeRow: React.FC<Props> = ({
  config,
  loadedCount,
  selectedCount,
  onImport,
  loading,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '10px 16px',
        borderBottom: '1px solid #f0f0f0',
        gap: 12,
      }}
    >
      <div style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{config.name}</div>
      <div style={{ fontSize: 13, color: '#888', minWidth: 80, textAlign: 'center' }}>
        불러온: {loadedCount}
      </div>
      <div style={{ fontSize: 13, color: '#1a73e8', minWidth: 80, textAlign: 'center' }}>
        선택: {selectedCount}
      </div>
      <button
        onClick={onImport}
        disabled={loading}
        style={{
          padding: '6px 14px',
          borderRadius: 6,
          border: '1px solid #1a73e8',
          background: loading ? '#e8f0fe' : '#fff',
          color: '#1a73e8',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: 13,
          whiteSpace: 'nowrap',
        }}
      >
        {loading ? '불러오는 중...' : '문제 불러오기'}
      </button>
    </div>
  );
};

export default QuestionTypeRow;
