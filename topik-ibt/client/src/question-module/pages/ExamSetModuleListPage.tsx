import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listExamSets, deleteExamSet } from '../api/examSetApi';
import type { ExamSetListItem } from '../api/examSetApi';

const STATUS_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  DRAFT: { bg: '#e0e0e0', color: '#555', label: '임시저장' },
  ACTIVE: { bg: '#e6f4ea', color: '#137333', label: '활성' },
  ARCHIVED: { bg: '#f0f0f0', color: '#888', label: '보관' },
};

const ExamSetModuleListPage: React.FC = () => {
  const navigate = useNavigate();
  const [sets, setSets] = useState<ExamSetListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchSets = () => {
    setLoading(true);
    listExamSets()
      .then(setSets)
      .catch(() => setError('세트 목록을 불러올 수 없습니다.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSets();
  }, []);

  const handleDelete = async (s: ExamSetListItem) => {
    if (!window.confirm(`시험세트 '${s.name}'을 삭제하시겠습니까?`)) return;
    try {
      await deleteExamSet(s.id);
      fetchSets();
    } catch (err: any) {
      alert(err.response?.data?.message || '삭제에 실패했습니다.');
    }
  };

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 22 }}>시험 세트 목록</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => navigate('/question-module/import')}
            style={{
              padding: '8px 18px',
              borderRadius: 6,
              border: '1px solid #1a73e8',
              background: '#fff',
              color: '#1a73e8',
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            문제 불러오기
          </button>
          <button
            onClick={() => navigate('/question-module/compose')}
            style={{
              padding: '8px 18px',
              borderRadius: 6,
              border: 'none',
              background: '#1a73e8',
              color: '#fff',
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            + 새 세트 만들기
          </button>
        </div>
      </div>

      {loading ? (
        <p style={{ color: '#888', textAlign: 'center', marginTop: 60 }}>불러오는 중...</p>
      ) : error ? (
        <p style={{ color: '#d93025', textAlign: 'center', marginTop: 60 }}>{error}</p>
      ) : sets.length === 0 ? (
        <div style={{ textAlign: 'center', marginTop: 60, color: '#888' }}>
          <p style={{ fontSize: 16 }}>아직 생성된 시험 세트가 없습니다.</p>
          <p style={{ fontSize: 14 }}>위의 버튼을 눌러 새로운 세트를 만들어 보세요.</p>
        </div>
      ) : (
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: 14,
          }}
        >
          <thead>
            <tr style={{ borderBottom: '2px solid #e0e0e0' }}>
              <th style={{ textAlign: 'left', padding: '10px 12px' }}>세트명</th>
              <th style={{ textAlign: 'center', padding: '10px 12px' }}>시험유형</th>
              <th style={{ textAlign: 'center', padding: '10px 12px' }}>상태</th>
              <th style={{ textAlign: 'center', padding: '10px 12px' }}>문항수</th>
              <th style={{ textAlign: 'center', padding: '10px 12px' }}>수정일</th>
              <th style={{ textAlign: 'center', padding: '10px 12px' }}>관리</th>
            </tr>
          </thead>
          <tbody>
            {sets.map((s) => {
              const badge = STATUS_BADGE[s.status] ?? STATUS_BADGE.DRAFT;
              return (
                <tr key={s.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 500 }}>{s.name}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>{s.examType}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                    <span
                      style={{
                        padding: '3px 10px',
                        borderRadius: 12,
                        fontSize: 12,
                        background: badge.bg,
                        color: badge.color,
                      }}
                    >
                      {badge.label}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                    {s.questionCount}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', color: '#888' }}>
                    {new Date(s.updatedAt).toLocaleDateString('ko-KR')}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                    <button
                      onClick={() => navigate(`/question-module/compose/${s.id}`)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 4,
                        border: '1px solid #ccc',
                        background: '#fff',
                        cursor: 'pointer',
                        fontSize: 12,
                        marginRight: 4,
                      }}
                    >
                      편집
                    </button>
                    <button
                      onClick={() => navigate(`/question-module/upload/${s.id}`)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 4,
                        border: '1px solid #1a73e8',
                        background: '#e8f0fe',
                        color: '#1a73e8',
                        cursor: 'pointer',
                        fontSize: 12,
                      }}
                    >
                      업로드
                    </button>
                    {(s.status === 'DRAFT' || s.status === 'ARCHIVED') && (
                      <button
                        onClick={() => handleDelete(s)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: 4,
                          border: '1px solid #d93025',
                          background: '#fce8e6',
                          color: '#d93025',
                          cursor: 'pointer',
                          fontSize: 12,
                          marginLeft: 4,
                        }}
                      >
                        삭제
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ExamSetModuleListPage;
