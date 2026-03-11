# TASK-06: 어드민 — 회원 관리 및 시험세트 배정

> 연관 PRD: ADMIN-01~10, AUTH-01~06, QUESTION-09~11, QUESTION-16~17
> 참고 화면: SCR-A01, SCR-A02, SCR-A03, SCR-A04, SCR-A05, SCR-A06
> 연관 문서: [TASK-08 문제 출제 모듈](./TASK-08_문제출제모듈.md) · [TASK-07 운영모니터링](./TASK-07_어드민_운영모니터링.md)
> 우선순위: Phase 1 (MVP 필수)

---

## 목표

어드민이 응시자 계정을 직접 생성하고, 각 계정에 응시할 시험세트 1개를 배정하는 기능을 구현한다.
응시자는 로그인 후 배정된 시험세트 1개만 확인하고 응시할 수 있다.

---

## 1. 전체 운영 흐름

```
[어드민]
  1. 어드민 로그인 (SCR-A01)
  2. 문제 출제 모듈에서 문제은행 Import → 세트 구성 → IBT 업로드 완료
     → 업로드 시 세트 상태 ACTIVE 전환 (→ TASK-08 SCR-Q07 참조)
  3. 회원 생성 화면에서 응시자 계정 생성 + 시험세트 배정 (SCR-A04)
  4. 응시자에게 ID·비밀번호 전달

[응시자]
  1. 로그인 (SCR-01)
  2. 배정된 시험세트 1개 확인 + 선택 (SCR-03)
  3. 시험 시작
```

---

## 2. 어드민 로그인 (SCR-A01)

### UI 명세
```
┌──────────────────────────────────────────┐
│         TOPIK IBT 관리자 시스템           │
│                                          │
│   관리자 ID  [_______________________]   │
│   비밀번호   [_______________________]   │
│                                          │
│           [      로그인      ]            │
└──────────────────────────────────────────┘
```

### 구현 요구사항
- 응시자 로그인과 완전히 분리된 별도 URL (`/admin/login`)
- 어드민 전용 JWT 토큰 (role: ADMIN / SUPER_ADMIN / PROCTOR)
- 로그인 실패 5회 잠금
- 세션 만료: 4시간 (응시자 세션과 별도)

### API
```
POST /api/admin-auth/login
Body: { loginId: string, password: string }
Response: { token: string, adminInfo: { id, name, role } }
```

---

## 3. 어드민 대시보드 (SCR-A02)

### UI 명세
```
┌─────────────────────────────────────────────────────────────────┐
│  TOPIK IBT 관리자  │  대시보드  회원관리  시험세트  응시내역  │  로그아웃  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ 전체 회원 │  │ 응시 완료 │  │ 진행 중  │  │ 미응시   │       │
│  │   150명  │  │   87명   │  │   12명   │  │   51명   │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
│                                                                 │
│  [시험세트별 현황 테이블]              [오늘 응시 현황 그래프]  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 컴포넌트: AdminDashboard
- 상단 GNB: 대시보드 / 회원관리 / 시험세트 / 응시내역 탭 네비게이션
- 4개 요약 카드: 전체 회원 수, 응시 완료, 진행 중, 미응시
- 시험세트별 현황 테이블 (세트명 / 배정 인원 / 완료 / 진행 중 / 미응시)
- 30초마다 자동 갱신 (polling 또는 WebSocket)

---

## 4. 회원 목록 (SCR-A03)

### UI 명세
```
┌─────────────────────────────────────────────────────────────────┐
│  회원 관리                              [+ 회원 생성] [일괄 등록]│
├──────────┬──────────────────────────────────────────────────────┤
│ 검색: [__________] 상태: [전체▼] 시험세트: [전체▼]  [검색]      │
├────┬─────────┬──────────┬──────────┬───────────┬───────┬───────┤
│ #  │  ID     │  성명    │  시험세트  │  응시상태  │ 생성일 │ 관리  │
├────┼─────────┼──────────┼──────────┼───────────┼───────┼───────┤
│  1 │ user001 │ 김영희   │ 세트A-001  │ 완료      │ 03-10 │ [편집]│
│  2 │ user002 │ 이민수   │ 세트B-002  │ 진행 중   │ 03-10 │ [편집]│
│  3 │ user003 │ TOPIK KIM│ 세트A-001  │ 미응시    │ 03-10 │ [편집]│
└────┴─────────┴──────────┴──────────┴───────────┴───────┴───────┘
│  총 150명  |  1 2 3 ... 15  (페이지네이션)                      │
└─────────────────────────────────────────────────────────────────┘
```

### 구현 요구사항
- 검색: ID, 성명 텍스트 검색
- 필터: 응시 상태 (전체/완료/진행 중/미응시/잠금), 시험세트
- 정렬: 생성일, 성명 (클릭 토글)
- 페이지네이션: 20명씩
- 응시 상태 배지 색상: 완료(녹색), 진행 중(파란색), 미응시(회색), 잠금(빨간색)

### API
```
GET /api/admin/examinees
Query: { page, limit, search, status, examSetId, sortBy, sortOrder }
Response: { data: Examinee[], total: number, page: number }
```

---

## 5. 회원 생성 (SCR-A04)

### UI 명세
```
┌──────────────────────────────────────────────────────────────┐
│  신규 회원 생성                                    [닫기 ×]  │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  계정 ID *    [___________________________________]          │
│               ※ 영문·숫자 조합, 6~20자                       │
│                                                              │
│  비밀번호 *   [___________________________________]          │
│               ※ 영문+숫자+특수문자, 8자 이상                  │
│                                                              │
│  성명 *       [___________________________________]          │
│                                                              │
│  수험번호 *   [___________________________________]          │
│               ※ 9자리 숫자, 중복 불가                         │
│                                                              │
│  좌석번호     [___]                                          │
│                                                              │
│  증명사진     [이미지 업로드 □]                              │
│                                                              │
│  기관명       [___________________________________]          │
│                                                              │
│  시험실       [___________________________________]          │
│                                                              │
│  배정 시험세트 * [______ 세트 선택 ▼ __________________]    │
│                  ※ 문제 출제 모듈에서 IBT 업로드(활성화)된    │
│                     세트만 표시 (→ TASK-08 SCR-Q07 연계)     │
│                  세트A-001: 2026년 1회 TOPIK II 세트A        │
│                  세트B-002: 2026년 1회 TOPIK I 세트B         │
│                                                              │
│                    [  취소  ]     [  생성  ]                  │
└──────────────────────────────────────────────────────────────┘
```

### 컴포넌트: ExamineeCreateModal
```typescript
interface ExamineeCreateForm {
  loginId: string;          // 계정 ID
  password: string;         // 초기 비밀번호
  name: string;             // 성명
  registrationNumber: string; // 수험번호 (9자리)
  seatNumber?: number;
  photoFile?: File;
  institutionName?: string;
  examRoomName?: string;
  assignedExamSetId: string; // 배정 시험세트 (필수)
}
```

### 유효성 검사 규칙
```typescript
const validationRules = {
  loginId: /^[a-zA-Z0-9]{6,20}$/,
  password: /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/,
  registrationNumber: /^\d{9}$/,
  name: (v: string) => v.trim().length >= 2,
  assignedExamSetId: (v: string) => v !== "",
};
```

### API
```
// 시험세트 드롭다운 목록은 TASK-08에서 업로드된 ACTIVE 세트만 조회
// GET /api/admin/exam-sets?status=ACTIVE (→ TASK-08 SCR-Q07 업로드 후 연동)

POST /api/admin/examinees
Body: FormData {
  loginId, password, name, registrationNumber,
  seatNumber, photo (file), institutionName,
  examRoomName, assignedExamSetId
}
Response: { examineeId: string, loginId: string }
```

---

## 6. 회원 상세 / 편집 (SCR-A05)

### 탭 구성
1. **기본 정보** — 계정 정보 수정, 비밀번호 초기화
2. **시험세트** — 배정 세트 변경
3. **응시 내역** — 해당 회원의 응시 로그

### 시험세트 변경
- 드롭다운으로 다른 세트 선택 가능
- 이미 응시가 완료된 경우 변경 불가 (경고 표시)
- 진행 중인 경우: "현재 응시 중입니다. 강제 변경 시 시험이 초기화됩니다." 확인 모달

### 비밀번호 초기화
```typescript
// 새 임시 비밀번호 자동 생성 후 표시 (관리자가 전달)
POST /api/admin/examinees/:id/reset-password
Response: { temporaryPassword: string }
// 초기화된 임시 비밀번호를 화면에 1회 표시 (복사 버튼 제공)
```

---

## 7. 응시자 화면 — 시험세트 선택 (SCR-03)

### UI 명세
```
┌──────────────────────────────────────────────────────────┐
│  001007155              TOPIK IBT              [로그아웃]  │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  [사진]  김영희 님, 응시할 시험을 선택하세요.              │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  ⬜ 세트 001 — 2026년 1회 TOPIK II 세트A          │  │
│  │     시험 유형: TOPIK II (듣기·쓰기·읽기)           │  │
│  │     총 시험 시간: 약 3시간                          │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│                  [  시험 시작  ]                          │
└──────────────────────────────────────────────────────────┘
```

### 구현 요구사항
- 로그인 후 서버에서 해당 응시자의 `assignedExamSetId`로 시험세트 정보 로드
- 항상 1개 세트만 표시 (복수 배정 없음)
- 세트 카드: 세트명, 시험 유형, 영역 구성, 총 시험 시간 표시
- [시험 시작] 버튼 클릭 → 시험 대기실(SCR-04)로 이동

### API
```
GET /api/exam/assigned-set
Headers: { Authorization: Bearer <examineeToken> }
Response: {
  examSetId: string,
  examSetNumber: string,
  name: string,
  examType: "TOPIK_I" | "TOPIK_II",
  sections: { section: string, durationMinutes: number }[],
  totalDurationMinutes: number
}
```

---

## 8. 시험세트 관리 목록 (SCR-A06)

### UI 명세
```
┌─────────────────────────────────────────────────────────────────┐
│  시험세트 관리                                                   │
├────┬─────────────────────────┬──────────┬──────┬──────┬────────┤
│ #  │  세트명                 │  유형    │  상태 │배정수 │  관리  │
├────┼─────────────────────────┼──────────┼──────┼──────┼────────┤
│ 1  │ 2026년 1회 TOPIK II 세트A │ TOPIK II │ 활성 │  87  │ [상세] │
│ 2  │ 2026년 1회 TOPIK I 세트B  │ TOPIK I  │ 활성 │  63  │ [상세] │
│ 3  │ 테스트 세트 001          │ TOPIK II │ 초안 │   0  │ [상세] │
└────┴─────────────────────────┴──────────┴──────┴──────┴────────┘
```

- 상태 배지: 초안(회색), 업로드됨(파란색), 활성(녹색), 보관됨(회색)
- 배정수 클릭: 해당 세트 배정 회원 목록으로 이동
- 세트 상태는 TASK-08 문제 출제 모듈에서 IBT 업로드 시 자동 변경 (DRAFT → ACTIVE)

---


---

## ⚠️ ACID 상용서비스 구현 필수 항목

> 출처: `ACID_상용서비스_구현목록.md`
> 이 섹션의 항목은 상용 서비스 기준으로 **반드시 구현**해야 합니다.

---

### T3-05 | 시험세트 배정 드롭다운 — ACTIVE 세트만 표시 (C-04 UI)

**대상**: `client/src/admin/components/ExamineeDetailTab.tsx` (시험세트 배정 탭)

```typescript
// ✅ 배정 드롭다운은 반드시 /api/admin/exam-sets/assignable 호출
// (ACTIVE 상태 세트만 반환하는 전용 엔드포인트 — T3-05)
const { data: assignableSets } = useQuery({
  queryKey: ["assignable-exam-sets"],
  queryFn: () => adminApi.get("/exam-sets/assignable").then(r => r.data.sets),
});

// ❌ 잘못된 방법: 전체 세트 조회 후 클라이언트에서 필터링
// → 서버 측 ACTIVE 전용 API를 사용해야 DB 제약과 일치

return (
  <Select placeholder="배정할 시험세트 선택">
    {assignableSets?.map(set => (
      <Select.Option key={set.id} value={set.id}>
        [{set.examSetNumber}] {set.name} ({set.examType})
      </Select.Option>
    ))}
  </Select>
);
```

---

### T2-06 | 시험세트 변경 — 시험 중 차단 409 응답 처리 (신규 발굴 UI)

**대상**: `client/src/admin/components/ExamineeDetailTab.tsx` (시험세트 변경 버튼)

```typescript
// ✅ 세트 변경 시 409(시험 중) 응답을 명확한 UI로 처리
const handleChangeExamSet = async (newExamSetId: string) => {
  try {
    await adminApi.patch(`/examinees/${examineeId}/exam-set`, { newExamSetId });
    toast.success("시험세트가 변경되었습니다.");
    refetchExaminee();
  } catch (err: any) {
    if (err.response?.status === 409) {
      // ✅ 시험 중 변경 시도 → 명확한 안내 모달
      Modal.warning({
        title: "세트 변경 불가",
        content: "응시자가 현재 시험을 진행 중입니다. 시험 완료 후 변경하세요.",
        okText: "확인"
      });
    } else {
      toast.error("시험세트 변경 중 오류가 발생했습니다.");
    }
  }
};
```

## 9. 완료 조건 (Acceptance Criteria)

- [ ] 어드민 로그인 (응시자와 분리된 URL/토큰)
- [ ] 회원 생성 폼: 모든 필드 유효성 검사
- [ ] 회원 생성 시 시험세트 드롭다운: TASK-08 IBT 업로드 후 ACTIVE 상태 세트만 표시
- [ ] 문제 출제 모듈에서 새 세트 업로드 시 드롭다운 목록에 즉시 반영
- [ ] 회원 목록: 검색·필터·정렬·페이지네이션
- [ ] 회원 상세: 정보 수정, 비밀번호 초기화, 시험세트 변경
- [ ] 응시자 로그인 후 배정된 시험세트 1개만 표시
- [ ] 시험세트 없이 배정된 경우: "시험이 배정되지 않았습니다. 관리자에게 문의하세요." 표시
- [ ] 어드민 GNB 탭 네비게이션

---

## 10. 파일 구조

```
src/
├── admin/
│   ├── pages/
│   │   ├── AdminLoginPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── ExamineeListPage.tsx
│   │   ├── ExamineeDetailPage.tsx
│   │   └── ExamSetListPage.tsx
│   ├── components/
│   │   ├── ExamineeCreateModal.tsx
│   │   ├── ExamSetSelector.tsx
│   │   └── StatusBadge.tsx
│   └── api/
│       ├── adminAuthApi.ts
│       └── adminExamineeApi.ts
├── exam/
│   └── pages/
│       └── ExamSetSelectPage.tsx  // 응시자 화면
└── types/
    └── admin.types.ts
```

---

## 추가: 접수 관리 화면 (SCR-A09 ~ A11)

> PRD v2.1 자가접수 시스템 연계. TASK-14 백엔드 API와 연동.

### SCR-A09 접수 신청 목록
- 경로: `/admin/registrations`
- 기능: 자가 접수 신청자 목록 + 상태 필터 (전체/대기/승인/반려)
- 검색: 이름, 이메일, 수험번호
- 정렬: 신청일 기준 DESC
- API: `GET /api/admin/registrations?status=PENDING&page=1&size=20`

### SCR-A10 접수 처리
- 기능: 개별 신청 상세 보기 + 승인/반려 처리
- 승인 시: Examinee 계정 자동 생성 (수험번호, 로그인ID, 임시 비밀번호 발급)
- 반려 시: 반려 사유 입력 필수
- API: `POST /api/admin/registrations/:id/approve`, `POST /api/admin/registrations/:id/reject`

### SCR-A11 일괄 접수 처리
- 기능: 체크박스로 다수 선택 → [일괄 승인] 버튼
- 트랜잭션으로 처리, 하나라도 실패 시 전체 롤백
- API: `POST /api/admin/registrations/batch-approve`

### 작업 경로
- `client/src/admin/pages/RegistrationListPage.tsx` (SCR-A09)
- `client/src/admin/pages/RegistrationProcessPage.tsx` (SCR-A10 + A11)

### Phase
- Phase 2 (자가접수 시스템)

---

## ✅ 구현 현황 (2026-03-10 기준)

### 완료된 항목
- [x] 어드민 로그인 — POST /api/admin-auth/login, adminToken 저장 — `admin/pages/AdminLoginPage.tsx`
- [x] 어드민 GNB 레이아웃 — 탭 네비게이션, 로그아웃 — `admin/components/AdminLayout.tsx`
- [x] 회원 목록 — 검색/필터/페이지네이션 (20명/페이지) — `admin/pages/ExamineeListPage.tsx`
- [x] 응시 상태 배지 — 완료(녹)/진행(파)/미응시(회)/잠금(빨) — `admin/components/StatusBadge.tsx`
- [x] 회원 생성 모달 — 모든 필드 유효성 검사, FormData 사진 업로드, 409 중복 처리 — `admin/components/ExamineeCreateModal.tsx`
- [x] 회원 상세/편집 — 3탭 (기본정보/시험세트/응시내역), 비밀번호 초기화 — `admin/pages/ExamineeDetailPage.tsx`
- [x] 시험세트 배정 드롭다운 — ACTIVE 세트만 표시 (T3-05) — `admin/components/ExamSetSelector.tsx`
- [x] 시험세트 관리 목록 — 상태 배지, 배정수 표시 — `admin/pages/ExamSetListPage.tsx`
- [x] 응시자 시험세트 선택 화면 — 배정된 1개 세트 표시, 시험 시작 — `exam/pages/ExamSetSelectScreen.tsx`
- [x] T3-05: 배정 가능 세트 ACTIVE 필터 — `admin/components/ExamSetSelector.tsx`
- [x] T2-06: 시험 중 세트 변경 409 처리 — `admin/pages/ExamineeDetailPage.tsx`
- [x] T3-01: 회원 생성 중복 409 처리 — `admin/components/ExamineeCreateModal.tsx`

### 미완료 항목 (Phase 2)
- [ ] DashboardPage 요약 카드 통계 (TASK-07에서 구현됨, TASK-06 문서 SCR-A02 기준)
- [ ] adminAuthApi.ts 별도 API 모듈 분리
- [ ] adminExamineeApi.ts 별도 API 모듈 분리
- [ ] admin.types.ts 타입 정의 파일 분리
- [ ] ExamineeDetailTab.tsx 별도 컴포넌트 분리 (현재 ExamineeDetailPage 내부)

### 실제 파일 경로 (문서 vs 구현)
| 문서 경로 | 실제 경로 | 상태 |
|-----------|-----------|------|
| `admin/pages/AdminLoginPage.tsx` | `admin/pages/AdminLoginPage.tsx` | ✅ |
| `admin/pages/DashboardPage.tsx` | `admin/pages/DashboardPage.tsx` | ✅ |
| `admin/pages/ExamineeListPage.tsx` | `admin/pages/ExamineeListPage.tsx` | ✅ |
| `admin/pages/ExamineeDetailPage.tsx` | `admin/pages/ExamineeDetailPage.tsx` | ✅ |
| `admin/pages/ExamSetListPage.tsx` | `admin/pages/ExamSetListPage.tsx` | ✅ |
| `admin/components/ExamineeCreateModal.tsx` | `admin/components/ExamineeCreateModal.tsx` | ✅ |
| `admin/components/ExamSetSelector.tsx` | `admin/components/ExamSetSelector.tsx` | ✅ |
| `admin/components/StatusBadge.tsx` | `admin/components/StatusBadge.tsx` | ✅ |
| `admin/api/adminAuthApi.ts` | (미분리, 페이지 내 직접 호출) | ⏳ |
| `admin/api/adminExamineeApi.ts` | (미분리, 페이지 내 직접 호출) | ⏳ |
| `types/admin.types.ts` | (미분리) | ⏳ |
| `exam/pages/ExamSetSelectPage.tsx` | `exam/pages/ExamSetSelectScreen.tsx` | ✅ |

### 비고
- 문서에서 `ExamSetSelectPage.tsx`로 명시된 응시자 세트 선택 화면은 `ExamSetSelectScreen.tsx`로 네이밍 변경되어 구현
- AdminLayout.tsx는 문서 파일 구조에 명시되지 않았으나 GNB 네비게이션 요구사항에 따라 추가 구현
- adminAuthApi.ts, adminExamineeApi.ts, admin.types.ts는 별도 파일로 분리되지 않고 각 페이지에서 직접 API 호출 중
- ExamineeDetailTab.tsx(ACID 항목 대상)는 별도 파일 없이 ExamineeDetailPage.tsx 내부에 통합 구현
