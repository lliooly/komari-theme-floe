import {
  Button,
  DropdownMenu,
  Flex,
  IconButton,
  Switch,
  TextArea,
  TextField,
} from "@radix-ui/themes";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  ChevronDownIcon,
  Power,
  Save,
  type ReiconIcon,
} from "@/components/Icones/Reicon";
import { AnimatePresence, motion } from "framer-motion"; // 引入 Framer Motion

import { ActionFeedbackIcon } from "@/components/ui/action-feedback-icon";
import { useActionFeedback } from "@/hooks/useActionFeedback";
import { cn } from "@/lib/utils";

function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  return (
    (typeof value === "object" && value !== null) || typeof value === "function"
  ) && typeof (value as { then?: unknown }).then === "function";
}

interface SettingCardProps {
  title?: string | React.ReactNode;
  description?: string | React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  bordless?: boolean;
  direction?: "row" | "column" | "row-reverse" | "column-reverse";
  onHeaderClick?: () => void;
}

export function SettingCard({
  title = "",
  description = "",
  children,
  className = "",
  direction = "column",
  bordless = false,
  onHeaderClick = () => { },
}: SettingCardProps) {
  const actionChild = React.Children.toArray(children).find(
    (child) => React.isValidElement(child) && child.type === Action
  );

  const otherChildren = React.Children.toArray(children).filter(
    (child) => !(React.isValidElement(child) && child.type === Action)
  );

  return (
    <Flex
      direction={direction}
      justify="between"
      align="center"
      wrap="wrap"
      className={
        bordless ? className : `rounded-md py-2 px-4 bg-transparent min-h-8 ${className}`
      }
    >
      <Flex
        className="w-full"
        direction="row"
        justify="between"
        align="center"
        wrap="nowrap"
        onClick={onHeaderClick}
      >
        <Flex
          direction="column"
          gap="1"
          className="min-h-10"
          justify={"center"}
        >
          <label className="text-base font-medium" style={{ fontWeight: 600 }}>
            {title}
          </label>
          {description && (
            <label className="text-sm text-muted-foreground">
              {description}
            </label>
          )}
        </Flex>
        {actionChild}
      </Flex>
      {otherChildren}
    </Flex>
  );
}

function Action({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

SettingCard.Action = Action;

export function SettingCardSwitch({
  label = "",
  autoDisabled = true,
  defaultChecked,
  onChange,
  ...props
}: SettingCardProps & {
  label?: string;
  autoDisabled?: boolean;
  defaultChecked?: boolean;
  onChange?: (
    checked: boolean,
    switchElement: HTMLButtonElement
  ) => void | boolean | Promise<unknown>;
}) {
  const switchRef = React.useRef<HTMLButtonElement>(null);
  const [checked, setChecked] = React.useState(defaultChecked ?? false);
  const { status: switchStatus, run: runSwitch } = useActionFeedback();

  const handleChange = (nextChecked: boolean) => {
    if (switchStatus === "loading") return;

    const previousValue = checked;
    setChecked(nextChecked);
    const switchElement = switchRef.current;
    if (!switchElement) {
      setChecked(previousValue);
      return;
    }

    let result: void | boolean | Promise<unknown>;
    try {
      result = onChange?.(nextChecked, switchElement);
    } catch {
      setChecked(previousValue);
      return;
    }

    if (result === false) {
      setChecked(previousValue);
      return;
    }

    if (isPromiseLike(result)) {
      void runSwitch(async () => {
        try {
          const resolvedResult = await result;
          if (resolvedResult === false) {
            setChecked(previousValue);
            return false;
          }
          return true;
        } catch {
          setChecked(previousValue);
          return false;
        }
      });
    }
  };

  return (
    <SettingCard {...props} direction="column">
      <SettingCard.Action>
        <Flex direction="row" gap="2" align="center">
          <label>{label}</label>
          <Switch
            ref={switchRef}
            checked={checked}
            onCheckedChange={handleChange}
            disabled={autoDisabled && switchStatus === "loading"}
            aria-busy={switchStatus === "loading"}
          />
          <ActionFeedbackIcon
            status={switchStatus}
            icon={Power}
            className={switchStatus === "idle" ? "opacity-0" : ""}
          />
        </Flex>
      </SettingCard.Action>
    </SettingCard>
  );
}

export function SettingCardButton({
  label = "",
  variant = "solid",
  children,
  onClick,
  autoDisabled = true,
  feedbackIcon: FeedbackIcon = Save,
  ...props
}: SettingCardProps & {
  label?: string;
  variant?: "solid" | "soft" | "outline" | "ghost";
  children?: React.ReactNode;
  onClick?: (buttonElement: HTMLButtonElement) => void | Promise<unknown>;
  autoDisabled?: boolean;
  feedbackIcon?: ReiconIcon;
}) {
  const { status, run } = useActionFeedback();
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    void run(async () => {
      const result = await onClick?.(event.currentTarget);
      return result !== false;
    });
  };
  return (
    <SettingCard {...props} direction="column">
      <SettingCard.Action>
        <Flex>
          <Flex direction="row" gap="2" align="center">
            <label>{label}</label>
            <Button
              type="button"
              onClick={handleClick}
              variant={variant}
              disabled={autoDisabled && status === "loading"}
              aria-busy={status === "loading"}
            >
              <ActionFeedbackIcon status={status} icon={FeedbackIcon} />
              {children}
            </Button>
          </Flex>
        </Flex>
      </SettingCard.Action>
    </SettingCard>
  );
}

export function SettingCardIconButton({
  label = "",
  variant = "solid",
  children,
  onClick,
  autoDisabled = true,
  ...props
}: SettingCardProps & {
  label?: string;
  variant?: "solid" | "soft" | "outline" | "ghost";
  children?: React.ReactNode;
  onClick?: (buttonElement: HTMLButtonElement) => void;
  autoDisabled?: boolean;
}) {
  const [disabled, setDisabled] = React.useState(false);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (autoDisabled) setDisabled(true);
    const result: any = onClick ? onClick(event.currentTarget) : undefined;
    if (autoDisabled) {
      const promise: Promise<any> = result;
      if (promise && typeof promise.then === "function") {
        promise.finally(() => setDisabled(false));
      } else {
        setDisabled(false);
      }
    }
  };
  return (
    <SettingCard {...props} direction="column">
      <SettingCard.Action>
        <Flex>
          <Flex direction="row" gap="2" align="center">
            <label>{label}</label>
            <IconButton
              onClick={handleClick}
              variant={variant}
              disabled={disabled}
            >
              {children}
            </IconButton>
          </Flex>
        </Flex>
      </SettingCard.Action>
    </SettingCard>
  );
}

interface SettingCardShortTextInputProps
  extends Omit<React.ComponentProps<typeof TextField.Root>, 'onChange' | 'onKeyDown'> {
  // SettingCard 相关属性
  title?: string;
  description?: string;
  bordless?: boolean;

  // 按钮相关属性
  showSaveButton?: boolean;
  label?: string;
  autoDisabled?: boolean;
  isSaving?: boolean;

  // 保存回调
  OnSave?: (
    value: string,
    inputElement: HTMLInputElement,
    buttonElement: HTMLButtonElement
  ) => void | Promise<unknown>;

  // 额外内容
  children?: React.ReactNode | null;

  // 输入框事件回调 (可选，用于额外处理)
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export function SettingCardShortTextInput({
  // SettingCard 属性
  title = "",
  description = "",
  bordless = false,

  // 按钮属性
  showSaveButton = true,
  label,
  autoDisabled = true,
  isSaving,

  // 保存回调
  OnSave = () => { },

  // 额外内容
  children = null,

  // 事件回调
  onChange,
  onKeyDown,

  // TextField.Root 的所有其他属性
  value,
  defaultValue,
  placeholder,
  disabled,
  type = "text",
  required,
  readOnly,
  maxLength,
  minLength,
  pattern,
  autoComplete,
  autoFocus,
  name,
  id,
  className = "w-full",
  ...restProps
}: SettingCardShortTextInputProps) {
  const { t } = useTranslation();
  const saveLabel = label ?? t("save");
  const { status: saveStatus, run: runSave } = useActionFeedback();
  const savingState =
    isSaving !== undefined ? isSaving : autoDisabled && saveStatus === "loading";
  const [internalValue, setInternalValue] = React.useState(value || defaultValue || "");
  const currentValue = value !== undefined ? value : internalValue;
  const inputRef = React.useRef<HTMLInputElement>(null);
  const buttonRef = React.useRef<HTMLButtonElement>(null);

  // 当外部value改变时，同步内部状态
  React.useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value.toString());
    }
  }, [value]);

  const handleSave = () => {
    const valueToSave = currentValue?.toString() || "";
    void runSave(async () => {
      if (!inputRef.current || !buttonRef.current) return false;
      const result = await OnSave(valueToSave, inputRef.current, buttonRef.current);
      return result !== false;
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;

    // 只有在非受控模式下才更新内部状态
    if (value === undefined) {
      setInternalValue(newValue);
    }

    // 调用外部传入的 onChange 回调
    onChange?.(e);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // 按 Enter 键时触发保存
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }

    // 调用外部传入的 onKeyDown 回调
    onKeyDown?.(e);
  };

  return (
    <SettingCard title={title} description={description} bordless={bordless}>
      <Flex direction="column" className="w-full mt-1" gap="2" align="start">
        <TextField.Root
          {...restProps}
          className={className}
          value={value !== undefined ? value : internalValue}
          defaultValue={value === undefined ? defaultValue : undefined}
          placeholder={placeholder}
          disabled={disabled || savingState}
          type={type}
          required={required}
          readOnly={readOnly}
          maxLength={maxLength}
          minLength={minLength}
          pattern={pattern}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          name={name}
          id={id}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          ref={inputRef}
        >
        </TextField.Root>
        {children}
        <Button
          type="button"
          ref={buttonRef}
          onClick={handleSave}
          variant="solid"
          hidden={!showSaveButton}
          disabled={savingState}
          aria-busy={saveStatus === "loading"}
        >
          <ActionFeedbackIcon status={saveStatus} icon={Save} />
          {saveLabel}
        </Button>
      </Flex>
    </SettingCard>
  );
}

export function SettingCardLongTextInput({
  title = "",
  description = "",
  label,
  defaultValue = "",
  OnSave = () => { },
  onChange,
  autoDisabled = true,
  isSaving,
  bordless = false,
  showSaveButton = true,
}: {
  title?: string;
  description?: string;
  label?: string;
  defaultValue?: string;
  OnSave?: (
    value: string,
    textAreaElement: HTMLTextAreaElement,
    buttonElement: HTMLButtonElement
  ) => void | Promise<unknown>;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  autoDisabled?: boolean;
  isSaving?: boolean;
  bordless?: boolean;
  showSaveButton?: boolean;
}) {
  const { t } = useTranslation();
  const saveLabel = label ?? t("save");
  const { status: saveStatus, run: runSave } = useActionFeedback();
  const savingState =
    isSaving !== undefined ? isSaving : autoDisabled && saveStatus === "loading";
  const [value, setValue] = React.useState(defaultValue);
  const textAreaRef = React.useRef<HTMLTextAreaElement>(null);
  const buttonRef = React.useRef<HTMLButtonElement>(null);

  const handleSave = () => {
    void runSave(async () => {
      if (!textAreaRef.current || !buttonRef.current) return false;
      const result = await OnSave(value, textAreaRef.current, buttonRef.current);
      return result !== false;
    });
  };

  const handleTextAreaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    // 调用外部传入的 onChange 回调
    onChange?.(e);
  };

  return (
    <SettingCard title={title} description={description} bordless={bordless}>
      <Flex direction="column" className="w-full mt-1" gap="2" align="start">
        <TextArea
          className="w-full"
          defaultValue={defaultValue}
          resize="vertical"
          value={value}
          onChange={handleTextAreaChange}
          ref={textAreaRef}
        />
        {showSaveButton && (
          <Button
            type="button"
            ref={buttonRef}
            onClick={handleSave}
            variant="solid"
            disabled={savingState}
            aria-busy={saveStatus === "loading"}
          >
            <ActionFeedbackIcon status={saveStatus} icon={Save} />
            {saveLabel}
          </Button>
        )}
      </Flex>
    </SettingCard>
  );
}

export function SettingCardSelect({
  title,
  description,
  defaultValue = "",
  value,
  label,
  options = [],
  OnSave = () => { },
  autoDisabled = true,
  isSaving,
  bordless = false,
}: {
  title?: string;
  description?: string;
  defaultValue?: string;
  value?: string;
  label?: string;
  options?: { value: string; label?: string; disabled?: boolean }[];
  OnSave?: (
    value: string,
    buttonElement: HTMLButtonElement
  ) => void | boolean | Promise<unknown>;
  autoDisabled?: boolean;
  isSaving?: boolean;
  bordless?: boolean;
}) {
  const { t } = useTranslation();
  const selectLabel = label ?? t("select");
  const { status: selectStatus, run: runSelect } = useActionFeedback();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const savingState =
    isSaving !== undefined ? isSaving : autoDisabled && selectStatus === "loading";
  const [selectedValue, setSelectedValue] = React.useState(
    value !== undefined ? value : defaultValue
  );
  const buttonRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (value !== undefined) {
      setSelectedValue(value);
    }
  }, [value]);

  const handleSave = (nextValue: string) => {
    if (selectStatus === "loading") return;

    const previousValue = selectedValue;
    setSelectedValue(nextValue);
    const buttonElement = buttonRef.current;
    if (!buttonElement) {
      setSelectedValue(previousValue);
      return;
    }

    let result: void | boolean | Promise<unknown>;
    try {
      result = OnSave(nextValue, buttonElement);
    } catch {
      setSelectedValue(previousValue);
      return;
    }

    if (result === false) {
      setSelectedValue(previousValue);
      return;
    }

    if (isPromiseLike(result)) {
      void runSelect(async () => {
        try {
          const resolvedResult = await result;
          if (resolvedResult === false) {
            setSelectedValue(previousValue);
            return false;
          }
          return true;
        } catch {
          setSelectedValue(previousValue);
          return false;
        }
      });
    }
  };

  // 获取要显示的文本，优先显示选择的值对应的标签
  const getDisplayText = () => {
    if (selectedValue) {
      const selectedOption = options.find(
        (option) => option.value === selectedValue
      );
      return selectedOption?.label || selectedValue;
    }
    return selectLabel;
  };

  return (
    <SettingCard title={title} description={description} bordless={bordless}>
      <SettingCard.Action>
        <Flex>
          <Flex direction="row" gap="2" align="center">
            <DropdownMenu.Root onOpenChange={setMenuOpen}>
              <DropdownMenu.Trigger disabled={savingState}>
                <Button
                  type="button"
                  variant="soft"
                  ref={buttonRef}
                  aria-expanded={menuOpen}
                  aria-busy={selectStatus === "loading"}
                >
                  {getDisplayText()}
                  <ActionFeedbackIcon
                    status={selectStatus}
                    icon={ChevronDownIcon}
                    className={cn(
                      "semantic-icon-chevron",
                      menuOpen && selectStatus === "idle" && "rotate-180"
                    )}
                  />
                </Button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content>
                {options.map((option) => (
                  <DropdownMenu.Item
                    disabled={option.disabled}
                    key={option.value}
                    onSelect={() => {
                      handleSave(option.value);
                    }}
                  >
                    {option.label ? option.label : option.value}
                  </DropdownMenu.Item>
                ))}
              </DropdownMenu.Content>
            </DropdownMenu.Root>
          </Flex>
        </Flex>
      </SettingCard.Action>
    </SettingCard>
  );
}

export function SettingCardLabel({
  children,
}: {
  children: React.ReactNode | null;
}) {
  return (
    <label className="text-xl font-bold" style={{ fontWeight: 600 }}>
      {children}
    </label>
  );
}

export function SettingCardCollapse({
  title,
  description,
  defaultOpen = false,
  children,
  bordless = false,
}: {
  title?: string;
  description?: string;
  children?: React.ReactNode;
  defaultOpen?: boolean;
  bordless?: boolean;
}) {
  const [open, setOpen] = React.useState(defaultOpen);

  return (
    <SettingCard
      title={title}
      description={description}
      onHeaderClick={() => setOpen(!open)}
      bordless={bordless}
    >
      <SettingCard.Action>
        <IconButton
          variant="soft"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-controls="collapsible-content"
        >
          <motion.div
            initial={{ rotate: 0, scale: 1 }}
            animate={{ rotate: open ? 180 : 0, scale: open ? 1.1 : 1 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          >
            <ChevronDownIcon />
          </motion.div>
        </IconButton>
      </SettingCard.Action>
      <AnimatePresence>
        {open && (
          <motion.div
            className="w-full p-0 md:p-1" // Ensures the content takes full width
            layout // Smoothly handles height changes
            initial={{ height: 0, opacity: 0, y: -10 }}
            animate={{ height: "auto", opacity: 1, y: 0 }}
            exit={{ height: 0, opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: "hidden" }} // Prevents content clipping during animation
            id="collapsible-content"
          >
            <div className="my-2" />
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </SettingCard>
  );
}

// Header slot for SettingCardCollapse
SettingCardCollapse.Header = function Header({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div>{children}</div>;
};
