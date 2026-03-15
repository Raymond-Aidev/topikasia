import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import MemberSelectModal from '../components/MemberSelectModal';
import { adminApi } from '../../api/adminApi';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent } from '../../components/ui/card';

interface ExamSetInfo {
  id: string;
  name: string;
  examType: string;
  status: string;
}

interface SelectedMember {
  id: string;
  name: string;
  email: string;
}

interface LaunchResult {
  name: string;
  email: string;
  loginId: string;
}

const ExamLaunchPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [examSet, setExamSet] = useState<ExamSetInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 시험 설정
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(40);

  // 응시자 선택
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<SelectedMember[]>([]);

  // 발행
  const [launching, setLaunching] = useState(false);
  const [result, setResult] = useState<LaunchResult[] | null>(null);

  useEffect(() => {
    if (!id) return;
    adminApi.get(`/admin/exam-sets/${id}`)
      .then((res) => {
        const data = (res.data as any)?.data || res.data;
        setExamSet(data);
      })
      .catch((err) => setError(err.response?.data?.message || '시험세트를 불러올 수 없습니다'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleMemberSelect = (members: SelectedMember[]) => {
    setSelectedMembers((prev) => {
      const existingIds = new Set(prev.map((m) => m.id));
      const newMembers = members.filter((m) => !existingIds.has(m.id));
      return [...prev, ...newMembers];
    });
  };

  const removeMember = (memberId: string) => {
    setSelectedMembers((prev) => prev.filter((m) => m.id !== memberId));
  };

  const handleLaunch = async () => {
    if (!startAt || !endAt) { alert('시작일시와 종료일시를 입력해주세요.'); return; }
    if (selectedMembers.length === 0) { alert('응시자를 선택해주세요.'); return; }
    if (!confirm(`${selectedMembers.length}명의 응시자로 시험을 발행하시겠습니까?`)) return;

    setLaunching(true);
    try {
      const res = await adminApi.post(`/admin/exam-sets/${id}/launch`, {
        startAt: new Date(startAt).toISOString(),
        endAt: new Date(endAt).toISOString(),
        timeLimitMinutes,
        memberIds: selectedMembers.map((m) => m.id),
      });
      const data = res.data.data;
      setResult(data.examinees);
      alert(res.data.message);
    } catch (err: any) {
      alert(err.response?.data?.message || '시험 발행에 실패했습니다.');
    } finally {
      setLaunching(false);
    }
  };

  if (loading) return <AdminLayout><div className="text-gray-400 text-center py-10">로딩 중...</div></AdminLayout>;
  if (error) return <AdminLayout><div className="text-red-600 text-center py-10">{error}</div></AdminLayout>;
  if (!examSet) return <AdminLayout><div className="text-gray-400 text-center py-10">시험세트를 찾을 수 없습니다</div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="flex items-center gap-3 mb-6">
        <Button variant="outline" size="sm" onClick={() => navigate('/admin/exam-sets')}>&larr; 돌아가기</Button>
        <h1 className="text-[22px] font-bold m-0">시험 발행</h1>
      </div>

      {result ? (
        /* 발행 완료 결과 */
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-bold text-green-700 mb-4">시험 발행 완료</h2>
            <div className="text-sm text-gray-600 mb-4">
              아래 수험번호를 응시자에게 안내해주세요. 응시자는 이 번호로 시험에 입장합니다.
            </div>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-3 py-2 text-left border">이름</th>
                  <th className="px-3 py-2 text-left border">이메일</th>
                  <th className="px-3 py-2 text-left border font-bold">수험번호</th>
                </tr>
              </thead>
              <tbody>
                {result.map((r, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2 border">{r.name}</td>
                    <td className="px-3 py-2 border text-gray-500">{r.email}</td>
                    <td className="px-3 py-2 border font-mono font-bold text-blue-700">{r.loginId}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Button className="mt-4" variant="outline" onClick={() => navigate('/admin/exam-sets')}>
              시험세트 목록으로
            </Button>
          </CardContent>
        </Card>
      ) : (
        /* 발행 설정 폼 */
        <div className="space-y-6">
          {/* ① 시험 정보 */}
          <Card>
            <CardContent className="p-6">
              <h2 className="font-bold text-base mb-4">① 시험 정보</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-gray-500">시험세트</Label>
                  <div className="font-semibold mt-1">{examSet.name}</div>
                </div>
                <div>
                  <Label className="text-gray-500">시험 유형</Label>
                  <div className="font-semibold mt-1">{examSet.examType === 'TOPIK_I' ? 'TOPIK I' : 'TOPIK II'}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ② 시간 설정 */}
          <Card>
            <CardContent className="p-6">
              <h2 className="font-bold text-base mb-4">② 시간 설정</h2>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>시작 일시 *</Label>
                  <Input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} />
                </div>
                <div>
                  <Label>종료 일시 *</Label>
                  <Input type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} />
                </div>
                <div>
                  <Label>시험 시간 (분)</Label>
                  <Input type="number" min={1} value={timeLimitMinutes} onChange={(e) => setTimeLimitMinutes(Number(e.target.value))} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ③ 응시자 선택 */}
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-base">③ 응시자 선택</h2>
                <Button onClick={() => setShowMemberModal(true)} className="bg-blue-600 hover:bg-blue-500 text-white">
                  응시자 선택
                </Button>
              </div>

              {selectedMembers.length === 0 ? (
                <div className="text-center text-gray-400 py-6 text-sm">선택된 응시자가 없습니다.</div>
              ) : (
                <div className="space-y-2">
                  <div className="text-sm text-gray-500 mb-2">선택된 응시자: {selectedMembers.length}명</div>
                  {selectedMembers.map((m) => (
                    <div key={m.id} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-md text-sm">
                      <div>
                        <span className="font-medium">{m.name}</span>
                        <span className="text-gray-400 ml-2">{m.email}</span>
                      </div>
                      <Button variant="outline" size="xs" onClick={() => removeMember(m.id)}
                        className="border-red-300 text-red-600 hover:bg-red-50">
                        제거
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 발행 버튼 */}
          <Button
            onClick={handleLaunch} disabled={launching || selectedMembers.length === 0}
            className="w-full py-3 text-base font-bold bg-green-600 hover:bg-green-500 text-white h-auto"
          >
            {launching ? '발행 중...' : `응시생등록 완료 (${selectedMembers.length}명)`}
          </Button>
        </div>
      )}

      <MemberSelectModal
        open={showMemberModal}
        onClose={() => setShowMemberModal(false)}
        onSelect={handleMemberSelect}
        excludeIds={selectedMembers.map((m) => m.id)}
      />
    </AdminLayout>
  );
};

export default ExamLaunchPage;
