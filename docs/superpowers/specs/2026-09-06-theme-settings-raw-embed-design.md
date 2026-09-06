# Floe 后台内嵌主题设置设计

## 1. 背景与目标

Floe 的自定义主题设置页已经具备完整的 React 控件，包括公告日期时间选择器。上一版使用 `redirect`，虽然能复用这些控件，但点击 Komari 的主题设置入口后会离开 Komari 管理页面，用户看到的是一个独立的 Floe 页面。

本次改为 `raw` 配置，让入口继续停留在 Komari 管理后台的主内容区域，同时加载 Floe 自己的设置界面。

目标如下：

- Komari 主题设置入口使用 `raw` 类型。
- raw 内容只负责启动和跳转，不复制或维护第二套设置表单。
- Floe 设置页在嵌入模式下隐藏站点导航、公告横幅和页脚，只展示设置面板。
- 直接访问 `/settings` 仍然保留完整的独立页面，方便本地开发和故障排查。
- 继续使用现有 `theme_settings` 数据结构与管理员 API，不修改 Komari 服务端。

## 2. 方案

### 2.1 Manifest raw 启动页

`komari-theme.json` 的 `configuration.data` 保存一段最小 HTML。HTML 不承载业务逻辑，只显示加载提示并在脚本中跳转当前 iframe 到 `/settings?embedded=1`。

跳转地址从父级管理页面推导：

1. 优先读取 `window.parent.location.href`。
2. 如果 iframe 访问父级地址受限，则读取 `document.referrer`。
3. 查找父级路径中的 `/admin`，其前缀作为 Komari 的部署 base path。
4. 将 base path 与 `/settings?embedded=1` 组合，使用 `window.location.replace` 导航 iframe 自身。

这样不会导航顶层管理页面，也不会形成“raw iframe 里再套一个 iframe”的嵌套结构。

### 2.2 Floe 嵌入页面

`/settings?embedded=1` 仍由现有 SPA 路由识别。`ThemeSettingsPage` 在嵌入模式下复用全部设置组件，但隐藏独立页面的标题、说明和返回仪表盘链接，保留响应式卡片布局与权限检查。

根布局新增客户端 `AppShell`，在同一嵌入标记下隐藏全局导航、公告横幅和页脚，并将主内容上下间距收紧。主题设置面板本身继续通过现有 Provider 获取登录态、主题配置和公告数据。

### 2.3 鉴权与数据

raw 启动页不包含任何配置数据、凭据或 API 请求。真正的设置页仍然通过浏览器 Cookie 调用 Komari API，并由 `ThemeContext` 判断管理员状态。未登录用户只看到无权限提示，前端隐藏不是服务端鉴权的替代品。

## 3. 兼容性与风险

- `raw` 与 `redirect` 均要求 Komari 服务端支持对应主题配置类型；按官方文档使用 Komari `1.2.1` 或更高版本。
- 部署在根路径和带前缀路径（例如 `/abc/`）时，raw 启动页都根据父级 `/admin` 路径计算目标地址。
- 若浏览器禁止脚本，raw 启动页保留一个 `/settings?embedded=1` 的手动链接；设置页的核心功能依赖 JavaScript，这是 Floe 静态 React 主题的既有要求。
- 直接打开 `/settings` 不带 `embedded` 参数时仍展示完整 Floe 页面，不影响本地调试和普通主题访问。

## 4. 验证标准

- `komari-theme.json` 通过 JSON 校验，`configuration.type` 为 `raw`，`configuration.data` 为非空 HTML 字符串。
- raw 字符串包含嵌入参数和 base path 推导逻辑，不包含顶层导航跳转。
- `/settings?embedded=1` 隐藏全局站点壳层但显示自定义设置面板。
- 直接访问 `/settings` 仍显示标题和返回入口。
- 管理员可以继续修改普通主题设置、Uptime Kuma 设置和公告日期时间；未登录用户不能编辑。
- 静态构建、主题打包、manifest 校验和 `git diff --check` 通过。

## 5. 参考

- [Komari 主题开发指南](https://komari-document.pages.dev/dev/theme)
- [Komari Web 主题说明](https://github.com/komari-monitor/komari-web)
