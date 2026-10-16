import { useId, type ComponentProps } from 'react';
import { Button } from './UiPrimitives';

type ReferenceCopyButtonProps = Omit<
  ComponentProps<typeof Button>,
  'children' | 'color' | 'disabled' | 'onClick' | 'shape' | 'size'
> & {
  hasSelection: boolean;
  disabled?: boolean;
  disabledReason?: string;
  onCopy: () => void | Promise<void>;
};

export function ReferenceCopyButton({
  hasSelection,
  disabled = false,
  disabledReason,
  onCopy,
  ...props
}: ReferenceCopyButtonProps) {
  const disabledReasonId = useId();
  const isDisabled = disabled || !hasSelection;
  const showDisabledReason = disabled && disabledReason != null;

  return (
    <>
      <Button
        {...props}
        color="black"
        size="sm"
        shape="square"
        disabled={isDisabled}
        aria-describedby={showDisabledReason ? disabledReasonId : props['aria-describedby']}
        onClick={() => void onCopy()}
      >
        복사 적용하기
      </Button>
      {showDisabledReason && (
        <span id={disabledReasonId} className="text-xs font-medium text-font-g">
          {disabledReason}
        </span>
      )}
    </>
  );
}
