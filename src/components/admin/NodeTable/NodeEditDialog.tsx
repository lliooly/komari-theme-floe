import * as React from "react";
import { z } from "zod";
import {
  schema,
  type ClientFormData,
} from "@/components/admin/NodeTable/schema/node";
import { DataTableRefreshContext } from "@/components/admin/NodeTable/schema/DataTableRefreshContext";
import { Pencil, Save } from "@/components/Icones/Reicon";
import { t } from "i18next";
import { toast } from "sonner";
import { Button, Dialog, Flex, IconButton, TextField } from "@radix-ui/themes";

import { ActionFeedbackIcon } from "@/components/ui/action-feedback-icon";
import { useActionFeedback } from "@/hooks/useActionFeedback";

export function EditDialog({ item }: { item: z.infer<typeof schema> }) {
  const [form, setForm] = React.useState<ClientFormData & { weight: number }>({
    name: item.name || "",
    token: item.token || "", // 从 item 初始化 token
    remark: item.remark || "", // 从 item 初始化 remark
    public_remark: item.public_remark || "", // 从 item 初始化 public_remark
    weight: item.weight || 0,
  });
  const [open, setOpen] = React.useState(false);
  const { status: saveStatus, run: runSave } = useActionFeedback();

  const refreshTable = React.useContext(DataTableRefreshContext);

  async function saveClientData(
    uuid: string,
    formData: ClientFormData
  ): Promise<boolean> {
    try {
      const response = await fetch(`/api/admin/client/${uuid}/edit`, {
        method: "POST",
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        toast.error(t("admin.nodeEdit.saveError", "保存失败"));
        return false;
      }

      refreshTable?.();
      toast.success(t("admin.nodeEdit.saveSuccess", "保存成功"));
      return true;
    } catch {
      toast.error(t("admin.nodeEdit.saveError", "保存失败"));
      return false;
    }
  }

  const handleSave = async () => {
    const payload: ClientFormData = {
      name: form.name,
      token: form.token,
      remark: form.remark,
      public_remark: form.public_remark,
    };

    const succeeded = await runSave(() => saveClientData(item.uuid, payload));
    if (succeeded) {
      setOpen(false);
    }
  }
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger>
        <IconButton
          variant="ghost"
          aria-busy={saveStatus === "loading"}
          disabled={saveStatus === "loading"}
        >
          <ActionFeedbackIcon status={saveStatus} icon={Pencil} />
        </IconButton>
      </Dialog.Trigger>
      <Dialog.Content>
        <Dialog.Title>{t("admin.nodeEdit.editInfo", "编辑信息")}</Dialog.Title>
        <div className="flex flex-col gap-4">
          <div>
            <label className="block mb-1 text-sm font-medium text-muted-foreground">
              {t("admin.nodeEdit.name", "名称")}
            </label>
            <TextField.Root
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder={t("admin.nodeEdit.namePlaceholder", "请输入名称")}
              disabled={saveStatus === "loading"}
            />
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium text-muted-foreground">
              {t("admin.nodeEdit.token", "Token 令牌")}
            </label>
            <TextField.Root
              value={form.token}
              onChange={(e) =>
                setForm((f) => ({ ...f, token: e.target.value }))
              }
              placeholder={t("admin.nodeEdit.tokenPlaceholder", "请输入 Token")}
              disabled={saveStatus === "loading"}
              readOnly
              className="bg-gray-200"
            />
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium text-muted-foreground">
              {t("admin.nodeEdit.remark", "私有备注")}
            </label>
            <TextField.Root
              value={form.remark}
              onChange={(e) =>
                setForm((f) => ({ ...f, remark: e.target.value }))
              }
              placeholder={t(
                "admin.nodeEdit.remarkPlaceholder",
                "请输入私有备注"
              )}
              disabled={saveStatus === "loading"}
            />
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium text-muted-foreground">
              {t("admin.nodeEdit.publicRemark", "公开备注")}
            </label>
            <TextField.Root
              value={form.public_remark}
              onChange={(e) =>
                setForm((f) => ({ ...f, public_remark: e.target.value }))
              }
              placeholder={t(
                "admin.nodeEdit.publicRemarkPlaceholder",
                "请输入公开备注"
              )}
              disabled={saveStatus === "loading"}
            />
          </div>
        </div>
        <Flex gap="2" align={"start"} className="mt-4">
          <Button
            type="submit"
            className="w-full"
            onClick={() => void handleSave()}
            disabled={saveStatus === "loading"}
            aria-busy={saveStatus === "loading"}
          >
            <ActionFeedbackIcon status={saveStatus} icon={Save} />
            {saveStatus === "loading"
              ? t("admin.nodeEdit.waiting", "等待...")
              : t("admin.nodeEdit.save", "保存")}
          </Button>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
