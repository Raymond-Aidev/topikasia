import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';

/**
 * Admin 라우트 가드
 * - adminToken이 localStorage에 없으면 로그인 페이지로 리다이렉트
 */
export default function AdminAuthGuard({ children }: { children: ReactNode }) {
  const location = useLocation();
  const token = localStorage.getItem('adminToken');

  if (!token) {
    return <Navigate to="/admin/login" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
}
