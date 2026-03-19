import type { ReactNode } from 'react';
import { useSessionRecovery } from '../hooks/useSessionRecovery';

/**
 * 시험 세션 자동 복구 래퍼
 * - examToken이 있으면 세션 복구 시도
 * - 복구 중에는 로딩 표시
 */
export default function ExamSessionGuard({ children }: { children: ReactNode }) {
  const { recovering } = useSessionRecovery();

  if (recovering) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-100">
        <div className="text-lg font-bold text-blue-800 mb-2">시험 세션 복구 중...</div>
        <div className="text-sm text-gray-500">잠시만 기다려 주세요</div>
      </div>
    );
  }

  return <>{children}</>;
}
