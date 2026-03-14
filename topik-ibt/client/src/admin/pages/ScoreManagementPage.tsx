import React, { useEffect, useState, useCallback } from 'react';
import AdminLayout from '../components/AdminLayout';
import { adminApi } from '../../api/adminApi';

interface ScoreItem {
  id: string;
  sessionId: string;
  examineeName: string;
  examineeLoginId: string;
  registrationNumber: string;
  examSetName: string;
  examType: string;
  sectionScores: Record<string, { raw: number; maxScore: number; autoGraded: boolean }>;
  totalScore: number;
  maxTotalScore: number;
  grade: number | null;
  gradingStatus: string;
  isPublished: boolean;
  gradedAt: string | null;
}

interface ExamSetOption { id: string; name: string; }

const PAGE_SIZE = 20;

const GRADING_STATUS_LABELS: Record<string, string> = {
  PENDING: '채점전',
  AUTO_GRADED: '자동채점',
  FULLY_GRADED: '채점완료',
};

const GRADE_LABELS: Record<number, string> = {
  1: '1급', 2: '2급', 3: '3급', 4: '4급', 5: '5급', 6: '6급',
};

const thStyle: React.CSSProperties = {
  padding: '10px 14px', textAlign: 'left', fontSize: '13px',
  fontWeight: 600, color: '#374151', borderBottom: '2px solid #e5e7eb',
};
const tdStyle: React.CSSProperties = {
  padding: '10px 14px', fontSize: '13px', color: '#111827', borderBottom: '1px solid #f3f4f6',
};

const ScoreManagementPage: React.FC = () => {
  const [scores, setScores] = useState<ScoreItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [examSets, setExamSets] = useState<ExamSetOption[]>([]);
  const [examSetFilter, setExamSetFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [publishedFilter, setPublishedFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Auto-grading state
  const [grading, setGrading] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // Detail modal
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detail, setDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [writingScore, setWritingScore] = useState('');
  const [savingManual, setSavingManual] = useState(false);

  const fetchScores = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, any> = { page, limit: PAGE_SIZE };
      if (examSetFilter) params.examSetId = examSetFilter;
      if (statusFilter) params.gradingStatus = statusFilter;
      if (publishedFilter) params.isPublished = publishedFilter;
      if (search) params.search = search;
      const res = await adminApi.get('/admin/scores', { params });
      const body = res.data?.data || res.data;
      setScores(Array.isArray(body) ? body : body.data || []);
      setTotal(res.data.total ?? body.total ?? 0);
    } catch (err: any) {
      setError(err.response?.data?.message || '데이터 로딩 실패');
    } finally {
      setLoading(false);
    }
  }, [page, examSetFilter, statusFilter, publishedFilter, search]);

  useEffect(() => { fetchScores(); }, [fetchScores]);

  useEffect(() => {
    adminApi.get('/admin/exam-sets/assignable').then(r => {
      const body = r.data?.data || r.data;
      setExamSets(Array.isArray(body) ? body : []);
    }).catch(() => {});
  }, []);

  // ─── 자동채점 실행 ────────────────────────────
  const handleAutoGrade = async () => {
    if (!examSetFilter) {
      alert('시험세트를 선택해주세요');
      return;
    }
    setGrading(true);
    try {
      const res = await adminApi.post('/admin/scores/auto-grade', { examSetId: examSetFilter });
      alert(`자동채점 완료: ${res.data.data.gradedCount}건 채점, ${res.data.data.skippedCount}건 스킵`);
      fetchScores();
    } catch (err: any) {
      alert(err.response?.data?.message || '자동채점 실패');
    } finally {
      setGrading(false);
    }
  };

  // ─── 공개/비공개 ─────────────────────────────
  const handlePublish = async (isPublished: boolean) => {
    const ids = Array.from(selected);
    if (ids.length === 0) {
      alert('대상을 선택해주세요');
      return;
    }
    setPublishing(true);
    try {
      await adminApi.post('/admin/scores/publish', { scoreIds: ids, isPublished });
      alert(`${ids.length}건 ${isPublished ? '공개' : '비공개'} 처리 완료`);
      setSelected(new Set());
      fetchScores();
    } catch (err: any) {
      alert(err.response?.data?.message || '처리 실패');
    } finally {
      setPublishing(false);
    }
  };

  // ─── 상세 모달 ───────────────────────────────
  const openDetail = async (id: string) => {
    setDetailId(id);
    setDetailLoading(true);
    setWritingScore('');
    try {
      const res = await adminApi.get(`/admin/scores/${id}`);
      const scoreData = res.data?.data || res.data;
      setDetail(scoreData);
      const ws = scoreData.sectionScores?.WRITING;
      if (ws) setWritingScore(String(ws.raw || 0));
    } catch (err: any) {
      alert(err.response?.data?.message || '상세 조회 실패');
      setDetailId(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleManualGrade = async () => {
    if (!detailId || writingScore === '') return;
    setSavingManual(true);
    try {
      await adminApi.patch(`/admin/scores/${detailId}/manual-grade`, {
        sectionScores: { WRITING: { raw: Number(writingScore) } },
      });
      alert('수동채점 저장 완료');
      setDetailId(null);
      fetchScores();
    } catch (err: any) {
      alert(err.response?.data?.message || '저장 실패');
    } finally {
      setSavingManual(false);
    }
  };

  // ─── 체크박스 ────────────────────────────────
  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };
  const toggleAll = () => {
    if (selected.size === scores.length) setSelected(new Set());
    else setSelected(new Set(scores.map(s => s.id)));
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const gradingBadge = (status: string) => {
    const colors: Record<string, { bg: string; color: string }> = {
      PENDING: { bg: '#fef3c7', color: '#92400e' },
      AUTO_GRADED: { bg: '#dbeafe', color: '#1e40af' },
      FULLY_GRADED: { bg: '#d1fae5', color: '#065f46' },
    };
    const c = colors[status] || colors.PENDING;
    return (
      <span style={{
        padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600,
        backgroundColor: c.bg, color: c.color,
      }}>
        {GRADING_STATUS_LABELS[status] || status}
      </span>
    );
  };

  return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>성적관리</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={handleAutoGrade}
            disabled={grading || !examSetFilter}
            style={{
              padding: '8px 18px', borderRadius: 6, border: 'none',
              backgroundColor: '#2563eb', color: '#fff', fontSize: 14, fontWeight: 600,
              cursor: grading || !examSetFilter ? 'not-allowed' : 'pointer',
              opacity: grading || !examSetFilter ? 0.5 : 1,
            }}
          >
            {grading ? '채점중...' : '자동채점 실행'}
          </button>
          <button
            onClick={() => handlePublish(true)}
            disabled={publishing || selected.size === 0}
            style={{
              padding: '8px 18px', borderRadius: 6, border: 'none',
              backgroundColor: '#16a34a', color: '#fff', fontSize: 14, fontWeight: 600,
              cursor: publishing || selected.size === 0 ? 'not-allowed' : 'pointer',
              opacity: publishing || selected.size === 0 ? 0.5 : 1,
            }}
          >
            선택 공개
          </button>
          <button
            onClick={() => handlePublish(false)}
            disabled={publishing || selected.size === 0}
            style={{
              padding: '8px 18px', borderRadius: 6, border: '1px solid #d1d5db',
              backgroundColor: '#fff', color: '#374151', fontSize: 14, fontWeight: 600,
              cursor: publishing || selected.size === 0 ? 'not-allowed' : 'pointer',
              opacity: publishing || selected.size === 0 ? 0.5 : 1,
            }}
          >
            선택 비공개
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <select
          value={examSetFilter}
          onChange={e => { setExamSetFilter(e.target.value); setPage(1); }}
          style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13, backgroundColor: '#fff' }}
        >
          <option value="">전체 시험세트</option>
          {examSets.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13, backgroundColor: '#fff' }}
        >
          <option value="">전체 채점상태</option>
          <option value="PENDING">채점전</option>
          <option value="AUTO_GRADED">자동채점</option>
          <option value="FULLY_GRADED">채점완료</option>
        </select>
        <select
          value={publishedFilter}
          onChange={e => { setPublishedFilter(e.target.value); setPage(1); }}
          style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13, backgroundColor: '#fff' }}
        >
          <option value="">전체 공개상태</option>
          <option value="true">공개</option>
          <option value="false">비공개</option>
        </select>
        <input
          placeholder="이름/수험번호 검색"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13, width: 180 }}
        />
      </div>

      {error && (
        <div style={{ padding: '12px 16px', marginBottom: 16, borderRadius: 6, backgroundColor: '#fee2e2', color: '#991b1b', fontSize: 14 }}>
          {error}
        </div>
      )}

      <div style={{ backgroundColor: '#fff', borderRadius: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
          <thead>
            <tr>
              <th style={{ ...thStyle, width: 40 }}>
                <input type="checkbox" checked={scores.length > 0 && selected.size === scores.length} onChange={toggleAll} />
              </th>
              <th style={thStyle}>수험번호</th>
              <th style={thStyle}>성명</th>
              <th style={thStyle}>시험세트</th>
              <th style={thStyle}>듣기</th>
              <th style={thStyle}>쓰기</th>
              <th style={thStyle}>읽기</th>
              <th style={thStyle}>총점</th>
              <th style={thStyle}>등급</th>
              <th style={thStyle}>채점상태</th>
              <th style={thStyle}>공개</th>
              <th style={thStyle}>관리</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={12} style={{ ...tdStyle, textAlign: 'center', padding: 40, color: '#9ca3af' }}>불러오는 중...</td></tr>
            ) : scores.length === 0 ? (
              <tr><td colSpan={12} style={{ ...tdStyle, textAlign: 'center', padding: 40, color: '#9ca3af' }}>데이터가 없습니다.</td></tr>
            ) : scores.map(s => (
              <tr key={s.id}>
                <td style={tdStyle}>
                  <input type="checkbox" checked={selected.has(s.id)} onChange={() => toggleSelect(s.id)} />
                </td>
                <td style={{ ...tdStyle, fontSize: 12, color: '#6b7280' }}>{s.registrationNumber}</td>
                <td style={{ ...tdStyle, fontWeight: 600 }}>{s.examineeName}</td>
                <td style={{ ...tdStyle, fontSize: 12 }}>{s.examSetName}</td>
                <td style={tdStyle}>{s.sectionScores?.LISTENING?.raw ?? '-'}</td>
                <td style={tdStyle}>{s.sectionScores?.WRITING ? s.sectionScores.WRITING.raw : '-'}</td>
                <td style={tdStyle}>{s.sectionScores?.READING?.raw ?? '-'}</td>
                <td style={{ ...tdStyle, fontWeight: 700 }}>{s.totalScore}/{s.maxTotalScore}</td>
                <td style={{ ...tdStyle, fontWeight: 600, color: s.grade ? '#2563eb' : '#9ca3af' }}>
                  {s.grade ? GRADE_LABELS[s.grade] || `${s.grade}급` : '-'}
                </td>
                <td style={tdStyle}>{gradingBadge(s.gradingStatus)}</td>
                <td style={tdStyle}>
                  <span style={{
                    padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600,
                    backgroundColor: s.isPublished ? '#d1fae5' : '#f3f4f6',
                    color: s.isPublished ? '#065f46' : '#6b7280',
                  }}>
                    {s.isPublished ? '공개' : '비공개'}
                  </span>
                </td>
                <td style={tdStyle}>
                  <button
                    onClick={() => openDetail(s.id)}
                    style={{
                      padding: '4px 12px', borderRadius: 4, border: '1px solid #d1d5db',
                      backgroundColor: '#fff', fontSize: 12, cursor: 'pointer',
                    }}
                  >
                    상세
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginTop: 20 }}>
          <button
            disabled={page <= 1} onClick={() => setPage(page - 1)}
            style={{ padding: '6px 12px', borderRadius: 4, border: '1px solid #d1d5db', backgroundColor: '#fff', fontSize: 13, cursor: page <= 1 ? 'not-allowed' : 'pointer', opacity: page <= 1 ? 0.5 : 1 }}
          >이전</button>
          {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
            const start = Math.max(1, Math.min(page - 4, totalPages - 9));
            const p = start + i;
            if (p > totalPages) return null;
            return (
              <button key={p} onClick={() => setPage(p)}
                style={{ padding: '6px 12px', borderRadius: 4, border: '1px solid #d1d5db', backgroundColor: p === page ? '#2563eb' : '#fff', color: p === page ? '#fff' : '#374151', fontSize: 13, fontWeight: p === page ? 600 : 400, cursor: 'pointer' }}
              >{p}</button>
            );
          })}
          <button
            disabled={page >= totalPages} onClick={() => setPage(page + 1)}
            style={{ padding: '6px 12px', borderRadius: 4, border: '1px solid #d1d5db', backgroundColor: '#fff', fontSize: 13, cursor: page >= totalPages ? 'not-allowed' : 'pointer', opacity: page >= totalPages ? 0.5 : 1 }}
          >다음</button>
        </div>
      )}

      {/* Detail Modal */}
      {detailId && (
        <div
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}
          onClick={() => setDetailId(null)}
        >
          <div
            style={{ backgroundColor: '#fff', borderRadius: 12, padding: 28, width: 560, maxHeight: '80vh', overflow: 'auto', boxShadow: '0 8px 30px rgba(0,0,0,0.15)' }}
            onClick={e => e.stopPropagation()}
          >
            {detailLoading ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>불러오는 중...</div>
            ) : detail ? (
              <>
                <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>성적 상세</h2>
                <div style={{ marginBottom: 12, fontSize: 14, color: '#374151' }}>
                  <div><strong>성명:</strong> {detail.examinee?.name}</div>
                  <div><strong>수험번호:</strong> {detail.examinee?.registrationNumber}</div>
                  <div><strong>시험:</strong> {detail.examSet?.name} ({detail.examSet?.examType})</div>
                </div>

                {/* Section scores */}
                <div style={{ marginBottom: 16 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>영역별 점수</h3>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={{ ...thStyle, fontSize: 12 }}>영역</th>
                        <th style={{ ...thStyle, fontSize: 12 }}>점수</th>
                        <th style={{ ...thStyle, fontSize: 12 }}>만점</th>
                        <th style={{ ...thStyle, fontSize: 12 }}>채점방식</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(detail.sectionScores || {}).map(([section, data]: [string, any]) => (
                        <tr key={section}>
                          <td style={tdStyle}>{section}</td>
                          <td style={{ ...tdStyle, fontWeight: 700 }}>{data.raw}</td>
                          <td style={tdStyle}>{data.maxScore}</td>
                          <td style={tdStyle}>{data.autoGraded ? '자동' : '수동'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div style={{ marginTop: 8, fontSize: 15, fontWeight: 700 }}>
                    총점: {detail.totalScore}/{detail.maxTotalScore}
                    {detail.grade && ` (${GRADE_LABELS[detail.grade] || detail.grade + '급'})`}
                  </div>
                </div>

                {/* Manual grading for WRITING */}
                {detail.sectionScores?.WRITING && detail.gradingStatus !== 'FULLY_GRADED' && (
                  <div style={{ marginBottom: 16, padding: 16, backgroundColor: '#fffbeb', borderRadius: 8, border: '1px solid #fde68a' }}>
                    <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#92400e' }}>쓰기 수동채점</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <label style={{ fontSize: 13 }}>쓰기 점수 (0~{detail.sectionScores.WRITING.maxScore}):</label>
                      <input
                        type="number"
                        min={0}
                        max={detail.sectionScores.WRITING.maxScore}
                        value={writingScore}
                        onChange={e => setWritingScore(e.target.value)}
                        style={{ width: 80, padding: '6px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 14 }}
                      />
                      <button
                        onClick={handleManualGrade}
                        disabled={savingManual}
                        style={{
                          padding: '6px 16px', borderRadius: 6, border: 'none',
                          backgroundColor: '#d97706', color: '#fff', fontSize: 13, fontWeight: 600,
                          cursor: savingManual ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {savingManual ? '저장중...' : '점수 저장'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Answer list */}
                {detail.answers && detail.answers.length > 0 && (
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>답안 목록 ({detail.answers.length}건)</h3>
                    <div style={{ maxHeight: 200, overflow: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr>
                            <th style={{ ...thStyle, fontSize: 11 }}>영역</th>
                            <th style={{ ...thStyle, fontSize: 11 }}>#</th>
                            <th style={{ ...thStyle, fontSize: 11 }}>답안</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detail.answers.map((a: any) => (
                            <tr key={a.id}>
                              <td style={{ ...tdStyle, fontSize: 12 }}>{a.section}</td>
                              <td style={{ ...tdStyle, fontSize: 12 }}>{a.questionIndex + 1}</td>
                              <td style={{ ...tdStyle, fontSize: 12, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {typeof a.answerJson === 'object' ? JSON.stringify(a.answerJson) : String(a.answerJson)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div style={{ marginTop: 20, textAlign: 'right' }}>
                  <button
                    onClick={() => setDetailId(null)}
                    style={{ padding: '8px 20px', borderRadius: 6, border: '1px solid #d1d5db', backgroundColor: '#fff', fontSize: 14, cursor: 'pointer' }}
                  >닫기</button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default ScoreManagementPage;
