# 恢复 Komari 原生主题设置与简化公告时间输入

## 目标

将 Floe 的主题配置恢复为 Komari 原生设置表单，移除自定义设置页和内嵌页面，避免公告依赖主题自身的登录、写入和 iframe 环境。

公告继续由前台读取 `theme_settings` 并按时间展示，但管理员直接在 Komari 后台填写公告字段。开始时间和结束时间使用简短格式，减少手写内容。

## 已确认的输入规则

- 公告开始时间和结束时间使用 `YYYY-MM-DD HH:mm`，例如 `2026-09-15 18:00`。
- 简短格式按站点约定的 UTC+08:00 解析，以保证不同访客看到同一个绝对时间。
- 现有带时区的 ISO 时间仍然有效，例如 `2026-09-15T18:00:00+08:00`、`2026-09-15T10:00:00Z`，不要求管理员迁移已有配置。
- 日期必须是真实日历日期，小时为 `00–23`，分钟为 `00–59`；格式或时间无效时公告隐藏。
- 公告启用时仍要求内容非空、结束时间晚于开始时间；到期公告自动隐藏，关闭状态保留配置。

## 配置入口与数据流

### Komari 原生设置表单

`komari-theme.json` 恢复到自定义设置页之前已使用的原生配置声明，保留现有主题、访客显示、Uptime Kuma 和公告字段。移除 `configuration.type: "raw"`、raw HTML 启动页以及 `/settings?embedded=1` 链路。

公告字段继续使用以下键：

- `announcement.enabled`
- `announcement.content`
- `announcement.startsAt`
- `announcement.endsAt`
- `announcement.textColor`

开始时间和结束时间为普通文本字段，后台帮助文案只要求填写 `YYYY-MM-DD HH:mm`。公告内容和文字颜色仍由原生表单提供。

### 前台读取与兼容

`AnnouncementContext` 继续从公开的 `theme_settings` 读取公告。`readAnnouncement` 同时兼容嵌套对象和点号扁平键，保留对旧配置的支持。

`announcementTime` 增加简短格式解析：先将 `YYYY-MM-DD HH:mm` 转换为 UTC+08:00 的绝对时间，再执行现有的开始、结束和过期判断。带 `Z` 或显式偏移的 ISO 输入沿用现有解析逻辑。

## 代码范围

- 恢复 `komari-theme.json` 的原生设置声明，并保留当前主题元数据版本。
- 从 `src/app/page.tsx` 移除 `/settings` 的自定义页面路由。
- 从 `AppShell` 移除嵌入状态检测、嵌入背景标记和嵌入专用布局；保留工作区现有的监控数据 Provider 调整。
- 从 `NavBar` 和 `ThemeSwitcher` 移除自定义公告编辑入口；普通主题外观与访客显示设置保持可用。
- 删除不再使用的 `ThemeSettingsPage`、`ThemeSettingsDefaults`、嵌入状态 hook、公告编辑器、日期选择器和日期时间工具。
- 保留公告横幅、Markdown 渲染、公告读取逻辑以及主题运行时仍使用的通用设置写入工具。
- 更新打包校验和 README，明确管理员在 Komari 原生表单中手填公告时间，不再描述内嵌设置页。

## 错误处理与兼容性

- 无效日期、反向时间区间、缺失内容和已过期公告不展示横幅。
- 旧的 ISO 公告不会因回退而失效。
- 删除自定义编辑入口不会删除服务器上已经保存的 `theme_settings`；已有公告可继续由原生后台字段编辑。
- 主题仍允许访客在本地调整外观；这些本地设置不改变公告的服务器配置。
- 当前工作区已有的未提交修改不参与本次回退，也不创建 worktree。

## 验证

- 校验 `komari-theme.json` 为合法 JSON，并确认不再包含 raw HTML、iframe 启动页或内嵌参数。
- 测试公告时间解析：简短格式、带时区 ISO、无效日期、边界时间、反向区间和过期状态。
- 运行现有 Node 测试、TypeScript 检查、ESLint 和生产构建。
- 运行 `git diff --check`，确认没有格式错误，并检查构建产物不再引用自定义设置页入口。
