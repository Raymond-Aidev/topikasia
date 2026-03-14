import React from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import { useDashboardPolling } from '../hooks/useDashboardPolling';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/table';

const DashboardPage: React.FC = () => {
  const { data, isLoading, error, lastUpdated, refresh } = useDashboardPolling();

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-[22px] font-bold m-0">대시보드</h1>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-gray-400">
              마지막 갱신: {lastUpdated.toLocaleTimeString('ko-KR')}
            </span>
          )}
          <Button variant="outline" size="sm" onClick={refresh} disabled={isLoading}>
            새로고침
          </Button>
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 mb-5 rounded-md bg-red-100 text-red-800 text-sm">
          {error}
        </div>
      )}

      {isLoading && !data ? (
        <p className="text-gray-500">로딩 중...</p>
      ) : data ? (
        <>
          {/* Summary cards */}
          <div className="flex gap-4 flex-wrap mb-8">
            <Card className="flex-1 min-w-[200px]">
              <CardContent>
                <div className="text-[13px] text-gray-500 mb-1">전체 응시자</div>
                <div className="text-[28px] font-bold text-gray-900">{data.totalMembers}</div>
              </CardContent>
            </Card>
            <Card className="flex-1 min-w-[200px]">
              <CardContent>
                <div className="text-[13px] text-gray-500 mb-1">진행 중</div>
                <div className="text-[28px] font-bold text-blue-600">{data.inProgress}</div>
              </CardContent>
            </Card>
            <Card className="flex-1 min-w-[200px]">
              <CardContent>
                <div className="text-[13px] text-gray-500 mb-1">완료</div>
                <div className="text-[28px] font-bold text-green-600">{data.completed}</div>
              </CardContent>
            </Card>
            <Card className="flex-1 min-w-[200px]">
              <CardContent>
                <div className="text-[13px] text-gray-500 mb-1">미응시</div>
                <div className="text-[28px] font-bold text-gray-700">{data.notStarted}</div>
              </CardContent>
            </Card>
          </div>

          {/* Exam set stats */}
          {data.examSetStats.length > 0 && (
            <div className="mb-8">
              <h2 className="text-base font-bold mb-3">시험세트별 현황</h2>
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead>시험세트</TableHead>
                        <TableHead>유형</TableHead>
                        <TableHead className="text-right">배정</TableHead>
                        <TableHead className="text-right">진행 중</TableHead>
                        <TableHead className="text-right">완료</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.examSetStats.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell>{s.name}</TableCell>
                          <TableCell className="text-gray-500">{s.examType}</TableCell>
                          <TableCell className="text-right">{s.assignedCount}</TableCell>
                          <TableCell className="text-right text-blue-600">{s.inProgressCount}</TableCell>
                          <TableCell className="text-right text-green-600">{s.completedCount}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Quick links */}
          <div className="flex gap-3 flex-wrap">
            <Link to="/admin/examinees" className="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white">회원관리</Link>
            <Link to="/admin/exam-sets" className="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white">시험세트</Link>
            <Link to="/admin/exam-sessions" className="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white">응시내역</Link>
          </div>
        </>
      ) : null}
    </AdminLayout>
  );
};

export default DashboardPage;
