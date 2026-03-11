import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api/adminApi';

interface ExamSet {
  id: string;
  examSetNumber: number;
  name: string;
  examType: string;
}

interface ExamSetSelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  style?: React.CSSProperties;
}

const ExamSetSelector: React.FC<ExamSetSelectorProps> = ({
  value,
  onChange,
  disabled = false,
  placeholder = '시험세트 선택',
  style,
}) => {
  const [examSets, setExamSets] = useState<ExamSet[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSets = async () => {
      setLoading(true);
      try {
        const res = await adminApi.get('/admin/exam-sets/assignable');
        setExamSets(res.data);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };
    fetchSets();
  }, []);

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled || loading}
      style={{
        padding: '8px 12px',
        borderRadius: '6px',
        border: '1px solid #d1d5db',
        fontSize: '14px',
        backgroundColor: '#fff',
        ...style,
      }}
    >
      <option value="">{loading ? '불러오는 중...' : placeholder}</option>
      {examSets.map((set) => (
        <option key={set.id} value={set.id}>
          [{set.examSetNumber}] {set.name} ({set.examType})
        </option>
      ))}
    </select>
  );
};

export default ExamSetSelector;
