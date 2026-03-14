import { Button } from '../../components/ui/button';

interface ExamNavigationProps {
  onPrev?: () => void;
  onNext?: () => void;
  onShowAll?: () => void;
  showAllButton?: boolean;
  prevDisabled?: boolean;
  nextDisabled?: boolean;
  nextLabel?: string;
}

export default function ExamNavigation({
  onPrev,
  onNext,
  onShowAll,
  showAllButton = false,
  prevDisabled = false,
  nextDisabled = false,
  nextLabel = '다음 >',
}: ExamNavigationProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-muted border-t border-border flex items-center justify-between px-6 z-[1000]">
      <Button
        variant="outline"
        className="border-accent text-accent font-semibold px-6"
        onClick={onPrev}
        disabled={prevDisabled}
      >
        {'< 이전'}
      </Button>

      {showAllButton && (
        <Button
          variant="outline"
          className="border-accent/50 bg-accent/10 text-accent"
          onClick={onShowAll}
        >
          전체 문제
        </Button>
      )}

      <Button
        variant="outline"
        className="border-accent text-accent font-semibold px-6"
        onClick={onNext}
        disabled={nextDisabled}
      >
        {nextLabel}
      </Button>
    </div>
  );
}
