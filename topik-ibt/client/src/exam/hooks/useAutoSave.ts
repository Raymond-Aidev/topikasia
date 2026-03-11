import { useEffect, useRef, useCallback } from 'react';
import { useExamStore } from '../../store/examStore';
import type { AnswerValue } from '../../store/examStore';
import { examApi } from '../../api/examApi';
import { saveLocal, getAllLocalAnswers, clearSession } from '../store/dexieDb';

const SYNC_INTERVAL_MS = 10_000;
const MAX_RETRIES = 5;
const MAX_BACKOFF_MS = 30_000;

function backoffMs(attempt: number): number {
  return Math.min(1000 * Math.pow(2, attempt), MAX_BACKOFF_MS);
}

async function syncToServer(
  sessionId: string,
  questionBankId: string,
  section: string,
  questionIndex: number,
  answerJson: AnswerValue,
  setNetworkError: (v: boolean) => void,
): Promise<boolean> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      await examApi.put(`/exam/sessions/${sessionId}/answers`, {
        answers: [{
          questionBankId,
          section,
          questionIndex,
          answerJson,
        }],
      });
      setNetworkError(false);
      return true;
    } catch {
      if (attempt < MAX_RETRIES - 1) {
        await new Promise((r) => setTimeout(r, backoffMs(attempt)));
      }
    }
  }
  setNetworkError(true);
  return false;
}

/**
 * Saves answer to IndexedDB immediately, then syncs to server.
 * Also runs a periodic sync every 10 seconds for any unsent local answers.
 */
export function useAutoSave() {
  const sessionId = useExamStore((s) => s.sessionId);
  const answers = useExamStore((s) => s.answers);
  const setNetworkError = useExamStore((s) => s.setNetworkError);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentSection = useExamStore((s) => s.currentSection);

  const saveAnswer = useCallback(
    async (questionBankId: string, questionIndex: number, value: AnswerValue) => {
      const sid = sessionId || 'offline';
      const section = currentSection || 'LISTENING';
      // Save locally first (offline-first)
      await saveLocal(questionBankId, sid, JSON.stringify(value));
      // Then try server
      if (sid !== 'offline') {
        await syncToServer(sid, questionBankId, section, questionIndex, value, setNetworkError);
      }
    },
    [sessionId, currentSection, setNetworkError],
  );

  // Periodic sync: push any unsent local answers to server
  useEffect(() => {
    const sid = sessionId || 'offline';

    const periodicSync = async () => {
      try {
        const locals = await getAllLocalAnswers(sid);
        if (locals.length === 0) return;

        const currentAnswers = useExamStore.getState().answers;
        let allSynced = true;

        const section = useExamStore.getState().currentSection || 'LISTENING';
        for (let idx = 0; idx < locals.length; idx++) {
          const local = locals[idx];
          const answer = currentAnswers[local.questionId];
          if (answer) {
            const ok = await syncToServer(sid, local.questionId, section, idx, answer, setNetworkError);
            if (!ok) allSynced = false;
          }
        }

        if (allSynced) {
          await clearSession(sid);
        }
      } catch {
        // silent
      }
    };

    intervalRef.current = setInterval(periodicSync, SYNC_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [sessionId, setNetworkError]);

  return { saveAnswer, answers };
}
