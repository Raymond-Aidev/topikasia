import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/adminApi';
import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../components/ui/dialog';

interface ExamineeCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

interface ExamSetOption {
  id: string;
  examSetNumber: number;
  name: string;
  examType: string;
}

const ExamineeCreateModal: React.FC<ExamineeCreateModalProps> = ({ isOpen, onClose, onCreated }) => {
  const [form, setForm] = useState({
    loginId: '',
    password: '',
    name: '',
    registrationNumber: '',
    seatNumber: '',
    institutionName: '',
    examRoomName: '',
    assignedExamSetId: '',
  });
  const [photo, setPhoto] = useState<File | null>(null);
  const [examSets, setExamSets] = useState<ExamSetOption[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    adminApi.get('/admin/exam-sets/assignable').then((res) => setExamSets(res.data)).catch(() => {});
  }, [isOpen]);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!/^[a-zA-Z0-9]{6,20}$/.test(form.loginId)) {
      e.loginId = '아이디는 6~20자 영문/숫자만 가능합니다.';
    }
    if (!/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/.test(form.password)) {
      e.password = '비밀번호는 8자 이상, 영문+숫자+특수문자를 포함해야 합니다.';
    }
    if (!form.name.trim()) e.name = '성명을 입력하세요.';
    if (!/^\d{9}$/.test(form.registrationNumber)) {
      e.registrationNumber = '수험번호는 9자리 숫자여야 합니다.';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setServerError('');
    if (!validate()) return;

    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => {
      if (v) fd.append(k, v);
    });
    if (photo) fd.append('photo', photo);

    try {
      setSubmitting(true);
      await adminApi.post('/admin/examinees', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onCreated();
      onClose();
      setForm({
        loginId: '',
        password: '',
        name: '',
        registrationNumber: '',
        seatNumber: '',
        institutionName: '',
        examRoomName: '',
        assignedExamSetId: '',
      });
      setPhoto(null);
    } catch (err: any) {
      if (err.response?.status === 409) {
        setServerError('이미 존재하는 아이디 또는 수험번호입니다.');
      } else {
        setServerError(err.response?.data?.message || '회원 생성에 실패했습니다.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-[520px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>회원 생성</DialogTitle>
        </DialogHeader>

        {serverError && (
          <div className="px-3.5 py-2.5 bg-red-100 text-red-900 rounded-md text-[13px]">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <Label className="mb-1 text-[13px] font-semibold text-gray-700">아이디 *</Label>
            <Input value={form.loginId} onChange={(e) => setForm({ ...form, loginId: e.target.value })} placeholder="6~20자 영문/숫자" />
            {errors.loginId && <p className="text-red-600 text-xs mt-0.5">{errors.loginId}</p>}
          </div>

          <div>
            <Label className="mb-1 text-[13px] font-semibold text-gray-700">비밀번호 *</Label>
            <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="8자 이상 (영문+숫자+특수문자)" />
            {errors.password && <p className="text-red-600 text-xs mt-0.5">{errors.password}</p>}
          </div>

          <div>
            <Label className="mb-1 text-[13px] font-semibold text-gray-700">성명 *</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            {errors.name && <p className="text-red-600 text-xs mt-0.5">{errors.name}</p>}
          </div>

          <div>
            <Label className="mb-1 text-[13px] font-semibold text-gray-700">수험번호 *</Label>
            <Input value={form.registrationNumber} onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })} placeholder="9자리 숫자" />
            {errors.registrationNumber && <p className="text-red-600 text-xs mt-0.5">{errors.registrationNumber}</p>}
          </div>

          <div>
            <Label className="mb-1 text-[13px] font-semibold text-gray-700">좌석번호</Label>
            <Input value={form.seatNumber} onChange={(e) => setForm({ ...form, seatNumber: e.target.value })} />
          </div>

          <div>
            <Label className="mb-1 text-[13px] font-semibold text-gray-700">사진</Label>
            <input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files?.[0] || null)} className="text-sm" />
          </div>

          <div>
            <Label className="mb-1 text-[13px] font-semibold text-gray-700">소속기관</Label>
            <Input value={form.institutionName} onChange={(e) => setForm({ ...form, institutionName: e.target.value })} />
          </div>

          <div>
            <Label className="mb-1 text-[13px] font-semibold text-gray-700">시험실</Label>
            <Input value={form.examRoomName} onChange={(e) => setForm({ ...form, examRoomName: e.target.value })} />
          </div>

          <div>
            <Label className="mb-1 text-[13px] font-semibold text-gray-700">시험세트</Label>
            <select
              className="w-full h-8 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm"
              value={form.assignedExamSetId}
              onChange={(e) => setForm({ ...form, assignedExamSetId: e.target.value })}
            >
              <option value="">시험세트 선택</option>
              {examSets.map((s) => (
                <option key={s.id} value={s.id}>
                  [{s.examSetNumber}] {s.name} ({s.examType})
                </option>
              ))}
            </select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              취소
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className={cn(submitting && 'opacity-70 cursor-not-allowed')}
            >
              {submitting ? '생성 중...' : '생성'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ExamineeCreateModal;
