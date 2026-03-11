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

export const useRegistrationStore = create<RegistrationState>((set) => ({
  user: null,
  isLoggedIn: false,
  schedules: [],
  selectedSchedule: null,
  currentStep: 1,
  formData: { ...initialFormData },
  myRegistrations: [],
  currentRegistration: null,

  setUser: (u) => set({ user: u }),
  setLoggedIn: (v) => set({ isLoggedIn: v }),
  setSchedules: (s) => set({ schedules: s }),
  selectSchedule: (s) => set({ selectedSchedule: s }),
  setCurrentStep: (step) => set({ currentStep: step }),
  updateFormData: (data) =>
    set((state) => ({ formData: { ...state.formData, ...data } })),
  setMyRegistrations: (r) => set({ myRegistrations: r }),
  setCurrentRegistration: (r) => set({ currentRegistration: r }),
  resetForm: () => set({ currentStep: 1, formData: { ...initialFormData } }),
  reset: () =>
    set({
      user: null,
      isLoggedIn: false,
      schedules: [],
      selectedSchedule: null,
      currentStep: 1,
      formData: { ...initialFormData },
      myRegistrations: [],
      currentRegistration: null,
    }),
}));
