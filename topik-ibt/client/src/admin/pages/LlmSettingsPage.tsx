import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api/adminApi';
import AdminLayout from '../components/AdminLayout';

interface LlmSettings {
  provider: string;
  model: string;
  hasApiKey: boolean;
}

interface TestResult {
  result: string;
  model?: string;
  explanation?: string;
  message?: string;
}

const LlmSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<LlmSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await adminApi.get('/admin/llm-settings');
      setSettings(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'LLM 설정을 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    try {
      setTesting(true);
      setTestResult(null);
      const res = await adminApi.post('/admin/llm-settings/test');
      setTestResult(res.data.data);
    } catch (err: any) {
      setTestResult({
        result: 'error',
        message: err.response?.data?.message || '테스트 요청에 실패했습니다.',
      });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>불러오는 중...</div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div style={{ padding: '40px', textAlign: 'center', color: '#dc2626' }}>{error}</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#111827' }}>LLM 설정</h1>
        <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
          해설 생성에 사용되는 LLM 설정을 확인합니다.
        </p>
      </div>

      {/* 설정 정보 패널 */}
      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          padding: '24px',
          marginBottom: '24px',
        }}
      >
        <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: '#111827' }}>
          현재 설정
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
          <div
            style={{
              padding: '16px',
              backgroundColor: '#f9fafb',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', marginBottom: '4px', textTransform: 'uppercase' }}>
              Provider
            </div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#111827' }}>
              {settings?.provider === 'anthropic' ? 'Anthropic' : 'OpenAI'}
            </div>
          </div>
          <div
            style={{
              padding: '16px',
              backgroundColor: '#f9fafb',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', marginBottom: '4px', textTransform: 'uppercase' }}>
              Model
            </div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#111827' }}>
              {settings?.model}
            </div>
          </div>
          <div
            style={{
              padding: '16px',
              backgroundColor: '#f9fafb',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', marginBottom: '4px', textTransform: 'uppercase' }}>
              API Key
            </div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: settings?.hasApiKey ? '#059669' : '#dc2626' }}>
              {settings?.hasApiKey ? '설정됨' : '미설정'}
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop: '16px',
            padding: '12px 16px',
            backgroundColor: '#eff6ff',
            borderRadius: '6px',
            border: '1px solid #bfdbfe',
            fontSize: '13px',
            color: '#1e40af',
            lineHeight: '1.5',
          }}
        >
          LLM 설정은 서버 환경변수(LLM_PROVIDER, LLM_MODEL, LLM_API_KEY)를 통해 구성됩니다.
          설정을 변경하려면 서버 환경변수를 수정한 후 재시작하세요.
        </div>
      </div>

      {/* 해설 테스트 */}
      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          padding: '24px',
        }}
      >
        <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: '#111827' }}>
          해설 테스트
        </h2>
        <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>
          LLM API 연결 상태를 확인하고 테스트 해설을 생성합니다.
        </p>
        <button
          onClick={handleTest}
          disabled={testing || !settings?.hasApiKey}
          style={{
            padding: '10px 20px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: !settings?.hasApiKey ? '#d1d5db' : '#1e293b',
            color: '#fff',
            fontSize: '14px',
            fontWeight: 600,
            cursor: testing || !settings?.hasApiKey ? 'not-allowed' : 'pointer',
            opacity: testing ? 0.6 : 1,
          }}
        >
          {testing ? '생성 중...' : '해설 테스트'}
        </button>

        {!settings?.hasApiKey && (
          <p style={{ fontSize: '12px', color: '#dc2626', marginTop: '8px' }}>
            API 키가 설정되지 않아 테스트를 실행할 수 없습니다.
          </p>
        )}

        {testResult && (
          <div
            style={{
              marginTop: '16px',
              padding: '16px',
              borderRadius: '8px',
              border: '1px solid',
              borderColor: testResult.result === 'ok' ? '#a7f3d0' : '#fecaca',
              backgroundColor: testResult.result === 'ok' ? '#ecfdf5' : '#fef2f2',
            }}
          >
            {testResult.result === 'ok' ? (
              <>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#065f46', marginBottom: '8px' }}>
                  테스트 성공 (모델: {testResult.model})
                </div>
                <div
                  style={{
                    fontSize: '13px',
                    color: '#374151',
                    lineHeight: '1.6',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {testResult.explanation}
                </div>
              </>
            ) : (
              <div style={{ fontSize: '13px', color: '#991b1b' }}>
                {testResult.message}
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default LlmSettingsPage;
