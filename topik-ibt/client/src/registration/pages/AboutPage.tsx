/**
 * SCR-HOME-02: 토픽아시아 소개 — 반응형
 */
import { useNavigate } from 'react-router-dom';
import GlobalNavigationBar, { GNB_HEIGHT, GNB_HEIGHT_MOBILE } from '../../shared/components/GlobalNavigationBar';
import Footer from '../../shared/components/Footer';
import { useResponsive } from '../../shared/hooks/useResponsive';
import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/button';

const FEATURES = [
  { icon: '🎯', title: '실전과 동일한 IBT 환경', desc: '공식 TOPIK IBT와 동일한 시험 화면, 타이머, 문항 네비게이션으로 실전 감각을 키울 수 있습니다.' },
  { icon: '📝', title: '간편한 온라인 접수', desc: '회원가입부터 접수까지 3분이면 완료. PC, 태블릿에서 간편하게 접수하세요.' },
  { icon: '📊', title: 'AI 학습 분석 제공', desc: '시험 후 유형별 강점/약점을 AI가 분석하고, 문항별 상세 해설을 제공합니다.' },
  { icon: '⚡', title: '실시간 성적 확인', desc: '시험 직후 성적표와 등급을 바로 확인하고, 이메일로 발송할 수 있습니다.' },
];

const SELLING_POINTS = [
  { title: '공식 TOPIK IBT와 100% 동일한 인터페이스', desc: '실제 시험과 똑같은 화면 구성, 타이머, 문항 네비게이션으로 연습할 수 있어 시험장에서 당황하지 않습니다.' },
  { title: '듣기·쓰기·읽기 전 영역 지원', desc: '4지선다, 드롭다운, 문장 배열, 서술형 등 TOPIK의 모든 문항 유형을 지원합니다.' },
  { title: 'AI 기반 학습 분석 (LMS)', desc: '시험 후 문항별 AI 해설 제공과 함께 유형별 강점/약점 분석 차트로 학습 방향을 제시합니다.' },
  { title: '간편한 온라인 접수 시스템', desc: '회원가입 → 시험 선택 → 접수까지 3분이면 완료. 별도의 서류 없이 온라인으로 진행됩니다.' },
  { title: '즉시 성적 확인 및 이메일 발송', desc: '시험 직후 영역별 점수, 총점, 등급을 확인하고 성적표를 인쇄하거나 이메일로 발송할 수 있습니다.' },
];

const STEPS = [
  { num: 1, icon: '👤', title: '회원가입', desc: '이메일 인증으로 간편 가입' },
  { num: 2, icon: '📋', title: '시험 접수', desc: '일정 선택 + 정보 입력' },
  { num: 3, icon: '💻', title: '시험 응시', desc: '실전과 동일한 IBT 환경' },
  { num: 4, icon: '📈', title: '성적 확인', desc: '성적표 + AI 학습 분석' },
];

export default function AboutPage() {
  const navigate = useNavigate();
  const { isMobile, isTablet } = useResponsive();
  const compact = isMobile || isTablet;
  const topPad = compact ? GNB_HEIGHT_MOBILE : GNB_HEIGHT;

  const featureCols = isMobile ? 'grid-cols-1' : isTablet ? 'grid-cols-2' : 'grid-cols-4';
  const examCols = isMobile ? 'grid-cols-1' : 'grid-cols-2';

  return (
    <div className="min-h-screen bg-gray-100 font-sans" style={{ paddingTop: topPad }}>
      <GlobalNavigationBar />

      {/* 히어로 */}
      <div className={cn(
        'bg-gradient-to-br from-[#1565C0] via-[#0D47A1] to-[#1A237E] text-white text-center',
        isMobile ? 'px-4 py-12' : 'px-6 py-20'
      )}>
        <div className={cn('font-extrabold mb-4', isMobile ? 'text-[28px]' : 'text-5xl')}>TOPIK Asia</div>
        <div className={cn('opacity-90 mb-2 leading-relaxed', isMobile ? 'text-base' : 'text-xl')}>
          한국어능력시험을 준비하는 가장 좋은 모의시험 사이트
        </div>
        <div className={cn('opacity-70 mb-10', isMobile ? 'text-[13px]' : 'text-[15px]')}>
          공식 TOPIK IBT와 동일한 환경에서 실전 연습하고, AI 분석으로 실력을 향상하세요
        </div>
        <div className="flex gap-4 justify-center flex-wrap">
          <Button
            className={cn(
              'font-bold bg-white text-[#1565C0] hover:bg-gray-100 rounded-lg border-none',
              isMobile ? 'px-7 py-3 text-sm' : 'px-9 py-3.5 text-base'
            )}
            onClick={() => navigate('/registration/schedules')}
          >
            시험 접수하기
          </Button>
          <Button
            variant="outline"
            className={cn(
              'font-bold bg-transparent text-white border-2 border-white/60 hover:bg-white/10 rounded-lg',
              isMobile ? 'px-7 py-3 text-sm' : 'px-9 py-3.5 text-base'
            )}
            onClick={() => navigate('/login')}
          >
            모의시험 체험하기
          </Button>
        </div>
      </div>

      {/* 서비스 소개 카드 */}
      <div className={cn('max-w-[1100px] mx-auto', isMobile ? 'px-4 py-14' : 'px-6 py-14')}>
        <div className={cn('font-extrabold text-gray-900 text-center mb-10', isMobile ? 'text-[22px]' : 'text-[28px]')}>
          왜 TOPIK Asia인가요?
        </div>
        <div className={cn('grid gap-6', isMobile ? 'gap-4' : '', featureCols)}>
          {FEATURES.map((f) => (
            <div key={f.title} className={cn(
              'bg-white rounded-2xl text-center shadow-sm',
              isMobile ? 'px-5 py-7' : 'px-6 py-9'
            )}>
              <div className="text-[40px] mb-4">{f.icon}</div>
              <div className={cn('font-bold text-[#1565C0] mb-3', isMobile ? 'text-base' : 'text-lg')}>{f.title}</div>
              <div className="text-sm text-gray-600 leading-relaxed">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 시험 구성 안내 */}
      <div className={cn('bg-white', isMobile ? 'px-4 py-14' : 'px-6 py-14')}>
        <div className="max-w-[1100px] mx-auto">
          <div className={cn('font-extrabold text-gray-900 text-center mb-10', isMobile ? 'text-[22px]' : 'text-[28px]')}>
            시험 구성 안내
          </div>
          <div className={cn('grid gap-6', examCols)}>
            {/* TOPIK I */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
              <div className="px-7 py-5 font-bold text-lg text-white bg-[#1976D2]">
                TOPIK I (초급)
              </div>
              <div className="px-7 py-6">
                {[['듣기', '40분 · 30문항 · 100점'], ['읽기', '60분 · 40문항 · 100점']].map(([l, r]) => (
                  <div key={l} className="flex justify-between py-2.5 border-b border-gray-100 text-sm text-gray-700">
                    <span>{l}</span><span>{r}</span>
                  </div>
                ))}
                <div className="flex justify-between py-2.5 text-sm text-gray-700 font-semibold">
                  <span>합계</span><span>100분 · 70문항 · 200점 만점</span>
                </div>
                <div className="mt-4 px-4 py-3 bg-blue-50 rounded-lg text-[13px] text-[#1565C0]">
                  1급: 80점 이상 &nbsp;|&nbsp; 2급: 140점 이상
                </div>
              </div>
            </div>
            {/* TOPIK II */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
              <div className="px-7 py-5 font-bold text-lg text-white bg-[#0D47A1]">
                TOPIK II (중·고급)
              </div>
              <div className="px-7 py-6">
                {[['듣기', '60분 · 50문항 · 100점'], ['쓰기', '50분 · 4문항 · 100점'], ['읽기', '70분 · 50문항 · 100점']].map(([l, r]) => (
                  <div key={l} className="flex justify-between py-2.5 border-b border-gray-100 text-sm text-gray-700">
                    <span>{l}</span><span>{r}</span>
                  </div>
                ))}
                <div className="flex justify-between py-2.5 text-sm text-gray-700 font-semibold">
                  <span>합계</span><span>180분 · 104문항 · 300점 만점</span>
                </div>
                <div className="mt-4 px-4 py-3 bg-indigo-50 rounded-lg text-[13px] text-[#1A237E]">
                  3급: 120점+ | 4급: 150점+ | 5급: 190점+ | 6급: 230점+
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 특장점 */}
      <div className={cn('max-w-[1100px] mx-auto', isMobile ? 'px-4 py-14' : 'px-6 py-14')}>
        <div className={cn('font-extrabold text-gray-900 text-center mb-10', isMobile ? 'text-[22px]' : 'text-[28px]')}>
          TOPIK Asia만의 특장점
        </div>
        {SELLING_POINTS.map((sp, i) => (
          <div key={i} className={cn(
            'bg-white rounded-xl shadow-sm mb-4',
            isMobile ? 'px-4 py-5' : 'px-8 py-7'
          )}>
            <div className={cn('font-bold text-gray-900 mb-2', isMobile ? 'text-[15px]' : 'text-[17px]')}>
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#1565C0] text-white text-sm font-bold mr-3.5">{i + 1}</span>
              {sp.title}
            </div>
            <div className={cn('text-sm text-gray-600 leading-relaxed', isMobile ? '' : 'ml-[42px]')}>{sp.desc}</div>
          </div>
        ))}
      </div>

      {/* 이용 방법 */}
      <div className={cn('bg-white', isMobile ? 'px-4 py-14' : 'px-6 py-14')}>
        <div className="max-w-[1100px] mx-auto">
          <div className={cn('font-extrabold text-gray-900 text-center mb-10', isMobile ? 'text-[22px]' : 'text-[28px]')}>
            이용 방법
          </div>
          <div className={cn(
            'flex justify-center gap-3',
            isMobile ? 'flex-col items-center' : 'flex-row items-start'
          )}>
            {STEPS.map((step, i) => (
              <div key={step.num} className={cn(
                'flex items-center',
                isMobile ? 'flex-col' : 'flex-row'
              )}>
                <div className={cn(
                  'text-center px-4 py-8 bg-white rounded-2xl shadow-sm',
                  isMobile ? 'w-full max-w-[220px]' : 'w-[220px]'
                )}>
                  <div className="text-4xl mb-3">{step.icon}</div>
                  <div className="text-xs font-bold text-[#1565C0] bg-blue-50 rounded-xl px-3 py-0.5 inline-block mb-2">STEP {step.num}</div>
                  <div className="text-base font-bold text-gray-900 mb-1">{step.title}</div>
                  <div className="text-[13px] text-gray-400">{step.desc}</div>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={cn(
                    'flex items-center text-2xl text-gray-300',
                    isMobile ? 'py-2 rotate-90' : 'pt-12'
                  )}>→</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA 배너 */}
      <div className={cn(isMobile ? 'px-4 py-14' : 'px-6 py-14')}>
        <div className="bg-gradient-to-br from-[#1565C0] to-[#0D47A1] text-white text-center rounded-[20px] max-w-[1100px] mx-auto px-6 py-14">
          <div className={cn('font-extrabold mb-3', isMobile ? 'text-xl' : 'text-[28px]')}>
            지금 바로 TOPIK 모의시험을 시작하세요!
          </div>
          <div className={cn('opacity-85 mb-8', isMobile ? 'text-sm' : 'text-base')}>
            실전과 동일한 환경에서 연습하고, AI 분석으로 실력을 향상하세요
          </div>
          <Button
            className={cn(
              'font-bold bg-white text-[#1565C0] hover:bg-gray-100 rounded-lg border-none',
              isMobile ? 'px-7 py-3 text-sm' : 'px-9 py-3.5 text-base'
            )}
            onClick={() => navigate('/registration/schedules')}
          >
            시험 접수하기
          </Button>
        </div>
      </div>

      {/* 앵커: 응시 규정 */}
      <div id="rules" className={cn('max-w-[1100px] mx-auto', isMobile ? 'px-4 py-12' : 'px-6 py-12')}>
        <div className="text-[22px] font-bold text-gray-900 mb-5 pb-3 border-b-2 border-gray-200">
          응시 규정
        </div>
        {[
          '시험 시간 내 모든 답안을 제출하는 것이 원칙입니다.',
          '시간 초과 시 작성된 답안이 자동으로 제출됩니다.',
          '부정행위 적발 시 해당 응시가 취소 처리됩니다.',
          '시험 진행 중 브라우저를 이탈하면 경고 메시지가 표시됩니다.',
          '네트워크 오류 발생 시 답안은 로컬에 임시 저장되며, 재접속 시 자동 동기화됩니다.',
        ].map((text, i) => (
          <div key={i} className="text-[15px] text-gray-700 leading-[1.8] mb-2 pl-5">• {text}</div>
        ))}
      </div>

      {/* 앵커: 시험 신청 방법 */}
      <div id="how-to-apply" className={cn('max-w-[1100px] mx-auto', isMobile ? 'px-4 py-12' : 'px-6 py-12')}>
        <div className="text-[22px] font-bold text-gray-900 mb-5 pb-3 border-b-2 border-gray-200">
          시험 신청 방법
        </div>
        {[
          '회원가입 후 이메일 인증을 완료합니다.',
          '시험 일정 페이지에서 원하는 시험을 선택합니다.',
          '개인정보를 입력하고 사진을 업로드합니다.',
          '접수 내용을 확인한 후 최종 제출합니다.',
          '마이페이지에서 접수 상태를 확인하고 수험표를 다운로드할 수 있습니다.',
        ].map((text, i) => (
          <div key={i} className="text-[15px] text-gray-700 leading-[1.8] mb-2 pl-5">{i + 1}. {text}</div>
        ))}
      </div>

      <Footer />
    </div>
  );
}
