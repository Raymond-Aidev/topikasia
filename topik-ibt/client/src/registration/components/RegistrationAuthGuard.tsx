import { Navigate, useLocation } from 'react-router-dom';
import { useRegistrationStore } from '../store/registrationStore';

/** localStorage 토큰의 존재 + 만료 여부를 실시간 검증 */
function isTokenStillValid(): boolean {
  const token = localStorage.getItem('registrationToken');
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return !(payload.exp && payload.exp * 1000 < Date.now());
  } catch {
    return false;
  }
}

/**
 * 로그인이 필요한 접수 페이지를 감싸는 가드 컴포넌트.
 * 토큰이 없거나 만료되면 로그인 페이지로 리다이렉트하며, 원래 경로를 state로 전달.
 */
export default function RegistrationAuthGuard({ children }: { children: React.ReactNode }) {
  const isLoggedIn = useRegistrationStore((s) => s.isLoggedIn);
  const setLoggedIn = useRegistrationStore((s) => s.setLoggedIn);
  const setUser = useRegistrationStore((s) => s.setUser);
  const location = useLocation();

  // Zustand 상태뿐 아니라 실제 토큰 유효성도 확인
  if (!isLoggedIn || !isTokenStillValid()) {
    // 만료된 토큰 정리 + Zustand 동기화
    if (isLoggedIn) {
      localStorage.removeItem('registrationToken');
      localStorage.removeItem('registrationUser');
      setLoggedIn(false);
      setUser(null);
    }
    return <Navigate to="/registration/login" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
}
