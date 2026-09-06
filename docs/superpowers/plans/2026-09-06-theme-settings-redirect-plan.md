# Floe 自定义主题设置页实现计划

## 目标

将 Floe 的 Komari 后台主题入口从自动生成的 `managed` 表单切换为 `redirect`，让后台进入 Floe 自己的 `/settings` 页面，并在公告设置中使用日期时间选择器。

## 实施步骤

### 1. 切换主题入口模式

- 精简 `komari-theme.json` 的 `configuration` 为规范的 `redirect` 配置。
- 将跳转目标设置为 `settings`，保留主题名称、图标和多语言标题。
- 确认原有主题设置键名不变，避免已保存数据失效。

### 2. 提取可复用设置面板

- 为 `ThemeSwitcher` 增加页面模式，复用现有设置控件，保留弹出模式的现有行为。
- 页面模式补齐 Logo、默认外观、默认语言和 Uptime Kuma 等原托管字段。
- 在 `ThemeContext` 中提供管理员状态就绪标记、Logo 保存和 Uptime Kuma 保存能力。
- 继续使用现有的主题设置合并队列，避免主题设置覆盖公告设置。

### 3. 接入公告日期时间选择器

- 为 `AnnouncementEditor` 增加内嵌模式。
- 页面模式直接显示公告表单、时区选择、日期时间选择器、预览和操作按钮。
- 修正表单在异步加载公告数据后同步初始值的问题，同时避免保存期间被轮询覆盖。
- 保留原有公告解析、验证、保存、立即关闭和失败反馈逻辑。

### 4. 增加设置页面路由

- 新增 Floe 风格的 `ThemeSettingsPage`。
- 在现有 SPA 路由中识别 `/settings`，不引入 `/admin` 或 `/terminal` 路径。
- 提供返回仪表盘入口、加载状态和非管理员提示。
- 在桌面端使用双栏或宽屏分组，在窄屏端自动堆叠；重点公告区域直接展示选择器。

### 5. 文档与版本

- 更新中英文 README，说明后台入口改为主题自定义页面，并注明 Komari `1.2.0` 以上要求。
- 将版本从 `0.1.0` 更新为 `0.1.1`，同步 `package-lock.json` 和 manifest。
- 使用约定式提交提交实现变更。

## 验证计划

1. 使用 `jq empty komari-theme.json` 校验 manifest。
2. 校验 manifest 的 `configuration.type` 为 `redirect`、`configuration.data` 为 `settings`。
3. 运行 `git diff --check` 和 `bash -n build-theme.sh`。
4. 运行项目类型检查或构建命令，确认静态导出成功。
5. 运行 `./build-theme.sh`，确认 Release 包含 `komari-theme.json`、`dist/` 和 `preview.png`。
6. 检查构建输出中存在 `/settings` 路由所需的代码，并确认 `v0.1.1` 标签构建流程可用。
7. 推送后等待 GitHub Actions 完成，再确认 Release 与主题安装包可下载。

## 风险与回滚

- 低于 `1.2.0` 的 Komari 服务端无法处理 `redirect`；升级服务端或暂时回退到上一版本即可。
- 回滚时将 manifest 恢复为上一版本的 `managed` 配置，已有 `theme_settings` 数据无需清理。
- 本次只修改 Floe 主题仓库，不修改 Komari 服务端源码和用户数据。
