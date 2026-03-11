import { adminApi } from '../../api/adminApi';

// ─── 인터페이스 ──────────────────────────────────────────────

export interface ExamSetSectionConfig {
  section: 'LISTENING' | 'WRITING' | 'READING';
  duration: number; // 분
  targetCount: number;
  questionBankIds: string[];
}

export interface ExamSetPayload {
  name: string;
  examType: 'TOPIK_I' | 'TOPIK_II';
  description: string;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  sections: ExamSetSectionConfig[];
}

export interface ExamSetListItem {
  id: string;
  name: string;
  examType: 'TOPIK_I' | 'TOPIK_II';
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  questionCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ExamSetDetail extends ExamSetPayload {
  id: string;
  questionCount: number;
  createdAt: string;
  updatedAt: string;
}

// ─── API 호출 ────────────────────────────────────────────────

const BASE = '/questions/question-module/exam-sets';

export async function createExamSet(payload: ExamSetPayload): Promise<ExamSetDetail> {
  const { data } = await adminApi.post(BASE, payload);
  return data;
}

export async function updateExamSet(id: string, payload: Partial<ExamSetPayload>): Promise<ExamSetDetail> {
  const { data } = await adminApi.put(`${BASE}/${id}`, payload);
  return data;
}

export async function listExamSets(): Promise<ExamSetListItem[]> {
  const { data } = await adminApi.get(BASE);
  return data;
}

export async function getExamSet(id: string): Promise<ExamSetDetail> {
  const { data } = await adminApi.get(`${BASE}/${id}`);
  return data;
}

export async function uploadExamSet(id: string): Promise<{ message: string }> {
  const { data } = await adminApi.post(`${BASE}/${id}/upload`);
  return data;
}
