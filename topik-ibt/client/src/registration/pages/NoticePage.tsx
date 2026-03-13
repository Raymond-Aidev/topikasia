/**
 * 알림·소통 페이지
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GlobalNavigationBar, { GNB_HEIGHT, GNB_HEIGHT_MOBILE } from '../../shared/components/GlobalNavigationBar';
import Footer from '../../shared/components/Footer';
import { useResponsive } from '../../shared/hooks/useResponsive';

interface Notice {
  id: string;
  title: string;
  date: string;
  category: string;
  content: string;
}

const NOTICES: Notice[] = [
  {
    id: '1',
    title: 'TOPIK Asia 서비스 오픈 안내',
    date: '2026-03-01',
    category: '공지',
    content: `안녕하세요, TOPIK Asia입니다.

한국어능력시험(TOPIK) 모의시험 플랫폼 TOPIK Asia가 정식 오픈하였습니다.

TOPIK Asia는 공식 TOPIK IBT와 동일한 인터페이스에서 실전과 같은 환경으로 시험을 연습할 수 있는 서비스입니다.

주요 서비스:
• TOPIK I (초급) / TOPIK II (중·고급) / EPS-TOPIK 모의시험 응시
• 듣기, 쓰기, 읽기 전 영역 지원
• AI 기반 학습 분석 및 성적 리포트 제공
• 간편 온라인 접수 및 즉시 성적 확인

많은 이용 부탁드립니다.
감사합니다.`,
  },
  {
    id: '2',
    title: '모의시험 응시 방법 안내',
    date: '2026-03-05',
    category: '안내',
    content: `TOPIK Asia 모의시험 응시 방법을 안내드립니다.

1. 시험 접수
   - 상단 메뉴 [시험접수] 또는 [시험별 안내] 페이지에서 원하는 시험 일정을 선택합니다.
   - 접수중인 시험을 선택한 후 [접수하기] 버튼을 클릭합니다.
   - 로그인 후 개인정보 입력 → 시험장 선택 → 사진 업로드 → 최종 확인 순서로 진행합니다.

2. 시험 응시
   - 시험 당일 [로그인] 페이지에서 수험번호로 로그인합니다.
   - 본인 확인 후 시험이 시작됩니다.
   - 시험은 영역별(듣기 → 쓰기 → 읽기)로 순서대로 진행됩니다.
   - 각 영역은 제한 시간 내에 완료해야 하며, 시간 초과 시 자동 제출됩니다.

3. 응시 환경
   - PC(Chrome, Edge 권장) 또는 태블릿에서 응시 가능합니다.
   - 안정적인 인터넷 연결이 필요합니다.
   - 듣기 영역을 위해 이어폰 또는 스피커를 준비해 주세요.

4. 주의사항
   - 시험 중 다른 탭/창으로 전환하면 경고가 표시될 수 있습니다.
   - 브라우저를 닫거나 새로고침할 경우 진행 상태가 저장되어 이어서 응시 가능합니다.`,
  },
  {
    id: '3',
    title: '시험 접수 방법 안내',
    date: '2026-03-10',
    category: '안내',
    content: `TOPIK Asia 시험 접수 절차를 안내드립니다.

[접수 절차]
① 회원가입: 이메일, 이름, 연락처를 입력하여 계정을 생성합니다.
② 이메일 인증: 가입 시 입력한 이메일로 발송된 인증코드를 입력합니다.
③ 로그인: 가입한 이메일과 비밀번호로 로그인합니다.
④ 시험 선택: [시험별 안내] 페이지에서 접수중인 시험을 선택합니다.
⑤ 접수 정보 입력: 개인정보, 시험장, 증명사진을 등록합니다.
⑥ 최종 확인: 입력한 정보를 확인하고 접수를 완료합니다.

[접수 확인 및 취소]
• 접수 완료 후 마이페이지에서 접수 내역과 수험표를 확인할 수 있습니다.
• 접수 취소는 시험일 3일 전까지 마이페이지에서 가능합니다.
• 시험일 3일 이내에는 접수 취소가 불가합니다.

[결제 안내]
• 현재 모의시험은 무료로 제공됩니다.
• 유료 시험의 경우 접수 과정에서 결제가 진행되며, 취소 시 전액 환불됩니다.`,
  },
  {
    id: '4',
    title: 'LMS 학습 분석 기능 안내',
    date: '2026-03-12',
    category: '업데이트',
    content: `TOPIK Asia LMS(학습관리시스템)의 AI 학습 분석 기능을 안내드립니다.

[LMS 이용 방법]
상단 메뉴 [LMS]를 클릭하면 응시한 시험 이력을 확인할 수 있습니다.

[제공 기능]

1. 성적 분석
   • 영역별(듣기/쓰기/읽기) 점수와 등급을 한눈에 확인
   • 시험별 점수 추이 그래프 제공
   • TOPIK 등급 기준표 대비 현재 수준 표시

2. 문제 복습
   • 틀린 문제와 정답 해설을 다시 확인
   • 문항별 정오표 제공
   • 오답 유형 분류 및 취약 문항 분석

3. AI 학습 분석
   • 유형별 강점/약점 자동 분석
   • 맞춤형 학습 추천 제공
   • 문항별 상세 해설 및 풀이 전략 제시

[이용 조건]
• 시험을 1회 이상 응시 완료해야 LMS 기능을 이용할 수 있습니다.
• AI 분석 리포트는 시험 완료 후 자동으로 생성됩니다.`,
  },
  {
    id: '5',
    title: '개인정보처리방침 개정 안내',
    date: '2026-02-15',
    category: '공지',
    content: `개인정보처리방침 개정 사항을 안내드립니다.

[개정 일자] 2026년 3월 1일

[주요 개정 내용]

1. 쿠키 및 로컬 저장소 정책 상세화 (제7항)
   • 필수 쿠키/저장소와 선택 쿠키/저장소를 구분하여 명시
   • 인증 토큰 종류(registrationToken, examToken, adminToken) 및 용도 명시
   • 쿠키 동의 배너를 통한 동의/거부 방법 안내 추가

2. 수집 항목 명확화 (제1항)
   • 시험 접수 시 수집 항목에 '시험장 선택 정보' 추가
   • 자동 수집 항목에 '브라우저 종류 및 버전' 추가

3. 이용 목적 추가 (제2항)
   • 'AI 학습 분석' 목적 추가 (영역별 강약점 분석, 학습 추천)

[확인 방법]
페이지 하단의 [개인정보처리방침] 링크를 클릭하면 전문을 확인할 수 있습니다.

이용자 여러분의 개인정보 보호를 위해 최선을 다하겠습니다.
감사합니다.`,
  },
];

const FAQ_ITEMS = [
  { q: 'TOPIK Asia는 공식 TOPIK과 동일한 시험인가요?', a: 'TOPIK Asia는 공식 TOPIK IBT와 동일한 형식의 모의시험 플랫폼입니다. 실전 연습을 위한 서비스이며, 공식 성적으로 인정되지 않습니다.' },
  { q: '시험 접수 후 취소할 수 있나요?', a: '시험일 3일 전까지 마이페이지에서 접수 취소가 가능합니다. 이후에는 취소가 불가합니다.' },
  { q: '시험 결과는 언제 확인할 수 있나요?', a: '시험 종료 즉시 성적표가 제공됩니다. 성적 확인 메뉴에서 확인하거나 이메일로 발송할 수 있습니다.' },
  { q: 'AI 학습 분석은 어떻게 이용하나요?', a: '시험 완료 후 LMS 메뉴에서 시험 이력을 선택하면 AI 분석 리포트를 확인할 수 있습니다.' },
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
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleNotice = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

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
          {NOTICES.map((notice, i) => {
            const isOpen = expandedId === notice.id;
            return (
              <div key={notice.id}>
                {/* 제목 행 */}
                <div
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: isMobile ? '16px' : '20px 28px',
                    borderBottom: (isOpen || i < NOTICES.length - 1) ? '1px solid #F0F0F0' : 'none',
                    cursor: 'pointer', gap: 12,
                    backgroundColor: isOpen ? '#F8FAFC' : '#FFFFFF',
                    transition: 'background-color 0.15s',
                  }}
                  onClick={() => toggleNotice(notice.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                    <span style={{
                      display: 'inline-block', padding: '3px 10px', borderRadius: 12,
                      fontSize: 11, fontWeight: 600, color: '#FFFFFF', flexShrink: 0,
                      backgroundColor: CATEGORY_COLORS[notice.category] || '#9E9E9E',
                    }}>
                      {notice.category}
                    </span>
                    <span style={{
                      fontSize: isMobile ? 14 : 15, color: '#374151', fontWeight: isOpen ? 700 : 500,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {notice.title}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                    <span style={{ fontSize: 13, color: '#9E9E9E' }}>{notice.date}</span>
                    <span style={{
                      fontSize: 12, color: '#9E9E9E',
                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s',
                      display: 'inline-block',
                    }}>
                      ▼
                    </span>
                  </div>
                </div>

                {/* 본문 (펼침) */}
                {isOpen && (
                  <div style={{
                    padding: isMobile ? '20px 16px' : '24px 28px',
                    backgroundColor: '#FAFBFC',
                    borderBottom: i < NOTICES.length - 1 ? '1px solid #F0F0F0' : 'none',
                  }}>
                    <div style={{
                      fontSize: 14, color: '#374151', lineHeight: 1.8,
                      whiteSpace: 'pre-wrap', wordBreak: 'keep-all',
                    }}>
                      {notice.content}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
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
