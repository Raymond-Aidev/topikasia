import React, { useEffect, useState, useCallback } from 'react';
import { adminApi } from '../../api/adminApi';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/table';

interface Member {
  id: string;
  name: string;
  email: string;
  phone: string | null;
}

interface MemberSelectModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (members: Member[]) => void;
  excludeIds?: string[];
}

const MemberSelectModal: React.FC<MemberSelectModalProps> = ({ open, onClose, onSelect, excludeIds = [] }) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.get('/admin/members', {
        params: { page, limit: 50, search: search || undefined },
      });
      const body = (res.data as any)?.data || res.data;
      setMembers((body.members || []).filter((m: Member) => !excludeIds.includes(m.id)));
      setTotalPages(body.pagination?.totalPages ?? 1);
    } catch {
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, excludeIds]);

  useEffect(() => {
    if (open) {
      fetchMembers();
      setSelected(new Set());
    }
  }, [open, fetchMembers]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (members.every((m) => selected.has(m.id))) {
      setSelected(new Set());
    } else {
      setSelected(new Set(members.map((m) => m.id)));
    }
  };

  const handleConfirm = () => {
    const selectedMembers = members.filter((m) => selected.has(m.id));
    onSelect(selectedMembers);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader><DialogTitle>회원 선택</DialogTitle></DialogHeader>

        <div className="flex gap-2 mb-3">
          <Input
            placeholder="이름 또는 이메일 검색" value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { setPage(1); fetchMembers(); } }}
            className="flex-1"
          />
          <Button variant="outline" onClick={() => { setPage(1); fetchMembers(); }}>검색</Button>
        </div>

        {loading ? (
          <div className="text-center py-6 text-gray-400">로딩 중...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <input type="checkbox" onChange={toggleAll}
                    checked={members.length > 0 && members.every((m) => selected.has(m.id))} />
                </TableHead>
                <TableHead>이름</TableHead>
                <TableHead>이메일</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.length === 0 ? (
                <TableRow><TableCell colSpan={3} className="text-center text-gray-400 py-6">회원이 없습니다.</TableCell></TableRow>
              ) : (
                members.map((m) => (
                  <TableRow key={m.id} className={selected.has(m.id) ? 'bg-blue-50' : ''}>
                    <TableCell>
                      <input type="checkbox" checked={selected.has(m.id)} onChange={() => toggleSelect(m.id)} />
                    </TableCell>
                    <TableCell className="font-medium">{m.name}</TableCell>
                    <TableCell className="text-gray-500 text-[13px]">{m.email}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-2">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>이전</Button>
            <span className="flex items-center text-[13px] text-gray-500">{page} / {totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>다음</Button>
          </div>
        )}

        <div className="flex justify-between items-center mt-4">
          <span className="text-sm text-gray-500">선택: {selected.size}명</span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>취소</Button>
            <Button onClick={handleConfirm} disabled={selected.size === 0} className="bg-blue-600 hover:bg-blue-500 text-white">
              선택 완료
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MemberSelectModal;
