import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { to: '/admin/dashboard', label: '대시보드' },
  { to: '/admin/examinees', label: '회원관리' },
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
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      <nav
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          height: '56px',
          backgroundColor: '#1e293b',
          color: '#fff',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <span style={{ fontWeight: 700, fontSize: '16px', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img src="/logo_topikasia.png" alt="TOPIK Asia" style={{ height: 28, objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
            관리자
          </span>
          <div style={{ display: 'flex', gap: '4px' }}>
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                style={({ isActive }) => ({
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 500,
                  textDecoration: 'none',
                  color: isActive ? '#fff' : '#94a3b8',
                  backgroundColor: isActive ? '#334155' : 'transparent',
                  transition: 'all 0.15s',
                })}
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>
        <button
          onClick={handleLogout}
          style={{
            padding: '6px 16px',
            borderRadius: '6px',
            border: '1px solid #475569',
            backgroundColor: 'transparent',
            color: '#94a3b8',
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          로그아웃
        </button>
      </nav>
      <main style={{ padding: '24px', maxWidth: '1280px', margin: '0 auto' }}>
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
