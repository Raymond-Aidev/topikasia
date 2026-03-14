interface ExamineeCardProps {
  seatNumber?: number | null;
  photoUrl?: string | null;
  registrationNumber?: string;
  name?: string;
  institutionName?: string | null;
  examRoomName?: string | null;
  showSignature?: boolean;
}

export default function ExamineeCard({ seatNumber, photoUrl, registrationNumber, name, institutionName, examRoomName, showSignature = false }: ExamineeCardProps) {
  return (
    <div className="flex items-center gap-4 p-5 bg-white rounded-xl shadow-sm border border-gray-300">
      {seatNumber != null && (
        <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-blue-800 text-white text-base font-bold shrink-0">
          {seatNumber}
        </div>
      )}

      {photoUrl ? (
        <img src={photoUrl} alt="응시자 사진" className="w-[72px] h-[72px] rounded-full object-cover bg-gray-300 border-2 border-blue-800 shrink-0" />
      ) : (
        <div className="w-[72px] h-[72px] rounded-full bg-gray-300 border-2 border-blue-800 flex items-center justify-center text-[28px] text-gray-400 shrink-0">
          👤
        </div>
      )}

      <div className="flex flex-col gap-1">
        <div>
          <span className="text-xs text-gray-500">수험번호</span>
          <div className="text-[15px] font-semibold text-gray-900">{registrationNumber || '-'}</div>
        </div>
        <div>
          <span className="text-xs text-gray-500">이름</span>
          <div className="text-[15px] font-semibold text-gray-900">{name || '-'}</div>
        </div>
        {institutionName && (
          <div>
            <span className="text-xs text-gray-500">시험기관</span>
            <div className="text-[15px] font-semibold text-gray-900">{institutionName}</div>
          </div>
        )}
        {examRoomName && (
          <div>
            <span className="text-xs text-gray-500">시험실</span>
            <div className="text-[15px] font-semibold text-gray-900">{examRoomName}</div>
          </div>
        )}
        {showSignature && (
          <div className="mt-2 w-[180px] h-12 border border-dashed border-gray-400 rounded-md flex items-center justify-center text-xs text-gray-400">
            서명 영역
          </div>
        )}
      </div>
    </div>
  );
}
