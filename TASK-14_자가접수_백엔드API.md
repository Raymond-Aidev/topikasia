# TASK-14: 자가접수 백엔드 API

> 연관 PRD: REG-01~13
> 연관 문서: [TASK-09 백엔드 서버셋업·인증](./TASK-09_백엔드_서버셋업_인증.md) · [TASK-11 어드민API](./TASK-11_어드민API.md)
> 우선순위: Phase 2
> 선행 조건: TASK-09 완료

---

## 목적 및 범위

응시자가 스스로 회원가입 후 시험 일정을 확인하고 접수를 신청할 수 있는 **자가 접수 시스템**의 백엔드 API를 구현한다.
기존 어드민이 수동으로 응시자를 생성하는 방식과 병행하여, 접수자가 직접 회원가입 → 이메일 인증 → 시험 접수 → 어드민 승인의 흐름으로 응시자로 전환되는 파이프라인을 제공한다.

### 주요 흐름

1. 접수자 회원가입 + 이메일 인증
2. 접수자 로그인 (별도 JWT)
3. 시험 일정 조회
4. 접수 신청 (사진, 영문이름, 생년월일 등)
5. 어드민 승인 → Examinee 레코드 자동 생성
6. 접수자에게 수험번호/로그인 정보 부여

---

## 1. 데이터 모델

### 신규 테이블

#### RegistrationUser (접수 회원)
| 필드 | 타입 | 설명 |
|------|------|------|
| id | String (cuid) | PK |
| email | String (unique) | 로그인 이메일 |
| passwordHash | String | bcrypt 해시 |
| name | String | 이름 |
| phone | String? | 연락처 |
| isVerified | Boolean (default false) | 이메일 인증 여부 |
| verifyCode | String? | 6자리 인증코드 |
| verifyExpiry | DateTime? | 인증코드 만료시각 |
| createdAt | DateTime | 생성일 |
| updatedAt | DateTime | 수정일 |

#### ExamSchedule (시험 일정)
| 필드 | 타입 | 설명 |
|------|------|------|
| id | String (cuid) | PK |
| examName | String | 시험명 (예: 제93회 TOPIK) |
| examRound | Int | 회차 |
| examType | ExamType | TOPIK_I / TOPIK_II |
| examDate | DateTime | 시험일 |
| registrationStartAt | DateTime | 접수 시작일시 |
| registrationEndAt | DateTime | 접수 마감일시 |
| venues | Json | [{name, address, capacity, currentCount}] |
| maxCapacity | Int | 전체 정원 |
| currentCount | Int (default 0) | 현재 접수 인원 |
| status | ScheduleStatus | OPEN / CLOSED / FULL |
| createdAt | DateTime | 생성일 |
| updatedAt | DateTime | 수정일 |

#### Registration (접수 신청)
| 필드 | 타입 | 설명 |
|------|------|------|
| id | String (cuid) | PK |
| userId | String | FK → RegistrationUser |
| scheduleId | String | FK → ExamSchedule |
| examType | ExamType | TOPIK_I / TOPIK_II |
| englishName | String | 영문 이름 |
| birthDate | DateTime | 생년월일 |
| gender | Gender | MALE / FEMALE |
| photoUrl | String? | 증명사진 URL |
| venueId | String | 선택 시험장 ID (venues JSON 내) |
| venueName | String | 시험장 이름 |
| contactPhone | String? | 연락처 |
| address | String? | 주소 |
| status | RegistrationStatus | PENDING / APPROVED / REJECTED / CANCELLED |
| examineeId | String? | 승인 시 생성된 Examinee ID |
| rejectionNote | String? | 반려 사유 |
| approvedAt | DateTime? | 승인 일시 |
| approvedById | String? | 승인 어드민 ID |
| createdAt | DateTime | 생성일 |
| updatedAt | DateTime | 수정일 |
| @@unique | [userId, scheduleId] | 동일 일정 중복 접수 방지 |

### 신규 Enum
- `ScheduleStatus`: OPEN, CLOSED, FULL
- `Gender`: MALE, FEMALE
- `RegistrationStatus`: PENDING, APPROVED, REJECTED, CANCELLED

---

## 2. API 전체 목록

| 메서드 | 경로 | 설명 | 인증 |
|--------|------|------|------|
| POST | /api/registration/signup | 회원가입 | Public |
| POST | /api/registration/verify-email | 이메일 인증 | Public |
| POST | /api/registration/login | 접수자 로그인 | Public |
| GET | /api/registration/schedules | 시험 일정 목록 | Public |
| GET | /api/registration/schedules/:id | 시험 일정 상세 | Public |
| POST | /api/registration/apply | 접수 신청 | registrationAuth |
| GET | /api/registration/my | 내 접수 내역 | registrationAuth |
| GET | /api/registration/my/:id | 접수 상세 | registrationAuth |
| DELETE | /api/registration/my/:id | 접수 취소 | registrationAuth |
| GET | /api/admin/registrations | 접수 목록 (어드민) | adminAuth + ADMIN+ |
| POST | /api/admin/registrations/:id/approve | 접수 승인 | adminAuth + ADMIN+ |
| POST | /api/admin/registrations/:id/reject | 접수 반려 | adminAuth + ADMIN+ |
| POST | /api/admin/registrations/batch-approve | 일괄 승인 | adminAuth + ADMIN+ |

---

## 3. 회원가입

```
POST /api/registration/signup
```

**Request Body**
```json
{
  "email": "user@example.com",
  "password": "MySecure123!",
  "name": "홍길동",
  "phone": "010-1234-5678"
}
```

**Validation**
- email: 유효한 이메일 형식, unique
- password: 8자 이상
- name: 1자 이상

**Response 201**
```json
{
  "success": true,
  "message": "회원가입 완료. 이메일로 전송된 인증코드를 입력해주세요.",
  "data": { "userId": "cuid...", "email": "user@example.com" }
}
```

**로직**: bcrypt 해시(12 rounds), 6자리 숫자 인증코드 생성, 3분 만료, (실 배포 시 이메일 발송)

---

## 4. 이메일 인증

```
POST /api/registration/verify-email
```

**Request Body**
```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

**Response 200**
```json
{ "success": true, "message": "이메일 인증이 완료되었습니다." }
```

**에러**: 인증코드 불일치(400), 만료(400), 사용자 없음(404)

---

## 5. 접수자 로그인

```
POST /api/registration/login
```

**Request Body**
```json
{
  "email": "user@example.com",
  "password": "MySecure123!"
}
```

**Response 200**
```json
{
  "success": true,
  "data": {
    "token": "jwt...",
    "user": { "id": "...", "email": "...", "name": "..." }
  }
}
```

**검증**: 이메일 인증 완료(isVerified=true) 필수, 미인증 시 403

---

## 6. 시험 일정 목록

```
GET /api/registration/schedules?examType=TOPIK_I&status=OPEN
```

**Response 200**
```json
{
  "success": true,
  "data": {
    "schedules": [
      {
        "id": "...",
        "examName": "제93회 한국어능력시험",
        "examRound": 93,
        "examType": "TOPIK_I",
        "examDate": "2026-05-10T00:00:00Z",
        "registrationStartAt": "...",
        "registrationEndAt": "...",
        "venues": [...],
        "maxCapacity": 500,
        "currentCount": 123,
        "status": "OPEN"
      }
    ]
  }
}
```

---

## 7. 시험 일정 상세

```
GET /api/registration/schedules/:id
```

단일 일정 + 시험장별 잔여석 반환.

---

## 8. 접수 신청

```
POST /api/registration/apply
```

**Request Body**
```json
{
  "scheduleId": "...",
  "examType": "TOPIK_I",
  "englishName": "HONG GILDONG",
  "birthDate": "1995-03-15",
  "gender": "MALE",
  "photoUrl": "https://...",
  "venueId": "venue-1",
  "venueName": "서울고사장",
  "contactPhone": "010-1234-5678",
  "address": "서울시 강남구..."
}
```

**Validation**
- scheduleId: 존재하는 OPEN 상태 일정
- @@unique(userId, scheduleId): 동일 일정 중복 접수 방지
- currentCount < maxCapacity 확인

**Response 201**
```json
{
  "success": true,
  "data": {
    "registrationId": "...",
    "status": "PENDING"
  }
}
```

**ACID**: `prisma.$transaction` 내에서 일정 상태 확인 + 접수 생성 + currentCount 증가를 원자적으로 처리

---

## 9. 내 접수 내역

```
GET /api/registration/my
```

접수자 본인의 전체 접수 목록 반환.

---

## 10. 접수 상세 / 취소

```
GET /api/registration/my/:id
DELETE /api/registration/my/:id
```

취소는 PENDING 상태인 경우에만 가능. 취소 시 currentCount 원자적 감소.

---

## 11. 접수 목록 (어드민)

```
GET /api/admin/registrations?status=PENDING&page=1&limit=20
```

페이지네이션, 상태 필터, 검색 지원.

---

## 12. 접수 승인 (어드민)

```
POST /api/admin/registrations/:id/approve
```

**로직** (트랜잭션 내):
1. Registration 상태 → APPROVED
2. Examinee 레코드 자동 생성 (registrationNumber, loginId, 임시 비밀번호)
3. Registration.examineeId 에 생성된 Examinee.id 연결
4. approvedAt, approvedById 기록

---

## 13. 접수 반려 (어드민)

```
POST /api/admin/registrations/:id/reject
```

**Request Body**
```json
{ "rejectionNote": "사진이 규격에 맞지 않습니다." }
```

---

## 14. 일괄 승인 (어드민)

```
POST /api/admin/registrations/batch-approve
```

**Request Body**
```json
{ "registrationIds": ["id1", "id2", "id3"] }
```

전체를 단일 트랜잭션으로 처리. 하나라도 실패 시 전체 롤백.

---

## ACID / 보안 고려사항

| 항목 | 설명 |
|------|------|
| 접수 동시성 | `$transaction` 내에서 currentCount 확인+증가를 원자적 처리 |
| 중복 접수 방지 | `@@unique([userId, scheduleId])` DB 제약 + P2002 catch |
| 인증 분리 | 접수자 JWT는 기존 응시자/어드민 JWT와 별도 (type: 'registration') |
| 비밀번호 해시 | bcrypt 12 rounds |
| 인증코드 만료 | 3분 TTL, 인증 완료 후 코드 삭제 |
| 접수 취소 원자성 | 상태 변경 + currentCount 감소를 트랜잭션으로 묶음 |
| 승인 시 Examinee 생성 | 트랜잭션 내에서 Registration 업데이트 + Examinee 생성을 원자적 처리 |
| 소유권 검증 | 모든 접수자 API에서 JWT userId와 리소스 소유자 일치 확인 |

---

## 완료 조건 (Acceptance Criteria)

- [ ] `POST /signup`: 이메일 중복 시 409, 성공 시 인증코드 생성
- [ ] `POST /verify-email`: 올바른 코드로 isVerified=true, 만료된 코드 거부
- [ ] `POST /login`: 미인증 이메일 403, 올바른 credentials로 JWT 발급
- [ ] `GET /schedules`: OPEN 상태 일정 목록 반환, examType 필터 동작
- [ ] `POST /apply`: OPEN 일정에만 접수 가능, 중복 접수 시 409, currentCount 원자 증가
- [ ] `GET /my`: 본인 접수 내역만 반환
- [ ] `DELETE /my/:id`: PENDING 상태만 취소 가능, currentCount 원자 감소
- [ ] `GET /admin/registrations`: 페이지네이션 + 필터 동작
- [ ] `POST /admin/registrations/:id/approve`: Examinee 자동 생성, examineeId 연결
- [ ] `POST /admin/registrations/:id/reject`: rejectionNote 기록
- [ ] `POST /admin/registrations/batch-approve`: 트랜잭션 내 일괄 처리
- [ ] registrationAuth 미들웨어가 접수자 JWT만 허용
- [ ] 타인 접수 내역 접근 시 403
- [ ] SQL 마이그레이션 파일로 테이블/enum 생성 가능

---

## 파일 구조

```
server/
├── prisma/migrations/manual/
│   └── 004_add_registration_tables.sql
├── src/
│   ├── middleware/
│   │   └── registration-auth.middleware.ts
│   ├── modules/
│   │   ├── registration/
│   │   │   ├── registration.router.ts
│   │   │   └── handlers/
│   │   │       ├── signup.ts
│   │   │       ├── verifyEmail.ts
│   │   │       ├── login.ts
│   │   │       ├── listSchedules.ts
│   │   │       ├── applyRegistration.ts
│   │   │       ├── myRegistrations.ts
│   │   │       └── cancelRegistration.ts
│   │   └── admin/handlers/
│   │       ├── listRegistrations.ts
│   │       ├── approveRegistration.ts
│   │       ├── rejectRegistration.ts
│   │       └── batchApproveRegistrations.ts
│   └── app.ts (수정: registration router 마운트)
```
