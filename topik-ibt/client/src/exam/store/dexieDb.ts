import Dexie, { type Table } from 'dexie';

export interface LocalAnswer {
  questionId: string;
  sessionId: string;
  answerJson: string;
  savedAt: number;
}

class ExamDatabase extends Dexie {
  answers!: Table<LocalAnswer, string>;

  constructor() {
    super('TopikIBTExam');
    this.version(1).stores({
      answers: 'questionId, sessionId, savedAt',
    });
  }
}

const db = new ExamDatabase();

export async function saveLocal(
  questionId: string,
  sessionId: string,
  answerJson: string,
): Promise<void> {
  await db.answers.put({
    questionId,
    sessionId,
    answerJson,
    savedAt: Date.now(),
  });
}

export async function getAllLocalAnswers(sessionId: string): Promise<LocalAnswer[]> {
  return db.answers.where('sessionId').equals(sessionId).toArray();
}

export async function clearSession(sessionId: string): Promise<void> {
  await db.answers.where('sessionId').equals(sessionId).delete();
}

export default db;
