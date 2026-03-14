import React, { useEffect, useState, useCallback } from 'react';
import AdminLayout from '../components/AdminLayout';
import StatusBadge from '../components/StatusBadge';
import ExamSessionDetailModal from '../components/ExamSessionDetailModal';
import { adminApi } from '../../api/adminApi';
import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent } from '../../components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from '../../components/ui/pagination';

interface ExamSession {
  id: string;
  examineeName: string;
  examineeLoginId: string;
  examSetName: string;
  status: string;
  startedAt: string;
  endedAt: string | null;
}

interface ExamSetOption {
  id: string;
  name: string;
}

const PAGE_SIZE = 20;

const formatDateTime = (v: string | null) => {
  if (!v) return '-';
  return new Date(v).toLocaleString('ko-KR');
};

const ExamSessionListPage: React.FC = () => {
  const [sessions, setSessions] = useState<ExamSession[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [examSetFilter, setExamSetFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [examSets, setExamSets] = useState<ExamSetOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  // Detail modal
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, any> = { page, limit: PAGE_SIZE };
      if (statusFilter) params.status = statusFilter;
      if (examSetFilter) params.examSetId = examSetFilter;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      const res = await adminApi.get('/admin/exam-sessions', { params });
      const body = res.data?.data || res.data;
      setSessions(body.sessions || body.data || []);
      setTotal(body.pagination?.total ?? body.total ?? 0);
    } catch (err: any) {
      setError(err.response?.data?.message || '데이터를 불러오는 데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, examSetFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  useEffect(() => {
    adminApi
      .get('/admin/exam-sets/assignable')
      .then((res) => {
        const body = res.data?.data || res.data;
        setExamSets(Array.isArray(body) ? body : []);
      })
      .catch(() => {});
  }, []);

  const handleExport = async () => {
    setExporting(true);
    try {
      const params: Record<string, any> = {};
      if (statusFilter) params.status = statusFilter;
      if (examSetFilter) params.examSetId = examSetFilter;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      const res = await adminApi.get('/admin/exam-sessions/export', {
        responseType: 'blob',
        params,
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `exam-sessions-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.response?.data?.message || '내보내기에 실패했습니다.');
    } finally {
      setExporting(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-5">
        <h1 className="text-[22px] font-bold m-0">응시내역</h1>
        <Button
          onClick={handleExport}
          disabled={exporting}
          className="bg-green-600 hover:bg-green-500 text-white"
        >
          {exporting ? '내보내기 중...' : 'Excel 내보내기'}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2.5 mb-4 flex-wrap items-center">
        <div className="flex items-center gap-1.5">
          <Label className="text-[13px]">기간:</Label>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
            className="w-auto text-[13px]"
          />
          <span className="text-gray-400">~</span>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
            className="w-auto text-[13px]"
          />
        </div>

        <select
          value={examSetFilter}
          onChange={(e) => { setExamSetFilter(e.target.value); setPage(1); }}
          className="h-8 px-3 rounded-lg border border-input bg-transparent text-[13px]"
        >
          <option value="">전체 시험세트</option>
          {examSets.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="h-8 px-3 rounded-lg border border-input bg-transparent text-[13px]"
        >
          <option value="">전체 상태</option>
          <option value="IN_PROGRESS">진행 중</option>
          <option value="COMPLETED">완료</option>
          <option value="TIMED_OUT">시간 초과</option>
          <option value="ABANDONED">중단</option>
        </select>
      </div>

      {error && (
        <div className="px-4 py-3 mb-4 rounded-md bg-red-100 text-red-800 text-sm">
          {error}
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>성명</TableHead>
                <TableHead>세트</TableHead>
                <TableHead>시작시간</TableHead>
                <TableHead>종료시간</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>관리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-gray-400">
                    불러오는 중...
                  </TableCell>
                </TableRow>
              ) : sessions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-gray-400">
                    데이터가 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                sessions.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <span className="text-xs text-gray-500">{s.examineeLoginId}</span>
                    </TableCell>
                    <TableCell className="font-semibold">{s.examineeName}</TableCell>
                    <TableCell>{s.examSetName}</TableCell>
                    <TableCell className="text-xs text-gray-500">{formatDateTime(s.startedAt)}</TableCell>
                    <TableCell className="text-xs text-gray-500">{formatDateTime(s.endedAt)}</TableCell>
                    <TableCell><StatusBadge status={s.status} type="session" /></TableCell>
                    <TableCell>
                      <Button variant="outline" size="xs" onClick={() => setSelectedSessionId(s.id)}>
                        보기
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination className="mt-5">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                text="이전"
                onClick={() => setPage(page - 1)}
                className={cn(page <= 1 && 'pointer-events-none opacity-50')}
              />
            </PaginationItem>
            {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
              const start = Math.max(1, Math.min(page - 4, totalPages - 9));
              const p = start + i;
              if (p > totalPages) return null;
              return (
                <PaginationItem key={p}>
                  <PaginationLink
                    isActive={p === page}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </PaginationLink>
                </PaginationItem>
              );
            })}
            <PaginationItem>
              <PaginationNext
                text="다음"
                onClick={() => setPage(page + 1)}
                className={cn(page >= totalPages && 'pointer-events-none opacity-50')}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      <ExamSessionDetailModal
        isOpen={!!selectedSessionId}
        sessionId={selectedSessionId}
        onClose={() => setSelectedSessionId(null)}
      />
    </AdminLayout>
  );
};

export default ExamSessionListPage;
