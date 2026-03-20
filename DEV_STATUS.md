# TOPIK IBT — 개발 현황 보고서

> 최종 업데이트: 2026-03-19
> 최신 커밋: `3fe1cb9` (Add auto-submit on timer expiry with 5-second countdown)
> 배포 환경: Railway (Docker)

---

## 전체 요약

| 구분 | 수치 |
|------|------|
| 프론트엔드 페이지 | 44개 (exam 16 + admin 12 + registration 11 + question-module 5) |
| 백엔드 핸들러 | 74개 .ts 파일 (6개 모듈) |
| DB 모델 (Prisma) | 15개 |
| shadcn/ui 컴포넌트 | 29개 |
| 시드/마이그레이션 SQL | 8개 |

---

## TASK별 구현 상태

### Phase 1 — 핵심 시험 시스템 (TASK-01 ~ TASK-12)

| TASK | 제목 | 상태 | 비고 |
|------|------|:----:|------|
| TASK-01 | 공통 UI + 로그인/대기 화면 | ✅ 완료 | ExamHeader, Navigation, LoginScreen, WaitingRoom 등 구현 |
| TASK-02 | 듣기 영역 | ✅ 완료 | AudioPlayer + useAudioPlayer 훅, ListeningScreen |
| TASK-03 | 쓰기 영역 | ✅ 완료 | ShortAnswerQuestion, EssayQuestion, WritingScreen |
| TASK-04 | 읽기 영역 | ✅ 완료 | MCQ/드롭다운/D&D/삽입위치 5가지 유형, ReadingScreen |
| TASK-05 | 답안 제출/시험 종료 | ✅ 완료 | SubmitReviewScreen, ExamEndScreen, 영역별 제출 |
| TASK-06 | 어드민 회원관리/세트배정 | ✅ 완료 | ExamineeListPage, ExamineeDetailPage, 시험세트 배정 |
| TASK-07 | 어드민 운영 모니터링 | ✅ 완료 | DashboardPage, RealtimeMonitorPage, ExamSessionListPage |
| TASK-08 | 문제 출제 모듈 | ✅ 완료 | QuestionBankImport, ExamSetCompose, IBTUpload, Preview |
| TASK-09 | 백엔드 서버 셋업/인증 | ✅ 완료 | Express+Prisma, JWT 인증, RBAC 미들웨어 |
| TASK-10 | 응시자 시험 API | ✅ 완료 | 세션 생성/복구, 답안 저장/제출, 자동 채점 |
| TASK-11 | 어드민 API | ✅ 완료 | 회원 CRUD, 대시보드, Excel 내보내기, 일괄 등록 |
| TASK-12 | 문제은행/WebSocket/파일업로드 | ✅ 완료 | 문제은행 Mock API, S3 업로드, WebSocket 기본 구조 |

### Phase 2 — 자가접수 시스템 (TASK-13 ~ TASK-14)

| TASK | 제목 | 상태 | 비고 |
|------|------|:----:|------|
| TASK-13 | 자가접수 응시자 화면 | ✅ 완료 | 회원가입, 이메일인증, 시험일정, 4단계 접수 위자드, MyPage |
| TASK-14 | 자가접수 백엔드 API | ✅ 완료 | signup, verifyEmail, login, apply, 자동승인, 수험표 PDF |

### Phase 2.5 — 홈페이지 리디자인 (TASK-15)

| TASK | 제목 | 상태 | 비고 |
|------|------|:----:|------|
| TASK-15 | 메인 홈페이지 리디자인 | ✅ 완료 | LandingPage, AboutPage, NoticePage, GNB, Footer, 배너 캐러셀 |

---

## 최근 주요 작업 이력

| 날짜 | 커밋 | 작업 내용 |
|------|------|-----------|
| 2026-03-19 | `3fe1cb9` | 타이머 만료 시 5초 카운트다운 후 자동 제출 기능 추가 |
| 2026-03-19 | `72f3891` | 필드명 불일치 수정 (registrationStartDate → registrationStartAt) |
| 2026-03-19 | `9f6e7c8` | 중복 접수 시 confirm 다이얼로그 + 마이페이지 이동 UX 개선 |
| 2026-03-19 | `e22647d` | GNB 로그인 상태 페이지 새로고침 시 유지 (localStorage 연동) |
| 2026-03-19 | `8512f07` | 접수 확인 페이지: 수험번호 표시, 날짜 포맷, 시험장 표시, 조건부 수험표 다운로드 |
| 2026-03-18 | `69ff410` | 시험 API 호출 누락 수정 (section-start, session-complete) |
| 2026-03-18 | `1f73062` | 시험 UI 흰 화면 수정: 중첩된 API 응답 언래핑 + 필드명 정렬 |
| 2026-03-18 | `58e9a3e` | 시험 로그인, 접수 플로우, 일정 표시 버그 수정 |
| 2026-03-17 | `2550fcc` | 흰 화면 수정, launchExam 데이터 무결성, approve 레이스 컨디션 |
| 2026-03-17 | `12318bf` | 회원 관리, 시험 일괄 등록 위자드, 인증 설계 문서 |
| 2026-03-14 | `7962d50` | shadcn 마이그레이션 후 레이아웃/데이터 표시 버그 수정 |
| 2026-03-14 | `46d6364` | 전체 클라이언트 UI를 shadcn/ui + Tailwind CSS v4로 마이그레이션 (116파일) |

---

## 기술 스택 현황

### 프론트엔드
| 기술 | 버전 | 용도 |
|------|------|------|
| React | 19.2 | UI 프레임워크 |
| TypeScript | 5.x | 타입 안전성 |
| Vite | 6.x | 빌드 도구 |
| Tailwind CSS | v4 | 스타일링 (`@tailwindcss/vite` 플러그인) |
| shadcn/ui | v4 (base-nova) | UI 컴포넌트 라이브러리 (29개 컴포넌트) |
| React Router | 7 | 라우팅 |
| Zustand | - | 상태 관리 |
| Axios | - | HTTP 클라이언트 |
| Howler.js | - | 오디오 재생 (듣기 시험) |
| Dexie.js | - | IndexedDB (오프라인 답안 저장) |
| Socket.io-client | - | 실시간 통신 |

### 백엔드
| 기술 | 버전 | 용도 |
|------|------|------|
| Express | 5 | HTTP 서버 |
| Prisma | 5 | ORM (PostgreSQL) |
| JWT | - | 인증 (응시자/어드민 분리) |
| bcrypt | - | 비밀번호 해싱 |
| Nodemailer | - | 이메일 발송 (인증코드, 성적) |
| PDFKit | - | 수험표 PDF 생성 |
| ExcelJS | - | Excel 내보내기 |
| AWS SDK S3 | - | 파일 업로드 (사진, 오디오) |
| Socket.io | - | WebSocket 서버 |
| Zod | - | 요청 데이터 검증 |

### 인프라
| 기술 | 용도 |
|------|------|
| Docker (Node 20-Alpine) | 컨테이너화 (multi-stage build) |
| Railway | 배포 플랫폼 |
| PostgreSQL | 데이터베이스 |
| AWS S3 | 파일 스토리지 |

---

## DB 스키마 모델 목록

| 모델 | 용도 | 주요 관계 |
|------|------|-----------|
| AdminUser | 어드민 계정 (SUPER_ADMIN/ADMIN/PROCTOR/QUESTION_AUTHOR) | → Examinee 생성자 |
| Examinee | 수험자 (ACTIVE/INACTIVE/LOCKED) | → ExamSet, ExamSession |
| ExamSet | 시험 세트 (DRAFT/UPLOADED/ACTIVE/ARCHIVED) | → Examinee, ExamSession |
| ExamSession | 시험 응시 세션 (IN_PROGRESS/COMPLETED/ABANDONED) | → Examinee, ExamSet, Answer |
| Answer | 개별 답안 | → ExamSession |
| Score | 채점 결과 (PENDING/AUTO_GRADED/FULLY_GRADED) | → ExamSession |
| RegistrationUser | 자가접수 회원 | → Registration |
| ExamSchedule | 시험 일정 (용량 관리) | → ExamSet, Registration |
| Registration | 접수 신청 (PENDING/APPROVED/REJECTED/CANCELLED) | → RegistrationUser, ExamSchedule |
| QuestionExplanation | LLM 생성 문제 해설 캐시 | → ExamSet |
| LmsAnalysis | LMS 학습 분석 데이터 | → ExamSession |
| AuditLog | 감사 로그 | → AdminUser |

---

## 라우트 구조

### 프론트엔드 라우트 (client/src/App.tsx)

```
/ ─────────────────────── LandingPage (메인)
/about ────────────────── AboutPage (토픽아시아 소개)
/notice ───────────────── NoticePage (공지사항)

/login ────────────────── LoginScreen (응시자 로그인)
/exam/verify ──────────── ExamineeVerifyScreen
/exam/select-set ──────── ExamSetSelectScreen
/exam/waiting ─────────── WaitingRoomScreen
/exam/section-waiting ─── SectionWaitingScreen
/exam/listening ───────── ListeningScreen
/exam/writing ─────────── WritingScreen
/exam/reading ─────────── ReadingScreen
/exam/submit/:section ─── SubmitReviewScreen
/exam/end ─────────────── ExamEndScreen
/exam-blocked ─────────── ExamBlockedScreen
/exam/score ───────────── ScoreReportScreen
/exam/score/email ─────── ScoreEmailScreen
/lms ──────────────────── LmsMainScreen
/lms/review/:sessionId ── LmsReviewScreen
/lms/analysis/:sessionId  LmsAnalysisScreen

/admin/login ──────────── AdminLoginPage
/admin/dashboard ──────── DashboardPage
/admin/examinees ──────── ExamineeListPage
/admin/examinees/:id ──── ExamineeDetailPage
/admin/exam-sets ──────── ExamSetListPage
/admin/registrations ──── RegistrationListPage
/admin/exam-sessions ──── ExamSessionListPage
/admin/scores ─────────── ScoreManagementPage
/admin/monitor ────────── RealtimeMonitorPage
/admin/llm-settings ───── LlmSettingsPage
/admin/question-types ─── QuestionTypeConfigPage
/admin/schedules ──────── ExamScheduleManagePage

/question-module/import ──── QuestionBankImportPage
/question-module/sets ────── ExamSetModuleListPage
/question-module/compose/:id ExamSetComposePage
/question-module/upload/:id  IBTUploadPage
/question-module/preview/:id ExamSetPreviewPage

/registration ─────────── LandingPage
/registration/signup ──── SignUpPage
/registration/verify-email EmailVerifyPage
/registration/login ───── RegistrationLoginPage
/registration/schedules ── ExamSchedulePage
/registration/apply ───── RegistrationFormPage
/registration/confirm ─── RegistrationConfirmPage
/registration/complete ── RegistrationCompletePage
/registration/mypage ──── MyPage
```

### 백엔드 API 엔드포인트

```
POST   /api/exam-auth/login
GET    /api/exam/exam-set
GET    /api/exam/current-session
POST   /api/exam/session
POST   /api/exam/answers
POST   /api/exam/submit/:section
POST   /api/exam/complete
GET    /api/exam/score
POST   /api/exam/score/email
POST   /api/exam/section-start

POST   /api/admin-auth/login
POST   /api/admin-auth/logout
GET    /api/admin/dashboard
GET    /api/admin/examinees
POST   /api/admin/examinees
GET    /api/admin/examinees/:id
PATCH  /api/admin/examinees/:id
DELETE /api/admin/examinees/:id
POST   /api/admin/examinees/:id/reset-password
POST   /api/admin/examinees/:id/change-exam-set
POST   /api/admin/examinees/bulk-import
GET    /api/admin/exam-sets
POST   /api/admin/exam-sets
GET    /api/admin/exam-sets/:id
PATCH  /api/admin/exam-sets/:id/schedule
GET    /api/admin/exam-sessions
GET    /api/admin/exam-sessions/:id
POST   /api/admin/exam-sessions/export
GET    /api/admin/scores
POST   /api/admin/sessions/:id/auto-score
POST   /api/admin/scores/publish
GET    /api/admin/registrations
PATCH  /api/admin/registrations/:id
POST   /api/admin/registrations/batch
GET    /api/admin/schedules
POST   /api/admin/schedules
PATCH  /api/admin/schedules/:id
DELETE /api/admin/schedules/:id
GET    /api/admin/llm-settings
POST   /api/admin/llm-settings
GET    /api/admin/question-types
POST   /api/admin/question-types

GET    /api/registration/schedules
POST   /api/registration/signup
POST   /api/registration/verify-email
POST   /api/registration/resend-code
POST   /api/registration/login
POST   /api/registration/apply
GET    /api/registration/my
GET    /api/registration/my/:id/ticket
DELETE /api/registration/my/:id

GET    /api/lms/history
GET    /api/lms/sessions/:id/review
GET    /api/lms/sessions/:id/analysis
POST   /api/lms/sessions/:id/explain/:questionId
```

---

## 알려진 이슈 및 기술 부채

### 미해결 이슈
| ID | 심각도 | 설명 | 참조 |
|----|--------|------|------|
| ISS-01 | ⚠️ | `@base-ui/react` Textarea 컴포넌트도 Input과 동일한 FieldContext hook 에러 가능성 | input.tsx 수정 참고 |
| ISS-02 | ⚠️ | 기타 shadcn v4 컴포넌트(`@base-ui/react` 기반)가 특정 컨텍스트에서 hook 에러 발생 가능 | 모니터링 필요 |

### ACID 분석 보고서 미적용 항목 (ACID_분석보고서.md)
| 우선순위 | ID | 설명 | 상태 |
|:--------:|-----|------|:----:|
| 1 | A-01 + I-01 | 로그인 failCount 원자적 증가 (보안) | ⬜ 미적용 |
| 2 | A-04 + I-02 + C-01 | 세션 중복 생성 방지 (partial unique index) | ⬜ 미적용 |
| 3 | A-03 + D-01 | IBT 업로드 원자성 보강 | ⬜ 미적용 |
| 4 | C-02 | CASCADE 동작 명시 | ⬜ 미적용 |
| 5 | A-06 + I-03 | 시험세트 번호 시퀀스 채번 | ⬜ 미적용 |
| 6 | A-02 | S3 + DB 업로드 순서 조정 | ⬜ 미적용 |
| 7 | I-04 | 회원 생성 중복 오류 처리 (P2002) | ⬜ 미적용 |
| 8 | D-02 | IndexedDB 동기화 재시도 로직 | ⬜ 미적용 |
| 9 | D-03 | 서버 타이머 강제 제출 Job | ⬜ 미적용 |
| 10 | C-03 + C-04 | 상태 전환 규칙 강제 | ⬜ 미적용 |

### 최근 수정 사항 (2026-03-17 ~ 03-19)
- [x] 시험 UI 흰 화면 문제 해결 (API 응답 언래핑, 필드명 정렬)
- [x] GNB 로그인 상태 새로고침 시 유지 (localStorage 연동)
- [x] 접수 확인 페이지: 수험번호, 날짜 포맷, 시험장, 조건부 수험표 다운로드
- [x] 중복 접수 시 마이페이지 이동 옵션 UX 개선
- [x] 필드명 불일치 수정 (registrationStartDate → registrationStartAt)
- [x] 타이머 만료 시 5초 카운트다운 후 자동 제출

### UI/UX 고도화 잔여 작업
- [ ] 공지사항 상세 내용 작성 및 클릭 시 내용 표시 기능
- [ ] 다크모드 지원 (CSS 변수는 준비됨, 토글 UI 미구현)

---

## 배포 정보

| 항목 | 값 |
|------|-----|
| 배포 플랫폼 | Railway |
| Docker 베이스 | node:20-alpine (multi-stage) |
| DB | PostgreSQL (Railway 관리형) |
| 빌드 방식 | Dockerfile → client Vite build + server tsc → 단일 컨테이너 |
| 시드 방식 | `server/prisma/init-db.js` → `sql/001~008` 순차 실행 |
| 프로덕션 URL | Railway 자동 할당 |
| 배포 트리거 | `git push origin main` → 자동 빌드/배포 |

---

## 파일 구조 요약

```
topik-ibt/
├── client/                          # React 프론트엔드
│   ├── src/
│   │   ├── components/ui/           # shadcn/ui 컴포넌트 (29개)
│   │   ├── exam/                    # 응시자 시험 모듈
│   │   │   ├── pages/ (16)
│   │   │   ├── components/
│   │   │   ├── store/
│   │   │   └── api/
│   │   ├── admin/                   # 어드민 모듈
│   │   │   ├── pages/ (12)
│   │   │   └── api/
│   │   ├── registration/            # 자가접수 모듈
│   │   │   ├── pages/ (11)
│   │   │   ├── store/
│   │   │   └── api/
│   │   ├── question-module/         # 문제 출제 모듈
│   │   │   └── pages/ (5)
│   │   ├── shared/                  # 공통 컴포넌트
│   │   │   ├── components/          # GNB, Footer, LegalModal 등
│   │   │   └── hooks/
│   │   ├── lib/utils.ts             # cn() 유틸리티
│   │   ├── index.css                # Tailwind v4 + shadcn 테마
│   │   ├── App.tsx                  # 라우터
│   │   └── main.tsx                 # 엔트리
│   ├── components.json              # shadcn 설정
│   ├── vite.config.ts
│   └── tsconfig.json
├── server/                          # Express 백엔드
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/                # 인증 (exam + admin)
│   │   │   ├── exam/                # 시험 API (10 handlers)
│   │   │   ├── admin/               # 어드민 API (30 handlers)
│   │   │   ├── registration/        # 접수 API (11 handlers)
│   │   │   ├── lms/                 # LMS API (4 handlers)
│   │   │   └── question-module/     # 문제은행 API
│   │   ├── middleware/              # JWT, RBAC, 에러 핸들러
│   │   ├── services/                # 채점, 이메일 등
│   │   └── app.ts, server.ts
│   └── prisma/
│       ├── schema.prisma            # 15개 모델
│       ├── sql/                     # 8개 시드/마이그레이션
│       └── init-db.js
├── Dockerfile
├── start.sh
└── docker-compose.yml
```
