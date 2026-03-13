/**
 * 알림·소통 페이지
 */
import { useNavigate } from 'react-router-dom';
import GlobalNavigationBar, { GNB_HEIGHT, GNB_HEIGHT_MOBILE } from '../../shared/components/GlobalNavigationBar';
import Footer from '../../shared/components/Footer';
import { useResponsive } from '../../shared/hooks/useResponsive';

const NOTICES = [
  { id: '1', title: 'TOPIK Asia 서비스 오픈 안내', date: '2026-03-01', category: '공지' },
  { id: '2', title: '모의시험 응시 방법 안내', date: '2026-03-05', category: '안내' },
  { id: '3', title: '시험 접수 방법 안내', date: '2026-03-10', category: '안내' },
  { id: '4', title: 'LMS 학습 분석 기능 안내', date: '2026-03-12', category: '업데이트' },
  { id: '5', title: '2026년 상반기 시험 일정 안내', date: '2026-02-20', category: '공지' },
  { id: '6', title: '개인정보처리방침 개정 안내', date: '2026-02-15', category: '공지' },
];

const FAQ_ITEMS = [
  { q: 'TOPIK Asia는 공식 TOPIK과 동일한 시험인가요?', a: 'TOPIK Asia는 공식 TOPIK IBT와 동일한 형식의 모의시험 플랫폼입니다. 실전 연습을 위한 서비스이며, 공식 성적으로 인정되지 않습니다.' },
  { q: '시험 접수 후 취소할 수 있나요?', a: '시험일 3일 전까지 마이페이지에서 접수 취소가 가능합니다. 이후에는 취소가 불가합니다.' },
  { q: '시험 결과는 언제 확인할 수 있나요?', a: '시험 종료 즉시 성적표가 제공됩니다. 성적 확인 메뉴에서 확인하거나 이메일로 발송할 수 있습니다.' },
  { q: 'AI 학습 분석은 어떻게 이용하나요?', a: '시험 완료 후 학습하기 메뉴에서 시험 이력을 선택하면 AI 분석 리포트를 확인할 수 있습니다.' },
  { q: '모바일에서도 시험 응시가 가능한가요?', a: '현재 PC 및 태블릿 환경을 권장합니다. 모바일 브라우저에서는 화면이 최적화되지 않을 수 있습니다.' },
];

const CATEGORY_COLORS: Record<string, string> = {
  '공지': '#1565C0',
  '안내': '#4CAF50',
  '업데이트': '#FF9800',
};

export default function NoticePage() {
  const navigate = useNavigate();
  const { isMobile, isTablet } = useResponsive();
  const compact = isMobile || isTablet;
  const topPad = compact ? GNB_HEIGHT_MOBILE : GNB_HEIGHT;
  const px = isMobile ? '16px' : '24px';

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F5F5F5', fontFamily: 'sans-serif', paddingTop: topPad }}>
      <GlobalNavigationBar />

      {/* 히어로 */}
      <div style={{
        background: 'linear-gradient(135deg, #00695C 0%, #004D40 60%, #1A237E 100%)',
        color: '#FFFFFF', textAlign: 'center',
        padding: isMobile ? '48px 16px' : '64px 24px',
      }}>
        <div style={{ fontSize: isMobile ? 28 : 40, fontWeight: 800, marginBottom: 12 }}>알림·소통</div>
        <div style={{ fontSize: isMobile ? 14 : 18, opacity: 0.9, lineHeight: 1.6 }}>
          TOPIK Asia의 최신 소식과 자주 묻는 질문을 확인하세요
        </div>
      </div>

      {/* 공지사항 */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: `48px ${px}` }}>
        <div style={{ fontSize: isMobile ? 22 : 28, fontWeight: 800, color: '#111827', marginBottom: 32 }}>
          공지사항
        </div>
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          {NOTICES.map((notice, i) => (
            <div
              key={notice.id}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: isMobile ? '16px' : '20px 28px',
                borderBottom: i < NOTICES.length - 1 ? '1px solid #F0F0F0' : 'none',
                cursor: 'pointer',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                <span style={{
                  display: 'inline-block', padding: '3px 10px', borderRadius: 12,
                  fontSize: 11, fontWeight: 600, color: '#FFFFFF', flexShrink: 0,
                  backgroundColor: CATEGORY_COLORS[notice.category] || '#9E9E9E',
                }}>
                  {notice.category}
                </span>
                <span style={{ fontSize: isMobile ? 14 : 15, color: '#374151', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {notice.title}
                </span>
              </div>
              <span style={{ fontSize: 13, color: '#9E9E9E', flexShrink: 0 }}>{notice.date}</span>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div style={{ backgroundColor: '#FFFFFF', padding: `56px ${px}` }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ fontSize: isMobile ? 22 : 28, fontWeight: 800, color: '#111827', marginBottom: 32 }}>
            자주 묻는 질문 (FAQ)
          </div>
          {FAQ_ITEMS.map((item, i) => (
            <div key={i} style={{
              backgroundColor: '#F9FAFB', borderRadius: 12,
              padding: isMobile ? '20px 16px' : '24px 28px',
              marginBottom: 16,
            }}>
              <div style={{ fontSize: isMobile ? 15 : 17, fontWeight: 700, color: '#111827', marginBottom: 10 }}>
                <span style={{ color: '#1565C0', marginRight: 8 }}>Q.</span>
                {item.q}
              </div>
              <div style={{ fontSize: 14, color: '#616161', lineHeight: 1.7, paddingLeft: isMobile ? 0 : 24 }}>
                <span style={{ color: '#4CAF50', fontWeight: 600, marginRight: 8 }}>A.</span>
                {item.a}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 문의 CTA */}
      <div style={{ padding: `48px ${px}` }}>
        <div style={{
          background: 'linear-gradient(135deg, #00695C, #004D40)',
          color: '#FFFFFF', textAlign: 'center',
          padding: isMobile ? '40px 20px' : '48px 24px',
          borderRadius: 20, maxWidth: 1100, margin: '0 auto',
        }}>
          <div style={{ fontSize: isMobile ? 20 : 24, fontWeight: 800, marginBottom: 12 }}>
            찾으시는 답변이 없으신가요?
          </div>
          <div style={{ fontSize: isMobile ? 14 : 16, opacity: 0.85, marginBottom: 28 }}>
            고객센터로 문의해 주시면 빠르게 안내해 드리겠습니다
          </div>
          <button
            style={{
              padding: isMobile ? '12px 28px' : '14px 36px',
              fontSize: isMobile ? 14 : 16, fontWeight: 700,
              backgroundColor: '#FFFFFF', color: '#00695C',
              border: 'none', borderRadius: 8, cursor: 'pointer',
            }}
            onClick={() => navigate('/about')}
          >
            고객센터 바로가기
          </button>
        </div>
      </div>

      <Footer />
    </div>
  );
}
