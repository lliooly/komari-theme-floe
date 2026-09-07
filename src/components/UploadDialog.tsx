import React, { useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Flex } from "@/components/ui/flex";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { Upload as UploadIcon, X } from "@/components/Icones/Reicon";
import { ActionFeedbackIcon } from "@/components/ui/action-feedback-icon";
import { useActionFeedback } from "@/hooks/useActionFeedback";
import type { ActionFeedbackStatus } from "@/hooks/useActionFeedback";

export type UploadDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  accept?: string; // e.g. ".zip,.png" or MIME types
  dragDropText?: React.ReactNode;
  clickToBrowseText?: React.ReactNode;
  hintText?: React.ReactNode;
  uploading?: boolean;
  progress?: number; // 0-100
  uploadingText?: React.ReactNode;
  cancelUploadLabel?: React.ReactNode;
  onCancelUpload?: () => void;
  onFileSelected?: (file: File) => void | boolean | Promise<boolean | void>;
  /** 可选的受控上传反馈状态；未提供时，异步 onFileSelected 会自动反馈。 */
  uploadStatus?: ActionFeedbackStatus;
  closeLabel?: React.ReactNode;
};

// Utility to match file by accept list (extensions or mime types)
function matchesAccept(file: File, accept: string | undefined) {
  if (!accept || accept.trim() === "" || accept === "*/*") return true;
  const items = accept.split(",").map((s) => s.trim().toLowerCase());
  const name = file.name.toLowerCase();
  const type = (file.type || "").toLowerCase();
  for (const it of items) {
    if (it.startsWith(".")) {
      if (name.endsWith(it)) return true;
    } else if (it.includes("/")) {
      if (type === it) return true;
      // wildcard like image/*
      const [m] = it.split("/");
      const [fm] = type.split("/");
      if (m && m === fm) return true;
    }
  }
  return false;
}

function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  return (
    (typeof value === "object" && value !== null) || typeof value === "function"
  ) && typeof (value as { then?: unknown }).then === "function";
}

const UploadDialog: React.FC<UploadDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  accept = "*/*",
  dragDropText,
  clickToBrowseText,
  hintText,
  uploading = false,
  progress = 0,
  uploadingText,
  cancelUploadLabel,
  onCancelUpload,
  onFileSelected,
  uploadStatus,
  closeLabel = "Close",
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const { status: selectionStatus, run: runUpload } = useActionFeedback();
  const feedbackStatus =
    uploadStatus ?? (uploading ? "loading" : selectionStatus);
  const isBusy = feedbackStatus === "loading";

  const handleFile = (file: File) => {
    if (!onFileSelected || isBusy) return;

    let result: void | boolean | Promise<boolean | void>;
    try {
      result = onFileSelected(file);
    } catch (error) {
      console.error("Failed to select file: ", error);
      void runUpload(async () => false);
      return;
    }

    if (result === false) {
      void runUpload(async () => false);
      return;
    }

    if (isPromiseLike(result)) {
      void runUpload(async () => {
        try {
          return (await result) !== false;
        } catch (error) {
          console.error("Failed to upload file: ", error);
          return false;
        }
      });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const file = files.find((f) => matchesAccept(f, accept));
    if (file) handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && matchesAccept(file, accept)) handleFile(file);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[450px]">
        <DialogTitle>{title}</DialogTitle>
        {description ? (
          <DialogDescription>{description}</DialogDescription>
        ) : null}

        <Box className="space-y-4 mt-4">
          <Flex
            direction="column"
            align="center"
            justify="center"
            role="button"
            tabIndex={isBusy ? -1 : 0}
            aria-busy={isBusy}
            aria-disabled={isBusy}
            className="rounded-lg bg-muted/30 p-8 text-center cursor-pointer transition-colors hover:bg-muted/45"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => {
              if (!isBusy) inputRef.current?.click();
            }}
            onKeyDown={(e) => {
              if (!isBusy && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                inputRef.current?.click();
              }
            }}
          >
            <ActionFeedbackIcon
              status={feedbackStatus}
              icon={UploadIcon}
              className="mx-auto mb-4 size-12 text-gray-400"
            />
            {dragDropText ? (
              <Text size="3" weight="medium">{dragDropText}</Text>
            ) : null}
            {clickToBrowseText ? (
              <Text size="2" color="gray" className="mt-2">
                {clickToBrowseText}
              </Text>
            ) : null}
            {hintText ? (
              <Text size="1" color="gray" className="mt-2">
                {hintText}
              </Text>
            ) : null}
          </Flex>

          <input
            ref={inputRef}
            type="file"
            accept={accept}
            onChange={handleFileSelect}
            className="hidden"
          />
        </Box>

        {uploading && (
          <Box className="flex items-center justify-center z-50">
            <Card className="p-6 text-center min-w-80 max-w-md">
              {uploadingText ? (
                <Text size="3" className="mt-2 mb-4">
                  {uploadingText}
                </Text>
              ) : null}

              {/* Progress bar */}
              <Box className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-3 overflow-hidden">
                <Box
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all duration-500 ease-out relative"
                  style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
                >
                  <Box className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
                </Box>
              </Box>

              <Flex justify="between" align="center" className="mb-4">
                <Text size="2" color="gray">
                  {Math.round(Math.max(0, Math.min(100, progress)))}%
                </Text>
              </Flex>

              {onCancelUpload ? (
                <Button
                  variant="outline"
                  onClick={onCancelUpload}
                  disabled={progress >= 100}
                >
                  <X className="size-4" />
                  {cancelUploadLabel ?? "Cancel"}
                </Button>
              ) : null}
            </Card>
          </Box>
        )}

        <Flex justify="end" className="gap-3 mt-4">
          <DialogClose asChild>
            <Button variant="outline">
              {closeLabel}
            </Button>
          </DialogClose>
        </Flex>
      </DialogContent>
    </Dialog>
  );
};

export default UploadDialog;
