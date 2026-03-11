import axios from 'axios';
import { env } from '../../config/env';

// ─── 인터페이스 ──────────────────────────────────────────────

export interface QuestionBankQuery {
  typeCode?: string;       // 문제 유형 코드 (듣기, 읽기, 쓰기)
  difficulty?: string;     // 난이도 (상, 중, 하)
  keyword?: string;        // 검색 키워드
  count?: number;          // 페이지당 항목 수
  page?: number;           // 페이지 번호
}

export interface QuestionBankItem {
  bankId: string;
  typeCode: string;
  typeName: string;
  difficulty: string;
  title: string;
  preview: string;
  hasAudio: boolean;
  hasImage: boolean;
  createdAt: string;
}

export interface QuestionBankDetail {
  bankId: string;
  typeCode: string;
  typeName: string;
  difficulty: string;
  title: string;
  content: string;
  options: { label: string; text: string }[];
  correctAnswer: string;
  audioUrl?: string;
  imageUrl?: string;
  explanation?: string;
  points: number;
  createdAt: string;
}

// ─── Mock 데이터 ─────────────────────────────────────────────

const MOCK_ITEMS: QuestionBankItem[] = [
  {
    bankId: 'qb-001',
    typeCode: 'LISTENING',
    typeName: '듣기',
    difficulty: '중',
    title: '대화를 듣고 알맞은 그림을 고르십시오.',
    preview: '남자와 여자가 식당에서 주문하는 대화...',
    hasAudio: true,
    hasImage: true,
    createdAt: '2025-01-15T09:00:00Z',
  },
  {
    bankId: 'qb-002',
    typeCode: 'LISTENING',
    typeName: '듣기',
    difficulty: '하',
    title: '다음을 듣고 물음에 답하십시오.',
    preview: '안내 방송을 듣고 내용과 일치하는 것을 고르는 문제...',
    hasAudio: true,
    hasImage: false,
    createdAt: '2025-01-16T10:00:00Z',
  },
  {
    bankId: 'qb-003',
    typeCode: 'READING',
    typeName: '읽기',
    difficulty: '상',
    title: '다음 글의 주제로 가장 알맞은 것을 고르십시오.',
    preview: '한국의 전통 문화에 대한 설명문...',
    hasAudio: false,
    hasImage: false,
    createdAt: '2025-02-01T14:30:00Z',
  },
  {
    bankId: 'qb-004',
    typeCode: 'READING',
    typeName: '읽기',
    difficulty: '중',
    title: '다음 ( )에 들어갈 가장 알맞은 것을 고르십시오.',
    preview: '빈칸에 알맞은 문법 표현을 선택하는 문제...',
    hasAudio: false,
    hasImage: false,
    createdAt: '2025-02-05T11:00:00Z',
  },
  {
    bankId: 'qb-005',
    typeCode: 'WRITING',
    typeName: '쓰기',
    difficulty: '상',
    title: '다음을 읽고 150~300자로 글을 쓰십시오.',
    preview: '주어진 주제에 대해 자신의 의견을 서술하는 문제...',
    hasAudio: false,
    hasImage: false,
    createdAt: '2025-02-10T09:30:00Z',
  },
  {
    bankId: 'qb-006',
    typeCode: 'LISTENING',
    typeName: '듣기',
    difficulty: '상',
    title: '다음을 듣고 남자의 중심 생각을 고르십시오.',
    preview: '토론 형식의 대화를 듣고 중심 생각을 파악하는 문제...',
    hasAudio: true,
    hasImage: false,
    createdAt: '2025-03-01T08:00:00Z',
  },
];

function getMockDetail(bankId: string): QuestionBankDetail {
  const item = MOCK_ITEMS.find((i) => i.bankId === bankId);
  return {
    bankId: bankId,
    typeCode: item?.typeCode ?? 'READING',
    typeName: item?.typeName ?? '읽기',
    difficulty: item?.difficulty ?? '중',
    title: item?.title ?? '샘플 문제',
    content: '다음 글을 읽고 물음에 답하십시오.\n\n한국어능력시험(TOPIK)은 한국어를 모국어로 하지 않는 재외동포 및 외국인의 한국어 사용 능력을 측정·평가하여 그 결과를 한국 내 대학 유학 및 취업 등에 활용하는 것을 목적으로 합니다.',
    options: [
      { label: '①', text: '한국어능력시험의 목적' },
      { label: '②', text: '한국어능력시험의 역사' },
      { label: '③', text: '한국어 학습 방법' },
      { label: '④', text: '한국 대학 입학 절차' },
    ],
    correctAnswer: '①',
    audioUrl: item?.hasAudio ? `https://mock-s3.example.com/audio/${bankId}.mp3` : undefined,
    imageUrl: item?.hasImage ? `https://mock-s3.example.com/images/${bankId}.png` : undefined,
    explanation: '글의 첫 문장에서 TOPIK의 목적을 명확하게 설명하고 있습니다.',
    points: 2,
    createdAt: item?.createdAt ?? '2025-01-01T00:00:00Z',
  };
}

// ─── 클라이언트 함수 ─────────────────────────────────────────

function isMockMode(): boolean {
  return env.QUESTION_BANK_API_URL.includes('localhost:4000');
}

/**
 * 문제은행에서 유형별 문제 목록 조회
 */
export async function fetchQuestionsByType(
  query: QuestionBankQuery,
): Promise<{ items: QuestionBankItem[]; total: number }> {
  if (isMockMode()) {
    let items = [...MOCK_ITEMS];

    if (query.typeCode) {
      items = items.filter((i) => i.typeCode === query.typeCode);
    }
    if (query.difficulty) {
      items = items.filter((i) => i.difficulty === query.difficulty);
    }
    if (query.keyword) {
      const kw = query.keyword.toLowerCase();
      items = items.filter(
        (i) =>
          i.title.toLowerCase().includes(kw) ||
          i.preview.toLowerCase().includes(kw),
      );
    }

    const total = items.length;
    const page = query.page ?? 1;
    const count = query.count ?? 20;
    const start = (page - 1) * count;
    items = items.slice(start, start + count);

    return { items, total };
  }

  // 실제 API 호출
  const response = await axios.get(`${env.QUESTION_BANK_API_URL}/questions`, {
    params: query,
    headers: { 'X-API-Key': env.QUESTION_BANK_API_KEY },
    timeout: 10000,
  });

  return response.data;
}

/**
 * 문제은행에서 개별 문제 상세 조회
 */
export async function fetchQuestionDetail(
  bankId: string,
): Promise<QuestionBankDetail> {
  if (isMockMode()) {
    return getMockDetail(bankId);
  }

  const response = await axios.get(
    `${env.QUESTION_BANK_API_URL}/questions/${bankId}`,
    {
      headers: { 'X-API-Key': env.QUESTION_BANK_API_KEY },
      timeout: 10000,
    },
  );

  return response.data;
}
