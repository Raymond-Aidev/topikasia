import axios from 'axios';
import type {
  SignUpPayload,
  LoginPayload,
  VerifyEmailPayload,
  ApplyPayload,
  ExamSchedule,
  Registration,
  RegistrationUser,
  ExamVenue,
} from '../types/registration.types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const registrationApi = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
});

registrationApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('registrationToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

registrationApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || '';
      // 로그인/회원가입 요청은 인터셉터에서 리다이렉트하지 않음
      const authPaths = ['/registration/login', '/registration/signup', '/registration/verify-email', '/registration/resend-code'];
      const isAuthRequest = authPaths.some((p) => url.includes(p));
      if (!isAuthRequest) {
        localStorage.removeItem('registrationToken');
        window.location.href = '/registration';
      }
    }
    return Promise.reject(error);
  }
);

// ── Auth ─────────────────────────────────────────────
export async function signUp(payload: SignUpPayload) {
  const res = await registrationApi.post<{ message: string; email: string }>(
    '/registration/signup',
    payload
  );
  return res.data;
}

export async function verifyEmail(payload: VerifyEmailPayload) {
  const res = await registrationApi.post<{ message: string }>(
    '/registration/verify-email',
    payload
  );
  return res.data;
}

export async function resendCode(email: string) {
  const res = await registrationApi.post<{ message: string }>(
    '/registration/resend-code',
    { email }
  );
  return res.data;
}

export async function login(payload: LoginPayload) {
  const res = await registrationApi.post<{ success: boolean; data: { token: string; user: RegistrationUser } }>(
    '/registration/login',
    payload
  );
  return res.data;
}

// ── Schedules ────────────────────────────────────────
export async function fetchSchedules() {
  const res = await registrationApi.get('/registration/schedules');
  const body = res.data;
  // API returns { success, data: { schedules: [...] } }
  if (body?.data?.schedules) return body.data.schedules as ExamSchedule[];
  if (Array.isArray(body?.data)) return body.data as ExamSchedule[];
  if (Array.isArray(body)) return body as ExamSchedule[];
  return [];
}

export async function fetchVenues(scheduleId: string) {
  const res = await registrationApi.get<ExamVenue[]>(
    `/registration/schedules/${scheduleId}/venues`
  );
  return res.data;
}

// ── Registration ─────────────────────────────────────
export async function applyRegistration(payload: ApplyPayload) {
  // 서버 스키마에 맞춰 birthDate 문자열로 변환, 필드명 매핑
  const birthDate = `${payload.birthYear}-${String(payload.birthMonth).padStart(2, '0')}-${String(payload.birthDay).padStart(2, '0')}`;

  const body = {
    scheduleId: payload.scheduleId,
    examType: payload.examType,
    venueId: payload.venueId,
    venueName: payload.venueName,
    englishName: payload.englishName,
    birthDate,
    gender: payload.gender,
    contactPhone: payload.phone || undefined,
    address: payload.address || undefined,
  };

  const res = await registrationApi.post<Registration>('/registration/apply', body);
  return res.data;
}

export async function fetchMyRegistrations() {
  const res = await registrationApi.get<Registration[]>('/registration/my');
  return res.data;
}

export async function fetchMyRegistrationDetail(id: string) {
  const res = await registrationApi.get<Registration>(`/registration/my/${id}`);
  return res.data;
}

export async function downloadTicket(id: string) {
  const res = await registrationApi.get(`/registration/my/${id}/ticket`, {
    responseType: 'blob',
  });
  return res.data;
}
