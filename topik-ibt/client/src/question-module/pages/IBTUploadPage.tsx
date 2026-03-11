import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getExamSet, uploadExamSet, ExamSetDetail } from '../api/examSetApi';
import UploadValidationPanel, { ValidationError } from '../components/UploadValidationPanel';

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
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 24px', textAlign: 'center' }}>
        <p style={{ color: '#888', marginTop: 60 }}>불러오는 중...</p>
      </div>
    );
  }

  if (!examSet) {
    return (
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 24px', textAlign: 'center' }}>
        <p style={{ color: '#d93025', marginTop: 60 }}>세트를 찾을 수 없습니다.</p>
        <button
          onClick={() => navigate('/question-module/sets')}
          style={{
            marginTop: 16,
            padding: '8px 20px',
            borderRadius: 6,
            border: '1px solid #ccc',
            background: '#fff',
            cursor: 'pointer',
          }}
        >
          목록으로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 24px' }}>
      <h2 style={{ margin: '0 0 8px', fontSize: 22 }}>IBT 업로드</h2>
      <p style={{ margin: '0 0 24px', color: '#666', fontSize: 14 }}>
        시험 세트를 검증하고 IBT 시스템에 업로드합니다.
      </p>

      {/* 세트 요약 */}
      <div
        style={{
          background: '#f8f9fa',
          padding: 20,
          borderRadius: 10,
          marginBottom: 24,
        }}
      >
        <div style={{ display: 'flex', gap: 24, fontSize: 14 }}>
          <div>
            <span style={{ color: '#888' }}>세트명: </span>
            <strong>{examSet.name}</strong>
          </div>
          <div>
            <span style={{ color: '#888' }}>시험유형: </span>
            <strong>{examSet.examType}</strong>
          </div>
        </div>
      </div>

      {/* 영역별 상태 */}
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ margin: '0 0 12px', fontSize: 16 }}>영역별 검증</h3>
        {['LISTENING', 'WRITING', 'READING'].map((key) => {
          const sec = examSet.sections?.find((s) => s.section === key);
          const count = sec?.questionBankIds.length ?? 0;
          const target = sec?.targetCount ?? 0;
          const duration = sec?.duration ?? 0;
          const ok = count > 0 && duration > 0;

          return (
            <div
              key={key}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 16px',
                borderBottom: '1px solid #f0f0f0',
                fontSize: 14,
              }}
            >
              <span style={{ fontSize: 18 }}>{ok ? '\u2705' : '\u274C'}</span>
              <span style={{ minWidth: 60, fontWeight: 600 }}>{SECTION_LABELS[key]}</span>
              <span style={{ color: '#555' }}>
                {count}/{target} 문항
              </span>
              <span style={{ color: '#888' }}>| {duration}분</span>
            </div>
          );
        })}
      </div>

      {/* 검증 패널 */}
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ margin: '0 0 12px', fontSize: 16 }}>검증 결과</h3>
        <UploadValidationPanel errors={validationErrors} />
      </div>

      {/* 업로드 진행 */}
      {uploading && (
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              height: 8,
              background: '#e0e0e0',
              borderRadius: 4,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${progress}%`,
                background: '#1a73e8',
                transition: 'width 0.3s',
                borderRadius: 4,
              }}
            />
          </div>
          <p style={{ fontSize: 13, color: '#888', marginTop: 6 }}>
            업로드 중... {progress}%
          </p>
        </div>
      )}

      {uploadError && (
        <p style={{ color: '#d93025', fontSize: 14, marginBottom: 16 }}>{uploadError}</p>
      )}

      {uploadSuccess && (
        <div
          style={{
            padding: 16,
            background: '#e6f4ea',
            borderRadius: 8,
            color: '#137333',
            fontSize: 14,
            marginBottom: 16,
          }}
        >
          업로드가 완료되었습니다. 시험 세트가 활성화되었습니다.
        </div>
      )}

      {/* 버튼 */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button
          onClick={() => navigate(`/question-module/compose/${id}`)}
          style={{
            padding: '10px 20px',
            borderRadius: 6,
            border: '1px solid #ccc',
            background: '#fff',
            cursor: 'pointer',
            fontSize: 14,
          }}
        >
          세트 편집으로
        </button>
        <button
          onClick={handleUpload}
          disabled={hasBlockingErrors || uploading || uploadSuccess}
          style={{
            padding: '10px 24px',
            borderRadius: 6,
            border: 'none',
            background:
              hasBlockingErrors || uploading || uploadSuccess ? '#ccc' : '#1a73e8',
            color: '#fff',
            cursor:
              hasBlockingErrors || uploading || uploadSuccess ? 'not-allowed' : 'pointer',
            fontSize: 15,
            fontWeight: 600,
          }}
        >
          {uploading
            ? '업로드 중...'
            : uploadSuccess
              ? '업로드 완료'
              : 'IBT 업로드 및 활성화 →'}
        </button>
      </div>
    </div>
  );
};

export default IBTUploadPage;
