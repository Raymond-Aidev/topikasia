import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api/adminApi';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';

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
    <Select
      value={value}
      onValueChange={(val) => { if (val) onChange(val); }}
      disabled={disabled || loading}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder={loading ? '불러오는 중...' : placeholder} />
      </SelectTrigger>
      <SelectContent>
        {examSets.map((set) => (
          <SelectItem key={set.id} value={set.id}>
            [{set.examSetNumber}] {set.name} ({set.examType})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default ExamSetSelector;
