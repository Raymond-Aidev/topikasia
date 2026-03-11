import React, { useEffect, useState } from 'react';
import { QuestionBankItem } from '../api/questionBankApi';
import { fetchQuestionsFromBank } from '../api/questionBankMock';
import QuestionPreview from './QuestionPreview';

interface Props {
  typeCode: string;
  typeName: string;
  initialSelected: QuestionBankItem[];
  onConfirm: (items: QuestionBankItem[]) => void;
  onCancel: () => void;
}

const DIFFICULTY_OPTIONS = [
  { value: '', label: '전체' },
  { value: 'EASY', label: '하' },
  { value: 'MEDIUM', label: '중' },
  { value: 'HARD', label: '상' },
];

const QuestionSelectDrawer: React.FC<Props> = ({
  typeCode,
  typeName,
  initialSelected,
  onConfirm,
  onCancel,
}) => {
  const [items, setItems] = useState<QuestionBankItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(initialSelected.map((q) => q.bankId))
  );
  const [difficulty, setDifficulty] = useState('');
  const [keyword, setKeyword] = useState('');
  const [previewId, setPreviewId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchQuestionsFromBank({
      typeCode,
      difficulty: difficulty ? (difficulty as 'EASY' | 'MEDIUM' | 'HARD') : undefined,
      keyword: keyword || undefined,
    })
      .then((res) => setItems(res.items))
      .finally(() => setLoading(false));
  }, [typeCode, difficulty, keyword]);

  const toggle = (bankId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(bankId)) next.delete(bankId);
      else next.add(bankId);
      return next;
    });
  };

  const handleConfirm = () => {
    // 선택된 항목 중 현재 로드된 아이템 + 이전에 선택했지만 필터에 걸린 항목 유지
    const allItems = [...items, ...initialSelected];
    const uniqueMap = new Map(allItems.map((q) => [q.bankId, q]));
    const selected = Array.from(selectedIds)
      .map((id) => uniqueMap.get(id))
      .filter(Boolean) as QuestionBankItem[];
    onConfirm(selected);
  };

  return (
    <>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000,
          display: 'flex',
          justifyContent: 'flex-end',
          background: 'rgba(0,0,0,0.35)',
        }}
        onClick={onCancel}
      >
        <div
          style={{
            width: 520,
            height: '100%',
            background: '#fff',
            boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
            display: 'flex',
            flexDirection: 'column',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{ padding: '20px 24px 12px', borderBottom: '1px solid #e0e0e0' }}>
            <h3 style={{ margin: 0, fontSize: 18 }}>{typeName} 문제 선택</h3>
          </div>

          {/* Filters */}
          <div
            style={{
              padding: '12px 24px',
              display: 'flex',
              gap: 10,
              borderBottom: '1px solid #f0f0f0',
            }}
          >
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              style={{
                padding: '6px 10px',
                borderRadius: 6,
                border: '1px solid #ccc',
                fontSize: 14,
              }}
            >
              {DIFFICULTY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  난이도: {o.label}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="키워드 검색..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              style={{
                flex: 1,
                padding: '6px 10px',
                borderRadius: 6,
                border: '1px solid #ccc',
                fontSize: 14,
              }}
            />
          </div>

          {/* List */}
          <div style={{ flex: 1, overflow: 'auto', padding: '8px 24px' }}>
            {loading ? (
              <p style={{ color: '#888', textAlign: 'center', marginTop: 40 }}>
                불러오는 중...
              </p>
            ) : items.length === 0 ? (
              <p style={{ color: '#888', textAlign: 'center', marginTop: 40 }}>
                문제가 없습니다.
              </p>
            ) : (
              items.map((item) => (
                <div
                  key={item.bankId}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    padding: '10px 0',
                    borderBottom: '1px solid #f5f5f5',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(item.bankId)}
                    onChange={() => toggle(item.bankId)}
                    style={{ marginTop: 3 }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, lineHeight: 1.5 }}>{item.previewText}</div>
                    <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
                      난이도:{' '}
                      {item.difficulty === 'EASY'
                        ? '하'
                        : item.difficulty === 'MEDIUM'
                          ? '중'
                          : '상'}{' '}
                      | {item.tags.join(', ')}
                    </div>
                  </div>
                  <button
                    onClick={() => setPreviewId(item.bankId)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 4,
                      border: '1px solid #ccc',
                      background: '#fff',
                      fontSize: 12,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    미리보기
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              padding: '16px 24px',
              borderTop: '1px solid #e0e0e0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ fontSize: 14, color: '#555' }}>
              {items.length}개 중 {selectedIds.size}개 선택됨
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={onCancel}
                style={{
                  padding: '8px 20px',
                  borderRadius: 6,
                  border: '1px solid #ccc',
                  background: '#fff',
                  cursor: 'pointer',
                  fontSize: 14,
                }}
              >
                취소
              </button>
              <button
                onClick={handleConfirm}
                style={{
                  padding: '8px 20px',
                  borderRadius: 6,
                  border: 'none',
                  background: '#1a73e8',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: 14,
                }}
              >
                선택 완료
              </button>
            </div>
          </div>
        </div>
      </div>

      {previewId && (
        <QuestionPreview bankId={previewId} onClose={() => setPreviewId(null)} />
      )}
    </>
  );
};

export default QuestionSelectDrawer;
