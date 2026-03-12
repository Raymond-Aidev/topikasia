import React, { useState } from 'react';
import type { QuestionTypeConfig } from '../config/questionTypes.config';
import type { QuestionBankItem } from '../api/questionBankApi';
import { fetchQuestionsFromBank } from '../api/questionBankMock';
import { useImportedQuestionsStore } from '../store/importedQuestionsStore';
import QuestionTypeRow from './QuestionTypeRow';
import QuestionSelectDrawer from './QuestionSelectDrawer';

interface Props {
  types: QuestionTypeConfig[];
  sectionLabel: string;
}

const QuestionBankImporter: React.FC<Props> = ({ types, sectionLabel }) => {
  const { selectedByType, setSelected } = useImportedQuestionsStore();
  const [loadedMap, setLoadedMap] = useState<Record<string, QuestionBankItem[]>>({});
  const [loadingSet, setLoadingSet] = useState<Set<string>>(new Set());
  const [drawerType, setDrawerType] = useState<QuestionTypeConfig | null>(null);

  const handleImport = async (config: QuestionTypeConfig) => {
    setLoadingSet((prev) => new Set(prev).add(config.code));
    try {
      const res = await fetchQuestionsFromBank({ typeCode: config.code });
      setLoadedMap((prev) => ({ ...prev, [config.code]: res.items }));
      setDrawerType(config);
    } finally {
      setLoadingSet((prev) => {
        const next = new Set(prev);
        next.delete(config.code);
        return next;
      });
    }
  };

  return (
    <div style={{ marginBottom: 24 }}>
      <h3
        style={{
          margin: '0 0 8px',
          padding: '8px 16px',
          background: '#f8f9fa',
          borderRadius: 8,
          fontSize: 15,
        }}
      >
        {sectionLabel}
      </h3>
      {types.map((t) => (
        <QuestionTypeRow
          key={t.code}
          config={t}
          loadedCount={loadedMap[t.code]?.length ?? 0}
          selectedCount={selectedByType[t.code]?.length ?? 0}
          onImport={() => handleImport(t)}
          loading={loadingSet.has(t.code)}
        />
      ))}

      {drawerType && (
        <QuestionSelectDrawer
          typeCode={drawerType.code}
          typeName={drawerType.name}
          initialSelected={selectedByType[drawerType.code] ?? []}
          onConfirm={(items) => {
            setSelected(drawerType.code, items);
            setDrawerType(null);
          }}
          onCancel={() => setDrawerType(null)}
        />
      )}
    </div>
  );
};

export default QuestionBankImporter;
