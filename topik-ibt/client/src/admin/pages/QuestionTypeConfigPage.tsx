import React, { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { adminApi } from '../../api/adminApi';
import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/table';
import { Switch } from '../../components/ui/switch';

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
        <div className="py-10 text-center text-gray-400">로딩 중...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-[900px] mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="m-0 text-[22px] font-bold">문제 유형 설정</h2>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-500 text-white"
          >
            {saving ? '저장 중...' : '저장'}
          </Button>
        </div>

        {error && (
          <div className="px-4 py-2.5 bg-red-50 text-red-600 rounded-md mb-4 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="px-4 py-2.5 bg-green-50 text-green-700 rounded-md mb-4 text-sm">
            {success}
          </div>
        )}

        {/* Section filter */}
        <div className="flex gap-2 mb-5">
          {SECTION_FILTERS.map((f) => (
            <Button
              key={f}
              variant={sectionFilter === f ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSectionFilter(f)}
              className={cn(
                'rounded-full',
                sectionFilter === f && 'bg-blue-600 hover:bg-blue-500 text-white'
              )}
            >
              {f === 'ALL' ? '전체' : SECTION_LABELS[f] || f}
            </Button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>코드</TableHead>
                <TableHead>이름</TableHead>
                <TableHead>영역</TableHead>
                <TableHead className="text-center">활성</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTypes.map((t) => (
                <TableRow key={t.code}>
                  <TableCell className="font-mono text-[13px] text-gray-700">
                    {t.code}
                  </TableCell>
                  <TableCell className="text-sm">
                    {t.name}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={cn(
                        t.section === 'LISTENING' && 'bg-blue-100 text-blue-800',
                        t.section === 'WRITING' && 'bg-orange-100 text-orange-800',
                        t.section === 'READING' && 'bg-green-100 text-green-800'
                      )}
                    >
                      {SECTION_LABELS[t.section] || t.section}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={t.isActive}
                      onCheckedChange={() => handleToggle(t.code)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredTypes.length === 0 && (
          <div className="py-10 text-center text-gray-400 text-sm">
            해당 영역의 문제 유형이 없습니다.
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default QuestionTypeConfigPage;
