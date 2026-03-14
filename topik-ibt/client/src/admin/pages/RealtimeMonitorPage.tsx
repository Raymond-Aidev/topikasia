/**
 * SCR-A08: 실시간 모니터링
 * MONITOR-05: 현재 시험중 응시자 실시간 상태
 */
import React, { useEffect, useState, useCallback } from 'react';
import AdminLayout from '../components/AdminLayout';
import { adminApi } from '../../api/adminApi';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';

interface LiveExaminee {
  sessionId: string;
  examinee: {
    name: string;
    loginId: string;
    registrationNumber: string;
    seatNumber: number | null;
    examRoomName: string | null;
  };
  examSet: { name: string; examSetNumber: string };
  startedAt: string;
  currentSection: string | null;
  completedSections: string[];
  submittedAnswerCount: number;
  totalAnswerCount: number;
  status: string;
}

interface CompletedExaminee {
  sessionId: string;
  examinee: {
    name: string;
    loginId: string;
    registrationNumber: string;
    seatNumber: number | null;
  };
  examSet: { name: string; examSetNumber: string };
  startedAt: string;
  completedAt: string;
  status: string;
}

interface MonitorData {
  stats: { inProgress: number; completedRecent: number; totalActive: number };
  liveExaminees: LiveExaminee[];
  completedExaminees: CompletedExaminee[];
}

const SECTION_LABELS: Record<string, string> = {
  LISTENING: '듣기', WRITING: '쓰기', READING: '읽기',
};

const formatTime = (v: string) => new Date(v).toLocaleTimeString('ko-KR');

const RealtimeMonitorPage: React.FC = () => {
  const [data, setData] = useState<MonitorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await adminApi.get('/admin/monitor/realtime');
      setData(res.data.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || '데이터 로딩 실패');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    if (!autoRefresh) return;
    const interval = setInterval(fetchData, 5000); // 5초 폴링
    return () => clearInterval(interval);
  }, [fetchData, autoRefresh]);

  const sectionBadge = (section: string | null, completed: string[]) => {
    if (!section && completed.length === 0) return <span className="text-gray-400">대기</span>;
    return (
      <div className="flex gap-1 flex-wrap">
        {completed.map(s => (
          <Badge key={s} className="bg-green-100 text-green-800">
            {SECTION_LABELS[s] || s}
          </Badge>
        ))}
        {section && (
          <Badge className="bg-blue-100 text-blue-800 animate-pulse">
            {SECTION_LABELS[section] || section} 진행중
          </Badge>
        )}
      </div>
    );
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-5">
        <div>
          <h1 className="text-[22px] font-bold m-0">실시간 모니터링</h1>
          <span className="text-xs text-gray-400">
            {autoRefresh ? '5초 간격 자동 새로고침' : '자동 새로고침 중지'}
          </span>
        </div>
        <div className="flex gap-2 items-center">
          <label className="flex items-center gap-1.5 text-[13px] cursor-pointer">
            <input type="checkbox" checked={autoRefresh} onChange={e => setAutoRefresh(e.target.checked)} />
            자동 새로고침
          </label>
          <Button variant="outline" onClick={fetchData}>
            새로고침
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {data && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent>
              <div className="text-[13px] text-gray-500 mb-1">시험 진행중</div>
              <div className="text-[32px] font-extrabold text-blue-600">{data.stats.inProgress}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <div className="text-[13px] text-gray-500 mb-1">최근 완료 (2시간)</div>
              <div className="text-[32px] font-extrabold text-green-600">{data.stats.completedRecent}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <div className="text-[13px] text-gray-500 mb-1">전체 활동</div>
              <div className="text-[32px] font-extrabold text-gray-700">{data.stats.totalActive}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {error && (
        <div className="px-4 py-3 mb-4 rounded-md bg-red-100 text-red-800 text-sm">
          {error}
        </div>
      )}

      {/* Live Examinees */}
      <h2 className="text-base font-bold mb-3">
        진행중 응시자 {data ? `(${data.liveExaminees.length}명)` : ''}
      </h2>
      <Card className="mb-8">
        <CardContent className="p-0 overflow-auto">
          <Table className="min-w-[800px]">
            <TableHeader>
              <TableRow>
                <TableHead>좌석</TableHead>
                <TableHead>성명</TableHead>
                <TableHead>수험번호</TableHead>
                <TableHead>시험세트</TableHead>
                <TableHead>시작시간</TableHead>
                <TableHead>현재 영역</TableHead>
                <TableHead>답안 저장</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-10 text-gray-400">불러오는 중...</TableCell></TableRow>
              ) : !data || data.liveExaminees.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-10 text-gray-400">현재 시험 진행중인 응시자가 없습니다.</TableCell></TableRow>
              ) : data.liveExaminees.map(e => (
                <TableRow key={e.sessionId}>
                  <TableCell className="font-semibold">{e.examinee.seatNumber ?? '-'}</TableCell>
                  <TableCell className="font-semibold">{e.examinee.name}</TableCell>
                  <TableCell className="text-xs text-gray-500">{e.examinee.registrationNumber}</TableCell>
                  <TableCell className="text-xs">{e.examSet.name}</TableCell>
                  <TableCell className="text-xs text-gray-500">{formatTime(e.startedAt)}</TableCell>
                  <TableCell>{sectionBadge(e.currentSection, e.completedSections)}</TableCell>
                  <TableCell>
                    <span className="text-[13px] font-semibold">
                      {e.submittedAnswerCount}/{e.totalAnswerCount}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recently Completed */}
      {data && data.completedExaminees.length > 0 && (
        <>
          <h2 className="text-base font-bold mb-3">
            최근 완료 ({data.completedExaminees.length}명)
          </h2>
          <Card>
            <CardContent className="p-0 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>좌석</TableHead>
                    <TableHead>성명</TableHead>
                    <TableHead>수험번호</TableHead>
                    <TableHead>시험세트</TableHead>
                    <TableHead>시작</TableHead>
                    <TableHead>완료</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.completedExaminees.map(e => (
                    <TableRow key={e.sessionId}>
                      <TableCell>{e.examinee.seatNumber ?? '-'}</TableCell>
                      <TableCell className="font-semibold">{e.examinee.name}</TableCell>
                      <TableCell className="text-xs text-gray-500">{e.examinee.registrationNumber}</TableCell>
                      <TableCell className="text-xs">{e.examSet.name}</TableCell>
                      <TableCell className="text-xs text-gray-500">{formatTime(e.startedAt)}</TableCell>
                      <TableCell className="text-xs text-green-600 font-semibold">{formatTime(e.completedAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </AdminLayout>
  );
};

export default RealtimeMonitorPage;
