import {
  Check,
  LoaderCircle,
  X,
  type ReiconIcon,
  type ReiconIconProps,
} from "@/components/Icones/Reicon";

import { cn } from "@/lib/utils";
import type { ActionFeedbackStatus } from "@/hooks/useActionFeedback";

type FeedbackIcon = ReiconIcon;

interface ActionFeedbackIconProps extends ReiconIconProps {
  status: ActionFeedbackStatus;
  icon: FeedbackIcon;
  successIcon?: FeedbackIcon;
  errorIcon?: FeedbackIcon;
}

export function ActionFeedbackIcon({
  status,
  icon: IdleIcon,
  successIcon: SuccessIcon = Check,
  errorIcon: ErrorIcon = X,
  className,
  ...iconProps
}: ActionFeedbackIconProps) {
  const Icon = status === "loading"
    ? LoaderCircle
    : status === "success"
      ? SuccessIcon
      : status === "error"
        ? ErrorIcon
        : IdleIcon;
  const stateClassName =
    status === "loading"
      ? "action-feedback-icon__item--loading"
      : status === "success"
        ? "action-feedback-icon__item--success text-emerald-600 dark:text-emerald-400"
        : status === "error"
          ? "action-feedback-icon__item--error text-destructive"
          : "";

  return (
    <span
      aria-hidden="true"
      data-feedback-status={status}
      className={cn("relative inline-flex size-4 shrink-0 items-center justify-center", className)}
    >
      <Icon
        key={status}
        {...iconProps}
        className={cn("action-feedback-icon__item absolute inset-0 size-full", stateClassName)}
      />
    </span>
  );
}
