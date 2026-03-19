import { create } from 'zustand';
import type {
  ExamSchedule,
  Registration,
  RegistrationUser,
  RegistrationFormData,
} from '../types/registration.types';

const initialFormData: RegistrationFormData = {
  englishName: '',
  birthYear: 1990,
  birthMonth: 1,
  birthDay: 1,
  gender: '',
  venueId: '',
  venueName: '',
  phone: '',
  address: '',
  nationality: '',
  studyPeriod: '',
  photoFile: null,
  photoPreview: '',
  agreedToTerms: false,
};

interface RegistrationState {
  // 사용자
  user: RegistrationUser | null;
  isLoggedIn: boolean;

  // 시험 일정
  schedules: ExamSchedule[];
  selectedSchedule: ExamSchedule | null;

  // 접수 Wizard
  currentStep: number;
  formData: RegistrationFormData;

  // 내 접수
  myRegistrations: Registration[];
  currentRegistration: Registration | null;

  // 액션
  setUser: (u: RegistrationUser | null) => void;
  setLoggedIn: (v: boolean) => void;
  setSchedules: (s: ExamSchedule[]) => void;
  selectSchedule: (s: ExamSchedule | null) => void;
  setCurrentStep: (step: number) => void;
  updateFormData: (data: Partial<RegistrationFormData>) => void;
  setMyRegistrations: (r: Registration[]) => void;
  setCurrentRegistration: (r: Registration | null) => void;
  resetForm: () => void;
  reset: () => void;
}

// 앱 시작 시 localStorage 토큰의 유효성(만료 여부)을 확인하여 로그인 상태 초기화
function isTokenValid(): boolean {
  if (typeof window === 'undefined') return false;
  const token = localStorage.getItem('registrationToken');
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      localStorage.removeItem('registrationToken');
      localStorage.removeItem('registrationUser');
      return false;
    }
    return true;
  } catch {
    localStorage.removeItem('registrationToken');
    localStorage.removeItem('registrationUser');
    return false;
  }
}

function loadPersistedUser(): RegistrationUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('registrationUser');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem('registrationUser');
    return null;
  }
}

export const useRegistrationStore = create<RegistrationState>((set) => ({
  user: isTokenValid() ? loadPersistedUser() : null,
  isLoggedIn: isTokenValid(),
  schedules: [],
  selectedSchedule: null,
  currentStep: 1,
  formData: { ...initialFormData },
  myRegistrations: [],
  currentRegistration: null,

  setUser: (u) => {
    if (u) {
      localStorage.setItem('registrationUser', JSON.stringify(u));
    } else {
      localStorage.removeItem('registrationUser');
    }
    set({ user: u });
  },
  setLoggedIn: (v) => set({ isLoggedIn: v }),
  setSchedules: (s) => set({ schedules: s }),
  selectSchedule: (s) => set({ selectedSchedule: s }),
  setCurrentStep: (step) => set({ currentStep: step }),
  updateFormData: (data) =>
    set((state) => ({ formData: { ...state.formData, ...data } })),
  setMyRegistrations: (r) => set({ myRegistrations: r }),
  setCurrentRegistration: (r) => set({ currentRegistration: r }),
  resetForm: () => set({ currentStep: 1, formData: { ...initialFormData } }),
  reset: () => {
    localStorage.removeItem('registrationUser');
    set({
      user: null,
      isLoggedIn: false,
      schedules: [],
      selectedSchedule: null,
      currentStep: 1,
      formData: { ...initialFormData },
      myRegistrations: [],
      currentRegistration: null,
    });
  },
}));
