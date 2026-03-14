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
import { cn } from '../../lib/utils';
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

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        touchAction: 'none',
      }}
      className={cn(
        'flex cursor-grab select-none items-center gap-3 rounded-lg border-2 border-gray-300 px-4 py-3.5 text-[15px] leading-relaxed',
        isDragging
          ? 'bg-blue-50 opacity-80 shadow-lg'
          : 'bg-white'
      )}
      {...attributes}
      {...listeners}
    >
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-500">
        {index + 1}
      </div>
      <span className="flex-1">{text}</span>
      <span className="text-lg text-gray-400">☰</span>
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
    <div className="pb-4">
      <div className="mb-4 whitespace-pre-wrap text-base leading-[1.7] text-gray-900">
        {question.instruction}
      </div>

      {question.passageText && (
        <div className="mb-4 whitespace-pre-wrap rounded-lg border border-gray-300 bg-gray-50 px-5 py-4 text-[15px] leading-[1.8] text-gray-700">
          {question.passageText}
        </div>
      )}

      <div className="mb-3 text-[13px] font-medium text-blue-800">
        문장을 드래그하여 올바른 순서로 배열하세요
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={orderedIds} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-2">
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
