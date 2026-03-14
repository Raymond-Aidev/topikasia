import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api/adminApi';
import AdminLayout from '../components/AdminLayout';
import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

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
        <div className="py-10 text-center text-gray-500">불러오는 중...</div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="py-10 text-center text-red-600">{error}</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">LLM 설정</h1>
        <p className="text-sm text-gray-500 mt-1">
          해설 생성에 사용되는 LLM 설정을 확인합니다.
        </p>
      </div>

      {/* 설정 정보 패널 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>현재 설정</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-xs font-semibold text-gray-500 mb-1 uppercase">Provider</div>
              <div className="text-lg font-bold text-gray-900">
                {settings?.provider === 'anthropic' ? 'Anthropic' : 'OpenAI'}
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-xs font-semibold text-gray-500 mb-1 uppercase">Model</div>
              <div className="text-lg font-bold text-gray-900">
                {settings?.model}
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-xs font-semibold text-gray-500 mb-1 uppercase">API Key</div>
              <div className={cn('text-lg font-bold', settings?.hasApiKey ? 'text-emerald-600' : 'text-red-600')}>
                {settings?.hasApiKey ? '설정됨' : '미설정'}
              </div>
            </div>
          </div>

          <div className="mt-4 px-4 py-3 bg-blue-50 rounded-md border border-blue-200 text-[13px] text-blue-800 leading-relaxed">
            LLM 설정은 서버 환경변수(LLM_PROVIDER, LLM_MODEL, LLM_API_KEY)를 통해 구성됩니다.
            설정을 변경하려면 서버 환경변수를 수정한 후 재시작하세요.
          </div>
        </CardContent>
      </Card>

      {/* 해설 테스트 */}
      <Card>
        <CardHeader>
          <CardTitle>해설 테스트</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-[13px] text-gray-500 mb-4">
            LLM API 연결 상태를 확인하고 테스트 해설을 생성합니다.
          </p>
          <Button
            onClick={handleTest}
            disabled={testing || !settings?.hasApiKey}
            className={cn(
              'text-white',
              !settings?.hasApiKey ? 'bg-gray-300' : 'bg-slate-800 hover:bg-slate-700'
            )}
          >
            {testing ? '생성 중...' : '해설 테스트'}
          </Button>

          {!settings?.hasApiKey && (
            <p className="text-xs text-red-600 mt-2">
              API 키가 설정되지 않아 테스트를 실행할 수 없습니다.
            </p>
          )}

          {testResult && (
            <div
              className={cn(
                'mt-4 p-4 rounded-lg border',
                testResult.result === 'ok'
                  ? 'border-green-300 bg-green-50'
                  : 'border-red-300 bg-red-50'
              )}
            >
              {testResult.result === 'ok' ? (
                <>
                  <div className="text-[13px] font-semibold text-green-800 mb-2">
                    테스트 성공 (모델: {testResult.model})
                  </div>
                  <div className="text-[13px] text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {testResult.explanation}
                  </div>
                </>
              ) : (
                <div className="text-[13px] text-red-800">
                  {testResult.message}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default LlmSettingsPage;
