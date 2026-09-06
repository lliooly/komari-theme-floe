# 公告日期时间选择器实现计划

本计划依据 `docs/superpowers/specs/2026-09-06-announcement-datetime-picker-design.md` 制定，直接在当前仓库实现，不创建额外工作树。

## 1. 增加本地日期时间与时区工具

新增 `src/lib/dateTime.ts`。

- 解析和格式化 `YYYY-MM-DDTHH:mm`，按日期字段生成月历，避免 UTC 解析造成跨日偏移。
- 提供安全的系统时区读取和浏览器支持的 IANA 时区列表，始终包含系统时区与 `UTC`。
- 使用 `Intl.DateTimeFormat` 将指定 IANA 时区的本地日期时间转换为时间戳/ISO 字符串。
- 校验转换后的日期、时分与输入一致；夏令时跳过的不存在时间返回 `NaN`。
- 保持没有第三方日期库、没有额外主题配置字段。

验证点：合法日期、无效日期、指定时区、系统时区回退、夏令时不存在时间和已有 ISO 时间的本地化回显。

## 2. 创建日期时间选择器组件

新增 `src/components/ui/date-time-picker.tsx`，复用 `src/components/ui/popover.tsx`。

- 使用按钮作为触发器，显示本地化日期时间或空值占位文案，禁止直接手写完整时间字符串。
- 弹层包含月份导航、可点击的月历日期网格、小时 `00–23`、分钟 `00–59`、时区选择和清除按钮。
- 值为空时打开到今天，选择日期后默认 `00:00`；已有时分则选新日期时保留时分。
- 时区由父表单控制；选择器只改变临时时区，不直接改写日期时间值。
- 提供可读的月份、星期、日期和按钮 ARIA 标签，保留键盘可操作性和 `prefers-reduced-motion` 兼容。

验证点：打开/关闭、月份切换、选日期、选时分、切换时区、清除、键盘焦点和移动宽度布局。

## 3. 接入公告编辑器

修改 `src/components/AnnouncementEditor.tsx`。

- 用两个 `DateTimePicker` 替换原有 `datetime-local` 输入。
- 增加编辑器生命周期内的共享 `timezone` 状态，默认系统时区；不写入 `Announcement`。
- 保存时使用指定时区转换 `start` 和 `end`，继续写入现有 ISO `startsAt`/`endsAt` 字段。
- 保留现有内容、时间顺序、当前时间、禁用、保存失败和已发布公告更新逻辑。
- 外部时区提示跟随当前临时选择，旧公告无额外字段也能继续编辑。

验证点：开始/结束共用时区、切换时区保留本地日期与时分、旧 ISO 时间回显、清除后的校验和保存失败保留输入。

## 4. 补充翻译

修改 `src/i18n/locales/en.json`、`src/i18n/locales/zh_CN.json`、`src/i18n/locales/zh_TW.json`。

- 增加选择器占位、上月、下月、今天、小时、分钟、时区和清除文案。
- 月份与星期名称由 `Intl` 依当前语言生成，不复制硬编码月份名称。

## 5. 静态与构建验证

- 执行 `npx tsc --noEmit`。
- 执行 `npm run build`；如沙箱再次阻止 Turbopack 创建进程，使用已授权的构建权限重跑。
- 执行 `git diff --check`，检查 JSON、TypeScript 和样式变更。
- 若开发服务器可用，手动检查桌面/移动端、浅色/深色主题、中文/英文、时区切换、夏令时边界和键盘操作。

## 实现顺序

1. 完成日期时间工具并做静态类型检查。
2. 创建选择器组件并接入 Popover。
3. 替换公告表单输入、接入时区转换和校验。
4. 添加三种语言文案。
5. 执行 TypeScript、生产构建和交互检查。

## 预计影响文件

- 新增 `src/lib/dateTime.ts`
- 新增 `src/components/ui/date-time-picker.tsx`
- 修改 `src/components/AnnouncementEditor.tsx`
- 修改 `src/i18n/locales/en.json`
- 修改 `src/i18n/locales/zh_CN.json`
- 修改 `src/i18n/locales/zh_TW.json`
- 新增 `docs/superpowers/specs/2026-09-06-announcement-datetime-picker-design.md`
- 新增 `docs/superpowers/plans/2026-09-06-announcement-datetime-picker-plan.md`
