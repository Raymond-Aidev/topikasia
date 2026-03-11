import React from 'react';

interface ExamSetScheduleInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const ExamSetScheduleInput: React.FC<ExamSetScheduleInputProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>
        시험 시작 예정 시각
      </label>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <input
          type="datetime-local"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid #d1d5db',
            fontSize: '14px',
            flex: 1,
          }}
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            disabled={disabled}
            style={{
              padding: '8px 14px',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              backgroundColor: '#fff',
              fontSize: '13px',
              cursor: disabled ? 'not-allowed' : 'pointer',
              color: '#6b7280',
            }}
          >
            초기화
          </button>
        )}
      </div>
      <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>
        시작 시각을 설정하면 해당 시간에 시험이 자동으로 시작됩니다. 비워두면 수동 시작 모드로 전환됩니다.
      </p>
    </div>
  );
};

export default ExamSetScheduleInput;
