import type {
  QuestionBankQuery,
  QuestionBankItem,
  QuestionBankDetail,
  QuestionBankResponse,
} from './questionBankApi';
import { DEFAULT_QUESTION_TYPES } from '../config/questionTypes.config';

// ─── 목 데이터 생성 헬퍼 ────────────────────────────────────

const DIFFICULTIES: ('EASY' | 'MEDIUM' | 'HARD')[] = ['EASY', 'MEDIUM', 'HARD'];

const PREVIEW_TEXTS: Record<string, string[]> = {
  LISTENING: [
    '다음을 듣고 이어질 수 있는 말을 고르십시오.',
    '다음 대화를 듣고 알맞은 그림을 고르십시오.',
    '다음을 듣고 남자가 하려는 행동으로 알맞은 것을 고르십시오.',
    '다음을 듣고 여자의 중심 생각을 고르십시오.',
    '다음을 듣고 물음에 답하십시오.',
  ],
  WRITING: [
    '다음을 읽고 ㉠과 ㉡에 들어갈 말을 각각 한 문장으로 쓰십시오.',
    '다음 그래프를 보고 내용을 200~300자로 쓰십시오.',
    '다음을 읽고 자신의 생각을 600~700자로 쓰십시오.',
    '다음 주제에 대해 자신의 의견을 쓰십시오.',
    '빈칸에 알맞은 내용을 쓰십시오.',
  ],
  READING: [
    '다음을 읽고 맞지 않는 것을 고르십시오.',
    '다음 글의 주제로 가장 알맞은 것을 고르십시오.',
    '다음 글에서 <보기>의 문장이 들어가기에 가장 알맞은 곳을 고르십시오.',
    '다음을 순서대로 맞게 나열한 것을 고르십시오.',
    '다음 글을 읽고 빈칸에 들어갈 내용으로 가장 알맞은 것을 고르십시오.',
    '다음을 읽고 내용이 같은 것을 고르십시오.',
  ],
};

const TAGS_POOL: Record<string, string[]> = {
  LISTENING: ['일상생활', '직장', '뉴스', '강연', '대화', '인터뷰'],
  WRITING: ['그래프', '의견', '설명문', '논술', '편지'],
  READING: ['광고', '안내문', '신문기사', '소설', '논문', '일상생활'],
};

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateMockItems(typeCode: string, count: number): QuestionBankItem[] {
  const typeConfig = DEFAULT_QUESTION_TYPES.find((t) => t.code === typeCode);
  if (!typeConfig) return [];

  const section = typeConfig.section;
  const previews = PREVIEW_TEXTS[section];
  const tags = TAGS_POOL[section];

  return Array.from({ length: count }, (_, i) => ({
    bankId: `${typeCode}_${String(i + 1).padStart(3, '0')}`,
    typeCode,
    typeName: typeConfig.name,
    section,
    difficulty: randomFrom(DIFFICULTIES),
    previewText: randomFrom(previews),
    hasAudio: section === 'LISTENING',
    hasImage: Math.random() > 0.7,
    usageCount: Math.floor(Math.random() * 20),
    tags: [randomFrom(tags), randomFrom(tags)].filter((v, idx, a) => a.indexOf(v) === idx),
    createdAt: new Date(Date.now() - Math.random() * 90 * 86400000).toISOString(),
  }));
}

// 캐시 — 동일 typeCode 에 대해 일관된 목 데이터 반환
const mockCache: Record<string, QuestionBankItem[]> = {};

function getOrCreateMock(typeCode: string): QuestionBankItem[] {
  if (!mockCache[typeCode]) {
    mockCache[typeCode] = generateMockItems(typeCode, 20 + Math.floor(Math.random() * 15));
  }
  return mockCache[typeCode];
}

// ─── 공개 API ────────────────────────────────────────────────

export async function fetchQuestionsFromBank(
  query: QuestionBankQuery
): Promise<QuestionBankResponse> {
  // 네트워크 지연 시뮬레이션
  await new Promise((r) => setTimeout(r, 300 + Math.random() * 400));

  let items = getOrCreateMock(query.typeCode);

  if (query.difficulty) {
    items = items.filter((item) => item.difficulty === query.difficulty);
  }
  if (query.keyword) {
    const kw = query.keyword.toLowerCase();
    items = items.filter(
      (item) =>
        item.previewText.toLowerCase().includes(kw) ||
        item.tags.some((t) => t.includes(kw))
    );
  }

  const page = query.page ?? 1;
  const size = query.size ?? 50;
  const total = items.length;
  const start = (page - 1) * size;
  const paged = items.slice(start, start + size);

  return {
    items: paged,
    total,
    page,
    size,
    totalPages: Math.ceil(total / size),
  };
}

export async function fetchQuestionDetail(bankId: string): Promise<QuestionBankDetail> {
  await new Promise((r) => setTimeout(r, 200 + Math.random() * 300));

  // bankId 형식: TYPECODE_NNN
  const typeCode = bankId.replace(/_\d+$/, '');
  const items = getOrCreateMock(typeCode);
  const item = items.find((q) => q.bankId === bankId);

  if (!item) {
    throw new Error(`문제를 찾을 수 없습니다: ${bankId}`);
  }

  return {
    bankId: item.bankId,
    typeCode: item.typeCode,
    typeName: item.typeName,
    section: item.section,
    difficulty: item.difficulty,
    instruction: item.previewText,
    passage:
      item.section === 'LISTENING'
        ? '(음성 파일이 재생됩니다)'
        : '한국어능력시험은 한국어를 모국어로 하지 않는 외국인 및 재외동포를 대상으로 한국어 사용 능력을 측정·평가하여 그 결과를 국내 대학 유학 및 취업 등에 활용하는 시험입니다. 이 시험은 의사소통 능력 중심의 평가를 통해 한국어 교육의 방향을 제시하고, 한국어 보급을 확대하는 데 기여하고 있습니다.',
    audioUrl: item.section === 'LISTENING' ? `/audio/mock_${item.bankId}.mp3` : undefined,
    imageUrl: item.hasImage ? `/images/mock_${item.bankId}.png` : undefined,
    options: [
      { label: '①', text: '한국어를 배우려면 한국에 가야 한다.' },
      { label: '②', text: '한국어능력시험은 외국인만 볼 수 있다.' },
      { label: '③', text: '시험 결과는 유학이나 취업에 활용된다.' },
      { label: '④', text: '한국어능력시험은 매년 한 번만 실시된다.' },
    ],
    correctAnswer: '③',
    explanation: '지문에서 "국내 대학 유학 및 취업 등에 활용하는 시험"이라고 명시되어 있습니다.',
    modelAnswer: item.section === 'WRITING' ? '모범 답안 예시입니다.' : undefined,
    scoringCriteria: item.section === 'WRITING' ? '내용(5점), 구성(5점), 어휘·문법(5점)' : undefined,
    tags: item.tags,
    createdAt: item.createdAt,
  };
}
