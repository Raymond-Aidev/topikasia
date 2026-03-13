/**
 * SCR-HOME-02: 토픽아시아 소개
 * 한국어능력시험을 준비하는 가장 좋은 모의시험 사이트
 */
import { useNavigate } from 'react-router-dom';
import GlobalNavigationBar, { GNB_HEIGHT } from '../../shared/components/GlobalNavigationBar';
import Footer from '../../shared/components/Footer';

const FEATURES = [
  {
    icon: '🎯',
    title: '실전과 동일한 IBT 환경',
    desc: '공식 TOPIK IBT와 동일한 시험 화면, 타이머, 문항 네비게이션으로 실전 감각을 키울 수 있습니다.',
  },
  {
    icon: '📝',
    title: '간편한 온라인 접수',
    desc: '회원가입부터 접수까지 3분이면 완료. PC, 태블릿에서 간편하게 접수하세요.',
  },
  {
    icon: '📊',
    title: 'AI 학습 분석 제공',
    desc: '시험 후 유형별 강점/약점을 AI가 분석하고, 문항별 상세 해설을 제공합니다.',
  },
  {
    icon: '⚡',
    title: '실시간 성적 확인',
    desc: '시험 직후 성적표와 등급을 바로 확인하고, 이메일로 발송할 수 있습니다.',
  },
];

const SELLING_POINTS = [
  {
    title: '공식 TOPIK IBT와 100% 동일한 인터페이스',
    desc: '실제 시험과 똑같은 화면 구성, 타이머, 문항 네비게이션으로 연습할 수 있어 시험장에서 당황하지 않습니다.',
  },
  {
    title: '듣기·쓰기·읽기 전 영역 지원',
    desc: '4지선다, 드롭다운, 문장 배열, 서술형 등 TOPIK의 모든 문항 유형을 지원합니다.',
  },
  {
    title: 'AI 기반 학습 분석 (LMS)',
    desc: '시험 후 문항별 AI 해설 제공과 함께 유형별 강점/약점 분석 차트로 학습 방향을 제시합니다.',
  },
  {
    title: '간편한 온라인 접수 시스템',
    desc: '회원가입 → 시험 선택 → 접수까지 3분이면 완료. 별도의 서류 없이 온라인으로 진행됩니다.',
  },
  {
    title: '즉시 성적 확인 및 이메일 발송',
    desc: '시험 직후 영역별 점수, 총점, 등급을 확인하고 성적표를 인쇄하거나 이메일로 발송할 수 있습니다.',
  },
];

const STEPS = [
  { num: 1, icon: '👤', title: '회원가입', desc: '이메일 인증으로 간편 가입' },
  { num: 2, icon: '📋', title: '시험 접수', desc: '일정 선택 + 정보 입력' },
  { num: 3, icon: '💻', title: '시험 응시', desc: '실전과 동일한 IBT 환경' },
  { num: 4, icon: '📈', title: '성적 확인', desc: '성적표 + AI 학습 분석' },
];

const s = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#F5F5F5',
    fontFamily: 'sans-serif',
    paddingTop: GNB_HEIGHT,
  },
  hero: {
    background: 'linear-gradient(135deg, #1565C0 0%, #0D47A1 50%, #1A237E 100%)',
    color: '#FFFFFF',
    textAlign: 'center' as const,
    padding: '80px 24px',
  },
  heroTitle: { fontSize: 48, fontWeight: 800 as const, marginBottom: 16 },
  heroSub: { fontSize: 20, opacity: 0.9, marginBottom: 8, lineHeight: 1.6 },
  heroDesc: { fontSize: 15, opacity: 0.7, marginBottom: 40 },
  heroBtns: { display: 'flex' as const, gap: 16, justifyContent: 'center' as const },
  primaryBtn: {
    padding: '14px 36px', fontSize: 16, fontWeight: 700 as const,
    backgroundColor: '#FFFFFF', color: '#1565C0', border: 'none', borderRadius: 8, cursor: 'pointer',
  },
  secondaryBtn: {
    padding: '14px 36px', fontSize: 16, fontWeight: 700 as const,
    backgroundColor: 'transparent', color: '#FFFFFF', border: '2px solid rgba(255,255,255,0.6)',
    borderRadius: 8, cursor: 'pointer',
  },
  section: { maxWidth: 1100, margin: '0 auto', padding: '56px 24px' },
  sectionTitle: {
    fontSize: 28, fontWeight: 800 as const, color: '#111827',
    textAlign: 'center' as const, marginBottom: 40,
  },
  featureGrid: {
    display: 'grid' as const,
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 24,
  },
  featureCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: '36px 24px',
    textAlign: 'center' as const, boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
  },
  featureIcon: { fontSize: 40, marginBottom: 16 },
  featureTitle: { fontSize: 18, fontWeight: 700 as const, color: '#1565C0', marginBottom: 12 },
  featureDesc: { fontSize: 14, color: '#616161', lineHeight: 1.6 },
  examTable: {
    display: 'grid' as const, gridTemplateColumns: '1fr 1fr', gap: 24,
  },
  examCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, overflow: 'hidden' as const,
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
  },
  examCardHeader: {
    padding: '20px 28px', fontWeight: 700 as const, fontSize: 18, color: '#FFFFFF',
  },
  examCardBody: { padding: '24px 28px' },
  examRow: {
    display: 'flex' as const, justifyContent: 'space-between' as const,
    padding: '10px 0', borderBottom: '1px solid #F0F0F0',
    fontSize: 14, color: '#374151',
  },
  spItem: {
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: '28px 32px',
    marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
  },
  spNum: {
    display: 'inline-flex' as const, alignItems: 'center' as const, justifyContent: 'center' as const,
    width: 28, height: 28, borderRadius: '50%', backgroundColor: '#1565C0', color: '#FFF',
    fontSize: 14, fontWeight: 700 as const, marginRight: 14,
  },
  spTitle: { fontSize: 17, fontWeight: 700 as const, color: '#111827', marginBottom: 8 },
  spDesc: { fontSize: 14, color: '#616161', lineHeight: 1.6, marginLeft: 42 },
  stepsRow: {
    display: 'flex' as const, alignItems: 'flex-start' as const, justifyContent: 'center' as const, gap: 12,
  },
  stepCard: {
    flex: 1, maxWidth: 220, textAlign: 'center' as const, padding: '32px 16px',
    backgroundColor: '#FFFFFF', borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  stepIcon: { fontSize: 36, marginBottom: 12 },
  stepNum: {
    fontSize: 12, fontWeight: 700 as const, color: '#1565C0',
    backgroundColor: '#E3F2FD', borderRadius: 12, padding: '2px 12px',
    display: 'inline-block' as const, marginBottom: 8,
  },
  stepTitle: { fontSize: 16, fontWeight: 700 as const, color: '#111827', marginBottom: 4 },
  stepDesc: { fontSize: 13, color: '#9E9E9E' },
  stepArrow: {
    display: 'flex' as const, alignItems: 'center' as const, paddingTop: 48,
    fontSize: 24, color: '#BDBDBD',
  },
  ctaBanner: {
    background: 'linear-gradient(135deg, #1565C0, #0D47A1)',
    color: '#FFFFFF', textAlign: 'center' as const, padding: '56px 24px', borderRadius: 20,
    margin: '0 auto', maxWidth: 1100,
  },
  anchorSection: {
    maxWidth: 1100, margin: '0 auto', padding: '48px 24px',
  },
  anchorTitle: {
    fontSize: 22, fontWeight: 700 as const, color: '#111827', marginBottom: 20,
    paddingBottom: 12, borderBottom: '2px solid #E0E0E0',
  },
  anchorItem: {
    fontSize: 15, color: '#374151', lineHeight: 1.8, marginBottom: 8,
    paddingLeft: 20,
  },
};

export default function AboutPage() {
  const navigate = useNavigate();

  return (
    <div style={s.page}>
      <GlobalNavigationBar />

      {/* 히어로 */}
      <div style={s.hero}>
        <img
          src="/logo_topikasia.png"
          alt="TOPIK Asia"
          style={{ height: 80, objectFit: 'contain' as const, marginBottom: 20, filter: 'brightness(0) invert(1)' }}
        />
        <div style={s.heroTitle}>TOPIK Asia</div>
        <div style={s.heroSub}>한국어능력시험을 준비하는 가장 좋은 모의시험 사이트</div>
        <div style={s.heroDesc}>
          공식 TOPIK IBT와 동일한 환경에서 실전 연습하고, AI 분석으로 실력을 향상하세요
        </div>
        <div style={s.heroBtns}>
          <button style={s.primaryBtn} onClick={() => navigate('/registration/schedules')}>
            시험 접수하기
          </button>
          <button style={s.secondaryBtn} onClick={() => navigate('/login')}>
            모의시험 체험하기
          </button>
        </div>
      </div>

      {/* 서비스 소개 카드 */}
      <div style={s.section}>
        <div style={s.sectionTitle}>왜 TOPIK Asia인가요?</div>
        <div style={s.featureGrid}>
          {FEATURES.map((f) => (
            <div key={f.title} style={s.featureCard}>
              <div style={s.featureIcon}>{f.icon}</div>
              <div style={s.featureTitle}>{f.title}</div>
              <div style={s.featureDesc}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 시험 구성 안내 */}
      <div style={{ backgroundColor: '#FFFFFF', padding: '56px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={s.sectionTitle}>시험 구성 안내</div>
          <div style={s.examTable}>
            {/* TOPIK I */}
            <div style={s.examCard}>
              <div style={{ ...s.examCardHeader, backgroundColor: '#1976D2' }}>
                TOPIK I (초급)
              </div>
              <div style={s.examCardBody}>
                <div style={s.examRow}><span>듣기</span><span>40분 · 30문항 · 100점</span></div>
                <div style={s.examRow}><span>읽기</span><span>60분 · 40문항 · 100점</span></div>
                <div style={{ ...s.examRow, borderBottom: 'none', fontWeight: 600 }}>
                  <span>합계</span><span>100분 · 70문항 · 200점 만점</span>
                </div>
                <div style={{ marginTop: 16, padding: '12px 16px', backgroundColor: '#E3F2FD', borderRadius: 8, fontSize: 13, color: '#1565C0' }}>
                  1급: 80점 이상 &nbsp;|&nbsp; 2급: 140점 이상
                </div>
              </div>
            </div>
            {/* TOPIK II */}
            <div style={s.examCard}>
              <div style={{ ...s.examCardHeader, backgroundColor: '#0D47A1' }}>
                TOPIK II (중·고급)
              </div>
              <div style={s.examCardBody}>
                <div style={s.examRow}><span>듣기</span><span>60분 · 50문항 · 100점</span></div>
                <div style={s.examRow}><span>쓰기</span><span>50분 · 4문항 · 100점</span></div>
                <div style={s.examRow}><span>읽기</span><span>70분 · 50문항 · 100점</span></div>
                <div style={{ ...s.examRow, borderBottom: 'none', fontWeight: 600 }}>
                  <span>합계</span><span>180분 · 104문항 · 300점 만점</span>
                </div>
                <div style={{ marginTop: 16, padding: '12px 16px', backgroundColor: '#E8EAF6', borderRadius: 8, fontSize: 13, color: '#1A237E' }}>
                  3급: 120점+ | 4급: 150점+ | 5급: 190점+ | 6급: 230점+
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 특장점 */}
      <div style={s.section}>
        <div style={s.sectionTitle}>TOPIK Asia만의 특장점</div>
        {SELLING_POINTS.map((sp, i) => (
          <div key={i} style={s.spItem}>
            <div style={s.spTitle}>
              <span style={s.spNum}>{i + 1}</span>
              {sp.title}
            </div>
            <div style={s.spDesc}>{sp.desc}</div>
          </div>
        ))}
      </div>

      {/* 이용 방법 */}
      <div style={{ backgroundColor: '#FFFFFF', padding: '56px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={s.sectionTitle}>이용 방법</div>
          <div style={s.stepsRow}>
            {STEPS.map((step, i) => (
              <div key={step.num} style={{ display: 'flex' as const, alignItems: 'flex-start' as const }}>
                <div style={s.stepCard}>
                  <div style={s.stepIcon}>{step.icon}</div>
                  <div style={s.stepNum}>STEP {step.num}</div>
                  <div style={s.stepTitle}>{step.title}</div>
                  <div style={s.stepDesc}>{step.desc}</div>
                </div>
                {i < STEPS.length - 1 && (
                  <div style={s.stepArrow}>→</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA 배너 */}
      <div style={{ padding: '56px 24px' }}>
        <div style={s.ctaBanner}>
          <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}>
            지금 바로 TOPIK 모의시험을 시작하세요!
          </div>
          <div style={{ fontSize: 16, opacity: 0.85, marginBottom: 32 }}>
            실전과 동일한 환경에서 연습하고, AI 분석으로 실력을 향상하세요
          </div>
          <button style={s.primaryBtn} onClick={() => navigate('/registration/schedules')}>
            시험 접수하기
          </button>
        </div>
      </div>

      {/* 앵커: 응시 규정 */}
      <div id="rules" style={s.anchorSection}>
        <div style={s.anchorTitle}>응시 규정</div>
        <div style={s.anchorItem}>• 시험 시간 내 모든 답안을 제출하는 것이 원칙입니다.</div>
        <div style={s.anchorItem}>• 시간 초과 시 작성된 답안이 자동으로 제출됩니다.</div>
        <div style={s.anchorItem}>• 부정행위 적발 시 해당 응시가 취소 처리됩니다.</div>
        <div style={s.anchorItem}>• 시험 진행 중 브라우저를 이탈하면 경고 메시지가 표시됩니다.</div>
        <div style={s.anchorItem}>• 네트워크 오류 발생 시 답안은 로컬에 임시 저장되며, 재접속 시 자동 동기화됩니다.</div>
      </div>

      {/* 앵커: 시험 신청 방법 */}
      <div id="how-to-apply" style={s.anchorSection}>
        <div style={s.anchorTitle}>시험 신청 방법</div>
        <div style={s.anchorItem}>1. 회원가입 후 이메일 인증을 완료합니다.</div>
        <div style={s.anchorItem}>2. 시험 일정 페이지에서 원하는 시험을 선택합니다.</div>
        <div style={s.anchorItem}>3. 개인정보를 입력하고 사진을 업로드합니다.</div>
        <div style={s.anchorItem}>4. 접수 내용을 확인한 후 최종 제출합니다.</div>
        <div style={s.anchorItem}>5. 마이페이지에서 접수 상태를 확인하고 수험표를 다운로드할 수 있습니다.</div>
      </div>

      <Footer />
    </div>
  );
}
