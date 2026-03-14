import React, { useEffect, useState, useCallback } from 'react';
import AdminLayout from '../components/AdminLayout';
import { adminApi } from '../../api/adminApi';
import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent } from '../../components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from '../../components/ui/pagination';

interface ScoreItem {
  id: string;
  sessionId: string;
  examineeName: string;
  examineeLoginId: string;
  registrationNumber: string;
  examSetName: string;
  examType: string;
  sectionScores: Record<string, { raw: number; maxScore: number; autoGraded: boolean }>;
  totalScore: number;
  maxTotalScore: number;
  grade: number | null;
  gradingStatus: string;
  isPublished: boolean;
  gradedAt: string | null;
}

interface ExamSetOption { id: string; name: string; }

const PAGE_SIZE = 20;

const GRADING_STATUS_LABELS: Record<string, string> = {
  PENDING: '채점전',
  AUTO_GRADED: '자동채점',
  FULLY_GRADED: '채점완료',
};

const GRADE_LABELS: Record<number, string> = {
  1: '1급', 2: '2급', 3: '3급', 4: '4급', 5: '5급', 6: '6급',
};

const ScoreManagementPage: React.FC = () => {
  const [scores, setScores] = useState<ScoreItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [examSets, setExamSets] = useState<ExamSetOption[]>([]);
  const [examSetFilter, setExamSetFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [publishedFilter, setPublishedFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Auto-grading state
  const [grading, setGrading] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // Detail modal
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detail, setDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [writingScore, setWritingScore] = useState('');
  const [savingManual, setSavingManual] = useState(false);

  const fetchScores = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, any> = { page, limit: PAGE_SIZE };
      if (examSetFilter) params.examSetId = examSetFilter;
      if (statusFilter) params.gradingStatus = statusFilter;
      if (publishedFilter) params.isPublished = publishedFilter;
      if (search) params.search = search;
      const res = await adminApi.get('/admin/scores', { params });
      const body = res.data?.data || res.data;
      setScores(Array.isArray(body) ? body : body.data || []);
      setTotal(res.data.total ?? body.total ?? 0);
    } catch (err: any) {
      setError(err.response?.data?.message || '데이터 로딩 실패');
    } finally {
      setLoading(false);
    }
  }, [page, examSetFilter, statusFilter, publishedFilter, search]);

  useEffect(() => { fetchScores(); }, [fetchScores]);

  useEffect(() => {
    adminApi.get('/admin/exam-sets/assignable').then(r => {
      const body = r.data?.data || r.data;
      setExamSets(Array.isArray(body) ? body : []);
    }).catch(() => {});
  }, []);

  const handleAutoGrade = async () => {
    if (!examSetFilter) {
      alert('시험세트를 선택해주세요');
      return;
    }
    setGrading(true);
    try {
      const res = await adminApi.post('/admin/scores/auto-grade', { examSetId: examSetFilter });
      alert(`자동채점 완료: ${res.data.data.gradedCount}건 채점, ${res.data.data.skippedCount}건 스킵`);
      fetchScores();
    } catch (err: any) {
      alert(err.response?.data?.message || '자동채점 실패');
    } finally {
      setGrading(false);
    }
  };

  const handlePublish = async (isPublished: boolean) => {
    const ids = Array.from(selected);
    if (ids.length === 0) {
      alert('대상을 선택해주세요');
      return;
    }
    setPublishing(true);
    try {
      await adminApi.post('/admin/scores/publish', { scoreIds: ids, isPublished });
      alert(`${ids.length}건 ${isPublished ? '공개' : '비공개'} 처리 완료`);
      setSelected(new Set());
      fetchScores();
    } catch (err: any) {
      alert(err.response?.data?.message || '처리 실패');
    } finally {
      setPublishing(false);
    }
  };

  const openDetail = async (id: string) => {
    setDetailId(id);
    setDetailLoading(true);
    setWritingScore('');
    try {
      const res = await adminApi.get(`/admin/scores/${id}`);
      const scoreData = res.data?.data || res.data;
      setDetail(scoreData);
      const ws = scoreData.sectionScores?.WRITING;
      if (ws) setWritingScore(String(ws.raw || 0));
    } catch (err: any) {
      alert(err.response?.data?.message || '상세 조회 실패');
      setDetailId(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleManualGrade = async () => {
    if (!detailId || writingScore === '') return;
    setSavingManual(true);
    try {
      await adminApi.patch(`/admin/scores/${detailId}/manual-grade`, {
        sectionScores: { WRITING: { raw: Number(writingScore) } },
      });
      alert('수동채점 저장 완료');
      setDetailId(null);
      fetchScores();
    } catch (err: any) {
      alert(err.response?.data?.message || '저장 실패');
    } finally {
      setSavingManual(false);
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };
  const toggleAll = () => {
    if (selected.size === scores.length) setSelected(new Set());
    else setSelected(new Set(scores.map(s => s.id)));
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const GradingBadge = ({ status }: { status: string }) => {
    if (status === 'FULLY_GRADED') {
      return <Badge className="bg-green-600">{GRADING_STATUS_LABELS[status] || status}</Badge>;
    }
    if (status === 'AUTO_GRADED') {
      return <Badge variant="secondary">{GRADING_STATUS_LABELS[status] || status}</Badge>;
    }
    return <Badge variant="secondary">{GRADING_STATUS_LABELS[status] || status}</Badge>;
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-5">
        <h1 className="text-[22px] font-bold m-0">성적관리</h1>
        <div className="flex gap-2">
          <Button
            onClick={handleAutoGrade}
            disabled={grading || !examSetFilter}
            className="bg-blue-600 hover:bg-blue-500 text-white"
          >
            {grading ? '채점중...' : '자동채점 실행'}
          </Button>
          <Button
            onClick={() => handlePublish(true)}
            disabled={publishing || selected.size === 0}
            className="bg-green-600 hover:bg-green-500 text-white"
          >
            선택 공개
          </Button>
          <Button
            onClick={() => handlePublish(false)}
            disabled={publishing || selected.size === 0}
            variant="outline"
          >
            선택 비공개
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2.5 mb-4 flex-wrap items-center">
        <select
          value={examSetFilter}
          onChange={e => { setExamSetFilter(e.target.value); setPage(1); }}
          className="h-8 px-3 rounded-lg border border-input bg-transparent text-[13px]"
        >
          <option value="">전체 시험세트</option>
          {examSets.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="h-8 px-3 rounded-lg border border-input bg-transparent text-[13px]"
        >
          <option value="">전체 채점상태</option>
          <option value="PENDING">채점전</option>
          <option value="AUTO_GRADED">자동채점</option>
          <option value="FULLY_GRADED">채점완료</option>
        </select>
        <select
          value={publishedFilter}
          onChange={e => { setPublishedFilter(e.target.value); setPage(1); }}
          className="h-8 px-3 rounded-lg border border-input bg-transparent text-[13px]"
        >
          <option value="">전체 공개상태</option>
          <option value="true">공개</option>
          <option value="false">비공개</option>
        </select>
        <Input
          placeholder="이름/수험번호 검색"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="w-44 text-[13px]"
        />
      </div>

      {error && (
        <div className="px-4 py-3 mb-4 rounded-md bg-red-100 text-red-800 text-sm">
          {error}
        </div>
      )}

      <Card>
        <CardContent className="p-0 overflow-auto">
          <Table className="min-w-[900px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <input type="checkbox" checked={scores.length > 0 && selected.size === scores.length} onChange={toggleAll} />
                </TableHead>
                <TableHead>수험번호</TableHead>
                <TableHead>성명</TableHead>
                <TableHead>시험세트</TableHead>
                <TableHead>듣기</TableHead>
                <TableHead>쓰기</TableHead>
                <TableHead>읽기</TableHead>
                <TableHead>총점</TableHead>
                <TableHead>등급</TableHead>
                <TableHead>채점상태</TableHead>
                <TableHead>공개</TableHead>
                <TableHead>관리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={12} className="text-center py-10 text-gray-400">불러오는 중...</TableCell></TableRow>
              ) : scores.length === 0 ? (
                <TableRow><TableCell colSpan={12} className="text-center py-10 text-gray-400">데이터가 없습니다.</TableCell></TableRow>
              ) : scores.map(s => (
                <TableRow key={s.id}>
                  <TableCell>
                    <input type="checkbox" checked={selected.has(s.id)} onChange={() => toggleSelect(s.id)} />
                  </TableCell>
                  <TableCell className="text-xs text-gray-500">{s.registrationNumber}</TableCell>
                  <TableCell className="font-semibold">{s.examineeName}</TableCell>
                  <TableCell className="text-xs">{s.examSetName}</TableCell>
                  <TableCell>{s.sectionScores?.LISTENING?.raw ?? '-'}</TableCell>
                  <TableCell>{s.sectionScores?.WRITING ? s.sectionScores.WRITING.raw : '-'}</TableCell>
                  <TableCell>{s.sectionScores?.READING?.raw ?? '-'}</TableCell>
                  <TableCell className="font-bold">{s.totalScore}/{s.maxTotalScore}</TableCell>
                  <TableCell className={cn('font-semibold', s.grade ? 'text-blue-600' : 'text-gray-400')}>
                    {s.grade ? GRADE_LABELS[s.grade] || `${s.grade}급` : '-'}
                  </TableCell>
                  <TableCell><GradingBadge status={s.gradingStatus} /></TableCell>
                  <TableCell>
                    <Badge variant={s.isPublished ? 'default' : 'outline'}
                      className={cn(s.isPublished ? 'bg-green-600' : '')}>
                      {s.isPublished ? '공개' : '비공개'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="xs" onClick={() => openDetail(s.id)}>
                      상세
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
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
                  <PaginationLink isActive={p === page} onClick={() => setPage(p)}>
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

      {/* Detail Modal */}
      <Dialog open={!!detailId} onOpenChange={(open) => { if (!open) setDetailId(null); }}>
        <DialogContent className="sm:max-w-[560px] max-h-[80vh] overflow-auto">
          {detailLoading ? (
            <div className="text-center py-10 text-gray-400">불러오는 중...</div>
          ) : detail ? (
            <>
              <DialogHeader>
                <DialogTitle>성적 상세</DialogTitle>
              </DialogHeader>
              <div className="mb-3 text-sm text-gray-700 space-y-1">
                <div><strong>성명:</strong> {detail.examinee?.name}</div>
                <div><strong>수험번호:</strong> {detail.examinee?.registrationNumber}</div>
                <div><strong>시험:</strong> {detail.examSet?.name} ({detail.examSet?.examType})</div>
              </div>

              {/* Section scores */}
              <div className="mb-4">
                <h3 className="text-[15px] font-semibold mb-2">영역별 점수</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">영역</TableHead>
                      <TableHead className="text-xs">점수</TableHead>
                      <TableHead className="text-xs">만점</TableHead>
                      <TableHead className="text-xs">채점방식</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(detail.sectionScores || {}).map(([section, data]: [string, any]) => (
                      <TableRow key={section}>
                        <TableCell>{section}</TableCell>
                        <TableCell className="font-bold">{data.raw}</TableCell>
                        <TableCell>{data.maxScore}</TableCell>
                        <TableCell>{data.autoGraded ? '자동' : '수동'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="mt-2 text-[15px] font-bold">
                  총점: {detail.totalScore}/{detail.maxTotalScore}
                  {detail.grade && ` (${GRADE_LABELS[detail.grade] || detail.grade + '급'})`}
                </div>
              </div>

              {/* Manual grading for WRITING */}
              {detail.sectionScores?.WRITING && detail.gradingStatus !== 'FULLY_GRADED' && (
                <div className="mb-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <h3 className="text-sm font-semibold mb-2 text-amber-800">쓰기 수동채점</h3>
                  <div className="flex items-center gap-2">
                    <label className="text-[13px]">쓰기 점수 (0~{detail.sectionScores.WRITING.maxScore}):</label>
                    <Input
                      type="number"
                      min={0}
                      max={detail.sectionScores.WRITING.maxScore}
                      value={writingScore}
                      onChange={e => setWritingScore(e.target.value)}
                      className="w-20"
                    />
                    <Button
                      onClick={handleManualGrade}
                      disabled={savingManual}
                      size="sm"
                      className="bg-amber-600 hover:bg-amber-500 text-white"
                    >
                      {savingManual ? '저장중...' : '점수 저장'}
                    </Button>
                  </div>
                </div>
              )}

              {/* Answer list */}
              {detail.answers && detail.answers.length > 0 && (
                <div>
                  <h3 className="text-[15px] font-semibold mb-2">답안 목록 ({detail.answers.length}건)</h3>
                  <div className="max-h-[200px] overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-[11px]">영역</TableHead>
                          <TableHead className="text-[11px]">#</TableHead>
                          <TableHead className="text-[11px]">답안</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {detail.answers.map((a: any) => (
                          <TableRow key={a.id}>
                            <TableCell className="text-xs">{a.section}</TableCell>
                            <TableCell className="text-xs">{a.questionIndex + 1}</TableCell>
                            <TableCell className="text-xs max-w-[200px] overflow-hidden text-ellipsis">
                              {typeof a.answerJson === 'object' ? JSON.stringify(a.answerJson) : String(a.answerJson)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              <div className="mt-5 text-right">
                <Button variant="outline" onClick={() => setDetailId(null)}>닫기</Button>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default ScoreManagementPage;
