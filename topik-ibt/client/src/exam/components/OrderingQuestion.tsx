import { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Question } from '../../types/exam.types';
import type { AnswerValue } from '../../store/examStore';

interface OrderingQuestionProps {
  question: Question;
  answer: AnswerValue | undefined;
  onAnswer: (value: AnswerValue) => void;
}

interface SortableItemProps {
  id: string;
  text: string;
  index: number;
}

function SortableItem({ id, text, index }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '14px 16px',
    borderRadius: 8,
    border: '2px solid #E0E0E0',
    backgroundColor: isDragging ? '#E3F2FD' : '#fff',
    cursor: 'grab',
    fontSize: 15,
    lineHeight: '1.6',
    opacity: isDragging ? 0.8 : 1,
    boxShadow: isDragging ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
    userSelect: 'none' as const,
    touchAction: 'none',
  };

  const handleStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
    borderRadius: '50%',
    backgroundColor: '#F5F5F5',
    color: '#757575',
    fontSize: 14,
    fontWeight: 700,
    flexShrink: 0,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <div style={handleStyle}>{index + 1}</div>
      <span style={{ flex: 1 }}>{text}</span>
      <span style={{ color: '#BDBDBD', fontSize: 18 }}>☰</span>
    </div>
  );
}

export default function OrderingQuestion({ question, answer, onAnswer }: OrderingQuestionProps) {
  const cards = question.sentenceCards ?? [];
  const [orderedIds, setOrderedIds] = useState<string[]>(() => {
    if (answer?.orderedItems && answer.orderedItems.length > 0) {
      return answer.orderedItems;
    }
    return cards.map((c) => c.id);
  });

  useEffect(() => {
    if (answer?.orderedItems && answer.orderedItems.length > 0) {
      setOrderedIds(answer.orderedItems);
    }
  }, [question.questionId]); // eslint-disable-line react-hooks/exhaustive-deps

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = orderedIds.indexOf(String(active.id));
    const newIndex = orderedIds.indexOf(String(over.id));
    const newOrder = arrayMove(orderedIds, oldIndex, newIndex);

    setOrderedIds(newOrder);
    onAnswer({ orderedItems: newOrder });
  };

  const cardMap = new Map(cards.map((c) => [c.id, c.text]));

  return (
    <div style={{ padding: '0 0 16px 0' }}>
      <div style={{
        fontSize: 16,
        lineHeight: '1.7',
        color: '#212121',
        marginBottom: 16,
        whiteSpace: 'pre-wrap',
      }}>
        {question.instruction}
      </div>

      {question.passageText && (
        <div style={{
          backgroundColor: '#FAFAFA',
          border: '1px solid #E0E0E0',
          borderRadius: 8,
          padding: '16px 20px',
          marginBottom: 16,
          fontSize: 15,
          lineHeight: '1.8',
          whiteSpace: 'pre-wrap',
          color: '#333',
        }}>
          {question.passageText}
        </div>
      )}

      <div style={{
        fontSize: 13,
        color: '#1565C0',
        marginBottom: 12,
        fontWeight: 500,
      }}>
        문장을 드래그하여 올바른 순서로 배열하세요
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={orderedIds} strategy={verticalListSortingStrategy}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {orderedIds.map((id, index) => (
              <SortableItem
                key={id}
                id={id}
                text={cardMap.get(id) ?? ''}
                index={index}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
