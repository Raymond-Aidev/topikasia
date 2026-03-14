import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { QuestionBankItem } from '../api/questionBankApi';
import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';

// ─── SortableItem ────────────────────────────────────────────

const WRITING_TYPES = ['ESSAY', 'SHORT_ANSWER', 'FILL_IN_BLANK', 'SENTENCE_COMPLETION', 'SUMMARY'];

interface SortableItemProps {
  item: QuestionBankItem;
  index: number;
  onRemove: () => void;
  onModelAnswer?: (item: QuestionBankItem) => void;
  hasModelAnswer?: boolean;
}

const SortableItem: React.FC<SortableItemProps> = ({ item, index, onRemove, onModelAnswer, hasModelAnswer }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.bankId });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex items-center gap-2 px-3 py-2 mb-1 bg-white border border-gray-300 rounded-md text-[13px]',
        isDragging && 'opacity-50'
      )}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      <span {...attributes} {...listeners} className="cursor-grab select-none">
        ⠿
      </span>
      <span className="text-gray-400 min-w-[24px]">{index + 1}</span>
      <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
        {item.previewText}
      </span>
      <Badge variant="secondary" className="text-[11px] bg-gray-100 text-gray-500">
        {item.typeName}
      </Badge>
      {hasModelAnswer && (
        <Badge variant="secondary" className="text-[10px] bg-green-50 text-green-700 font-semibold">
          모범답안
        </Badge>
      )}
      {onModelAnswer && WRITING_TYPES.includes(item.typeCode) && (
        <Button
          variant="outline"
          size="xs"
          onClick={(e) => { e.stopPropagation(); onModelAnswer(item); }}
          className={cn(
            'text-[11px] border-purple-500 text-purple-500 whitespace-nowrap',
            hasModelAnswer && 'bg-purple-50'
          )}
          title="모범답안 설정"
        >
          모범답안
        </Button>
      )}
      <button
        onClick={onRemove}
        className="bg-transparent border-none text-red-600 cursor-pointer text-base px-1"
        title="제거"
      >
        ×
      </button>
    </div>
  );
};

// ─── ExamSetComposer ─────────────────────────────────────────

interface Props {
  section: 'LISTENING' | 'WRITING' | 'READING';
  sectionLabel: string;
  setItems: QuestionBankItem[];
  poolItems: QuestionBankItem[];
  targetCount: number;
  onSetItemsChange: (items: QuestionBankItem[]) => void;
  onModelAnswer?: (item: QuestionBankItem) => void;
  modelAnswerIds?: Set<string>;
}

const ExamSetComposer: React.FC<Props> = ({
  section: _section,
  sectionLabel,
  setItems,
  poolItems,
  targetCount,
  onSetItemsChange,
  onModelAnswer,
  modelAnswerIds,
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = setItems.findIndex((q) => q.bankId === active.id);
      const newIndex = setItems.findIndex((q) => q.bankId === over.id);
      if (oldIndex >= 0 && newIndex >= 0) {
        onSetItemsChange(arrayMove(setItems, oldIndex, newIndex));
      }
    }
  };

  const addToSet = (item: QuestionBankItem) => {
    if (!setItems.find((q) => q.bankId === item.bankId)) {
      onSetItemsChange([...setItems, item]);
    }
  };

  const removeFromSet = (bankId: string) => {
    onSetItemsChange(setItems.filter((q) => q.bankId !== bankId));
  };

  const setItemIds = new Set(setItems.map((q) => q.bankId));
  const available = poolItems.filter((q) => !setItemIds.has(q.bankId));

  return (
    <div className="mb-8">
      <h3 className="m-0 mb-3 text-base">
        {sectionLabel}{' '}
        <span className="font-normal text-sm text-gray-500">
          현재: {setItems.length} / {targetCount} 문항
        </span>
      </h3>

      <div className="flex gap-4">
        {/* Left: set items (sortable) */}
        <div className="flex-1 border border-gray-300 rounded-lg p-3 min-h-[200px] bg-gray-50">
          <h4 className="m-0 mb-2 text-[13px] text-gray-500">
            세트 문항 (드래그하여 순서 변경)
          </h4>
          {setItems.length === 0 ? (
            <p className="text-gray-400 text-[13px] text-center mt-10">
              오른쪽에서 문항을 추가하세요
            </p>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={setItems.map((q) => q.bankId)}
                strategy={verticalListSortingStrategy}
              >
                {setItems.map((item, index) => (
                  <SortableItem
                    key={item.bankId}
                    item={item}
                    index={index}
                    onRemove={() => removeFromSet(item.bankId)}
                    onModelAnswer={onModelAnswer}
                    hasModelAnswer={modelAnswerIds?.has(item.bankId)}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </div>

        {/* Right: pool */}
        <div className="flex-1 border border-gray-300 rounded-lg p-3 min-h-[200px] bg-white max-h-[400px] overflow-auto">
          <h4 className="m-0 mb-2 text-[13px] text-gray-500">
            가져온 문항 풀 ({available.length}개)
          </h4>
          {available.length === 0 ? (
            <p className="text-gray-400 text-[13px] text-center mt-10">
              가져온 문항이 없습니다
            </p>
          ) : (
            available.map((item) => (
              <div
                key={item.bankId}
                className="flex items-center gap-2 px-2.5 py-1.5 mb-1 border border-gray-100 rounded-md text-[13px]"
              >
                <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                  {item.previewText}
                </span>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => addToSet(item)}
                  className="text-blue-600 border-blue-600 bg-blue-50 whitespace-nowrap"
                >
                  + 추가
                </Button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ExamSetComposer;
