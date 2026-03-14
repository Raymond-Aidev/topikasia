import React, { useEffect, useState, useCallback } from 'react';
import AdminLayout from '../components/AdminLayout';
import { adminApi } from '../../api/adminApi';
import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';

interface Registration {
  id: string;
  englishName: string;
  birthDate: string;
  gender: string;
  status: string;
  examName: string;
  examType: string;
  examDate: string;
  venueName: string;
  userName: string;
  userEmail: string;
  createdAt: string;
  rejectionNote?: string;
}

const PAGE_SIZE = 20;

const STATUS_MAP: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string; className?: string }> = {
  PENDING: { variant: 'secondary', label: '대기', className: 'bg-amber-100 text-amber-800' },
  APPROVED: { variant: 'default', label: '승인', className: 'bg-green-100 text-green-800' },
  REJECTED: { variant: 'destructive', label: '반려' },
  CANCELLED: { variant: 'outline', label: '취소' },
};

const RegistrationListPage: React.FC = () => {
  const [items, setItems] = useState<Registration[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [processing, setProcessing] = useState(false);

  // Detail modal
  const [detail, setDetail] = useState<Registration | null>(null);
  const [rejectNote, setRejectNote] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.get('/admin/registrations', {
        params: { page, limit: PAGE_SIZE, search: search || undefined, status: statusFilter || undefined },
      });
      const body = (res.data as any)?.data || res.data;
      setItems(body.registrations || body.data || []);
      setTotal(body.pagination?.total ?? body.total ?? 0);
      setTotalPages(body.pagination?.totalPages ?? body.totalPages ?? 1);
    } catch (err: any) {
      setError(err.response?.data?.message || '데이터를 불러오는 데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const pendingIds = items.filter((r) => r.status === 'PENDING').map((r) => r.id);
    if (pendingIds.every((id) => selected.has(id))) {
      setSelected((prev) => { const next = new Set(prev); pendingIds.forEach((id) => next.delete(id)); return next; });
    } else {
      setSelected((prev) => { const next = new Set(prev); pendingIds.forEach((id) => next.add(id)); return next; });
    }
  };

  const handleApprove = async (id: string) => {
    if (!confirm('이 접수를 승인하시겠습니까? 응시자 계정이 자동 생성됩니다.')) return;
    setProcessing(true);
    try {
      const res = await adminApi.put(`/admin/registrations/${id}/approve`);
      const data = res.data.data;
      alert(`승인 완료!\n\n로그인 ID: ${data.loginId}\n임시 비밀번호: ${data.temporaryPassword}\n수험번호: ${data.registrationNumber}`);
      fetchData();
      setDetail(null);
    } catch (err: any) {
      alert(err.response?.data?.message || '승인 처리에 실패했습니다.');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (id: string) => {
    if (!rejectNote.trim()) { alert('반려 사유를 입력해주세요.'); return; }
    setProcessing(true);
    try {
      await adminApi.put(`/admin/registrations/${id}/reject`, { rejectionNote: rejectNote });
      alert('반려 처리 완료');
      fetchData();
      setDetail(null);
      setRejectNote('');
    } catch (err: any) {
      alert(err.response?.data?.message || '반려 처리에 실패했습니다.');
    } finally {
      setProcessing(false);
    }
  };

  const handleBatchApprove = async () => {
    const ids = Array.from(selected);
    if (ids.length === 0) { alert('선택된 접수가 없습니다.'); return; }
    if (!confirm(`${ids.length}건을 일괄 승인하시겠습니까?`)) return;
    setProcessing(true);
    try {
      const res = await adminApi.post('/admin/registrations/batch-approve', { registrationIds: ids });
      const approved = res.data.data;
      const summary = approved.map((a: any) => `${a.englishName}: ${a.loginId} / ${a.temporaryPassword}`).join('\n');
      alert(`${approved.length}건 일괄 승인 완료!\n\n${summary}`);
      setSelected(new Set());
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || '일괄 승인에 실패했습니다.');
    } finally {
      setProcessing(false);
    }
  };

  const StatusBadgeLocal = ({ status }: { status: string }) => {
    const s = STATUS_MAP[status] || { variant: 'outline' as const, label: status };
    return <Badge variant={s.variant} className={s.className}>{s.label}</Badge>;
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-5">
        <h1 className="text-[22px] font-bold m-0">접수 관리</h1>
        <div className="text-sm text-gray-500">총 {total}건</div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            type="text" placeholder="이름 또는 이메일 검색" value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-60"
          />
          <Button type="submit" variant="outline">검색</Button>
        </form>
        <select
          value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="h-8 px-3 rounded-lg border border-input bg-transparent text-sm"
        >
          <option value="">전체 상태</option>
          <option value="PENDING">대기</option>
          <option value="APPROVED">승인</option>
          <option value="REJECTED">반려</option>
          <option value="CANCELLED">취소</option>
        </select>
        {selected.size > 0 && (
          <Button
            onClick={handleBatchApprove} disabled={processing}
            className="bg-green-600 hover:bg-green-500 text-white"
          >
            {processing ? '처리 중...' : `선택 일괄 승인 (${selected.size}건)`}
          </Button>
        )}
      </div>

      {error && (
        <div className="px-4 py-3 mb-4 rounded-md bg-red-100 text-red-800 text-sm">{error}</div>
      )}

      {loading ? (
        <p className="text-gray-500">로딩 중...</p>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="w-10">
                    <input type="checkbox" onChange={toggleSelectAll}
                      checked={items.filter((r) => r.status === 'PENDING').length > 0 && items.filter((r) => r.status === 'PENDING').every((r) => selected.has(r.id))}
                    />
                  </TableHead>
                  <TableHead>영문이름</TableHead>
                  <TableHead>이메일</TableHead>
                  <TableHead>시험</TableHead>
                  <TableHead>시험장</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>신청일</TableHead>
                  <TableHead>처리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center text-gray-400 py-10">데이터가 없습니다.</TableCell></TableRow>
                ) : (
                  items.map((r) => (
                    <TableRow key={r.id} className={cn(selected.has(r.id) && 'bg-blue-50')}>
                      <TableCell>
                        {r.status === 'PENDING' && (
                          <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggleSelect(r.id)} />
                        )}
                      </TableCell>
                      <TableCell>
                        <button onClick={() => { setDetail(r); setRejectNote(''); }} className="bg-transparent border-none text-blue-600 cursor-pointer font-medium text-sm p-0">
                          {r.englishName}
                        </button>
                      </TableCell>
                      <TableCell className="text-gray-500 text-[13px]">{r.userEmail}</TableCell>
                      <TableCell className="text-[13px]">{r.examName}</TableCell>
                      <TableCell className="text-gray-500 text-[13px]">{r.venueName}</TableCell>
                      <TableCell><StatusBadgeLocal status={r.status} /></TableCell>
                      <TableCell className="text-gray-500 text-[13px]">{new Date(r.createdAt).toLocaleDateString('ko')}</TableCell>
                      <TableCell>
                        {r.status === 'PENDING' && (
                          <div className="flex gap-1.5">
                            <Button size="xs" onClick={() => handleApprove(r.id)} disabled={processing}
                              className="bg-green-600 hover:bg-green-500 text-white">
                              승인
                            </Button>
                            <Button size="xs" variant="outline" onClick={() => { setDetail(r); setRejectNote(''); }}>
                              반려
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-5">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                이전
              </Button>
              <span className="flex items-center text-[13px] text-gray-500">{page} / {totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                다음
              </Button>
            </div>
          )}
        </>
      )}

      {/* Detail / Reject Modal */}
      <Dialog open={!!detail} onOpenChange={(open) => { if (!open) setDetail(null); }}>
        <DialogContent className="sm:max-w-[520px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>접수 상세</DialogTitle>
          </DialogHeader>

          {detail && (
            <>
              <div className="grid grid-cols-[120px_1fr] gap-x-4 gap-y-2.5 text-sm mb-6">
                <span className="text-gray-500 font-semibold">영문이름</span><span>{detail.englishName}</span>
                <span className="text-gray-500 font-semibold">회원이름</span><span>{detail.userName}</span>
                <span className="text-gray-500 font-semibold">이메일</span><span>{detail.userEmail}</span>
                <span className="text-gray-500 font-semibold">생년월일</span><span>{detail.birthDate ? new Date(detail.birthDate).toLocaleDateString('ko') : '-'}</span>
                <span className="text-gray-500 font-semibold">성별</span><span>{detail.gender === 'MALE' ? '남성' : '여성'}</span>
                <span className="text-gray-500 font-semibold">시험</span><span>{detail.examName} ({detail.examType})</span>
                <span className="text-gray-500 font-semibold">시험일</span><span>{detail.examDate ? new Date(detail.examDate).toLocaleDateString('ko') : '-'}</span>
                <span className="text-gray-500 font-semibold">시험장</span><span>{detail.venueName}</span>
                <span className="text-gray-500 font-semibold">상태</span><span><StatusBadgeLocal status={detail.status} /></span>
                <span className="text-gray-500 font-semibold">신청일</span><span>{new Date(detail.createdAt).toLocaleString('ko')}</span>
                {detail.rejectionNote && (
                  <><span className="text-gray-500 font-semibold">반려사유</span><span className="text-red-800">{detail.rejectionNote}</span></>
                )}
              </div>

              {detail.status === 'PENDING' && (
                <>
                  <div className="mb-4 space-y-1">
                    <Label>반려 사유 (반려 시 필수)</Label>
                    <textarea
                      value={rejectNote} onChange={(e) => setRejectNote(e.target.value)}
                      placeholder="반려 사유를 입력하세요"
                      className="w-full px-3 py-2 rounded-md border border-input text-sm min-h-[80px] resize-y"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => handleApprove(detail.id)} disabled={processing}
                      className="flex-1 bg-green-600 hover:bg-green-500 text-white">
                      {processing ? '처리 중...' : '승인 (계정 생성)'}
                    </Button>
                    <Button onClick={() => handleReject(detail.id)} disabled={processing}
                      variant="outline" className="flex-1 border-red-600 text-red-600">
                      {processing ? '처리 중...' : '반려'}
                    </Button>
                  </div>
                </>
              )}

              <Button variant="outline" className="w-full mt-4" onClick={() => setDetail(null)}>
                닫기
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default RegistrationListPage;
