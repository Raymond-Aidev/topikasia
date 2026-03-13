/**
 * 시험별 안내 페이지
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GlobalNavigationBar, { GNB_HEIGHT, GNB_HEIGHT_MOBILE } from '../../shared/components/GlobalNavigationBar';
import { useResponsive } from '../../shared/hooks/useResponsive';
import Footer from '../../shared/components/Footer';
import { fetchSchedules } from '../api/registrationApi';
import { useRegistrationStore } from '../store/registrationStore';
import type { ExamSchedule } from '../types/registration.types';

const STATUS_LABELS: Record<string, string> = {
  UPCOMING: '예정',
  OPEN: '접수중',
  CLOSED: '마감',
  COMPLETED: '종료',
};

const STATUS_COLORS: Record<string, string> = {
  OPEN: '#4CAF50',
  CLOSED: '#9E9E9E',
  UPCOMING: '#E0E0E0',
  COMPLETED: '#BDBDBD',
};

const EXAM_INFO = [
  { icon: '📝', title: 'TOPIK I (초급)', desc: '듣기 40분 + 읽기 60분 = 100분, 200점 만점', level: '1급~2급' },
  { icon: '📚', title: 'TOPIK II (중·고급)', desc: '듣기 60분 + 쓰기 50분 + 읽기 70분 = 180분, 300점 만점', level: '3급~6급' },
];

export default function ExamSchedulePage() {
  const { isMobile, isTablet } = useResponsive();
  const compact = isMobile || isTablet;
  const topPad = compact ? GNB_HEIGHT_MOBILE : GNB_HEIGHT;
  const px = isMobile ? '16px' : '24px';
  const navigate = useNavigate();
  const selectSchedule = useRegistrationStore((s) => s.selectSchedule);
  const isLoggedIn = useRegistrationStore((s) => s.isLoggedIn);

  const [schedules, setSchedules] = useState<ExamSchedule[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSchedules()
      .then(setSchedules)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleRowClick = (sch: ExamSchedule) => {
    if (sch.status !== 'OPEN') return;
    setSelectedId(sch.id);
  };

  const handleApply = () => {
    const sch = schedules.find((s) => s.id === selectedId);
    if (!sch) return;
    selectSchedule(sch);
    navigate(isLoggedIn ? '/registration/apply' : '/registration/login');
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F5F5F5', fontFamily: 'sans-serif', paddingTop: topPad }}>
      <GlobalNavigationBar />

      {/* 히어로 */}
      <div style={{
        background: 'linear-gradient(135deg, #1565C0 0%, #0D47A1 60%, #1A237E 100%)',
        color: '#FFFFFF', textAlign: 'center',
        padding: isMobile ? '48px 16px' : '64px 24px',
      }}>
        <div style={{ fontSize: isMobile ? 28 : 40, fontWeight: 800, marginBottom: 12 }}>시험별 안내</div>
        <div style={{ fontSize: isMobile ? 14 : 18, opacity: 0.9, lineHeight: 1.6 }}>
          TOPIK I · TOPIK II 시험 일정을 확인하고 접수하세요
        </div>
      </div>

      {/* 시험 유형 소개 카드 */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: `48px ${px}` }}>
        <div style={{ fontSize: isMobile ? 22 : 28, fontWeight: 800, color: '#111827', textAlign: 'center', marginBottom: 32 }}>
          시험 유형
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: 24 }}>
          {EXAM_INFO.map((info) => (
            <div key={info.title} style={{
              backgroundColor: '#FFFFFF', borderRadius: 16, padding: isMobile ? '24px 20px' : '32px 28px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
            }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>{info.icon}</div>
              <div style={{ fontSize: isMobile ? 18 : 20, fontWeight: 700, color: '#1565C0', marginBottom: 8 }}>{info.title}</div>
              <div style={{ fontSize: 14, color: '#616161', lineHeight: 1.6, marginBottom: 12 }}>{info.desc}</div>
              <div style={{
                display: 'inline-block', padding: '4px 14px', borderRadius: 12,
                fontSize: 13, fontWeight: 600, backgroundColor: '#E3F2FD', color: '#1565C0',
              }}>
                {info.level}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 시험 일정 테이블 */}
      <div style={{ backgroundColor: '#FFFFFF', padding: `56px ${px}` }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ fontSize: isMobile ? 22 : 28, fontWeight: 800, color: '#111827', marginBottom: 32 }}>
            시험 일정
          </div>

          {loading && (
            <div style={{ textAlign: 'center', padding: 40, color: '#9E9E9E', fontSize: 15 }}>불러오는 중...</div>
          )}

          {!loading && schedules.length === 0 && (
            <div style={{ textAlign: 'center', padding: 60, color: '#9E9E9E', fontSize: 15 }}>
              등록된 시험 일정이 없습니다.
            </div>
          )}

          {!loading && schedules.length > 0 && (
            <>
              <div style={{ overflowX: isMobile ? 'auto' : undefined }}>
                <table style={{
                  width: '100%', borderCollapse: 'collapse',
                  backgroundColor: '#fff', borderRadius: 12,
                  overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                  minWidth: isMobile ? 600 : undefined,
                }}>
                  <thead>
                    <tr>
                      {['회차', '시험유형', '시험일', '접수마감', '잔여석', '상태'].map((h) => (
                        <th key={h} style={{
                          padding: '14px 16px', backgroundColor: '#F5F5F5',
                          fontWeight: 600, fontSize: 13, color: '#616161',
                          textAlign: 'left', borderBottom: '1px solid #E0E0E0',
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {schedules.map((sch) => {
                      const totalSeats = sch.venues.reduce((a, v) => a + v.capacity, 0);
                      const remaining = sch.venues.reduce((a, v) => a + v.remainingSeats, 0);
                      return (
                        <tr
                          key={sch.id}
                          style={{
                            backgroundColor: selectedId === sch.id ? '#E3F2FD' : '#fff',
                            cursor: sch.status === 'OPEN' ? 'pointer' : 'default',
                            transition: 'background-color 0.15s',
                          }}
                          onClick={() => handleRowClick(sch)}
                        >
                          <td style={{ padding: '14px 16px', fontSize: 14, color: '#212121', borderBottom: '1px solid #F5F5F5' }}>제{sch.examNumber}회</td>
                          <td style={{ padding: '14px 16px', fontSize: 14, color: '#212121', borderBottom: '1px solid #F5F5F5' }}>
                            {sch.examType === 'TOPIK_I' ? 'TOPIK I' : 'TOPIK II'}
                          </td>
                          <td style={{ padding: '14px 16px', fontSize: 14, color: '#212121', borderBottom: '1px solid #F5F5F5' }}>{sch.examDate}</td>
                          <td style={{ padding: '14px 16px', fontSize: 14, color: '#212121', borderBottom: '1px solid #F5F5F5' }}>{sch.registrationEndDate}</td>
                          <td style={{ padding: '14px 16px', fontSize: 14, color: '#212121', borderBottom: '1px solid #F5F5F5' }}>
                            {sch.status === 'OPEN' ? `${remaining}/${totalSeats}` : '-'}
                          </td>
                          <td style={{ padding: '14px 16px', fontSize: 14, borderBottom: '1px solid #F5F5F5' }}>
                            <span style={{
                              display: 'inline-block', padding: '4px 12px', borderRadius: 12,
                              fontSize: 12, fontWeight: 600,
                              color: sch.status === 'OPEN' || sch.status === 'CLOSED' ? '#fff' : '#757575',
                              backgroundColor: STATUS_COLORS[sch.status] || '#E0E0E0',
                            }}>
                              {STATUS_LABELS[sch.status] || sch.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div style={{ textAlign: 'center', marginTop: 32 }}>
                <button
                  style={{
                    padding: '14px 48px', fontSize: 16, fontWeight: 700,
                    color: '#fff', backgroundColor: selectedId ? '#1565C0' : '#90CAF9',
                    border: 'none', borderRadius: 8,
                    cursor: selectedId ? 'pointer' : 'not-allowed',
                  }}
                  onClick={handleApply}
                  disabled={!selectedId}
                >
                  접수하기
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 접수 안내 */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: `48px ${px}` }}>
        <div style={{ fontSize: isMobile ? 22 : 28, fontWeight: 800, color: '#111827', marginBottom: 24 }}>
          접수 안내
        </div>
        {[
          '접수중인 시험을 선택한 후 "접수하기" 버튼을 클릭하세요.',
          '로그인 후 개인정보 입력 → 시험장 선택 → 사진 업로드 → 최종 확인 순서로 진행됩니다.',
          '접수 완료 후 마이페이지에서 수험표를 다운로드할 수 있습니다.',
          '접수 취소는 시험일 3일 전까지 가능합니다.',
        ].map((text, i) => (
          <div key={i} style={{
            backgroundColor: '#FFFFFF', borderRadius: 12,
            padding: isMobile ? '16px' : '20px 28px',
            marginBottom: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            fontSize: 15, color: '#374151', lineHeight: 1.6,
          }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 24, height: 24, borderRadius: '50%', backgroundColor: '#1565C0', color: '#FFF',
              fontSize: 12, fontWeight: 700, marginRight: 12,
            }}>{i + 1}</span>
            {text}
          </div>
        ))}
      </div>

      <Footer />
    </div>
  );
}
