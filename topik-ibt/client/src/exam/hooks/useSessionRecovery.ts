import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { examApi } from '../../api/examApi';
import { useExamStore } from '../../store/examStore';
import type { SectionType } from '../../types/exam.types';

/**
 * 시험 세션 자동 복구 훅
 * - examToken이 localStorage에 남아있을 때 페이지 새로고침 시 자동 복구
 * - /exam/* 경로에서만 동작
 */
export function useSessionRecovery() {
  const navigate = useNavigate();
  const location = useLocation();
  const [recovering, setRecovering] = useState(false);

  const examinee = useExamStore((s) => s.examinee);
  const sessionId = useExamStore((s) => s.sessionId);
  const setExaminee = useExamStore((s) => s.setExaminee);
  const setAssignedExamSet = useExamStore((s) => s.setAssignedExamSet);
  const setSession = useExamStore((s) => s.setSession);
  const setCurrentSection = useExamStore((s) => s.setCurrentSection);
  const setExamPhase = useExamStore((s) => s.setExamPhase);
  const setAnswers = useExamStore((s) => s.setAnswers);

  useEffect(() => {
    // 이미 상태가 있으면 복구 불필요
    if (examinee && sessionId) return;

    // /exam/ 경로에서만 복구 시도
    if (!location.pathname.startsWith('/exam/')) return;

    // 로그인, 종료, 점수 화면에서는 복구 불필요
    const skipPaths = ['/exam/end', '/exam/score'];
    if (skipPaths.some((p) => location.pathname.startsWith(p))) return;

    const token = localStorage.getItem('examToken');
    if (!token) return;

    let cancelled = false;
    setRecovering(true);

    (async () => {
      try {
        // 1) 응시자 정보 복원
        const meRes = await examApi.get('/exam-auth/me');
        const meData = meRes.data?.data || meRes.data;
        if (cancelled || !meData) return;

        setExaminee({
          id: meData.id,
          loginId: meData.loginId,
          name: meData.name,
          registrationNumber: meData.registrationNumber,
          seatNumber: meData.seatNumber,
          photoUrl: meData.photoUrl,
          institutionName: meData.institutionName,
          examRoomName: meData.examRoomName,
        });

        // 2) 진행 중 세션 복원
        try {
          const sessionRes = await examApi.get('/exam/session/current');
          const session = sessionRes.data?.data || sessionRes.data;
          if (cancelled || !session) return;

          setSession(session.id);

          // examSet 정보 복원
          if (session.examSet) {
            const es = session.examSet;
            const sectionsJson = typeof es.sectionsJson === 'string' ? JSON.parse(es.sectionsJson) : es.sectionsJson;
            const sections = Object.entries(sectionsJson).map(([key, val]: [string, any]) => ({
              section: key as SectionType,
              questionCount: val.questions?.length || 0,
              durationMinutes: Math.ceil((val.timeLimit || 0) / 60),
            }));
            setAssignedExamSet({
              examSetId: es.id,
              examSetNumber: es.examSetNumber || '',
              name: es.name,
              examType: es.examType,
              sections,
              totalDurationMinutes: sections.reduce((sum, s) => sum + s.durationMinutes, 0),
              scheduledStartAt: es.scheduledStartAt || null,
            });
          }

          // 답안 복원
          if (session.answers && Array.isArray(session.answers)) {
            const answersMap: Record<string, any> = {};
            for (const ans of session.answers) {
              const val = typeof ans.answerJson === 'string' ? JSON.parse(ans.answerJson) : ans.answerJson;
              answersMap[ans.questionId] = val;
            }
            setAnswers(answersMap);
          }

          // 현재 섹션 결정 (sectionProgress에서 가장 마지막 진행 중 섹션)
          const sectionProgress = typeof session.sectionProgress === 'string'
            ? JSON.parse(session.sectionProgress)
            : session.sectionProgress;

          if (sectionProgress) {
            const inProgress = Object.entries(sectionProgress).find(
              ([, val]: [string, any]) => val.status === 'IN_PROGRESS'
            );
            if (inProgress) {
              setCurrentSection(inProgress[0] as SectionType);
              setExamPhase('IN_PROGRESS');
              // 적절한 시험 화면으로 이동
              const sectionRoutes: Record<string, string> = {
                LISTENING: '/exam/listening',
                WRITING: '/exam/writing',
                READING: '/exam/reading',
              };
              const route = sectionRoutes[inProgress[0]];
              if (route && location.pathname !== route) {
                navigate(route, { replace: true });
              }
              return;
            }
          }

          // 세션은 있지만 진행 중 섹션이 없으면 대기실로
          setExamPhase('WAITING');
          navigate('/exam/waiting', { replace: true });
        } catch {
          // 진행 중 세션 없음 → 시험 선택 화면으로
          setExamPhase('VERIFY');
          navigate('/exam/verify', { replace: true });
        }
      } catch {
        // 토큰 만료/무효 → 로그인 화면으로
        localStorage.removeItem('examToken');
        navigate('/login', { replace: true });
      } finally {
        if (!cancelled) setRecovering(false);
      }
    })();

    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { recovering };
}
