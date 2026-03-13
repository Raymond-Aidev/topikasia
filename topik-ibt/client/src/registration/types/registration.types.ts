export type ExamType = 'TOPIK_I' | 'TOPIK_II';
export type RegistrationStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';
export type ScheduleStatus = 'UPCOMING' | 'OPEN' | 'CLOSED' | 'COMPLETED';
export type Gender = 'MALE' | 'FEMALE';

export interface ExamVenue {
  id: string;
  name: string;
  region: string;
  address: string;
  capacity: number;
  remainingSeats: number;
}

export interface ExamSchedule {
  id: string;
  examNumber: number;
  examName: string;
  examType: ExamType;
  examDate: string;
  registrationStartDate: string;
  registrationEndDate: string;
  venues: ExamVenue[];
  status: ScheduleStatus;
}

export interface Registration {
  id: string;
  registrationNumber: string;
  userId: string;
  scheduleId: string;
  venueId: string;
  englishName: string;
  birthYear: number;
  birthMonth: number;
  birthDay: number;
  gender: Gender;
  phone: string;
  address: string;
  nationality: string;
  studyPeriod: string;
  photoUrl: string | null;
  status: RegistrationStatus;
  examSchedule?: ExamSchedule;
  venue?: ExamVenue;
  createdAt: string;
  updatedAt: string;
}

export interface RegistrationUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  isEmailVerified: boolean;
}

export interface RegistrationFormData {
  englishName: string;
  birthYear: number;
  birthMonth: number;
  birthDay: number;
  gender: Gender | '';
  venueId: string;
  venueName: string;
  phone: string;
  address: string;
  nationality: string;
  studyPeriod: string;
  photoFile: File | null;
  photoPreview: string;
  agreedToTerms: boolean;
}

export interface SignUpPayload {
  name: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface VerifyEmailPayload {
  email: string;
  code: string;
}

export interface ApplyPayload {
  scheduleId: string;
  venueId: string;
  englishName: string;
  birthYear: number;
  birthMonth: number;
  birthDay: number;
  gender: Gender;
  phone: string;
  address: string;
  nationality: string;
  studyPeriod: string;
  photoFile?: File;
}
