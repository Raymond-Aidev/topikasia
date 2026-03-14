import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuestionTypes } from '../hooks/useQuestionTypes';
import { useImportedQuestionsStore } from '../store/importedQuestionsStore';
import QuestionBankImporter from '../components/QuestionBankImporter';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';

const SECTIONS = [
  { key: 'LISTENING' as const, label: '듣기' },
  { key: 'WRITING' as const, label: '쓰기' },
  { key: 'READING' as const, label: '읽기' },
];

const QuestionBankImportPage: React.FC = () => {
  const navigate = useNavigate();
  const allTypes = useQuestionTypes();
  const { getSelectedBySection, getAllSelected } = useImportedQuestionsStore();

  const totalSelected = getAllSelected().length;

  return (
    <div className="mx-auto max-w-[900px] px-6 py-8">
      <h2 className="mb-2 text-[22px] font-bold">문제 은행 불러오기</h2>
      <p className="mb-6 text-sm text-muted-foreground">
        영역별 문제 유형을 선택하여 문제를 불러옵니다.
      </p>

      {SECTIONS.map(({ key, label }) => {
        const sectionTypes = allTypes.filter((t) => t.section === key);
        return (
          <QuestionBankImporter key={key} types={sectionTypes} sectionLabel={label} />
        );
      })}

      {/* Summary footer */}
      <Card className="mt-6">
        <CardContent className="flex items-center justify-between">
          <div className="text-sm">
            {SECTIONS.map(({ key, label }) => (
              <span key={key} className="mr-5">
                <strong>{label}</strong>: {getSelectedBySection(key).length}개
              </span>
            ))}
            <span className="ml-2 font-bold">
              | 총 {totalSelected}개 선택됨
            </span>
          </div>

          <Button
            onClick={() => navigate('/question-module/compose')}
            disabled={totalSelected === 0}
            size="lg"
            className="text-[15px] font-semibold"
          >
            세트 구성으로 이동 →
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuestionBankImportPage;
