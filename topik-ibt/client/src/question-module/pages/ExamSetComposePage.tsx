import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useImportedQuestionsStore } from '../store/importedQuestionsStore';
import type { QuestionBankItem } from '../api/questionBankApi';
import { createExamSet, updateExamSet, getExamSet, updateModelAnswer } from '../api/examSetApi';
import type { ExamSetPayload } from '../api/examSetApi';
import ExamSetComposer from '../components/ExamSetComposer';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Card, CardContent } from '../../components/ui/card';
import { Separator } from '../../components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../components/ui/dialog';

interface SectionState {
  duration: number;
  targetCount: number;
  items: QuestionBankItem[];
}

const SECTION_DEFS = [
  { key: 'LISTENING' as const, label: '듣기', defaultDuration: 60, defaultTarget: 20 },
  { key: 'WRITING' as const, label: '쓰기', defaultDuration: 50, defaultTarget: 4 },
  { key: 'READING' as const, label: '읽기', defaultDuration: 70, defaultTarget: 30 },
];

// ─── 모범답안 모달 ────────────────────────────────────────────

interface ModelAnswerModalProps {
  item: QuestionBankItem;
  examSetId: string;
  initialModelAnswer: string;
  initialScoringCriteria: string;
  onClose: () => void;
  onSaved: (bankId: string) => void;
}

const ModelAnswerModal: React.FC<ModelAnswerModalProps> = ({
  item,
  examSetId,
  initialModelAnswer,
  initialScoringCriteria,
  onClose,
  onSaved,
}) => {
  const [modelAnswer, setModelAnswer] = useState(initialModelAnswer);
  const [scoringCriteria, setScoringCriteria] = useState(initialScoringCriteria);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await updateModelAnswer(examSetId, {
        questionBankId: item.bankId,
        modelAnswer,
        scoringCriteria,
      });
      onSaved(item.bankId);
      onClose();
    } catch {
      setError('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>모범답안 설정</DialogTitle>
          <DialogDescription>{item.previewText}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="mb-1.5 text-[13px]">모범 답안</Label>
            <Textarea
              value={modelAnswer}
              onChange={(e) => setModelAnswer(e.target.value)}
              rows={6}
              className="resize-y font-[inherit]"
              placeholder="모범 답안을 입력하세요..."
            />
          </div>

          <div>
            <Label className="mb-1.5 text-[13px]">채점 기준</Label>
            <Textarea
              value={scoringCriteria}
              onChange={(e) => setScoringCriteria(e.target.value)}
              rows={6}
              className="resize-y font-[inherit]"
              placeholder="채점 기준을 입력하세요..."
            />
          </div>

          {error && (
            <p className="text-[13px] text-destructive">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-violet-500 hover:bg-violet-600"
          >
            {saving ? '저장 중...' : '저장'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ─── ExamSetComposePage ───────────────────────────────────────

const ExamSetComposePage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { getSelectedBySection } = useImportedQuestionsStore();

  const [name, setName] = useState('');
  const [examType, setExamType] = useState<'TOPIK_I' | 'TOPIK_II'>('TOPIK_II');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // 모범답안 모달 상태
  const [modelAnswerTarget, setModelAnswerTarget] = useState<QuestionBankItem | null>(null);
  const [modelAnswerIds, setModelAnswerIds] = useState<Set<string>>(new Set());
  const [modelAnswerData, setModelAnswerData] = useState<
    Record<string, { modelAnswer: string; scoringCriteria: string }>
  >({});

  const [sections, setSections] = useState<Record<string, SectionState>>(() => {
    const init: Record<string, SectionState> = {};
    SECTION_DEFS.forEach((s) => {
      init[s.key] = {
        duration: s.defaultDuration,
        targetCount: s.defaultTarget,
        items: [],
      };
    });
    return init;
  });

  // 기존 세트 로드
  useEffect(() => {
    if (id) {
      getExamSet(id)
        .then((data) => {
          setName(data.name);
          setExamType(data.examType);
          setDescription(data.description);
          // 세션 데이터는 서버에서 가져온 것 사용
          const newModelAnswerIds = new Set<string>();
          const newModelAnswerData: Record<string, { modelAnswer: string; scoringCriteria: string }> = {};

          data.sections?.forEach((sec) => {
            setSections((prev) => ({
              ...prev,
              [sec.section]: {
                duration: sec.duration,
                targetCount: sec.targetCount,
                items: prev[sec.section]?.items ?? [],
              },
            }));
          });

          // sectionsJson에서 모범답안 정보 추출 (raw data)
          const rawData = data as any;
          if (rawData.sectionsJson) {
            for (const section of rawData.sectionsJson) {
              const questions = section.questions || section.questionBankIds || [];
              for (const q of questions) {
                if (typeof q === 'object' && q.modelAnswer) {
                  const bankId = q.bankId || q.questionBankId;
                  newModelAnswerIds.add(bankId);
                  newModelAnswerData[bankId] = {
                    modelAnswer: q.modelAnswer || '',
                    scoringCriteria: q.scoringCriteria || '',
                  };
                }
              }
            }
          }

          setModelAnswerIds(newModelAnswerIds);
          setModelAnswerData(newModelAnswerData);
        })
        .catch(() => {
          // 새 세트 구성 모드로 진행
        });
    }
  }, [id]);

  // 스토어에서 가져온 문항을 pool 초기값으로 사용
  const poolBySection: Record<string, QuestionBankItem[]> = {
    LISTENING: getSelectedBySection('LISTENING'),
    WRITING: getSelectedBySection('WRITING'),
    READING: getSelectedBySection('READING'),
  };

  const updateSectionField = (
    section: string,
    field: keyof SectionState,
    value: number | QuestionBankItem[]
  ) => {
    setSections((prev) => ({
      ...prev,
      [section]: { ...prev[section], [field]: value },
    }));
  };

  const handleSave = async (status: 'DRAFT' | 'ACTIVE' = 'DRAFT') => {
    if (!name.trim()) {
      setError('세트 이름을 입력하세요.');
      return;
    }
    setSaving(true);
    setError('');

    const payload: ExamSetPayload = {
      name,
      examType,
      description,
      status,
      sections: SECTION_DEFS.map((s) => ({
        section: s.key,
        duration: sections[s.key].duration,
        targetCount: sections[s.key].targetCount,
        questionBankIds: sections[s.key].items.map((q) => q.bankId),
      })),
    };

    try {
      if (id) {
        await updateExamSet(id, payload);
      } else {
        const result = await createExamSet(payload);
        navigate(`/question-module/compose/${result.id}`, { replace: true });
      }
    } catch {
      setError('저장에 실패했습니다. 다시 시도해 주세요.');
    } finally {
      setSaving(false);
    }
  };

  const handleModelAnswer = useCallback((item: QuestionBankItem) => {
    setModelAnswerTarget(item);
  }, []);

  const handleModelAnswerSaved = useCallback((bankId: string) => {
    setModelAnswerIds((prev) => new Set(prev).add(bankId));
  }, []);

  const totalQuestions = SECTION_DEFS.reduce(
    (sum, s) => sum + sections[s.key].items.length,
    0
  );

  return (
    <div className="mx-auto max-w-[1100px] px-6 py-8">
      <h2 className="mb-6 text-[22px] font-bold">
        {id ? '시험 세트 편집' : '새 시험 세트 구성'}
      </h2>

      {/* 기본 정보 */}
      <Card className="mb-7">
        <CardContent>
          <div className="mb-3 flex flex-wrap gap-4">
            <div className="min-w-[200px] flex-[2]">
              <Label className="mb-1 text-[13px] text-muted-foreground">세트 이름</Label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="예: 2026년 제1회 TOPIK II 모의시험"
              />
            </div>
            <div className="min-w-[160px]">
              <Label className="mb-1 text-[13px] text-muted-foreground">시험 유형</Label>
              <select
                value={examType}
                onChange={(e) => setExamType(e.target.value as 'TOPIK_I' | 'TOPIK_II')}
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="TOPIK_I">TOPIK I</option>
                <option value="TOPIK_II">TOPIK II</option>
              </select>
            </div>
          </div>
          <div>
            <Label className="mb-1 text-[13px] text-muted-foreground">설명</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="resize-y"
            />
          </div>
        </CardContent>
      </Card>

      {/* 영역별 설정 & 구성 */}
      {SECTION_DEFS.map((s) => (
        <div key={s.key}>
          <div className="mb-3 flex items-center gap-4">
            <div>
              <Label className="text-[13px] text-muted-foreground">시간(분)</Label>
              <Input
                type="number"
                value={sections[s.key].duration}
                onChange={(e) =>
                  updateSectionField(s.key, 'duration', Number(e.target.value))
                }
                min={1}
                className="mt-0.5 w-20"
              />
            </div>
            <div>
              <Label className="text-[13px] text-muted-foreground">목표 문항수</Label>
              <Input
                type="number"
                value={sections[s.key].targetCount}
                onChange={(e) =>
                  updateSectionField(s.key, 'targetCount', Number(e.target.value))
                }
                min={1}
                className="mt-0.5 w-20"
              />
            </div>
          </div>

          <ExamSetComposer
            section={s.key}
            sectionLabel={s.label}
            setItems={sections[s.key].items}
            poolItems={poolBySection[s.key]}
            targetCount={sections[s.key].targetCount}
            onSetItemsChange={(items) => updateSectionField(s.key, 'items', items)}
            onModelAnswer={id ? handleModelAnswer : undefined}
            modelAnswerIds={modelAnswerIds}
          />
        </div>
      ))}

      {/* Footer */}
      {error && (
        <p className="mb-3 text-sm text-destructive">{error}</p>
      )}

      <Separator className="mt-4" />

      <div className="flex items-center justify-between py-4">
        <span className="text-sm text-muted-foreground">
          총 {totalQuestions}개 문항 구성됨
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate('/question-module/sets')}
          >
            목록으로
          </Button>
          <Button
            variant="secondary"
            onClick={() => handleSave('DRAFT')}
            disabled={saving}
          >
            {saving ? '저장 중...' : '임시 저장'}
          </Button>
          {id && (
            <Button
              onClick={() => navigate(`/question-module/upload/${id}`)}
            >
              업로드
            </Button>
          )}
        </div>
      </div>

      {/* 모범답안 모달 */}
      {modelAnswerTarget && id && (
        <ModelAnswerModal
          item={modelAnswerTarget}
          examSetId={id}
          initialModelAnswer={modelAnswerData[modelAnswerTarget.bankId]?.modelAnswer || ''}
          initialScoringCriteria={modelAnswerData[modelAnswerTarget.bankId]?.scoringCriteria || ''}
          onClose={() => setModelAnswerTarget(null)}
          onSaved={handleModelAnswerSaved}
        />
      )}
    </div>
  );
};

export default ExamSetComposePage;
