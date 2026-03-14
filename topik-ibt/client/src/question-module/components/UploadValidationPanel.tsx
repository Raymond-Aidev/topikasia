import React from 'react';

export interface ValidationError {
  message: string;
  blocking: boolean;
}

interface Props {
  errors: ValidationError[];
}

const UploadValidationPanel: React.FC<Props> = ({ errors }) => {
  const blocking = errors.filter((e) => e.blocking);
  const warnings = errors.filter((e) => !e.blocking);

  if (errors.length === 0) {
    return (
      <div className="p-4 bg-green-50 rounded-lg text-green-800 text-sm">
        모든 검증을 통과했습니다.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {blocking.length > 0 && (
        <div className="p-4 bg-red-50 rounded-lg border border-red-200">
          <h4 className="m-0 mb-2 text-red-700 text-sm">
            오류 (업로드 불가)
          </h4>
          <ul className="m-0 pl-5">
            {blocking.map((e, i) => (
              <li key={i} className="text-red-700 text-[13px] mb-1">
                {e.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {warnings.length > 0 && (
        <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-400">
          <h4 className="m-0 mb-2 text-amber-600 text-sm">경고</h4>
          <ul className="m-0 pl-5">
            {warnings.map((e, i) => (
              <li key={i} className="text-amber-600 text-[13px] mb-1">
                {e.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default UploadValidationPanel;
