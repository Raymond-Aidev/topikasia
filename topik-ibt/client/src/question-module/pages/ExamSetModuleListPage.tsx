import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listExamSets, deleteExamSet } from '../api/examSetApi';
import type { ExamSetListItem } from '../api/examSetApi';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '../../components/ui/table';

const STATUS_BADGE: Record<string, { variant: 'default' | 'secondary' | 'outline' | 'destructive'; label: string }> = {
  DRAFT: { variant: 'secondary', label: '임시저장' },
  ACTIVE: { variant: 'default', label: '활성' },
  ARCHIVED: { variant: 'outline', label: '보관' },
};

const ExamSetModuleListPage: React.FC = () => {
  const navigate = useNavigate();
  const [sets, setSets] = useState<ExamSetListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchSets = () => {
    setLoading(true);
    listExamSets()
      .then(setSets)
      .catch(() => setError('세트 목록을 불러올 수 없습니다.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSets();
  }, []);

  const handleDelete = async (s: ExamSetListItem) => {
    if (!window.confirm(`시험세트 '${s.name}'을 삭제하시겠습니까?`)) return;
    try {
      await deleteExamSet(s.id);
      fetchSets();
    } catch (err: any) {
      alert(err.response?.data?.message || '삭제에 실패했습니다.');
    }
  };

  return (
    <div className="mx-auto max-w-[960px] px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-[22px] font-bold">시험 세트 목록</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate('/question-module/import')}
          >
            문제 불러오기
          </Button>
          <Button
            onClick={() => navigate('/question-module/compose')}
          >
            + 새 세트 만들기
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="mt-16 text-center text-muted-foreground">불러오는 중...</p>
      ) : error ? (
        <p className="mt-16 text-center text-destructive">{error}</p>
      ) : sets.length === 0 ? (
        <div className="mt-16 text-center text-muted-foreground">
          <p className="text-base">아직 생성된 시험 세트가 없습니다.</p>
          <p className="text-sm">위의 버튼을 눌러 새로운 세트를 만들어 보세요.</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-left">세트명</TableHead>
              <TableHead className="text-center">시험유형</TableHead>
              <TableHead className="text-center">상태</TableHead>
              <TableHead className="text-center">문항수</TableHead>
              <TableHead className="text-center">수정일</TableHead>
              <TableHead className="text-center">관리</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sets.map((s) => {
              const badge = STATUS_BADGE[s.status] ?? STATUS_BADGE.DRAFT;
              return (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell className="text-center">{s.examType}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {s.questionCount}
                  </TableCell>
                  <TableCell className="text-center text-muted-foreground">
                    {new Date(s.updatedAt).toLocaleDateString('ko-KR')}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="outline"
                      size="sm"
                      className="mr-1"
                      onClick={() => navigate(`/question-module/compose/${s.id}`)}
                    >
                      편집
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-blue-500 bg-blue-50 text-blue-600 hover:bg-blue-100"
                      onClick={() => navigate(`/question-module/upload/${s.id}`)}
                    >
                      업로드
                    </Button>
                    {(s.status === 'DRAFT' || s.status === 'ARCHIVED') && (
                      <Button
                        variant="destructive"
                        size="sm"
                        className="ml-1"
                        onClick={() => handleDelete(s)}
                      >
                        삭제
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

export default ExamSetModuleListPage;
