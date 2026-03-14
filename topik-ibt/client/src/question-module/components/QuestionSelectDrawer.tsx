import React, { useEffect, useState } from 'react';
import type { QuestionBankItem } from '../api/questionBankApi';
import { fetchQuestionsFromBank } from '../api/questionBankMock';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Checkbox } from '../../components/ui/checkbox';
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
        className="fixed inset-0 z-[1000] flex justify-end bg-black/35"
        onClick={onCancel}
      >
        <div
          className="w-[520px] h-full bg-white shadow-[-4px_0_24px_rgba(0,0,0,0.12)] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 pt-5 pb-3 border-b border-gray-300">
            <h3 className="m-0 text-lg">{typeName} 문제 선택</h3>
          </div>

          {/* Filters */}
          <div className="px-6 py-3 flex gap-2.5 border-b border-gray-100">
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="px-2.5 py-1.5 rounded-md border border-gray-300 text-sm"
            >
              {DIFFICULTY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  난이도: {o.label}
                </option>
              ))}
            </select>
            <Input
              type="text"
              placeholder="키워드 검색..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="flex-1"
            />
          </div>

          {/* List */}
          <div className="flex-1 overflow-auto px-6 py-2">
            {loading ? (
              <p className="text-gray-400 text-center mt-10">
                불러오는 중...
              </p>
            ) : items.length === 0 ? (
              <p className="text-gray-400 text-center mt-10">
                문제가 없습니다.
              </p>
            ) : (
              items.map((item) => (
                <div
                  key={item.bankId}
                  className="flex items-start gap-2.5 py-2.5 border-b border-gray-100"
                >
                  <Checkbox
                    checked={selectedIds.has(item.bankId)}
                    onCheckedChange={() => toggle(item.bankId)}
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <div className="text-sm leading-relaxed">{item.previewText}</div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      난이도:{' '}
                      {item.difficulty === 'EASY'
                        ? '하'
                        : item.difficulty === 'MEDIUM'
                          ? '중'
                          : '상'}{' '}
                      | {item.tags.join(', ')}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => setPreviewId(item.bankId)}
                  >
                    미리보기
                  </Button>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-300 flex items-center justify-between">
            <span className="text-sm text-gray-500">
              {items.length}개 중 {selectedIds.size}개 선택됨
            </span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onCancel}>
                취소
              </Button>
              <Button onClick={handleConfirm}>
                선택 완료
              </Button>
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
