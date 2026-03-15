import React, { useEffect, useState, useCallback } from 'react';
import AdminLayout from '../components/AdminLayout';
import { adminApi } from '../../api/adminApi';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';

interface Member {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  isVerified: boolean;
  createdAt: string;
}

const PAGE_SIZE = 20;

const MemberListPage: React.FC = () => {
  const [items, setItems] = useState<Member[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 회원 추가 모달
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [creating, setCreating] = useState(false);

  // 엑셀 임포트 모달
  const [showImport, setShowImport] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.get('/admin/members', {
        params: { page, limit: PAGE_SIZE, search: search || undefined },
      });
      const body = (res.data as any)?.data || res.data;
      setItems(body.members || []);
      setTotal(body.pagination?.total ?? 0);
      setTotalPages(body.pagination?.totalPages ?? 1);
    } catch (err: any) {
      setError(err.response?.data?.message || '데이터를 불러오는 데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const handleCreate = async () => {
    if (!createForm.name || !createForm.email || !createForm.password) {
      alert('이름, 이메일, 비밀번호를 입력해주세요.');
      return;
    }
    setCreating(true);
    try {
      await adminApi.post('/admin/members', createForm);
      alert('회원이 추가되었습니다.');
      setShowCreate(false);
      setCreateForm({ name: '', email: '', password: '', phone: '' });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || '회원 추가에 실패했습니다.');
    } finally {
      setCreating(false);
    }
  };

  const handleImport = async () => {
    if (!importFile) { alert('파일을 선택해주세요.'); return; }
    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', importFile);
      const res = await adminApi.post('/admin/members/bulk-import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const data = res.data.data;
      alert(`임포트 완료!\n생성: ${data.created}건\n건너뜀: ${data.skipped}건${data.skippedDetails?.length ? '\n' + data.skippedDetails.join('\n') : ''}${data.parseErrors?.length ? '\n\n파싱 오류:\n' + data.parseErrors.join('\n') : ''}`);
      setShowImport(false);
      setImportFile(null);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || '임포트에 실패했습니다.');
    } finally {
      setImporting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('이 회원을 삭제하시겠습니까?')) return;
    try {
      await adminApi.delete(`/admin/members/${id}`);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || '삭제에 실패했습니다.');
    }
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-5">
        <h1 className="text-[22px] font-bold m-0">회원관리</h1>
        <div className="text-sm text-gray-500">총 {total}명</div>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            type="text" placeholder="이름 또는 이메일 검색" value={search}
            onChange={(e) => setSearch(e.target.value)} className="w-60"
          />
          <Button type="submit" variant="outline">검색</Button>
        </form>
        <Button onClick={() => setShowCreate(true)} className="bg-blue-600 hover:bg-blue-500 text-white">
          회원 추가
        </Button>
        <Button variant="outline" onClick={() => setShowImport(true)}>
          엑셀 임포트
        </Button>
      </div>

      {error && <div className="px-4 py-3 mb-4 rounded-md bg-red-100 text-red-800 text-sm">{error}</div>}

      {loading ? (
        <p className="text-gray-500">로딩 중...</p>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>이름</TableHead>
                  <TableHead>이메일</TableHead>
                  <TableHead>전화번호</TableHead>
                  <TableHead>인증</TableHead>
                  <TableHead>가입일</TableHead>
                  <TableHead>관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-gray-400 py-10">회원이 없습니다.</TableCell></TableRow>
                ) : (
                  items.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">{m.name}</TableCell>
                      <TableCell className="text-gray-500 text-[13px]">{m.email}</TableCell>
                      <TableCell className="text-gray-500 text-[13px]">{m.phone || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={m.isVerified ? 'default' : 'secondary'} className={m.isVerified ? 'bg-green-100 text-green-800' : ''}>
                          {m.isVerified ? '인증' : '미인증'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-500 text-[13px]">{new Date(m.createdAt).toLocaleDateString('ko')}</TableCell>
                      <TableCell>
                        <Button size="xs" variant="outline" onClick={() => handleDelete(m.id)}
                          className="border-red-300 text-red-600 hover:bg-red-50">
                          삭제
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-5">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>이전</Button>
              <span className="flex items-center text-[13px] text-gray-500">{page} / {totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>다음</Button>
            </div>
          )}
        </>
      )}

      {/* 회원 추가 모달 */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader><DialogTitle>회원 추가</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>이름 *</Label>
              <Input value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} />
            </div>
            <div>
              <Label>이메일 *</Label>
              <Input type="email" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} />
            </div>
            <div>
              <Label>비밀번호 *</Label>
              <Input type="password" value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} />
            </div>
            <div>
              <Label>전화번호</Label>
              <Input value={createForm.phone} onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })} />
            </div>
            <Button onClick={handleCreate} disabled={creating} className="w-full bg-blue-600 hover:bg-blue-500 text-white">
              {creating ? '처리 중...' : '추가'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 엑셀 임포트 모달 */}
      <Dialog open={showImport} onOpenChange={setShowImport}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader><DialogTitle>엑셀 임포트</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="text-sm text-gray-500">
              Excel 컬럼: 이름(name), 이메일(email), 비밀번호(password), 전화번호(phone, 선택)
            </div>
            <Input type="file" accept=".xlsx,.xls" onChange={(e) => setImportFile(e.target.files?.[0] || null)} />
            <Button onClick={handleImport} disabled={importing || !importFile} className="w-full bg-blue-600 hover:bg-blue-500 text-white">
              {importing ? '처리 중...' : '임포트'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default MemberListPage;
