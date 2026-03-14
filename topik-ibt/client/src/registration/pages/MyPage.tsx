import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GlobalNavigationBar, { GNB_HEIGHT, GNB_HEIGHT_MOBILE } from '../../shared/components/GlobalNavigationBar';
import { useResponsive } from '../../shared/hooks/useResponsive';
import Footer from '../../shared/components/Footer';
import { useRegistrationStore } from '../store/registrationStore';
import { fetchMyRegistrations, downloadTicket } from '../api/registrationApi';
import type { Registration } from '../types/registration.types';

const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#F5F5F5',
    fontFamily: 'sans-serif',
    paddingTop: GNB_HEIGHT,
  },
  content: {
    maxWidth: 1000,
    margin: '0 auto',
    padding: '32px 24px',
  },
  title: {
    fontSize: 24,
    fontWeight: 700 as const,
    color: '#212121',
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
    overflow: 'hidden',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
  },
  th: {
    padding: '14px 16px',
    backgroundColor: '#F5F5F5',
    fontWeight: 600 as const,
    fontSize: 13,
    color: '#616161',
    textAlign: 'left' as const,
    borderBottom: '1px solid #E0E0E0',
  },
  td: {
    padding: '14px 16px',
    fontSize: 14,
    color: '#212121',
    borderBottom: '1px solid #F5F5F5',
  },
  statusBadge: (status: string) => ({
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 600 as const,
    color: '#fff',
    backgroundColor:
      status === 'APPROVED'
        ? '#4CAF50'
        : status === 'PENDING'
          ? '#FF9800'
          : status === 'REJECTED'
            ? '#E53935'
            : '#9E9E9E',
  }),
  ticketBtn: {
    padding: '6px 16px',
    fontSize: 12,
    fontWeight: 600 as const,
    color: '#1565C0',
    backgroundColor: '#E3F2FD',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    marginLeft: 8,
  },
  newBtn: {
    marginTop: 24,
    padding: '12px 32px',
    fontSize: 15,
    fontWeight: 700 as const,
    color: '#FFFFFF',
    backgroundColor: '#1565C0',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
  },
  loading: {
    textAlign: 'center' as const,
    padding: 40,
    color: '#9E9E9E',
    fontSize: 15,
  },
  empty: {
    textAlign: 'center' as const,
    padding: 60,
    color: '#9E9E9E',
    fontSize: 15,
  },
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: '접수대기',
  APPROVED: '접수완료',
  REJECTED: '반려',
  CANCELLED: '취소됨',
};

export default function MyPage() {
  const { isMobile, isTablet } = useResponsive();
  const compact = isMobile || isTablet;
  const navigate = useNavigate();
  const { setMyRegistrations, resetForm } = useRegistrationStore();

  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyRegistrations()
      .then((data) => {
        setRegistrations(data);
        setMyRegistrations(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [setMyRegistrations]);

  const handleDownload = async (reg: Registration) => {
    try {
      const blob = await downloadTicket(reg.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `수험표_${reg.registrationNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('수험표 다운로드에 실패했습니다.');
    }
  };

  const handleNewRegistration = () => {
    resetForm();
    navigate('/registration/schedules');
  };

  return (
    <div style={{ ...styles.page, paddingTop: compact ? GNB_HEIGHT_MOBILE : GNB_HEIGHT }}>
      <GlobalNavigationBar />

      <div style={{ ...styles.content, padding: isMobile ? '24px 16px' : '32px 24px' }}>
        <div style={styles.title}>내 접수 내역</div>

        {loading && <div style={styles.loading}>불러오는 중...</div>}

        {!loading && registrations.length === 0 && (
          <div style={styles.empty}>접수 내역이 없습니다.</div>
        )}

        {!loading && registrations.length > 0 && (
          <div style={styles.card}>
            <div style={{ overflowX: isMobile ? 'auto' : undefined }}>
            <table style={{ ...styles.table, minWidth: isMobile ? 700 : undefined }}>
              <thead>
                <tr>
                  <th style={styles.th}>접수번호</th>
                  <th style={styles.th}>시험</th>
                  <th style={styles.th}>시험일</th>
                  <th style={styles.th}>시험장</th>
                  <th style={styles.th}>영문 성명</th>
                  <th style={styles.th}>상태</th>
                  <th style={styles.th}></th>
                </tr>
              </thead>
              <tbody>
                {registrations.map((reg) => (
                  <tr key={reg.id}>
                    <td style={styles.td}>{reg.registrationNumber}</td>
                    <td style={styles.td}>
                      {reg.examSchedule
                        ? `${reg.examSchedule.examName}`
                        : '-'}
                    </td>
                    <td style={styles.td}>{reg.examSchedule?.examDate || '-'}</td>
                    <td style={styles.td}>{reg.venue?.name || '-'}</td>
                    <td style={styles.td}>{reg.englishName}</td>
                    <td style={styles.td}>
                      <span style={styles.statusBadge(reg.status)}>
                        {STATUS_LABELS[reg.status] || reg.status}
                      </span>
                    </td>
                    <td style={styles.td}>
                      {reg.status === 'APPROVED' && (
                        <button
                          style={styles.ticketBtn}
                          onClick={() => handleDownload(reg)}
                        >
                          수험표
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        )}

        <button style={styles.newBtn} onClick={handleNewRegistration}>
          새 시험 접수하기
        </button>
      </div>
      <Footer />
    </div>
  );
}
