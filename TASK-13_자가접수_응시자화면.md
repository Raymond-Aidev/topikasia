# TASK-13: 자가 접수 시스템 — 응시자 화면 구현

> 연관 PRD: REG-01~08
> 참고 화면: SCR-M01 ~ SCR-M08
> 연관 문서: [TASK-01 공통UI](./TASK-01_공통UI_로그인_대기.md) — 디자인 패턴 참고
> 우선순위: Phase 2

---

## 목적 및 범위

TOPIK IBT 시험에 응시자가 직접 회원가입 후 시험 일정을 조회하고 접수를 신청하는
**자가 접수 시스템**의 프론트엔드를 구현한다.

주요 흐름:
```
메인 랜딩 → 회원가입 → 이메일 인증 → 로그인 → 시험 일정 조회 → 접수 신청(4단계 위자드) → 접수 확인 → 접수 완료 → 마이페이지
```

---

## 1. 화면 목록

| 화면 ID | 화면명 | 파일 | 설명 |
|---------|--------|------|------|
| SCR-M01 | 메인 랜딩 | `LandingPage.tsx` | 시험 소개 + 일정 카드 + [접수하기] [로그인] |
| SCR-M02 | 회원가입 | `SignUpPage.tsx` | 이름·이메일·비밀번호·연락처 입력 |
| SCR-M03 | 이메일 인증 | `EmailVerifyPage.tsx` | 인증코드 6자리 입력 (3분 타이머) |
| SCR-M04 | 시험 일정 조회 | `ExamSchedulePage.tsx` | 날짜·장소·잔여석·마감일 목록 |
| SCR-M05 | 접수 신청 | `RegistrationFormPage.tsx` | 4-step wizard (핵심 화면) |
| SCR-M06 | 접수 확인 | `RegistrationConfirmPage.tsx` | 신청 내역 최종 확인 + 제출 |
| SCR-M07 | 접수 완료 | `RegistrationCompletePage.tsx` | 완료 안내 + 수험표 다운로드 |
| SCR-M08 | 마이페이지 | `MyPage.tsx` | 내 접수 내역 + 상태 조회 + 수험표 |

---

## 2. 공통 컴포넌트

### 2-1. RegistrationHeader

**위치**: 화면 최상단 고정
**배경색**: `#FFFFFF` (흰색, 하단 border)

```
[TOPIK 로고]    [사용자명 님]  [00:59:50 타이머] [연장] | [로그아웃] | [마이페이지] | [🌐 한국어 ▾]
```

Props:
```typescript
interface RegistrationHeaderProps {
  userName?: string;
  showTimer?: boolean;
  showUserMenu?: boolean;
}
```

### 2-2. StepIndicator

4단계 진행 표시기 (스크린샷 참고):
```
[홈] 시험접수  | STEP01 기본정보입력 단계 > STEP02 시험장 선택 > STEP03 정보 입력 > STEP04 접수 완료
```

- 현재 단계: 초록색 텍스트 + 강조
- 완료 단계: 초록색 체크
- 미완료: 회색

### 2-3. ExamSelectionPanel

우측 패널 "시험선택 내역":
```
┌─────────────────────────┐
│  시험선택 내역            │
│                         │
│  시험명 및 수준           │
│  2026 년도 제106회 토픽   │
│  TOPIK I                │
│                         │
│  ┌─────────────────┐    │
│  │   다음 단계로     │    │
│  └─────────────────┘    │
└─────────────────────────┘
```

---

## 3. 화면 상세 명세

### SCR-M01: 메인 랜딩 (LandingPage)

```
┌──────────────────────────────────────────────┐
│  RegistrationHeader (로고만, 비로그인 상태)     │
├──────────────────────────────────────────────┤
│                                              │
│       한국어능력시험 TOPIK IBT                 │
│       온라인 시험 접수 시스템                   │
│                                              │
│   ┌───────────┐  ┌───────────┐               │
│   │  접수하기   │  │  로그인    │               │
│   └───────────┘  └───────────┘               │
│                                              │
│   ── 진행 중인 시험 일정 ──                    │
│   ┌──────────────────────────┐               │
│   │ 제106회 TOPIK             │               │
│   │ 시험일: 2026-05-15        │               │
│   │ 접수마감: 2026-04-15      │               │
│   │ [접수하기]                │               │
│   └──────────────────────────┘               │
└──────────────────────────────────────────────┘
```

API: `GET /api/registration/schedules` (공개, 인증 불필요)

### SCR-M02: 회원가입 (SignUpPage)

```
┌──────────────────────────────────────┐
│         TOPIK IBT 회원가입            │
│                                      │
│    이름       [___________________]  │
│    이메일     [___________________]  │
│    비밀번호   [___________________]  │
│    비밀번호확인[___________________]  │
│    연락처     [___________________]  │
│                                      │
│    □ 개인정보 수집·이용 동의           │
│                                      │
│         [   가입하기   ]              │
│                                      │
│    이미 계정이 있으신가요? [로그인]     │
└──────────────────────────────────────┘
```

API: `POST /api/registration/signup`
Body: `{ name, email, password, phone }`

유효성 검사:
- 이메일: 형식 검증
- 비밀번호: 8자 이상, 영문+숫자+특수문자
- 비밀번호 확인: 일치 여부
- 연락처: 숫자만 허용

### SCR-M03: 이메일 인증 (EmailVerifyPage)

```
┌──────────────────────────────────────┐
│         이메일 인증                    │
│                                      │
│   example@email.com 으로              │
│   인증 코드를 발송했습니다.            │
│                                      │
│   인증코드  [_ _ _ _ _ _]            │
│                                      │
│        남은 시간: 02:59               │
│                                      │
│     [   인증 확인   ]                │
│     [재전송] (30초 후 활성화)          │
└──────────────────────────────────────┘
```

API: `POST /api/registration/verify-email`
Body: `{ email, code }`

타이머: 3분 카운트다운, 만료 시 재전송 유도

### SCR-M04: 시험 일정 조회 (ExamSchedulePage)

```
┌──────────────────────────────────────────────────────────────┐
│  RegistrationHeader (로그인 상태)                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│   시험 일정 조회                                              │
│                                                              │
│   ┌────────┬──────────┬──────────┬────────┬────────┬───────┐│
│   │ 회차    │ 시험유형  │ 시험일    │ 장소   │ 잔여석  │ 상태  ││
│   ├────────┼──────────┼──────────┼────────┼────────┼───────┤│
│   │ 제106회 │ TOPIK I  │ 05-15    │ 서울   │ 45/100 │ 접수중 ││
│   │ 제106회 │ TOPIK II │ 05-16    │ 서울   │ 30/100 │ 접수중 ││
│   │ 제107회 │ TOPIK I  │ 07-20    │ 부산   │ -      │ 예정  ││
│   └────────┴──────────┴──────────┴────────┴────────┴───────┘│
│                                                              │
│   [접수하기] ← 행 선택 후 활성화                               │
└──────────────────────────────────────────────────────────────┘
```

API: `GET /api/registration/schedules`

### SCR-M05: 접수 신청 — 4-Step Wizard (RegistrationFormPage)

**핵심 화면** — 스크린샷 기반 구현

#### Step 1: 기본정보 입력

```
┌─────────────────────────────────────────────────────────────────────┐
│  [StepIndicator: STEP01 활성]                                        │
├───────────────────────────────────────────┬─────────────────────────┤
│                                           │  시험선택 내역            │
│  기본정보 입력  * 표시는 필수 항목입니다.     │                         │
│                                           │  시험명 및 수준           │
│  영문 성명 *  [____________________]      │  2026 년도 제106회 토픽   │
│                                           │  TOPIK I                │
│  생년월일 *   [1971 ▾] [7 ▾] [06 ▾]      │                         │
│                                           │  ┌─────────────────┐    │
│  성별 *       [■ 남자] [□ 여자]           │  │   다음 단계로     │    │
│                                           │  └─────────────────┘    │
│  ⚠ 주의사항 (빨간색 텍스트):                │                         │
│  1. 영문 성명은 여권, 외국인등록증 등...     │                         │
│  2. 한국어능력시험 원서접수 시 작성한...      │                         │
│  3. 매크로 프로그램을 사용하여...            │                         │
│                                           │                         │
│  ☑ 위 내용에 동의합니다                     │                         │
└───────────────────────────────────────────┴─────────────────────────┘
```

#### Step 2: 시험장 선택

```
┌───────────────────────────────────────────┬─────────────────────────┐
│  [StepIndicator: STEP02 활성]              │  시험선택 내역            │
│                                           │                         │
│  시험장 선택                               │  시험명 및 수준           │
│                                           │  2026 년도 제106회 토픽   │
│  지역 선택  [서울 ▾]                       │  TOPIK I                │
│                                           │                         │
│  ┌──────────────┬────────┬────────┐      │  시험장: 서울 제1시험장   │
│  │ 시험장        │ 잔여석  │ 선택   │      │                         │
│  ├──────────────┼────────┼────────┤      │  ┌─────────────────┐    │
│  │ 서울 제1시험장 │ 45/100 │ [선택] │      │  │   다음 단계로     │    │
│  │ 서울 제2시험장 │ 30/80  │ [선택] │      │  └─────────────────┘    │
│  └──────────────┴────────┴────────┘      │                         │
└───────────────────────────────────────────┴─────────────────────────┘
```

#### Step 3: 정보 입력

```
┌───────────────────────────────────────────┬─────────────────────────┐
│  [StepIndicator: STEP03 활성]              │  시험선택 내역            │
│                                           │                         │
│  추가 정보 입력                             │                         │
│                                           │                         │
│  연락처 *     [___________________]       │                         │
│  주소 *       [___________________]       │                         │
│  국적 *       [대한민국 ▾]                 │                         │
│  한국어 학습기간 [1년 ▾]                   │                         │
│                                           │                         │
│  사진 업로드 (3×4cm)                       │                         │
│  ┌──────────┐                             │                         │
│  │  [사진]   │  [파일 선택]                │                         │
│  │  미리보기  │                             │  ┌─────────────────┐    │
│  └──────────┘                             │  │   다음 단계로     │    │
│                                           │  └─────────────────┘    │
└───────────────────────────────────────────┴─────────────────────────┘
```

#### Step 4: 접수 완료 확인

```
┌───────────────────────────────────────────┬─────────────────────────┐
│  [StepIndicator: STEP04 활성]              │  시험선택 내역            │
│                                           │                         │
│  입력 내용 확인                             │                         │
│                                           │                         │
│  영문 성명: JAEJOON PARK                  │                         │
│  생년월일: 1971-07-06                      │                         │
│  성별: 남자                                │                         │
│  시험장: 서울 제1시험장                      │                         │
│  연락처: 010-1234-5678                     │                         │
│  주소: 서울시 강남구...                      │                         │
│  국적: 대한민국                             │                         │
│                                           │                         │
│     ┌───────────────┐                     │  ┌─────────────────┐    │
│     │   접수하기      │                     │  │   접수하기       │    │
│     └───────────────┘                     │  └─────────────────┘    │
└───────────────────────────────────────────┴─────────────────────────┘
```

### SCR-M06: 접수 확인 (RegistrationConfirmPage)

접수 신청 직후 최종 확인 화면:
- 전체 입력 정보 요약
- [수정하기] → Step 1로 되돌아가기
- [최종 제출] → POST /api/registration/apply

API: `POST /api/registration/apply`

### SCR-M07: 접수 완료 (RegistrationCompletePage)

```
┌──────────────────────────────────────┐
│                                      │
│          ✓ 접수가 완료되었습니다.       │
│                                      │
│   접수번호: REG-2026-001234          │
│   시험: 제106회 TOPIK I              │
│   시험일: 2026-05-15                 │
│   시험장: 서울 제1시험장              │
│                                      │
│   [수험표 다운로드]  [마이페이지]       │
└──────────────────────────────────────┘
```

### SCR-M08: 마이페이지 (MyPage)

```
┌──────────────────────────────────────────────────────────────┐
│  RegistrationHeader                                          │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  내 접수 내역                                                 │
│                                                              │
│  ┌────────┬──────────┬──────────┬────────┬─────────────────┐│
│  │ 접수번호 │ 시험      │ 시험일   │ 시험장  │ 상태            ││
│  ├────────┼──────────┼──────────┼────────┼─────────────────┤│
│  │ REG-001│ TOPIK I  │ 05-15    │ 서울   │ 접수완료 [수험표] ││
│  │ REG-002│ TOPIK II │ 05-16    │ 서울   │ 접수대기         ││
│  └────────┴──────────┴──────────┴────────┴─────────────────┘│
│                                                              │
│  [새 시험 접수하기]                                            │
└──────────────────────────────────────────────────────────────┘
```

API:
- `GET /api/registration/my` — 내 접수 목록
- `GET /api/registration/my/:id` — 접수 상세

---

## 4. 데이터 모델

```typescript
// 시험 일정
interface ExamSchedule {
  id: string;
  examNumber: number;          // 회차 (e.g., 106)
  examName: string;            // "제106회 TOPIK"
  examType: 'TOPIK_I' | 'TOPIK_II';
  examDate: string;            // ISO 날짜
  registrationStartDate: string;
  registrationEndDate: string;
  venues: ExamVenue[];
  status: 'UPCOMING' | 'OPEN' | 'CLOSED' | 'COMPLETED';
}

// 시험장
interface ExamVenue {
  id: string;
  name: string;
  region: string;
  address: string;
  capacity: number;
  remainingSeats: number;
}

// 접수 신청
interface Registration {
  id: string;
  registrationNumber: string;  // REG-2026-XXXXXX
  userId: string;
  scheduleId: string;
  venueId: string;

  // Step 1: 기본정보
  englishName: string;
  birthYear: number;
  birthMonth: number;
  birthDay: number;
  gender: 'MALE' | 'FEMALE';

  // Step 3: 추가정보
  phone: string;
  address: string;
  nationality: string;
  studyPeriod: string;
  photoUrl: string | null;

  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
}

// 접수자 사용자
interface RegistrationUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  isEmailVerified: boolean;
}
```

---

## 5. API 엔드포인트

| Method | Path | 설명 | 인증 |
|--------|------|------|------|
| POST | `/api/registration/signup` | 회원가입 | 없음 |
| POST | `/api/registration/verify-email` | 이메일 인증 | 없음 |
| POST | `/api/registration/login` | 로그인 | 없음 |
| GET | `/api/registration/schedules` | 시험 일정 목록 | 없음 |
| GET | `/api/registration/schedules/:id/venues` | 시험장 목록 | 토큰 |
| POST | `/api/registration/apply` | 접수 신청 | 토큰 |
| GET | `/api/registration/my` | 내 접수 목록 | 토큰 |
| GET | `/api/registration/my/:id` | 접수 상세 | 토큰 |
| GET | `/api/registration/my/:id/ticket` | 수험표 PDF | 토큰 |

---

## 6. Zustand Store (registrationStore)

```typescript
interface RegistrationState {
  // 사용자
  user: RegistrationUser | null;
  isLoggedIn: boolean;

  // 시험 일정
  schedules: ExamSchedule[];
  selectedSchedule: ExamSchedule | null;

  // 접수 Wizard
  currentStep: number; // 1~4
  formData: {
    englishName: string;
    birthYear: number;
    birthMonth: number;
    birthDay: number;
    gender: 'MALE' | 'FEMALE' | '';
    venueId: string;
    venueName: string;
    phone: string;
    address: string;
    nationality: string;
    studyPeriod: string;
    photoFile: File | null;
    photoPreview: string;
    agreedToTerms: boolean;
  };

  // 내 접수
  myRegistrations: Registration[];
  currentRegistration: Registration | null;

  // 액션
  setUser: (u: RegistrationUser | null) => void;
  setLoggedIn: (v: boolean) => void;
  setSchedules: (s: ExamSchedule[]) => void;
  selectSchedule: (s: ExamSchedule | null) => void;
  setCurrentStep: (step: number) => void;
  updateFormData: (data: Partial<RegistrationState['formData']>) => void;
  setMyRegistrations: (r: Registration[]) => void;
  setCurrentRegistration: (r: Registration | null) => void;
  resetForm: () => void;
  reset: () => void;
}
```

---

## 7. 라우팅

```typescript
// App.tsx 추가 라우트
<Route path="/registration" element={<LandingPage />} />
<Route path="/registration/signup" element={<SignUpPage />} />
<Route path="/registration/verify-email" element={<EmailVerifyPage />} />
<Route path="/registration/login" element={<RegistrationLoginPage />} />
<Route path="/registration/schedules" element={<ExamSchedulePage />} />
<Route path="/registration/apply" element={<RegistrationFormPage />} />
<Route path="/registration/confirm" element={<RegistrationConfirmPage />} />
<Route path="/registration/complete" element={<RegistrationCompletePage />} />
<Route path="/registration/mypage" element={<MyPage />} />
```

---

## 8. 파일 구조

```
client/src/registration/
├── api/
│   └── registrationApi.ts
├── types/
│   └── registration.types.ts
├── store/
│   └── registrationStore.ts
├── components/
│   ├── RegistrationHeader.tsx
│   ├── StepIndicator.tsx
│   └── ExamSelectionPanel.tsx
└── pages/
    ├── LandingPage.tsx          (SCR-M01)
    ├── SignUpPage.tsx            (SCR-M02)
    ├── EmailVerifyPage.tsx       (SCR-M03)
    ├── ExamSchedulePage.tsx      (SCR-M04)
    ├── RegistrationFormPage.tsx  (SCR-M05)
    ├── RegistrationConfirmPage.tsx (SCR-M06)
    ├── RegistrationCompletePage.tsx (SCR-M07)
    └── MyPage.tsx               (SCR-M08)
```

---

## 9. 스타일 컨벤션

- 인라인 스타일 사용 (CSS 파일 없음)
- Primary: `#1565C0`, Green: `#4CAF50`, Red: `#C62828`
- 폰트: `sans-serif`
- 카드 그림자: `0 1px 4px rgba(0,0,0,0.08)`
- 테두리 반경: 8~16px
- 활성 스텝: `#4CAF50` (초록), 비활성: `#9E9E9E` (회색)

---

## 10. Acceptance Criteria

- [ ] SCR-M01: 랜딩 페이지에서 시험 일정 카드 표시 및 접수하기/로그인 버튼 동작
- [ ] SCR-M02: 회원가입 폼 유효성 검사 및 API 호출
- [ ] SCR-M03: 이메일 인증코드 6자리 입력 + 3분 타이머 + 재전송
- [ ] SCR-M04: 시험 일정 목록 조회 및 선택
- [ ] SCR-M05 Step1: 영문 성명, 생년월일(드롭다운), 성별(토글) 입력 + 주의사항 동의
- [ ] SCR-M05 Step2: 지역 선택 → 시험장 목록 표시 → 잔여석 확인 → 선택
- [ ] SCR-M05 Step3: 추가 정보 입력 + 사진 업로드 (3×4cm 미리보기)
- [ ] SCR-M05 Step4: 전체 입력 내용 확인
- [ ] SCR-M06: 최종 확인 후 제출
- [ ] SCR-M07: 접수 완료 안내 + 수험표 다운로드 버튼
- [ ] SCR-M08: 내 접수 내역 목록 + 상태 표시 + 수험표 다운로드
- [ ] StepIndicator: 4단계 진행 표시기, 현재/완료/미완료 상태 구분
- [ ] ExamSelectionPanel: 우측 시험선택 내역 패널 + 다음 단계 버튼
- [ ] RegistrationHeader: TOPIK 로고 + 사용자명 + 타이머 + 로그아웃/마이페이지/언어 선택
- [ ] registrationStore: Zustand 상태 관리 정상 동작
- [ ] registrationApi: axios 인스턴스 + 토큰 인터셉터
- [ ] App.tsx: 접수 관련 라우트 9개 추가

---

## ✅ 구현 현황

### 완료된 항목
(구현 후 업데이트)

### 미완료 항목
- [ ] 전체 구현 예정
