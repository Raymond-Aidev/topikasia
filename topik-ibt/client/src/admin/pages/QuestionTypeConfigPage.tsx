import React, { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { adminApi } from '../../api/adminApi';

interface QuestionTypeItem {
  code: string;
  name: string;
  section: string;
  isActive: boolean;
}

const SECTION_LABELS: Record<string, string> = {
  LISTENING: '듣기',
  WRITING: '쓰기',
  READING: '읽기',
};

const SECTION_FILTERS = ['ALL', 'LISTENING', 'WRITING', 'READING'] as const;

const QuestionTypeConfigPage: React.FC = () => {
  const [types, setTypes] = useState<QuestionTypeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [sectionFilter, setSectionFilter] = useState<string>('ALL');

  useEffect(() => {
    fetchTypes();
  }, []);

  const fetchTypes = async () => {
    try {
      const { data } = await adminApi.get('/admin/question-types');
      setTypes(data.data);
    } catch {
      setError('문제 유형 목록을 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (code: string) => {
    setTypes((prev) =>
      prev.map((t) => (t.code === code ? { ...t, isActive: !t.isActive } : t))
    );
    setSuccess('');
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const updates = types.map((t) => ({ code: t.code, isActive: t.isActive }));
      const { data } = await adminApi.put('/admin/question-types', { updates });
      setTypes(data.data);
      setSuccess('저장되었습니다.');
    } catch {
      setError('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const filteredTypes =
    sectionFilter === 'ALL' ? types : types.filter((t) => t.section === sectionFilter);

  if (loading) {
    return (
      <AdminLayout>
        <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>로딩 중...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ margin: 0, fontSize: 22 }}>문제 유형 설정</h2>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '10px 24px',
              borderRadius: 6,
              border: 'none',
              background: '#1a73e8',
              color: '#fff',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>

        {error && (
          <div style={{ padding: '10px 16px', background: '#fce8e6', color: '#d93025', borderRadius: 6, marginBottom: 16, fontSize: 14 }}>
            {error}
          </div>
        )}
        {success && (
          <div style={{ padding: '10px 16px', background: '#e6f4ea', color: '#137333', borderRadius: 6, marginBottom: 16, fontSize: 14 }}>
            {success}
          </div>
        )}

        {/* Section filter */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {SECTION_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setSectionFilter(f)}
              style={{
                padding: '6px 16px',
                borderRadius: 20,
                border: sectionFilter === f ? '2px solid #1a73e8' : '1px solid #ddd',
                background: sectionFilter === f ? '#e8f0fe' : '#fff',
                color: sectionFilter === f ? '#1a73e8' : '#333',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: sectionFilter === f ? 600 : 400,
              }}
            >
              {f === 'ALL' ? '전체' : SECTION_LABELS[f] || f}
            </button>
          ))}
        </div>

        {/* Table */}
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            background: '#fff',
            borderRadius: 8,
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          <thead>
            <tr style={{ background: '#f8f9fa', textAlign: 'left' }}>
              <th style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: '#555' }}>
                코드
              </th>
              <th style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: '#555' }}>
                이름
              </th>
              <th style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: '#555' }}>
                영역
              </th>
              <th style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: '#555', textAlign: 'center' }}>
                활성
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredTypes.map((t) => (
              <tr
                key={t.code}
                style={{ borderTop: '1px solid #eee' }}
              >
                <td style={{ padding: '10px 16px', fontSize: 13, fontFamily: 'monospace', color: '#333' }}>
                  {t.code}
                </td>
                <td style={{ padding: '10px 16px', fontSize: 14, color: '#222' }}>
                  {t.name}
                </td>
                <td style={{ padding: '10px 16px', fontSize: 13 }}>
                  <span
                    style={{
                      padding: '2px 10px',
                      borderRadius: 12,
                      fontSize: 12,
                      fontWeight: 500,
                      background:
                        t.section === 'LISTENING'
                          ? '#e3f2fd'
                          : t.section === 'WRITING'
                          ? '#fff3e0'
                          : '#e8f5e9',
                      color:
                        t.section === 'LISTENING'
                          ? '#1565c0'
                          : t.section === 'WRITING'
                          ? '#e65100'
                          : '#2e7d32',
                    }}
                  >
                    {SECTION_LABELS[t.section] || t.section}
                  </span>
                </td>
                <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                  <label
                    style={{
                      position: 'relative',
                      display: 'inline-block',
                      width: 44,
                      height: 24,
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={t.isActive}
                      onChange={() => handleToggle(t.code)}
                      style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }}
                    />
                    <span
                      style={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: 12,
                        background: t.isActive ? '#1a73e8' : '#ccc',
                        transition: 'background 0.2s',
                      }}
                    />
                    <span
                      style={{
                        position: 'absolute',
                        top: 2,
                        left: t.isActive ? 22 : 2,
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        background: '#fff',
                        transition: 'left 0.2s',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                      }}
                    />
                  </label>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredTypes.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: '#888', fontSize: 14 }}>
            해당 영역의 문제 유형이 없습니다.
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default QuestionTypeConfigPage;
