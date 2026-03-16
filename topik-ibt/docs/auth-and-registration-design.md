# 인증 및 접수 시스템 설계 문서

> 최종 업데이트: 2026-03-15

## 1. 계정 체계 (3-Tier)

시스템에는 세 가지 독립된 계정 유형이 존재한다.

| 계정 유형 | 테이블 | 용도 | 인증 방식 |
|-----------|--------|------|-----------|
| **AdminUser** | `AdminUser` | 관리자 (시스템 운영) | email + password, `ADMIN_JWT_SECRET` |
| **RegistrationUser** | `RegistrationUser` | 사이트 회원 (접수자) | email + password, `JWT_SECRET` |
| **Examinee** | `Examinee` | 응시자 (시험 입장) | 수험번호(6자리), `JWT_SECRET` |

### 계정 간 관계

```
RegistrationUser (사이트 회원)
    │
    ├── Registration (접수) ──[승인]──→ Examinee (응시자) 자동 생성
    │     status: PENDING → APPROVED        loginId: 260001 (순차)
    │                                       passwordHash: 'NO_PASSWORD'
    └── Registration (접수 2)
          status: PENDING → APPROVED    → Examinee (응시자 2)
                                            loginId: 260002
```

- **1:N**: RegistrationUser → Registration (한 회원이 여러 시험 접수 가능)
- **1:1**: Registration → Examinee (승인 시 생성, `Registration.examineeId`로 연결)
- **독립**: AdminUser는 다른 계정과 직접 연결 없음

---

## 2. 수험번호 체계

### 발급 규칙
- PostgreSQL SEQUENCE `examinee_number_seq` 사용 (START 260001)
- 승인(approve) 트랜잭션 내에서 `nextval()` 호출 → 원자적, 중복 불가
- `loginId = registrationNumber = 순차 번호` (예: 260001, 260002, ...)

### 수험번호 용도
| 용도 | 필드 | 설명 |
|------|------|------|
| 시험 로그인 | `Examinee.loginId` | 6자리 숫자, 비밀번호 없음 |
| 수험표 표시 | `Examinee.registrationNumber` | 동일 값 |
| MyPage 표시 | `Registration → Examinee.loginId` JOIN | 승인 전에는 UUID 앞 8자 fallback |

### 시퀀스 SQL
```sql
-- prisma/sql/009_add_examinee_number_sequence.sql
CREATE SEQUENCE IF NOT EXISTS examinee_number_seq START 260001;
```

---

## 3. 인증 흐름

### 3-1. 사이트 로그인 (RegistrationUser)

```
[클라이언트]                    [서버]
  POST /api/registration/login
  { email, password }
         ──────────────────→  email로 RegistrationUser 조회
                              bcrypt.compare(password, passwordHash)
                              signRegistrationToken({ sub: userId, role: 'registration' })
         ←──────────────────  { token, user }

  localStorage.setItem('registrationToken', token)
  registrationApi: Authorization: Bearer {registrationToken}
```

**토큰 만료**: 24시간 (`signRegistrationToken` 하드코딩)
**401 처리**: localStorage 토큰 삭제 + Zustand 상태 초기화 + `/registration/login` 리다이렉트

### 3-2. 시험 로그인 (Examinee)

```
[클라이언트]                    [서버]
  POST /api/exam-auth/login
  { loginId: "260001" }
         ──────────────────→  loginId로 Examinee 조회
                              passwordHash === 'NO_PASSWORD' → 비밀번호 검증 skip
                              status 확인 (LOCKED → 423, INACTIVE → 403)
                              signExamineeToken({ sub: examineeId, loginId, role: 'examinee' })
         ←──────────────────  { token, examinee }

  localStorage.setItem('examToken', token)
  examApi: Authorization: Bearer {examToken || registrationToken}
```

**토큰 만료**: `JWT_EXPIRES_IN` 환경변수 (기본 8h)
**Passwordless**: 승인 시 생성된 Examinee는 `passwordHash = 'NO_PASSWORD'`
**하위호환**: 기존 Examinee (비밀번호 있는 경우)는 password 검증 유지

### 3-3. 어드민 로그인 (AdminUser)

```
  POST /api/admin/login → ADMIN_JWT_SECRET으로 별도 서명
  localStorage.setItem('adminToken', token)
  adminApi: Authorization: Bearer {adminToken}
```

**토큰 만료**: `ADMIN_JWT_EXPIRES_IN` (기본 4h)
**별도 시크릿**: `ADMIN_JWT_SECRET` (JWT_SECRET과 분리됨)

---

## 4. 접수 → 응시 전체 플로우

### 플로우 A: 공개 접수 (사용자 주도)

```
1. 회원가입        POST /api/registration/signup
                   └→ RegistrationUser 생성 (이메일 인증 필요)

2. 사이트 로그인    POST /api/registration/login
                   └→ registrationToken 발급

3. 시험 일정 조회   GET /api/registration/schedules
                   └→ OPEN 상태 ExamSchedule 목록

4. 접수 신청        POST /api/registration/apply
                   └→ Registration 생성 (status: PENDING)
                   └→ ExamSchedule.currentCount++

5. 관리자 승인      PUT /api/admin/registrations/:id/approve
                   └→ nextval('examinee_number_seq') → 260001
                   └→ Examinee 생성 (loginId: 260001, NO_PASSWORD)
                   └→ Registration.status → APPROVED
                   └→ Registration.examineeId 연결

6. 내 접수 확인     GET /api/registration/my
                   └→ MyPage에서 수험번호(260001) 확인
                   └→ 수험표 PDF 다운로드 가능

7. 시험 입장        POST /api/exam-auth/login { loginId: "260001" }
                   └→ examToken 발급
                   └→ 시험 세션 시작
```

### 플로우 B: 관리자 시험 발행 (관리자 주도)

```
1. 회원 등록        POST /api/admin/members (단건)
                   POST /api/admin/members/bulk-import (엑셀)
                   └→ RegistrationUser 생성 (isVerified: true)

2. 시험 발행        POST /api/admin/exam-sets/:id/launch
                   └→ ExamSchedule 생성 (시작/종료 시각 설정)
                   └→ 선택된 회원별:
                       ├→ nextval('examinee_number_seq') → 수험번호
                       ├→ Examinee 생성 (loginId=수험번호, assignedExamSetId 설정)
                       └→ Registration 생성 (status=APPROVED, examineeId 연결)

3. 수험번호 안내    발행 결과 화면에서 회원별 수험번호 확인
                   └→ 관리자가 응시자에게 수험번호 안내

4. 시험 입장        POST /api/exam-auth/login { loginId: "260003" }
                   └→ examToken 발급
                   └→ 시험 세션 시작
```

**두 플로우는 독립적이며, `Registration @@unique([userId, scheduleId])`로 중복 방지됨.**

### 접수 상태 전이

```
           ┌──── 사용자 취소 ────→ CANCELLED
           │
PENDING ───┤──── 관리자 승인 ────→ APPROVED ──→ (시험 응시 가능)
           │
           └──── 관리자 반려 ────→ REJECTED

* PENDING, REJECTED, CANCELLED: 관리자 삭제 가능
* APPROVED: 시험 이력 없을 때만 삭제 가능 (Examinee도 함께 삭제)
* PENDING: 사용자 직접 취소 가능
```

---

## 5. JWT 토큰 분리 현황

| 토큰 | Secret | 미들웨어 | role 필드 |
|------|--------|----------|-----------|
| adminToken | `ADMIN_JWT_SECRET` | `adminAuth` | `admin` |
| registrationToken | `JWT_SECRET` | `registrationAuth` | `registration` |
| examToken | `JWT_SECRET` | `examAuth` | `examinee` |

### 알려진 설계 이슈

> **이슈 #1: registrationToken과 examToken이 동일한 JWT_SECRET 사용**
>
> 두 토큰 모두 `JWT_SECRET`으로 서명되므로, 서명 검증만으로는 토큰 유형을 구분할 수 없다.
> 현재 `verifyRegistrationToken()`과 `verifyExamineeToken()`에서 `role` 필드를 확인하여 구분하고 있으나,
> 별도의 시크릿(`EXAM_JWT_SECRET`)을 사용하는 것이 더 안전하다.
>
> **현재 위험도**: 중간 (role 체크가 존재하므로 즉시 악용 불가)
> **권장 조치**: Phase 2에서 `EXAM_JWT_SECRET` 분리

> **이슈 #2: examAuth 미들웨어에서 registrationToken → examinee 변환 시 loginId 누락**
>
> `auth.middleware.ts`의 `examAuth`에서 registrationToken을 examinee로 변환할 때,
> `req.examinee.loginId`가 빈 문자열로 설정된다.
> 현재 downstream 코드에서 `loginId`를 직접 사용하는 곳은 없으나, 향후 문제가 될 수 있다.
>
> **현재 위험도**: 낮음
> **권장 조치**: Examinee 조회 시 loginId도 함께 가져오도록 수정

> **이슈 #3: NO_PASSWORD 매직 스트링**
>
> 비밀번호 없는 응시자를 `passwordHash = 'NO_PASSWORD'` 문자열로 구분한다.
> DB 무결성 관점에서 boolean 필드(`isPasswordless`)가 더 안전하지만,
> 현재 시스템에서는 Examinee 생성을 코드로만 제어하므로 실질적 위험은 낮다.
>
> **현재 위험도**: 낮음
> **권장 조치**: 스키마 마이그레이션 시 boolean 필드 추가 검토

---

## 6. API 엔드포인트 정리

### 접수 (Registration) — registrationToken 필요
| Method | Path | 설명 |
|--------|------|------|
| POST | `/api/registration/signup` | 회원가입 |
| POST | `/api/registration/login` | 사이트 로그인 |
| GET | `/api/registration/schedules` | 시험 일정 조회 |
| GET | `/api/registration/check-eligibility` | 응시 자격 확인 |
| POST | `/api/registration/apply` | 접수 신청 |
| GET | `/api/registration/my` | 내 접수 목록 |
| GET | `/api/registration/my/:id` | 접수 상세 |
| GET | `/api/registration/my/:id/ticket` | 수험표 PDF |
| DELETE | `/api/registration/my/:id` | 접수 취소 (PENDING만) |

### 시험 (Exam) — examToken 필요
| Method | Path | 설명 |
|--------|------|------|
| POST | `/api/exam-auth/login` | 시험 로그인 (수험번호) |
| GET | `/api/exam-auth/me` | 현재 응시자 정보 |

### 어드민 (Admin) — adminToken 필요

#### 접수 관리
| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/admin/registrations` | 접수 목록 |
| POST/PUT | `/api/admin/registrations/:id/approve` | 접수 승인 |
| POST/PUT | `/api/admin/registrations/:id/reject` | 접수 반려 |
| POST | `/api/admin/registrations/batch-approve` | 일괄 승인 |
| DELETE | `/api/admin/registrations/:id` | 접수 삭제 (APPROVED 시 Examinee 연쇄 삭제) |

#### 회원 관리 (RegistrationUser)
| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/admin/members` | 회원 목록 (검색, 페이지네이션) |
| POST | `/api/admin/members` | 회원 단건 등록 (isVerified: true) |
| POST | `/api/admin/members/bulk-import` | 엑셀 일괄 등록 (name, email, password, phone) |
| DELETE | `/api/admin/members/:id` | 회원 삭제 (접수 이력 있으면 차단) |

#### 시험세트 · 시험 발행
| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/admin/exam-sets` | 시험세트 목록 |
| GET | `/api/admin/exam-sets/:id` | 시험세트 상세 |
| PATCH | `/api/admin/exam-sets/:id/schedule` | 시험세트 일정 설정 |
| POST | `/api/admin/exam-sets/:id/launch` | 시험 발행 (ExamSchedule + Examinee + Registration 원자적 생성) |

---

## 7. 데이터베이스 관계도

```
AdminUser
    │
    └──[createdById]──→ Examinee ──→ ExamSession ──→ Answer
                           │              │              Score
                           │              └──→ QuestionExplanation
                           │
                           └──→ Score, LmsAnalysis

RegistrationUser ──[userId]──→ Registration ──[examineeId]──→ Examinee
                                    │
                                    └──[scheduleId]──→ ExamSchedule ──[examSetId]──→ ExamSet

제약조건:
- Registration @@unique([userId, scheduleId]) — 동일 시험 중복 접수 방지
- Examinee.loginId @unique — 수험번호 유일성
- Examinee.registrationNumber @unique — 수험번호 유일성
- Registration → RegistrationUser: onDelete Restrict
- Registration → ExamSchedule: onDelete Restrict
```

---

## 8. 변경 이력

| 날짜 | 변경 내용 |
|------|-----------|
| 2026-03-15 | 문서 최초 작성 |
| 2026-03-15 | 순차 수험번호 시스템 (260001+) 반영 |
| 2026-03-15 | Passwordless 시험 로그인 반영 |
| 2026-03-15 | 접수 취소/삭제 기능 반영 |
| 2026-03-15 | 수험표 PDF에 Examinee No. 행 추가 반영 |
| 2026-03-15 | 설계 이슈 3건 문서화 (#1 JWT Secret 공유, #2 loginId 누락, #3 NO_PASSWORD) |
| 2026-03-15 | 플로우 B (관리자 시험 발행) 추가 — 회원 등록 → 시험 발행 → 수험번호 발급 |
| 2026-03-15 | 어드민 API 확장: 회원 관리 CRUD, 엑셀 일괄 등록, 시험 발행 엔드포인트 |
| 2026-03-15 | 어드민 네비게이션 구조 변경: 회원관리 탭 신설, 기존 회원관리→응시자관리 명칭 변경 |
