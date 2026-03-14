import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import StatusBadge from '../components/StatusBadge';
import { adminApi } from '../../api/adminApi';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';

interface Examinee {
  id: string;
  name: string;
  loginId: string;
  status: string;
  examSetName?: string;
  seatNumber?: string;
}

const PAGE_SIZE = 20;

const ExamineeListPage: React.FC = () => {
  const [examinees, setExaminees] = useState<Examinee[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', loginId: '', password: '', seatNumber: '' });
  const [creating, setCreating] = useState(false);

  // Bulk import
  const [showBulk, setShowBulk] = useState(false);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkResult, setBulkResult] = useState<any>(null);

  const fetchExaminees = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.get('/admin/examinees', {
        params: { page, limit: PAGE_SIZE, search: search || undefined },
      });
      const body = (res.data as any)?.data || res.data;
      setExaminees(body.examinees || body.data || []);
      setTotal(body.pagination?.total ?? body.total ?? 0);
    } catch (err: any) {
      setError(err.response?.data?.message || '데이터를 불러오는 데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchExaminees();
  }, [fetchExaminees]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchExaminees();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await adminApi.post('/admin/examinees', createForm);
      setShowCreate(false);
      setCreateForm({ name: '', loginId: '', password: '', seatNumber: '' });
      fetchExaminees();
    } catch (err: any) {
      alert(err.response?.data?.message || '생성에 실패했습니다.');
    } finally {
      setCreating(false);
    }
  };

  const handleBulkImport = async () => {
    if (!bulkFile) return;
    setBulkUploading(true);
    setBulkResult(null);
    try {
      const formData = new FormData();
      formData.append('file', bulkFile);
      const res = await adminApi.post('/admin/examinees/bulk-import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setBulkResult(res.data.data);
      fetchExaminees();
    } catch (err: any) {
      alert(err.response?.data?.message || '일괄 등록에 실패했습니다.');
    } finally {
      setBulkUploading(false);
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-5">
        <h1 className="text-[22px] font-bold m-0">회원관리</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowBulk(true)}>
            Excel 일괄 등록
          </Button>
          <Button onClick={() => setShowCreate(true)} className="bg-slate-800 hover:bg-slate-700 text-white">
            응시자 추가
          </Button>
        </div>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <Input
          type="text"
          placeholder="이름 또는 아이디로 검색"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 max-w-xs"
        />
        <Button type="submit" variant="outline">
          검색
        </Button>
      </form>

      {error && (
        <div className="px-4 py-3 mb-4 rounded-md bg-red-100 text-red-800 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-gray-500">로딩 중...</p>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>이름</TableHead>
                  <TableHead>아이디</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>시험세트</TableHead>
                  <TableHead>좌석번호</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {examinees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-gray-400 py-10">
                      데이터가 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  examinees.map((ex) => (
                    <TableRow key={ex.id}>
                      <TableCell>
                        <Link to={`/admin/examinees/${ex.id}`} className="text-blue-600 no-underline font-medium">
                          {ex.name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-gray-500">{ex.loginId}</TableCell>
                      <TableCell><StatusBadge status={ex.status} /></TableCell>
                      <TableCell className="text-gray-500">{ex.examSetName || '-'}</TableCell>
                      <TableCell className="text-gray-500">{ex.seatNumber || '-'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                이전
              </Button>
              <span className="flex items-center text-[13px] text-gray-500">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                다음
              </Button>
            </div>
          )}
        </>
      )}

      {/* Create Modal */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>응시자 추가</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-3.5">
            {[
              { label: '이름', key: 'name' as const, type: 'text' },
              { label: '아이디', key: 'loginId' as const, type: 'text' },
              { label: '비밀번호', key: 'password' as const, type: 'password' },
              { label: '좌석번호', key: 'seatNumber' as const, type: 'text' },
            ].map((field) => (
              <div key={field.key} className="space-y-1">
                <Label>{field.label}</Label>
                <Input
                  type={field.type}
                  required={field.key !== 'seatNumber'}
                  value={createForm[field.key]}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, [field.key]: e.target.value }))}
                />
              </div>
            ))}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>
                취소
              </Button>
              <Button type="submit" disabled={creating} className="bg-slate-800 hover:bg-slate-700 text-white">
                {creating ? '생성 중...' : '생성'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Bulk Import Modal */}
      <Dialog open={showBulk} onOpenChange={(open) => { if (!open) { setShowBulk(false); setBulkResult(null); setBulkFile(null); } }}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Excel 일괄 등록</DialogTitle>
          </DialogHeader>
          <p className="text-[13px] text-gray-500">
            Excel 파일 컬럼: loginId, password, name, registrationNumber, seatNumber, institutionName, examRoomName
          </p>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={e => setBulkFile(e.target.files?.[0] || null)}
            className="block"
          />

          {bulkResult && (
            <div className="p-3 rounded-lg bg-green-50 text-[13px]">
              <div><strong>총 {bulkResult.totalRows}건</strong> 중 <strong className="text-green-600">{bulkResult.created}건 생성</strong>, {bulkResult.skipped}건 스킵</div>
              {bulkResult.skippedDetails?.length > 0 && (
                <div className="mt-2 text-yellow-700">
                  스킵: {bulkResult.skippedDetails.join(', ')}
                </div>
              )}
              {bulkResult.parseErrors?.length > 0 && (
                <div className="mt-2 text-red-800">
                  파싱 오류: {bulkResult.parseErrors.join('; ')}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowBulk(false); setBulkResult(null); setBulkFile(null); }}>
              닫기
            </Button>
            <Button
              onClick={handleBulkImport}
              disabled={!bulkFile || bulkUploading}
              className="bg-blue-600 hover:bg-blue-500 text-white"
            >
              {bulkUploading ? '업로드 중...' : '업로드'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default ExamineeListPage;
