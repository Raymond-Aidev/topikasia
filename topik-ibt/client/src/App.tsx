import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';

// ─── 응시자 화면 ───────────────────────────────────────────────
const LoginScreen = lazy(() => import('./exam/pages/LoginScreen'));
const ExamineeVerifyScreen = lazy(() => import('./exam/pages/ExamineeVerifyScreen'));
const ExamSetSelectScreen = lazy(() => import('./exam/pages/ExamSetSelectScreen'));
const WaitingRoomScreen = lazy(() => import('./exam/pages/WaitingRoomScreen'));
const SectionWaitingScreen = lazy(() => import('./exam/pages/SectionWaitingScreen'));
const ListeningScreen = lazy(() => import('./exam/pages/ListeningScreen'));
const WritingScreen = lazy(() => import('./exam/pages/WritingScreen'));
const ReadingScreen = lazy(() => import('./exam/pages/ReadingScreen'));
const SubmitReviewScreen = lazy(() => import('./exam/pages/SubmitReviewScreen'));
const ExamEndScreen = lazy(() => import('./exam/pages/ExamEndScreen'));
const ExamBlockedScreen = lazy(() => import('./exam/pages/ExamBlockedScreen'));
const ScoreReportScreen = lazy(() => import('./exam/pages/ScoreReportScreen'));
const ScoreEmailScreen = lazy(() => import('./exam/pages/ScoreEmailScreen'));
const LmsMainScreen = lazy(() => import('./exam/pages/LmsMainScreen'));
const LmsReviewScreen = lazy(() => import('./exam/pages/LmsReviewScreen'));
const LmsAnalysisScreen = lazy(() => import('./exam/pages/LmsAnalysisScreen'));

// ─── 어드민 화면 ───────────────────────────────────────────────
const AdminLoginPage = lazy(() => import('./admin/pages/AdminLoginPage'));
const DashboardPage = lazy(() => import('./admin/pages/DashboardPage'));
const ExamineeListPage = lazy(() => import('./admin/pages/ExamineeListPage'));
const ExamineeDetailPage = lazy(() => import('./admin/pages/ExamineeDetailPage'));
const ExamSetListPage = lazy(() => import('./admin/pages/ExamSetListPage'));
const ExamSessionListPage = lazy(() => import('./admin/pages/ExamSessionListPage'));
const RegistrationListPage = lazy(() => import('./admin/pages/RegistrationListPage'));
const ScoreManagementPage = lazy(() => import('./admin/pages/ScoreManagementPage'));
const RealtimeMonitorPage = lazy(() => import('./admin/pages/RealtimeMonitorPage'));
const LlmSettingsPage = lazy(() => import('./admin/pages/LlmSettingsPage'));
const QuestionTypeConfigPage = lazy(() => import('./admin/pages/QuestionTypeConfigPage'));

// ─── 문제 출제 모듈 ───────────────────────────────────────────
const QuestionBankImportPage = lazy(() => import('./question-module/pages/QuestionBankImportPage'));
const ExamSetComposePage = lazy(() => import('./question-module/pages/ExamSetComposePage'));
const ExamSetModuleListPage = lazy(() => import('./question-module/pages/ExamSetModuleListPage'));
const IBTUploadPage = lazy(() => import('./question-module/pages/IBTUploadPage'));
const ExamSetPreviewPage = lazy(() => import('./question-module/pages/ExamSetPreviewPage'));

// ─── 자가 접수 화면 ───────────────────────────────────────────
const AboutPage = lazy(() => import('./registration/pages/AboutPage'));
const LandingPage = lazy(() => import('./registration/pages/LandingPage'));
const SignUpPage = lazy(() => import('./registration/pages/SignUpPage'));
const EmailVerifyPage = lazy(() => import('./registration/pages/EmailVerifyPage'));
const RegistrationLoginPage = lazy(() => import('./registration/pages/RegistrationLoginPage'));
const ExamSchedulePage = lazy(() => import('./registration/pages/ExamSchedulePage'));
const RegistrationFormPage = lazy(() => import('./registration/pages/RegistrationFormPage'));
const RegistrationConfirmPage = lazy(() => import('./registration/pages/RegistrationConfirmPage'));
const RegistrationCompletePage = lazy(() => import('./registration/pages/RegistrationCompletePage'));
const MyPage = lazy(() => import('./registration/pages/MyPage'));

const Loading = () => <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>로딩 중...</div>;

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Loading />}>
        <Routes>
          {/* 응시자 */}
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/exam/verify" element={<ExamineeVerifyScreen />} />
          <Route path="/exam/select-set" element={<ExamSetSelectScreen />} />
          <Route path="/exam/waiting" element={<WaitingRoomScreen />} />
          <Route path="/exam/section-waiting" element={<SectionWaitingScreen />} />
          <Route path="/exam/listening" element={<ListeningScreen />} />
          <Route path="/exam/writing" element={<WritingScreen />} />
          <Route path="/exam/reading" element={<ReadingScreen />} />
          <Route path="/exam/submit/:section" element={<SubmitReviewScreen />} />
          <Route path="/exam/end" element={<ExamEndScreen />} />
          <Route path="/exam-blocked" element={<ExamBlockedScreen />} />
          <Route path="/exam/score" element={<ScoreReportScreen />} />
          <Route path="/exam/score/email" element={<ScoreEmailScreen />} />
          <Route path="/lms" element={<LmsMainScreen />} />
          <Route path="/lms/review/:sessionId" element={<LmsReviewScreen />} />
          <Route path="/lms/analysis/:sessionId" element={<LmsAnalysisScreen />} />

          {/* 어드민 */}
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin/dashboard" element={<DashboardPage />} />
          <Route path="/admin/examinees" element={<ExamineeListPage />} />
          <Route path="/admin/examinees/:id" element={<ExamineeDetailPage />} />
          <Route path="/admin/exam-sets" element={<ExamSetListPage />} />
          <Route path="/admin/registrations" element={<RegistrationListPage />} />
          <Route path="/admin/exam-sessions" element={<ExamSessionListPage />} />
          <Route path="/admin/scores" element={<ScoreManagementPage />} />
          <Route path="/admin/monitor" element={<RealtimeMonitorPage />} />
          <Route path="/admin/llm-settings" element={<LlmSettingsPage />} />
          <Route path="/admin/question-types" element={<QuestionTypeConfigPage />} />

          {/* 문제 출제 모듈 */}
          <Route path="/question-module/import" element={<QuestionBankImportPage />} />
          <Route path="/question-module/sets" element={<ExamSetModuleListPage />} />
          <Route path="/question-module/compose/:id?" element={<ExamSetComposePage />} />
          <Route path="/question-module/upload/:id" element={<IBTUploadPage />} />
          <Route path="/question-module/preview/:id" element={<ExamSetPreviewPage />} />

          {/* 자가 접수 */}
          <Route path="/about" element={<AboutPage />} />
          <Route path="/registration" element={<LandingPage />} />
          <Route path="/registration/signup" element={<SignUpPage />} />
          <Route path="/registration/verify-email" element={<EmailVerifyPage />} />
          <Route path="/registration/login" element={<RegistrationLoginPage />} />
          <Route path="/registration/schedules" element={<ExamSchedulePage />} />
          <Route path="/registration/apply" element={<RegistrationFormPage />} />
          <Route path="/registration/confirm" element={<RegistrationConfirmPage />} />
          <Route path="/registration/complete" element={<RegistrationCompletePage />} />
          <Route path="/registration/mypage" element={<MyPage />} />

          {/* 메인페이지 = 랜딩 (접수 시작점) */}
          <Route path="/" element={<LandingPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
