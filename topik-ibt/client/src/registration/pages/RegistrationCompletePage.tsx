import { useNavigate } from 'react-router-dom';
import GlobalNavigationBar, { GNB_HEIGHT, GNB_HEIGHT_MOBILE } from '../../shared/components/GlobalNavigationBar';
import { useResponsive } from '../../shared/hooks/useResponsive';
import Footer from '../../shared/components/Footer';
import { useRegistrationStore } from '../store/registrationStore';
// downloadTicket is available on MyPage after admin approval

const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#F5F5F5',
    fontFamily: 'sans-serif',
    paddingTop: GNB_HEIGHT,
  },
  content: {
    maxWidth: 560,
    margin: '0 auto',
    padding: '60px 24px',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: '48px 40px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    textAlign: 'center' as const,
  },
  checkIcon: {
    width: 72,
    height: 72,
    borderRadius: '50%',
    backgroundColor: '#E8F5E9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 24px',
    fontSize: 36,
    color: '#4CAF50',
  },
  title: {
    fontSize: 26,
    fontWeight: 800 as const,
    color: '#212121',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: '#616161',
    marginBottom: 32,
    lineHeight: 1.5,
  },
  infoTable: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    marginBottom: 32,
    textAlign: 'left' as const,
  },
  infoLabel: {
    padding: '10px 16px',
    fontSize: 14,
    fontWeight: 600 as const,
    color: '#757575',
    width: 120,
  },
  infoValue: {
    padding: '10px 16px',
    fontSize: 15,
    color: '#212121',
    fontWeight: 500 as const,
  },
  btnRow: {
    display: 'flex',
    gap: 16,
    justifyContent: 'center',
  },
  mypageBtn: {
    padding: '14px 32px',
    fontSize: 15,
    fontWeight: 600 as const,
    color: '#1565C0',
    backgroundColor: '#FFFFFF',
    border: '1px solid #1565C0',
    borderRadius: 8,
    cursor: 'pointer',
  },
};

export default function RegistrationCompletePage() {
  const { isMobile, isTablet } = useResponsive();
  const compact = isMobile || isTablet;
  const navigate = useNavigate();
  const { currentRegistration, selectedSchedule, resetForm } = useRegistrationStore();

  const handleMyPage = () => {
    resetForm();
    navigate('/registration/mypage');
  };

  return (
    <div style={{ ...styles.page, paddingTop: compact ? GNB_HEIGHT_MOBILE : GNB_HEIGHT }}>
      <GlobalNavigationBar />

      <div style={{ ...styles.content, maxWidth: isMobile ? '100%' : 560, padding: isMobile ? '32px 16px' : '60px 24px' }}>
        <div style={{ ...styles.card, padding: isMobile ? '32px 20px' : '48px 40px' }}>
          <div style={styles.checkIcon}>&#10003;</div>
          <div style={styles.title}>접수가 완료되었습니다</div>
          <div style={styles.subtitle}>
            시험 접수가 정상적으로 처리되었습니다.
            <br />
            아래 접수 정보를 확인하세요.
          </div>

          <table style={styles.infoTable}>
            <tbody>
              <tr>
                <td style={styles.infoLabel}>접수번호</td>
                <td style={styles.infoValue}>
                  {currentRegistration?.registrationNumber || '-'}
                </td>
              </tr>
              <tr>
                <td style={styles.infoLabel}>시험</td>
                <td style={styles.infoValue}>
                  {selectedSchedule
                    ? `${selectedSchedule.examName} (${selectedSchedule.examType === 'TOPIK_I' ? 'TOPIK I' : 'TOPIK II'})`
                    : '-'}
                </td>
              </tr>
              <tr>
                <td style={styles.infoLabel}>시험일</td>
                <td style={styles.infoValue}>{selectedSchedule?.examDate || '-'}</td>
              </tr>
              <tr>
                <td style={styles.infoLabel}>시험장</td>
                <td style={styles.infoValue}>
                  {currentRegistration?.venue?.name || '-'}
                </td>
              </tr>
              <tr>
                <td style={styles.infoLabel}>상태</td>
                <td style={styles.infoValue}>
                  <span
                    style={{
                      padding: '4px 12px',
                      borderRadius: 12,
                      fontSize: 12,
                      fontWeight: 600,
                      color: '#fff',
                      backgroundColor: '#FF9800',
                    }}
                  >
                    승인 대기중
                  </span>
                </td>
              </tr>
            </tbody>
          </table>

          <div style={{ padding: '16px 20px', backgroundColor: '#FFF8E1', borderRadius: 8, marginBottom: 24, fontSize: 14, color: '#795548', lineHeight: 1.6 }}>
            관리자 승인 후 마이페이지에서 수험표를 다운로드할 수 있습니다.
          </div>

          <div style={styles.btnRow}>
            <button style={styles.mypageBtn} onClick={handleMyPage}>
              마이페이지에서 확인
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
