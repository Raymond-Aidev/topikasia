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

// ─── SortableItem ────────────────────────────────────────────

interface SortableItemProps {
  item: QuestionBankItem;
  index: number;
  onRemove: () => void;
}

const SortableItem: React.FC<SortableItemProps> = ({ item, index, onRemove }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.bankId });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 12px',
    marginBottom: 4,
    background: '#fff',
    border: '1px solid #e0e0e0',
    borderRadius: 6,
    fontSize: 13,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <span {...attributes} {...listeners} style={{ cursor: 'grab', userSelect: 'none' }}>
        ⠿
      </span>
      <span style={{ color: '#888', minWidth: 24 }}>{index + 1}</span>
      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {item.previewText}
      </span>
      <span
        style={{
          fontSize: 11,
          padding: '2px 6px',
          borderRadius: 4,
          background: '#f0f0f0',
          color: '#666',
        }}
      >
        {item.typeName}
      </span>
      <button
        onClick={onRemove}
        style={{
          background: 'none',
          border: 'none',
          color: '#d93025',
          cursor: 'pointer',
          fontSize: 16,
          padding: '0 4px',
        }}
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
}

const ExamSetComposer: React.FC<Props> = ({
  section: _section,
  sectionLabel,
  setItems,
  poolItems,
  targetCount,
  onSetItemsChange,
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
    <div style={{ marginBottom: 32 }}>
      <h3 style={{ margin: '0 0 12px', fontSize: 16 }}>
        {sectionLabel}{' '}
        <span style={{ fontWeight: 400, fontSize: 14, color: '#555' }}>
          현재: {setItems.length} / {targetCount} 문항
        </span>
      </h3>

      <div style={{ display: 'flex', gap: 16 }}>
        {/* Left: set items (sortable) */}
        <div
          style={{
            flex: 1,
            border: '1px solid #e0e0e0',
            borderRadius: 8,
            padding: 12,
            minHeight: 200,
            background: '#fafafa',
          }}
        >
          <h4 style={{ margin: '0 0 8px', fontSize: 13, color: '#555' }}>
            세트 문항 (드래그하여 순서 변경)
          </h4>
          {setItems.length === 0 ? (
            <p style={{ color: '#aaa', fontSize: 13, textAlign: 'center', marginTop: 40 }}>
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
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </div>

        {/* Right: pool */}
        <div
          style={{
            flex: 1,
            border: '1px solid #e0e0e0',
            borderRadius: 8,
            padding: 12,
            minHeight: 200,
            background: '#fff',
            maxHeight: 400,
            overflow: 'auto',
          }}
        >
          <h4 style={{ margin: '0 0 8px', fontSize: 13, color: '#555' }}>
            가져온 문항 풀 ({available.length}개)
          </h4>
          {available.length === 0 ? (
            <p style={{ color: '#aaa', fontSize: 13, textAlign: 'center', marginTop: 40 }}>
              가져온 문항이 없습니다
            </p>
          ) : (
            available.map((item) => (
              <div
                key={item.bankId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 10px',
                  marginBottom: 4,
                  border: '1px solid #f0f0f0',
                  borderRadius: 6,
                  fontSize: 13,
                }}
              >
                <span
                  style={{
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {item.previewText}
                </span>
                <button
                  onClick={() => addToSet(item)}
                  style={{
                    padding: '3px 10px',
                    borderRadius: 4,
                    border: '1px solid #1a73e8',
                    background: '#e8f0fe',
                    color: '#1a73e8',
                    cursor: 'pointer',
                    fontSize: 12,
                    whiteSpace: 'nowrap',
                  }}
                >
                  + 추가
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ExamSetComposer;
