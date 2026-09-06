# Floe 自定义主题设置页

## 1. 背景与目标

Floe 当前在 `komari-theme.json` 中声明 `managed` 配置。Komari 会根据配置清单自动生成后台表单，因此公告开始时间和结束时间只能显示普通文本框，无法使用 Floe 已有的日期时间选择器。

本次改动将“主题管理”入口切换为 Floe 自己提供的设置页，保留现有主题配置能力，并让公告时间字段直接使用 `DateTimePicker`。

目标如下：

- 点击 Komari 后台的 Floe 主题设置入口后，进入 Floe 自己的 `/settings` 页面。
- 保留现有主题外观、状态卡片、游客显示和 Uptime Kuma 配置。
- 公告管理在页面内直接展示日期时间选择器、时区提示、Markdown 预览、保存和立即关闭。
- 继续使用现有的 `theme_settings` 数据结构和保存逻辑，不要求修改 Komari 服务端 API。
- 非管理员访问设置页时不展示可编辑表单。

## 2. 方案选择

| 方案 | 说明 | 结论 |
| --- | --- | --- |
| 保持 `managed` | 继续由 Komari 渲染表单，只能使用宿主支持的字段类型 | 无法提供自定义日期选择器 |
| `redirect` 到 Floe 页面 | 后台菜单跳转到主题静态页面，由 Floe 自己渲染 React 控件 | **采用** |
| `raw` HTML | 将完整 HTML 写入 manifest，由后台 iframe 渲染 | 不适合当前 React 结构，鉴权和维护成本更高 |

采用 `redirect` 的原因是它能复用现有主题组件，并且不会把 React 页面压缩成难以维护的 HTML 字符串。Komari 服务端需要为 `1.2.0` 或更高版本，才能解析 `raw` / `redirect` 配置。

## 3. 架构设计

### 3.1 Manifest 入口

将 `configuration` 改为规范的 `redirect` 结构：

```json
{
  "type": "redirect",
  "name": {
    "zh-CN": "Floe 主题设置",
    "zh-TW": "Floe 主題設定",
    "en-US": "Floe Theme Settings"
  },
  "icon": "Palette",
  "data": "settings"
}
```

后台菜单不再生成 `managed` 表单，而是导航到站点根目录下的 `settings` 路径。已保存的 `theme_settings` 数据保持原格式，不做迁移或清空。

### 3.2 设置页路由

项目已经使用 `useSpaPathname` 支持静态主题的客户端路由。本次在现有 `src/app/page.tsx` 中增加 `/settings` 分支，避免新增独立 Next 页面和重复加载 Provider。

设置页由 `ThemeSettingsPage` 负责页面级布局：

- 显示 Floe 风格的标题、说明和返回仪表盘入口。
- 等待主题配置与管理员状态加载完成后再展示编辑控件。
- 管理员状态不是 `yes` 时显示无权限提示，不执行保存操作。
- 使用 `ThemeSwitcher` 的共享设置内容，保证弹出式主题设置和后台页面不会出现两套行为。

### 3.3 共享设置面板

将现有 `ThemeSwitcher` 拆出可复用的设置内容，支持 `popover` 和 `page` 两种展示模式：

- `popover`：保持导航栏调色盘按钮和原有紧凑布局。
- `page`：使用宽屏响应式布局，适合后台主内容区域。

页面模式补齐当前托管配置中已有、但弹出面板尚未展示的 Logo、默认外观、默认语言和 Uptime Kuma 字段。所有控件仍写入既有键名，包含嵌套对象 `guestDisplay`、`uptimeKuma` 和 `statusCardsVisibility`。

### 3.4 公告编辑器

公告编辑器增加内嵌展示模式：

- 弹出面板继续显示“公告管理”按钮和对话框。
- 页面模式直接显示公告表单，不再套一层对话框。
- 开始时间和结束时间使用同一个临时时区，并复用已有 `DateTimePicker`。
- 保存前继续校验内容、时间有效性、时间先后关系和结束时间不得早于当前时间。
- 保存成功后更新 `AnnouncementContext`；保存失败保留当前输入并显示错误。

设置页使用现有主题设置读写链路：读取 `/api/public` 的 `theme_settings`，通过现有设置更新函数合并后写回管理员接口。公告写入时清除旧的公告扁平键，其他主题设置写入时排除公告，避免并发或旧快照覆盖公告配置。

## 4. 交互与视觉

页面采用 Floe 的“流动数据面板”方向：深浅主题共用现有 CSS 变量，使用柔和的毛玻璃卡片、清晰的分组标题和宽松的响应式间距。公告区域作为重点编辑区，日期字段在桌面端并排、窄屏端堆叠；预览紧随 Markdown 输入，方便确认发布效果。

页面提供明确的加载、无权限、保存中、保存成功和保存失败状态。交互控件保留键盘焦点、可见焦点环、`aria` 标签和表单语义。

## 5. 兼容性与风险

- Komari 服务端低于 `1.2.0` 时不支持 `redirect`；该版本需要升级后才能从后台菜单进入自定义设置页。
- 已有 `theme_settings` 数据不改变，安装新版本后由 Floe 页面继续读取。
- 主题根页面、实例页、公告展示和游客访问逻辑不改变。
- `settings` 是主题内部路由，不使用 `/admin` 或 `/terminal`，避免与 Komari 内置页面冲突。
- 页面保存仍由服务端鉴权；前端隐藏表单不是唯一安全边界。

## 6. 验证标准

- `komari-theme.json` 通过 JSON 校验，且 `configuration.type` 为 `redirect`、`data` 为 `settings`。
- 未登录用户访问 `/settings` 时看不到编辑控件。
- 管理员访问 `/settings` 时能看到全部现有设置和公告日期选择器。
- 公告日期选择器能选择日期、小时、分钟和时区，并保存为兼容的 ISO 时间。
- 修改普通主题设置不会覆盖公告；修改公告不会丢失其他主题设置。
- `git diff --check`、类型检查和静态构建通过。
- Release 包包含根目录 `komari-theme.json`、`dist/` 和预览图，并以 `v0.1.1` 发布。

## 7. 参考

- [Komari 主题开发指南](https://komari-document.pages.dev/dev/theme)
- [Komari 托管配置文档](https://komari-document.pages.dev/en/dev/managed-config)
