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
      localStorage.removeItem('registrationToken');
      window.location.href = '/registration';
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

export async function login(payload: LoginPayload) {
  const res = await registrationApi.post<{ token: string; user: RegistrationUser }>(
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
  const formData = new FormData();
  formData.append('scheduleId', payload.scheduleId);
  formData.append('venueId', payload.venueId);
  formData.append('englishName', payload.englishName);
  formData.append('birthYear', String(payload.birthYear));
  formData.append('birthMonth', String(payload.birthMonth));
  formData.append('birthDay', String(payload.birthDay));
  formData.append('gender', payload.gender);
  formData.append('phone', payload.phone);
  formData.append('address', payload.address);
  formData.append('nationality', payload.nationality);
  formData.append('studyPeriod', payload.studyPeriod);
  if (payload.photoFile) {
    formData.append('photo', payload.photoFile);
  }

  const res = await registrationApi.post<Registration>('/registration/apply', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
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
