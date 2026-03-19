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
import { useRegistrationStore } from '../store/registrationStore';

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
        useRegistrationStore.getState().setLoggedIn(false);
        useRegistrationStore.getState().setUser(null);
        window.location.href = '/registration/login';
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

// ── Eligibility ─────────────────────────────────────
export async function checkEligibility(scheduleId: string): Promise<{ eligible: boolean; examineeId?: string }> {
  const res = await registrationApi.get('/registration/check-eligibility', {
    params: { scheduleId },
  });
  return res.data?.data || { eligible: false };
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

  const res = await registrationApi.post('/registration/apply', body);
  const result = res.data;
  // 서버 응답: { success, data: { registrationId, status, examineeId, registrationNumber } }
  const data = result?.data || result;
  return {
    id: data.registrationId || data.id,
    registrationId: data.registrationId || data.id,
    status: data.status,
    examineeId: data.examineeId,
    registrationNumber: data.registrationNumber || null,
  } as any;
}

export async function fetchMyRegistrations() {
  const res = await registrationApi.get('/registration/my');
  const body = res.data;
  if (body?.data?.registrations) return body.data.registrations as Registration[];
  if (Array.isArray(body?.data)) return body.data as Registration[];
  if (Array.isArray(body)) return body as Registration[];
  return [];
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

export async function cancelRegistration(id: string) {
  const res = await registrationApi.delete(`/registration/my/${id}`);
  return res.data;
}
