import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getExamSet, uploadExamSet } from '../api/examSetApi';
import type { ExamSetDetail } from '../api/examSetApi';
import UploadValidationPanel from '../components/UploadValidationPanel';
import type { ValidationError } from '../components/UploadValidationPanel';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Progress } from '../../components/ui/progress';
import { Alert, AlertDescription } from '../../components/ui/alert';

const SECTION_LABELS: Record<string, string> = {
  LISTENING: '듣기',
  WRITING: '쓰기',
  READING: '읽기',
};

const IBTUploadPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [examSet, setExamSet] = useState<ExamSetDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getExamSet(id)
      .then(setExamSet)
      .catch(() => setUploadError('세트 정보를 불러올 수 없습니다.'))
      .finally(() => setLoading(false));
  }, [id]);

  // 검증 로직
  const getValidationErrors = (): ValidationError[] => {
    if (!examSet) return [];
    const errors: ValidationError[] = [];

    const sections = examSet.sections ?? [];
    const sectionKeys = ['LISTENING', 'WRITING', 'READING'];

    sectionKeys.forEach((key) => {
      const sec = sections.find((s) => s.section === key);
      if (!sec) {
        errors.push({
          message: `${SECTION_LABELS[key]} 영역이 구성되지 않았습니다.`,
          blocking: true,
        });
        return;
      }
      if (sec.questionBankIds.length === 0) {
        errors.push({
          message: `${SECTION_LABELS[key]} 영역에 문항이 없습니다.`,
          blocking: true,
        });
      }
      if (sec.questionBankIds.length < sec.targetCount) {
        errors.push({
          message: `${SECTION_LABELS[key]} 영역: 문항 수(${sec.questionBankIds.length})가 목표(${sec.targetCount})에 미달합니다.`,
          blocking: false,
        });
      }
      if (sec.duration <= 0) {
        errors.push({
          message: `${SECTION_LABELS[key]} 영역: 시험 시간이 설정되지 않았습니다.`,
          blocking: true,
        });
      }
    });

    if (!examSet.name.trim()) {
      errors.push({ message: '세트 이름이 비어 있습니다.', blocking: true });
    }

    return errors;
  };

  const validationErrors = examSet ? getValidationErrors() : [];
  const hasBlockingErrors = validationErrors.some((e) => e.blocking);

  const handleUpload = async () => {
    if (!id || hasBlockingErrors) return;
    setUploading(true);
    setUploadError('');
    setProgress(0);

    // 진행 표시 시뮬레이션
    const interval = setInterval(() => {
      setProgress((prev) => Math.min(prev + 10, 90));
    }, 300);

    try {
      await uploadExamSet(id);
      setProgress(100);
      setUploadSuccess(true);
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 409) {
        setUploadError('이미 업로드된 세트입니다. 수정 후 다시 시도하세요.');
      } else if (status === 429) {
        setUploadError('업로드가 진행 중입니다. 잠시 후 다시 시도하세요.');
      } else {
        setUploadError('업로드에 실패했습니다. 다시 시도해 주세요.');
      }
    } finally {
      clearInterval(interval);
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-[800px] px-6 py-8 text-center">
        <p className="mt-16 text-muted-foreground">불러오는 중...</p>
      </div>
    );
  }

  if (!examSet) {
    return (
      <div className="mx-auto max-w-[800px] px-6 py-8 text-center">
        <p className="mt-16 text-destructive">세트를 찾을 수 없습니다.</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => navigate('/question-module/sets')}
        >
          목록으로 돌아가기
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[800px] px-6 py-8">
      <h2 className="mb-2 text-[22px] font-bold">IBT 업로드</h2>
      <p className="mb-6 text-sm text-muted-foreground">
        시험 세트를 검증하고 IBT 시스템에 업로드합니다.
      </p>

      {/* 세트 요약 */}
      <Card className="mb-6">
        <CardContent>
          <div className="flex gap-6 text-sm">
            <div>
              <span className="text-muted-foreground">세트명: </span>
              <strong>{examSet.name}</strong>
            </div>
            <div>
              <span className="text-muted-foreground">시험유형: </span>
              <strong>{examSet.examType}</strong>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 영역별 상태 */}
      <div className="mb-6">
        <h3 className="mb-3 text-base font-semibold">영역별 검증</h3>
        {['LISTENING', 'WRITING', 'READING'].map((key) => {
          const sec = examSet.sections?.find((s) => s.section === key);
          const count = sec?.questionBankIds.length ?? 0;
          const target = sec?.targetCount ?? 0;
          const duration = sec?.duration ?? 0;
          const ok = count > 0 && duration > 0;

          return (
            <div
              key={key}
              className="flex items-center gap-3 border-b border-border px-4 py-2.5 text-sm"
            >
              <span className="text-lg">{ok ? '\u2705' : '\u274C'}</span>
              <span className="min-w-[60px] font-semibold">{SECTION_LABELS[key]}</span>
              <span className="text-foreground/80">
                {count}/{target} 문항
              </span>
              <span className="text-muted-foreground">| {duration}분</span>
            </div>
          );
        })}
      </div>

      {/* 검증 패널 */}
      <div className="mb-6">
        <h3 className="mb-3 text-base font-semibold">검증 결과</h3>
        <UploadValidationPanel errors={validationErrors} />
      </div>

      {/* 업로드 진행 */}
      {uploading && (
        <div className="mb-5">
          <Progress value={progress} />
          <p className="mt-1.5 text-xs text-muted-foreground">
            업로드 중... {progress}%
          </p>
        </div>
      )}

      {uploadError && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{uploadError}</AlertDescription>
        </Alert>
      )}

      {uploadSuccess && (
        <Alert className="mb-4 border-green-200 bg-green-50 text-green-700">
          <AlertDescription>
            업로드가 완료되었습니다. 시험 세트가 활성화되었습니다.
          </AlertDescription>
        </Alert>
      )}

      {/* 버튼 */}
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => navigate(`/question-module/compose/${id}`)}
        >
          세트 편집으로
        </Button>
        <Button
          onClick={handleUpload}
          disabled={hasBlockingErrors || uploading || uploadSuccess}
          className="text-[15px] font-semibold"
          size="lg"
        >
          {uploading
            ? '업로드 중...'
            : uploadSuccess
              ? '업로드 완료'
              : 'IBT 업로드 및 활성화 →'}
        </Button>
      </div>
    </div>
  );
};

export default IBTUploadPage;
