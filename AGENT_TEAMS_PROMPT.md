# TOPIK IBT — Claude Code Agent Teams 작업 프롬프트 (풀스택)

> 이 파일을 Claude Code에서 열고, 아래 프롬프트를 팀 리더 세션에 붙여넣으세요.

---

## 프롬프트 (복사해서 Claude Code에 붙여넣기)

```
당신은 TOPIK IBT 솔루션 개발 프로젝트의 팀 리더 에이전트입니다.
아래 지시에 따라 Agent Teams를 구성하고 풀스택 병렬 개발을 시작하세요.

## 프로젝트 문서 위치

모든 개발 문서는 현재 작업 폴더에 있습니다.
반드시 PRD.md를 먼저 읽고 전체 아키텍처를 파악하세요.

  PRD.md                                    ← 전체 제품 요구사항
  ── 프론트엔드 ──
  TASK-01_공통UI_로그인_대기.md
  TASK-02_듣기영역.md
  TASK-03_쓰기영역.md
  TASK-04_읽기영역.md
  TASK-05_답안제출_시험종료.md
  TASK-06_어드민_회원관리_시험세트배정.md
  TASK-07_어드민_운영모니터링.md
  TASK-08_문제출제모듈.md
  ── 백엔드 ──
  TASK-09_백엔드_서버셋업_인증.md
  TASK-10_응시자시험API.md
  TASK-11_어드민API.md
  TASK-12_문제은행_WebSocket_파일업로드.md

## 팀 리더 역할

1. PRD.md 숙지 후 공통 셋업 완료 (아래 섹션 참고)
2. 7개 에이전트에게 작업 동시 할당
3. 에이전트 간 충돌(타입 불일치, API 계약 위반) 조율
4. 모든 에이전트 완료 후 통합 테스트 수행

## 팀 리더 공통 셋업 (에이전트 투입 전 직접 완료)

### 1. 전체 모노레포 구조 생성
  topik-ibt/
  ├── client/       ← React 프론트엔드
  ├── server/       ← Express 백엔드
  └── shared/       ← 공통 타입 (client + server 공유)

### 2. client/ 초기화
  cd client && npm create vite@latest . -- --template react-ts
  npm install zustand react-router-dom axios dnd-kit
  npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
  npm install howler dexie xlsx socket.io-client
  npm install -D @types/howler

### 3. server/ 초기화
  cd server && npm init -y
  npm install express cors helmet bcrypt jsonwebtoken dotenv zod winston
  npm install @prisma/client socket.io exceljs multer axios
  npm install @aws-sdk/client-s3
  npm install -D typescript ts-node nodemon prisma
  npm install -D @types/express @types/node @types/bcrypt @types/jsonwebtoken @types/multer

### 4. Prisma 초기화 및 마이그레이션
  cd server && npx prisma init
  (TASK-09의 schema.prisma 내용 적용)
  npx prisma migrate dev --name init
  npx prisma generate

### 5. server/.env 생성 (TASK-09 참고)
  PORT, DATABASE_URL, JWT_SECRET, ADMIN_JWT_SECRET 등 설정

### 6. shared/types/ 공통 타입 정의
  (PRD.md 섹션 7 데이터 모델 기반)
  Examinee, ExamSet, Question, Answer, ExamSession, AdminUser

### 7. client/src/ 폴더 구조 생성
  src/
  ├── types/          ← 공통 타입
  ├── store/          ← Zustand
  ├── api/            ← axios 인스턴스 (exam / admin 분리)
  ├── exam/           ← 에이전트 A+B
  ├── admin/          ← 에이전트 C
  ├── question-module/ ← 에이전트 D
  └── shared/         ← 공통 컴포넌트

### 8. 라우터 설정 (client/src/App.tsx)
  /login                    → 응시자 로그인
  /exam/*                   → 응시자 시험 화면
  /admin/login              → 어드민 로그인
  /admin/*                  → 어드민 (RBAC 가드)
  /question-module/*        → 문제 출제 모듈

공통 셋업 완료 후 아래 7개 에이전트를 동시에 시작하세요.

---

## 에이전트 편성 (총 7개)

### [에이전트 A] 프론트엔드 — 응시자 공통·제출 화면
담당: TASK-01, TASK-05
작업 경로: client/src/exam/pages/, client/src/exam/store/
핵심 구현:
  - ExamHeader, ExamNavigation, ExamineeCard 공통 컴포넌트
  - 로그인(SCR-01) ~ 시험세트 선택(SCR-03) ~ 대기실(SCR-04)
  - 답안 제출(SCR-14~16) + 시험 종료(SCR-17)
  - Zustand examStore (기본 상태 구조)
의존: 에이전트 E의 POST /api/auth/login, GET /api/exam/assigned-set

### [에이전트 B] 프론트엔드 — 응시자 시험 영역
담당: TASK-02, TASK-03, TASK-04
작업 경로: client/src/exam/components/
핵심 구현:
  - AudioPlayer + useAudioPlayer 훅 (듣기)
  - ShortAnswerQuestion + EssayQuestion + useKoreanCharCount (쓰기)
  - MCQ / 드롭다운 / 문장배열(dnd-kit) / 삽입위치 (읽기)
  - useAutoSave + IndexedDB(Dexie) 오프라인 저장
  - 전체 문제 팝업(SCR-13)
의존: 에이전트 A의 examStore, 에이전트 E의 PUT /api/exam/answers

### [에이전트 C] 프론트엔드 — 어드민 시스템
담당: TASK-06, TASK-07
작업 경로: client/src/admin/
핵심 구현:
  - 어드민 로그인 + GNB 레이아웃
  - 회원 목록/생성(사진 업로드)/상세/편집
  - 시험세트 관리 목록(ACTIVE 세트만)
  - 대시보드 (30초 polling) + 응시 내역 + Excel 내보내기
의존: 에이전트 F의 /api/admin/* 엔드포인트

### [에이전트 D] 프론트엔드 — 문제 출제 모듈
담당: TASK-08
작업 경로: client/src/question-module/
핵심 구현:
  - questionTypes.config.ts (기본 15개 유형, 변경 가능)
  - QuestionBankImporter (유형별 [문제 불러오기] 버튼)
  - QuestionSelectDrawer (문항 선택 드로어 + 미리보기)
  - ExamSetComposer (2열 dnd-kit 구성 화면)
  - IBT 업로드 화면 + 유효성 검증 패널
  - Zustand importedQuestionsStore
의존: 에이전트 G의 /api/question-bank/*, /api/question-module/*

### [에이전트 E] 백엔드 — 서버 셋업 + 인증 + 응시자 시험 API
담당: TASK-09, TASK-10
작업 경로: server/src/
핵심 구현:
  (TASK-09) Express 앱, Prisma 스키마, JWT 미들웨어, RBAC, 에러 핸들러
  (TASK-10) 시험세트 조회, 세션 생성/복구, 답안 Upsert, 영역 제출, 완료 처리
우선 완료 후 에이전트 A, B에게 완료 통보

### [에이전트 F] 백엔드 — 어드민 API
담당: TASK-11
작업 경로: server/src/modules/admin/
핵심 구현:
  - 회원 CRUD (사진 S3 업로드 포함)
  - 비밀번호 초기화 (임시 비밀번호 1회 반환)
  - 대시보드 요약 통계
  - 응시 내역 목록 + Excel 내보내기 (ExcelJS)
선행 조건: 에이전트 E의 TASK-09 완료 후 시작
완료 후 에이전트 C에게 통보

### [에이전트 G] 백엔드 — 문제은행 + WebSocket + 파일 업로드
담당: TASK-12
작업 경로: server/src/modules/question-module/, server/src/websocket/
핵심 구현:
  - questionBankClient.ts (Mock API, 실제 교체 구조)
  - 시험세트 생성/수정/목록/IBT 업로드 API
  - IBT 업로드: 문제은행 스냅샷 저장 + ACTIVE 전환
  - 파일 업로드 (이미지/오디오 → S3)
  - WebSocket /exam, /proctor 네임스페이스 (Phase 2)
선행 조건: 에이전트 E의 TASK-09 완료 후 시작
완료 후 에이전트 D에게 통보

---

## 에이전트 간 의존 관계

  [에이전트 E] (TASK-09) ← 가장 먼저 완료 필요
      ↓
  [에이전트 F] (TASK-11)  [에이전트 G] (TASK-12)
      ↓                       ↓
  [에이전트 C] (프론트 어드민)  [에이전트 D] (프론트 출제모듈)

  [에이전트 A] (TASK-01,05)  ← 에이전트 E와 병렬 시작 가능 (Mock API 사용)
  [에이전트 B] (TASK-02~04)  ← 에이전트 A와 병렬 시작 가능 (Mock API 사용)

## 충돌 방지 규칙

- API 경로는 각 TASK 파일의 명세를 기준으로 하며, 변경 시 팀 리더에게 보고
- 프론트엔드는 Mock API (MSW 또는 하드코딩)로 먼저 개발, 백엔드 완료 후 연결
- Prisma 스키마 변경은 에이전트 E만 수행, 다른 에이전트는 요청으로 처리
- 각 에이전트는 자신의 담당 경로에만 파일 생성

## Phase 우선순위

Phase 1 (MVP) — 모든 에이전트 우선 집중:
  - 응시자: 로그인 → 배정 세트 → MCQ·단답·서술·드롭다운 → 제출
  - 어드민: 로그인 → 회원 생성 → 시험세트 배정
  - 출제 모듈: 문제 불러오기 → 세트 구성 → IBT 업로드

Phase 2 (이후 추가):
  - 읽기 문장배열 D&D, 삽입위치 (에이전트 B)
  - WebSocket 실시간 모니터링 (에이전트 G)
  - Excel 일괄 등록, 감독관 제어 (에이전트 F)

## 시작 명령

지금 바로 시작하세요:
1. dev_docs/PRD.md 읽기
2. 공통 셋업 완료
3. 에이전트 E 먼저 시작 (백엔드 기반)
4. 에이전트 A, B, D를 에이전트 E와 병렬 시작 (Mock API 사용)
5. 에이전트 E 완료 후 에이전트 F, G 시작
6. 에이전트 F 완료 후 에이전트 C 백엔드 연결
7. 에이전트 G 완료 후 에이전트 D 백엔드 연결
```

---

## 에이전트별 담당 요약표

| 에이전트 | 담당 TASK | 영역 | 산출물 경로 |
|----------|-----------|------|------------|
| 팀 리더 | PRD.md | 공통 셋업 | 모노레포 구조, shared/types/ |
| A | TASK-01, 05 | 프론트 응시자 공통 | client/src/exam/pages/ |
| B | TASK-02, 03, 04 | 프론트 시험 영역 | client/src/exam/components/ |
| C | TASK-06, 07 | 프론트 어드민 | client/src/admin/ |
| D | TASK-08 | 프론트 출제모듈 | client/src/question-module/ |
| E | TASK-09, 10 | 백엔드 기반+인증+시험API | server/src/ (기반) |
| F | TASK-11 | 백엔드 어드민 API | server/src/modules/admin/ |
| G | TASK-12 | 백엔드 문제은행+WS | server/src/modules/question-module/ |
