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
      <div
        style={{
          padding: 16,
          background: '#e6f4ea',
          borderRadius: 8,
          color: '#137333',
          fontSize: 14,
        }}
      >
        모든 검증을 통과했습니다.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {blocking.length > 0 && (
        <div
          style={{
            padding: 16,
            background: '#fce8e6',
            borderRadius: 8,
            border: '1px solid #f5c6cb',
          }}
        >
          <h4 style={{ margin: '0 0 8px', color: '#c5221f', fontSize: 14 }}>
            오류 (업로드 불가)
          </h4>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {blocking.map((e, i) => (
              <li key={i} style={{ color: '#c5221f', fontSize: 13, marginBottom: 4 }}>
                {e.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {warnings.length > 0 && (
        <div
          style={{
            padding: 16,
            background: '#fef7e0',
            borderRadius: 8,
            border: '1px solid #fdd835',
          }}
        >
          <h4 style={{ margin: '0 0 8px', color: '#e37400', fontSize: 14 }}>경고</h4>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {warnings.map((e, i) => (
              <li key={i} style={{ color: '#e37400', fontSize: 13, marginBottom: 4 }}>
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
