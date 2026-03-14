import { useState, useEffect, useCallback, useRef } from 'react';
import { adminApi } from '../../api/adminApi';

interface DashboardSummary {
  totalMembers: number;
  completed: number;
  inProgress: number;
  notStarted: number;
  examSetStats: {
    id: string;
    name: string;
    examType: string;
    assignedCount: number;
    completedCount: number;
    inProgressCount: number;
  }[];
}

const POLL_INTERVAL = 30_000;

export function useDashboardPolling() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await adminApi.get('/admin/dashboard/summary');
      const raw = res.data?.data || res.data;
      setData({
        totalMembers: raw.examinees?.total ?? 0,
        completed: raw.sessions?.completed ?? 0,
        inProgress: raw.sessions?.inProgress ?? 0,
        notStarted: raw.sessions?.notStarted ?? 0,
        examSetStats: (raw.examSetStats || []).map((s: any) => ({
          id: s.id,
          name: s.name,
          examType: s.examType || s.examSetNumber || '',
          assignedCount: s.assignedCount ?? 0,
          completedCount: s.completed ?? s.completedCount ?? 0,
          inProgressCount: s.inProgress ?? s.inProgressCount ?? 0,
        })),
      });
      setLastUpdated(new Date());
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || '데이터를 불러오는 데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(fetchData, POLL_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchData]);

  return { data, isLoading, error, lastUpdated, refresh };
}
