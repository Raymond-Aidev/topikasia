import React, { useEffect, useState, useCallback } from 'react';
import AdminLayout from '../components/AdminLayout';
import { adminApi } from '../../api/adminApi';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';

interface ExamSchedule {
  id: string;
  examName: string;
  examRound: number;
  examType: string;
  examDate: string;
  registrationStartAt: string;
  registrationEndAt: string;
  venues: any;
  maxCapacity: number;
  currentCount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface ScheduleForm {
  examName: string;
  examRound: number;
  examType: string;
  examDate: string;
  registrationStartAt: string;
  registrationEndAt: string;
  venues: string;
  maxCapacity: number;
  status: string;
}

const EMPTY_FORM: ScheduleForm = {
  examName: '',
  examRound: 0,
  examType: 'TOPIK_II',
  examDate: '',
  registrationStartAt: '',
  registrationEndAt: '',
  venues: '[]',
  maxCapacity: 9999,
  status: 'OPEN',
};

const STATUS_MAP: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string; className?: string }> = {
  OPEN: { variant: 'default', label: '접수중', className: 'bg-green-600' },
  CLOSED: { variant: 'destructive', label: '마감' },
  UPCOMING: { variant: 'secondary', label: '예정', className: 'bg-blue-100 text-blue-800' },
  COMPLETED: { variant: 'outline', label: '완료' },
};

const ExamScheduleManagePage: React.FC = () => {
  const [schedules, setSchedules] = useState<ExamSchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<ScheduleForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.get('/admin/schedules');
      setSchedules(res.data.data?.schedules || res.data.schedules || []);
    } catch (err: any) {
      setError(err.response?.data?.message || '데이터를 불러오는 데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (s: ExamSchedule) => {
    setEditId(s.id);
    setForm({
      examName: s.examName,
      examRound: s.examRound,
      examType: s.examType,
      examDate: s.examDate ? new Date(s.examDate).toISOString().slice(0, 16) : '',
      registrationStartAt: s.registrationStartAt ? new Date(s.registrationStartAt).toISOString().slice(0, 16) : '',
      registrationEndAt: s.registrationEndAt ? new Date(s.registrationEndAt).toISOString().slice(0, 16) : '',
      venues: JSON.stringify(s.venues || [], null, 2),
      maxCapacity: s.maxCapacity,
      status: s.status,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.examName || !form.examType || !form.examDate) {
      alert('시험명, 시험유형, 시험일은 필수입니다.');
      return;
    }
    setSaving(true);
    try {
      let parsedVenues: any[] = [];
      try { parsedVenues = JSON.parse(form.venues); } catch { parsedVenues = []; }

      const payload = {
        examName: form.examName,
        examRound: form.examRound,
        examType: form.examType,
        examDate: form.examDate,
        registrationStartAt: form.registrationStartAt || undefined,
        registrationEndAt: form.registrationEndAt || undefined,
        venues: parsedVenues,
        maxCapacity: form.maxCapacity,
        status: form.status,
      };

      if (editId) {
        await adminApi.put(`/admin/schedules/${editId}`, payload);
      } else {
        await adminApi.post('/admin/schedules', payload);
      }
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || '저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`"${name}" 일정을 삭제하시겠습니까?\n접수자가 있는 경우 삭제할 수 없습니다.`)) return;
    try {
      await adminApi.delete(`/admin/schedules/${id}`);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || '삭제에 실패했습니다.');
    }
  };

  const StatusBadgeLocal = ({ status }: { status: string }) => {
    const s = STATUS_MAP[status] || { variant: 'outline' as const, label: status };
    return <Badge variant={s.variant} className={s.className}>{s.label}</Badge>;
  };

  const updateField = (field: keyof ScheduleForm, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-5">
        <h1 className="text-[22px] font-bold m-0">시험 일정 관리</h1>
        <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-500 text-white">
          + 새 일정 등록
        </Button>
      </div>

      {error && (
        <div className="px-4 py-3 mb-4 rounded-md bg-red-100 text-red-800 text-sm">{error}</div>
      )}

      {loading ? (
        <p className="text-gray-500">로딩 중...</p>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>시험명</TableHead>
                <TableHead>회차</TableHead>
                <TableHead>유형</TableHead>
                <TableHead>시험일</TableHead>
                <TableHead>접수기간</TableHead>
                <TableHead>정원</TableHead>
                <TableHead>접수</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>관리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedules.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="text-center text-gray-400 py-10">등록된 시험 일정이 없습니다.</TableCell></TableRow>
              ) : (
                schedules.map(s => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <button onClick={() => openEdit(s)} className="bg-transparent border-none text-blue-600 cursor-pointer font-medium text-sm p-0">
                        {s.examName}
                      </button>
                    </TableCell>
                    <TableCell className="text-gray-500">{s.examRound || '-'}</TableCell>
                    <TableCell>{s.examType}</TableCell>
                    <TableCell className="text-[13px]">{new Date(s.examDate).toLocaleDateString('ko')}</TableCell>
                    <TableCell className="text-xs text-gray-500">
                      {new Date(s.registrationStartAt).toLocaleDateString('ko')} ~ {new Date(s.registrationEndAt).toLocaleDateString('ko')}
                    </TableCell>
                    <TableCell>{s.maxCapacity === 9999 ? '무제한' : s.maxCapacity.toLocaleString()}</TableCell>
                    <TableCell>{s.currentCount}</TableCell>
                    <TableCell><StatusBadgeLocal status={s.status} /></TableCell>
                    <TableCell>
                      <div className="flex gap-1.5">
                        <Button variant="outline" size="xs" onClick={() => openEdit(s)}>
                          수정
                        </Button>
                        <Button variant="outline" size="xs" onClick={() => handleDelete(s.id, s.examName)}
                          className="border-red-300 text-red-600">
                          삭제
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create / Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-[560px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? '시험 일정 수정' : '새 시험 일정 등록'}</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="space-y-1">
              <Label>시험명 *</Label>
              <Input value={form.examName} onChange={e => updateField('examName', e.target.value)}
                placeholder="예: 제106회 TOPIK" />
            </div>

            <div className="flex gap-3">
              <div className="flex-1 space-y-1">
                <Label>회차</Label>
                <Input type="number" value={form.examRound} onChange={e => updateField('examRound', parseInt(e.target.value) || 0)} />
              </div>
              <div className="flex-1 space-y-1">
                <Label>시험유형 *</Label>
                <select value={form.examType} onChange={e => updateField('examType', e.target.value)}
                  className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm">
                  <option value="TOPIK_I">TOPIK I</option>
                  <option value="TOPIK_II">TOPIK II</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <Label>시험일 *</Label>
              <Input type="datetime-local" value={form.examDate} onChange={e => updateField('examDate', e.target.value)} />
            </div>

            <div className="flex gap-3">
              <div className="flex-1 space-y-1">
                <Label>접수 시작일</Label>
                <Input type="datetime-local" value={form.registrationStartAt}
                  onChange={e => updateField('registrationStartAt', e.target.value)} />
              </div>
              <div className="flex-1 space-y-1">
                <Label>접수 마감일</Label>
                <Input type="datetime-local" value={form.registrationEndAt}
                  onChange={e => updateField('registrationEndAt', e.target.value)} />
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-1 space-y-1">
                <Label>정원</Label>
                <Input type="number" value={form.maxCapacity} onChange={e => updateField('maxCapacity', parseInt(e.target.value) || 0)} />
              </div>
              <div className="flex-1 space-y-1">
                <Label>상태</Label>
                <select value={form.status} onChange={e => updateField('status', e.target.value)}
                  className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm">
                  <option value="OPEN">접수중</option>
                  <option value="CLOSED">마감</option>
                  <option value="UPCOMING">예정</option>
                  <option value="COMPLETED">완료</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <Label>시험장 (JSON)</Label>
              <textarea value={form.venues} onChange={e => updateField('venues', e.target.value)}
                placeholder='[{"name": "서울시험장", "address": "..."}]'
                className="w-full px-3 py-2 rounded-md border border-input text-sm min-h-[80px] resize-y font-mono text-[13px]" />
            </div>
          </div>

          <DialogFooter>
            <Button onClick={handleSave} disabled={saving}
              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white">
              {saving ? '저장 중...' : (editId ? '수정' : '등록')}
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>
              취소
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default ExamScheduleManagePage;
