import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import ExamSetSelector from '../components/ExamSetSelector';
import StatusBadge from '../components/StatusBadge';
import { adminApi } from '../../api/adminApi';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent } from '../../components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/table';

interface ExamineeDetail {
  id: string;
  loginId: string;
  name: string;
  registrationNumber: string;
  seatNumber: string;
  institutionName: string;
  examRoomName: string;
  status: string;
  photoUrl: string | null;
  assignedExamSet: { id: string; name: string; examSetNumber: number; examType: string } | null;
  createdAt?: string;
}

interface ExamSession {
  id: string;
  examSetName: string;
  startedAt: string;
  endedAt: string | null;
  status: string;
}

type Tab = 'info' | 'examSet' | 'sessions';

const ExamineeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [examinee, setExaminee] = useState<ExamineeDetail | null>(null);
  const [sessions, setSessions] = useState<ExamSession[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('info');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Editable fields
  const [name, setName] = useState('');
  const [seatNumber, setSeatNumber] = useState('');
  const [institutionName, setInstitutionName] = useState('');
  const [examRoomName, setExamRoomName] = useState('');
  const [selectedExamSetId, setSelectedExamSetId] = useState('');

  const fetchExaminee = async () => {
    try {
      setLoading(true);
      const res = await adminApi.get(`/admin/examinees/${id}`);
      const data = res.data?.data || res.data;
      setExaminee(data);
      setName(data.name);
      setSeatNumber(data.seatNumber || '');
      setInstitutionName(data.institutionName || '');
      setExamRoomName(data.examRoomName || '');
      setSelectedExamSetId(data.assignedExamSet?.id || '');
    } catch {
      setError('회원 정보를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSessions = async () => {
    try {
      const res = await adminApi.get(`/admin/examinees/${id}/sessions`);
      setSessions(res.data);
    } catch {
      // silent
    }
  };

  useEffect(() => {
    if (id) {
      fetchExaminee();
      fetchSessions();
    }
  }, [id]);

  const handleSaveInfo = async () => {
    setMessage('');
    setError('');
    setSaving(true);
    try {
      await adminApi.patch(`/admin/examinees/${id}`, { name, seatNumber, institutionName, examRoomName });
      setMessage('저장되었습니다.');
      fetchExaminee();
    } catch (err: any) {
      setError(err.response?.data?.message || '저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    const newPw = prompt('새 비밀번호를 입력하세요 (8자 이상, 영문+숫자+특수문자):');
    if (!newPw) return;
    if (!/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/.test(newPw)) {
      alert('비밀번호는 8자 이상, 영문+숫자+특수문자를 포함해야 합니다.');
      return;
    }
    try {
      await adminApi.patch(`/admin/examinees/${id}/password`, { password: newPw });
      alert('비밀번호가 변경되었습니다.');
    } catch (err: any) {
      alert(err.response?.data?.message || '비밀번호 변경에 실패했습니다.');
    }
  };

  const handleChangeExamSet = async () => {
    setMessage('');
    setError('');
    setSaving(true);
    try {
      await adminApi.patch(`/admin/examinees/${id}/exam-set`, { examSetId: selectedExamSetId || null });
      setMessage('시험세트가 변경되었습니다.');
      fetchExaminee();
    } catch (err: any) {
      if (err.response?.status === 409) {
        setError('현재 시험이 진행 중이므로 시험세트를 변경할 수 없습니다.');
      } else {
        setError(err.response?.data?.message || '시험세트 변경에 실패했습니다.');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="text-center py-16 text-gray-400">불러오는 중...</div>
      </AdminLayout>
    );
  }

  if (!examinee) {
    return (
      <AdminLayout>
        <div className="text-center py-16 text-red-600">{error || '회원을 찾을 수 없습니다.'}</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Button
        variant="outline"
        size="sm"
        onClick={() => navigate('/admin/examinees')}
        className="mb-4"
      >
        &larr; 목록으로
      </Button>

      <div className="flex items-center gap-3 mb-5">
        <h1 className="m-0 text-[22px] text-gray-900">{examinee.name}</h1>
        <StatusBadge status={examinee.status} />
        {examinee.photoUrl && (
          <img
            src={examinee.photoUrl}
            alt="사진"
            className="w-10 h-[50px] object-cover rounded border border-gray-200 ml-2"
          />
        )}
      </div>

      {message && (
        <div className="px-3.5 py-2.5 bg-green-100 text-green-800 rounded-md mb-3 text-[13px]">
          {message}
        </div>
      )}
      {error && (
        <div className="px-3.5 py-2.5 bg-red-100 text-red-800 rounded-md mb-3 text-[13px]">
          {error}
        </div>
      )}

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => { setActiveTab(val as Tab); setMessage(''); setError(''); }}
      >
        <TabsList variant="line">
          <TabsTrigger value="info">기본 정보</TabsTrigger>
          <TabsTrigger value="examSet">시험세트</TabsTrigger>
          <TabsTrigger value="sessions">응시 내역</TabsTrigger>
        </TabsList>

        <Card className="mt-4">
          <CardContent>
            <TabsContent value="info">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>아이디</Label>
                  <Input value={examinee.loginId} disabled className="bg-gray-50" />
                </div>
                <div className="space-y-1">
                  <Label>수험번호</Label>
                  <Input value={examinee.registrationNumber} disabled className="bg-gray-50" />
                </div>
                <div className="space-y-1">
                  <Label>성명</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>좌석번호</Label>
                  <Input value={seatNumber} onChange={(e) => setSeatNumber(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>소속기관</Label>
                  <Input value={institutionName} onChange={(e) => setInstitutionName(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>시험실</Label>
                  <Input value={examRoomName} onChange={(e) => setExamRoomName(e.target.value)} />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button
                  onClick={handleSaveInfo}
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-500 text-white"
                >
                  {saving ? '저장 중...' : '저장'}
                </Button>
                <Button variant="outline" onClick={handleResetPassword}>
                  비밀번호 재설정
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="examSet">
              <div className="mb-4">
                <Label>현재 시험세트</Label>
                <div className="text-[15px] font-semibold text-gray-900 mt-1 mb-4">
                  {examinee.assignedExamSet
                    ? `[${examinee.assignedExamSet.examSetNumber}] ${examinee.assignedExamSet.name} (${examinee.assignedExamSet.examType})`
                    : '미배정'}
                </div>
              </div>
              <div className="space-y-1 mb-4">
                <Label>시험세트 변경</Label>
                <ExamSetSelector value={selectedExamSetId} onChange={setSelectedExamSetId} />
              </div>
              <Button
                onClick={handleChangeExamSet}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-500 text-white"
              >
                {saving ? '변경 중...' : '변경'}
              </Button>
            </TabsContent>

            <TabsContent value="sessions">
              {sessions.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                  응시 내역이 없습니다.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>시험세트</TableHead>
                      <TableHead>시작시간</TableHead>
                      <TableHead>종료시간</TableHead>
                      <TableHead>상태</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessions.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell>{s.examSetName}</TableCell>
                        <TableCell>{new Date(s.startedAt).toLocaleString('ko-KR')}</TableCell>
                        <TableCell>{s.endedAt ? new Date(s.endedAt).toLocaleString('ko-KR') : '-'}</TableCell>
                        <TableCell><StatusBadge status={s.status} type="session" /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>
    </AdminLayout>
  );
};

export default ExamineeDetailPage;
