"use client";

import { IconButton } from "@radix-ui/themes";
import { Copy } from "@/components/Icones/Reicon";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { ActionFeedbackIcon } from "@/components/ui/action-feedback-icon";
import { useActionFeedback } from "@/hooks/useActionFeedback";

export function CopyFeedbackButton({ value }: { value: string }) {
  const { t } = useTranslation();
  const { status, run } = useActionFeedback();

  const copyValue = async (): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(t("copy_success", "已复制到剪贴板"));
      return true;
    } catch (error) {
      console.error("Failed to copy text: ", error);
      toast.error(t("copy_failed", "复制失败"));
      return false;
    }
  };

  return (
    <IconButton
      type="button"
      variant="ghost"
      className="size-5"
      aria-label={t("copy", "复制")}
      aria-busy={status === "loading"}
      disabled={status === "loading"}
      onClick={() => void run(copyValue)}
    >
      <ActionFeedbackIcon status={status} icon={Copy} />
    </IconButton>
  );
}
