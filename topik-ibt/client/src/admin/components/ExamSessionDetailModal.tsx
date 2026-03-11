import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api/adminApi';
import StatusBadge from './StatusBadge';

interface ExamSessionDetailModalProps {
  isOpen: boolean;
  sessionId: string | null;
  onClose: () => void;
}

interface SectionProgress {
  section: string;
  startedAt: string | null;
  submittedAt: string | null;
  status: string;
}

interface SessionDetail {
  id: string;
  examineeName: string;
  examSetName: string;
  startedAt: string;
  endedAt: string | null;
  status: string;
  sections: SectionProgress[];
  answers?: {
    questionNumber: number;
    section: string;
    selectedAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
  }[];
}

const modalOverlay: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.5)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000,
};

const modalContent: React.CSSProperties = {
  backgroundColor: '#fff',
  borderRadius: '12px',
  padding: '32px',
  width: '680px',
  maxHeight: '85vh',
  overflowY: 'auto',
  boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
};

const thStyle: React.CSSProperties = {
  padding: '8px 12px',
  textAlign: 'left',
  fontSize: '13px',
  fontWeight: 600,
  color: '#374151',
  borderBottom: '2px solid #e5e7eb',
};

const tdStyle: React.CSSProperties = {
  padding: '8px 12px',
  fontSize: '13px',
  color: '#111827',
  borderBottom: '1px solid #f3f4f6',
};

const ExamSessionDetailModal: React.FC<ExamSessionDetailModalProps> = ({ isOpen, sessionId, onClose }) => {
  const [detail, setDetail] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);

  useEffect(() => {
    if (!isOpen || !sessionId) return;
    setLoading(true);
    setShowAnswers(false);
    adminApi
      .get(`/admin/exam-sessions/${sessionId}`)
      .then((res) => setDetail(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isOpen, sessionId]);

  if (!isOpen) return null;

  const formatDate = (d: string | null) => {
    if (!d) return '-';
    return new Date(d).toLocaleString('ko-KR');
  };

  const sectionLabel = (s: string) => {
    const map: Record<string, string> = { LISTENING: '듣기', WRITING: '쓰기', READING: '읽기' };
    return map[s] || s;
  };

  return (
    <div style={modalOverlay} onClick={onClose}>
      <div style={modalContent} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '18px', color: '#111827' }}>응시 상세</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#6b7280' }}>
            x
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>불러오는 중...</div>
        ) : detail ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
              <div><span style={{ fontSize: '12px', color: '#6b7280' }}>응시자</span><div style={{ fontWeight: 600 }}>{detail.examineeName}</div></div>
              <div><span style={{ fontSize: '12px', color: '#6b7280' }}>시험세트</span><div style={{ fontWeight: 600 }}>{detail.examSetName}</div></div>
              <div><span style={{ fontSize: '12px', color: '#6b7280' }}>시작시간</span><div>{formatDate(detail.startedAt)}</div></div>
              <div><span style={{ fontSize: '12px', color: '#6b7280' }}>종료시간</span><div>{formatDate(detail.endedAt)}</div></div>
              <div><span style={{ fontSize: '12px', color: '#6b7280' }}>상태</span><div><StatusBadge status={detail.status} type="session" /></div></div>
            </div>

            <h3 style={{ fontSize: '15px', marginBottom: '10px', color: '#111827' }}>영역별 진행 상황</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
              <thead>
                <tr>
                  <th style={thStyle}>영역</th>
                  <th style={thStyle}>시작시간</th>
                  <th style={thStyle}>제출시간</th>
                  <th style={thStyle}>상태</th>
                </tr>
              </thead>
              <tbody>
                {detail.sections.map((sec, i) => (
                  <tr key={i}>
                    <td style={tdStyle}>{sectionLabel(sec.section)}</td>
                    <td style={tdStyle}>{formatDate(sec.startedAt)}</td>
                    <td style={tdStyle}>{formatDate(sec.submittedAt)}</td>
                    <td style={tdStyle}><StatusBadge status={sec.status} type="session" /></td>
                  </tr>
                ))}
              </tbody>
            </table>

            {detail.answers && detail.answers.length > 0 && (
              <>
                <button
                  onClick={() => setShowAnswers(!showAnswers)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '6px',
                    border: '1px solid #d1d5db',
                    backgroundColor: '#fff',
                    fontSize: '13px',
                    cursor: 'pointer',
                    marginBottom: '12px',
                  }}
                >
                  {showAnswers ? '답안 접기' : '답안 보기'}
                </button>
                {showAnswers && (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={thStyle}>#</th>
                        <th style={thStyle}>영역</th>
                        <th style={thStyle}>선택</th>
                        <th style={thStyle}>정답</th>
                        <th style={thStyle}>결과</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.answers.map((a, i) => (
                        <tr key={i}>
                          <td style={tdStyle}>{a.questionNumber}</td>
                          <td style={tdStyle}>{sectionLabel(a.section)}</td>
                          <td style={tdStyle}>{a.selectedAnswer || '-'}</td>
                          <td style={tdStyle}>{a.correctAnswer}</td>
                          <td style={{ ...tdStyle, color: a.isCorrect ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
                            {a.isCorrect ? 'O' : 'X'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </>
            )}
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>데이터를 불러올 수 없습니다.</div>
        )}
      </div>
    </div>
  );
};

export default ExamSessionDetailModal;
