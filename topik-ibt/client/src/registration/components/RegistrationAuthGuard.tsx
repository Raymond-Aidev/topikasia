import { Navigate, useLocation } from 'react-router-dom';
import { useRegistrationStore } from '../store/registrationStore';

/**
 * 로그인이 필요한 접수 페이지를 감싸는 가드 컴포넌트.
 * 토큰이 없으면 로그인 페이지로 리다이렉트하며, 원래 경로를 state로 전달.
 */
export default function RegistrationAuthGuard({ children }: { children: React.ReactNode }) {
  const isLoggedIn = useRegistrationStore((s) => s.isLoggedIn);
  const location = useLocation();

  if (!isLoggedIn) {
    return <Navigate to="/registration/login" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
}
