import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/button';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { to: '/admin/dashboard', label: '대시보드' },
  { to: '/admin/members', label: '회원관리' },
  { to: '/admin/examinees', label: '응시자관리' },
  { to: '/admin/registrations', label: '접수관리' },
  { to: '/admin/exam-sets', label: '시험세트' },
  { to: '/admin/exam-sessions', label: '응시내역' },
  { to: '/admin/scores', label: '성적관리' },
  { to: '/admin/monitor', label: '모니터링' },
  { to: '/admin/llm-settings', label: 'LLM 설정' },
  { to: '/admin/question-types', label: '문제유형' },
  { to: '/admin/schedules', label: '시험일정' },
];

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-muted">
      <nav className="flex items-center justify-between px-6 h-14 bg-primary text-primary-foreground">
        <div className="flex items-center gap-6">
          <span className="font-bold text-base whitespace-nowrap flex items-center gap-2">
            <img src="/logo_topikasia.png" alt="TOPIK Asia" className="h-7 object-contain brightness-0 invert" />
            관리자
          </span>
          <div className="flex gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "px-4 py-2 rounded-md text-sm font-medium no-underline transition-all",
                    isActive
                      ? "text-primary-foreground bg-white/15"
                      : "text-primary-foreground/60 hover:text-primary-foreground hover:bg-white/10"
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="border-primary-foreground/30 bg-transparent text-primary-foreground/60 hover:text-primary-foreground hover:bg-white/10"
          onClick={handleLogout}
        >
          로그아웃
        </Button>
      </nav>
      <main className="p-6 max-w-[1280px] mx-auto">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
