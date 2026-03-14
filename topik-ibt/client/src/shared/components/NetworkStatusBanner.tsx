import { useExamStore } from '../../store/examStore';

export default function NetworkStatusBanner() {
  const hasNetworkError = useExamStore((s) => s.hasNetworkError);

  if (!hasNetworkError) return null;

  return (
    <div className="fixed top-14 left-0 right-0 bg-orange-500 text-white text-center py-2 px-4 text-sm font-semibold z-[999]">
      네트워크 연결이 불안정합니다. 답안 저장에 실패할 수 있습니다.
    </div>
  );
}
