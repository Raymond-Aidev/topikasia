import React, { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import ExamSetStatusBadge from '../components/ExamSetStatusBadge';
import ExamSetScheduleInput from '../components/ExamSetScheduleInput';
import { adminApi } from '../../api/adminApi';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/table';

interface ExamSet {
  id: string;
  name: string;
  examType: string;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  assignedCount: number;
  questionCount?: number;
  scheduledStartAt?: string | null;
  examStartedAt?: string | null;
}

const ExamSetListPage: React.FC = () => {
  const [examSets, setExamSets] = useState<ExamSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingSchedule, setEditingSchedule] = useState<string | null>(null);
  const [scheduleValue, setScheduleValue] = useState('');
  const [savingSchedule, setSavingSchedule] = useState(false);

  const fetchExamSets = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.get('/admin/exam-sets');
      const body = (res.data as any)?.data || res.data;
      setExamSets(Array.isArray(body) ? body : []);
    } catch (err: any) {
      setError(err.response?.data?.message || '데이터를 불러오는 데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExamSets();
  }, []);

  const handleScheduleSave = async (examSetId: string) => {
    setSavingSchedule(true);
    try {
      await adminApi.patch(`/admin/exam-sets/${examSetId}/schedule`, {
        scheduledStartAt: scheduleValue ? new Date(scheduleValue).toISOString() : null,
      });
      await fetchExamSets();
      setEditingSchedule(null);
    } catch (err: any) {
      alert(err.response?.data?.message || '일정 저장에 실패했습니다.');
    } finally {
      setSavingSchedule(false);
    }
  };

  const openScheduleEditor = (es: ExamSet) => {
    setEditingSchedule(es.id);
    if (es.scheduledStartAt) {
      const d = new Date(es.scheduledStartAt);
      const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      setScheduleValue(local);
    } else {
      setScheduleValue('');
    }
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-5">
        <h1 className="text-[22px] font-bold m-0">시험세트 관리</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchExamSets} disabled={loading}>
            새로고침
          </Button>
          <a href="/question-module/sets" className="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white no-underline">
            문제 출제 모듈
          </a>
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 mb-4 rounded-md bg-red-100 text-red-800 text-sm">
          {error}
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-10 text-gray-400">불러오는 중...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>세트명</TableHead>
                  <TableHead>유형</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead className="text-right">배정수</TableHead>
                  <TableHead>관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {examSets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-400 py-10">
                      시험세트가 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  examSets.map((es, idx) => (
                    <React.Fragment key={es.id}>
                      <TableRow>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell className="font-semibold">{es.name}</TableCell>
                        <TableCell>{es.examType}</TableCell>
                        <TableCell>
                          <ExamSetStatusBadge
                            status={es.status}
                            scheduledStartAt={es.scheduledStartAt}
                            examStartedAt={es.examStartedAt}
                          />
                        </TableCell>
                        <TableCell className="text-right">{es.assignedCount ?? 0}</TableCell>
                        <TableCell>
                          <div className="flex gap-1.5">
                            <a href={`/question-module/compose/${es.id}`} className="inline-flex items-center justify-center rounded-md text-sm font-medium h-7 px-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground no-underline">
                              편집
                            </a>
                            {es.status === 'ACTIVE' && (
                              <Button variant="outline" size="xs" onClick={() => openScheduleEditor(es)}>
                                시간 설정
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                      {editingSchedule === es.id && (
                        <TableRow>
                          <TableCell colSpan={6} className="bg-gray-50">
                            <div className="max-w-[480px] py-2">
                              <ExamSetScheduleInput
                                value={scheduleValue}
                                onChange={setScheduleValue}
                                disabled={savingSchedule}
                              />
                              <div className="flex gap-2 mt-3">
                                <Button
                                  onClick={() => handleScheduleSave(es.id)}
                                  disabled={savingSchedule}
                                  size="sm"
                                  className="bg-blue-600 hover:bg-blue-500 text-white"
                                >
                                  {savingSchedule ? '저장 중...' : '저장'}
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => setEditingSchedule(null)}>
                                  취소
                                </Button>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default ExamSetListPage;
