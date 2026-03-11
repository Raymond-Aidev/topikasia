interface ExamineeCardProps {
  seatNumber?: number | null;
  photoUrl?: string | null;
  registrationNumber?: string;
  name?: string;
  institutionName?: string | null;
  examRoomName?: string | null;
  showSignature?: boolean;
}

const styles = {
  card: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
    border: '1px solid #E0E0E0',
  },
  photo: {
    width: 72,
    height: 72,
    borderRadius: '50%',
    objectFit: 'cover' as const,
    backgroundColor: '#E0E0E0',
    border: '2px solid #1565C0',
    flexShrink: 0,
  },
  photoPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: '50%',
    backgroundColor: '#E0E0E0',
    border: '2px solid #1565C0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 28,
    color: '#9E9E9E',
    flexShrink: 0,
  },
  info: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 4,
  },
  label: {
    fontSize: 12,
    color: '#757575',
  },
  value: {
    fontSize: 15,
    fontWeight: 600 as const,
    color: '#212121',
  },
  seat: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#1565C0',
    color: '#fff',
    fontSize: 16,
    fontWeight: 700 as const,
    flexShrink: 0,
  },
  signatureArea: {
    marginTop: 8,
    width: 180,
    height: 48,
    border: '1px dashed #BDBDBD',
    borderRadius: 6,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    color: '#9E9E9E',
  },
};

export default function ExamineeCard({ seatNumber, photoUrl, registrationNumber, name, institutionName, examRoomName, showSignature = false }: ExamineeCardProps) {
  return (
    <div style={styles.card}>
      {seatNumber != null && <div style={styles.seat}>{seatNumber}</div>}

      {photoUrl ? (
        <img src={photoUrl} alt="응시자 사진" style={styles.photo} />
      ) : (
        <div style={styles.photoPlaceholder}>👤</div>
      )}

      <div style={styles.info}>
        <div>
          <span style={styles.label}>수험번호</span>
          <div style={styles.value}>{registrationNumber || '-'}</div>
        </div>
        <div>
          <span style={styles.label}>이름</span>
          <div style={styles.value}>{name || '-'}</div>
        </div>
        {institutionName && (
          <div>
            <span style={styles.label}>시험기관</span>
            <div style={styles.value}>{institutionName}</div>
          </div>
        )}
        {examRoomName && (
          <div>
            <span style={styles.label}>시험실</span>
            <div style={styles.value}>{examRoomName}</div>
          </div>
        )}
        {showSignature && <div style={styles.signatureArea}>서명 영역</div>}
      </div>
    </div>
  );
}
