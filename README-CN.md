# Floe

[![Build and Release Floe Theme](https://github.com/lliooly/komari-theme-floe/actions/workflows/build.yaml/badge.svg?branch=main)](https://github.com/lliooly/komari-theme-floe/actions/workflows/build.yaml)
[![MIT License](https://img.shields.io/github/license/lliooly/komari-theme-floe)](./LICENSE)

[English](./README.md)

[演示站点](https://komari.probe.name) · [下载最新主题包](https://github.com/lliooly/komari-theme-floe/releases/latest/download/dist-release.zip) · [查看全部版本](https://github.com/lliooly/komari-theme-floe/releases)

Floe 是一个独立维护的 [Komari](https://github.com/komari-monitor/komari) 第三方主题。它是一个静态导出的 [Next.js](https://nextjs.org/) 前端，通过正在运行的 Komari 后端读取实时数据，也可以作为 ZIP 主题包通过 Komari 的主题管理器安装。

> Floe 不是 Komari 或 Komari Next 的官方发布版本，也不代表任一项目的官方背书。

![Floe 预览](https://github.com/lliooly/komari-theme-floe/blob/main/preview.png?raw=true)

![Floe 深色主题预览](https://github.com/lliooly/komari-theme-floe/blob/main/images/dark-theme.png?raw=true)

## 功能特性

### 监控体验

- 实时仪表盘，定期刷新数据。
- 当前时间、在线节点、地区、流量和网络速度等汇总卡片。
- 节点世界地图。
- 节点浏览器，支持搜索、分组筛选、在线 / 离线状态，以及网格或表格视图。
- <code>/instance/&lt;uuid&gt;</code> 实例详情页，提供负载和延迟图表。
- 可选的 Uptime Kuma 状态面板，展示服务分组、状态徽章、心跳历史、最新延迟和 24 小时可用率。
- 剩余价值计算器，适用于后端提供价格和到期时间数据的部署。
- 响应式布局、深色模式、减少动态效果支持和多语言界面。

### 个性化配置

- 6 种颜色主题：Default、Ocean、Sunset、Forest、Midnight 和 Rose。
- 5 种卡片布局：Classic、Modern、Minimal、Detailed 和 Compact。
- 可选卡片和状态设计，包括延迟历史块与速度仪表。
- 4 种图表设计：Circle、Progress Bar、Bar Chart 和 Minimal。
- 自定义背景图片，并支持蒙版、轻柔模糊和玻璃模糊。
- 卡片背景透明度和模糊控制。
- 单独控制状态卡片、内存 / 磁盘总量、游客价格和到期时间的显示。
- 节点网格 / 表格偏好、自定义 Logo URL，以及浅色 / 深色 / 跟随系统外观。
- English、简体中文和繁体中文界面。
- 支持访客本地偏好，也支持管理员为整个 Komari 实例发布共享默认配置。

## 前置要求

- Node.js 22 或更高版本，用于本地开发和主题打包。
- 一个可从浏览器访问 API 的 Komari 后端实例。
- Komari 1.0.5 或更高版本，用于支持主题原生设置表单。

## 安装 Floe

推荐使用预构建的主题包安装：

1. [下载最新的 <code>dist-release.zip</code>](https://github.com/lliooly/komari-theme-floe/releases/latest/download/dist-release.zip)。
2. 打开 Komari 管理后台，进入主题管理。
3. 上传 ZIP 主题包并启用 Floe。

发布包包含 <code>komari-theme.json</code>、<code>preview.png</code> 和静态 <code>dist/</code> 目录。请上传发布包，不要直接上传源代码仓库。

## 本地开发

克隆仓库并安装锁定版本的依赖：

~~~bash
git clone https://github.com/lliooly/komari-theme-floe.git
cd komari-theme-floe
npm ci
~~~

### 配置 Komari API

如果后端不是运行在默认地址，请在项目根目录创建 <code>.env.local</code>：

~~~env
NEXT_PUBLIC_API_TARGET=http://127.0.0.1:25774
~~~

<code>NEXT_PUBLIC_API_TARGET</code> 应填写后端基础 URL。Floe 会在开发和本地预览时使用它代理 <code>/api/*</code> 和 <code>/themes/*</code>。

### 启动开发服务器

~~~bash
npm run dev
~~~

打开 <code>http://localhost:3000</code>。Next.js 开发服务器会将 API 和主题路径重写到 <code>NEXT_PUBLIC_API_TARGET</code>。

这些 Next.js rewrites 仅在开发环境启用。生产构建是静态导出，不包含服务端 rewrites。

### 预览生产构建

~~~bash
npm run build
npm run preview
~~~

<code>npm start</code> 与本地预览服务器使用同一个入口。构建结果是输出到 <code>dist/</code> 的静态站点；预览服务器会托管该目录，并将 <code>/api</code>、<code>/themes</code> 及其 WebSocket 升级请求代理到配置的 Komari 后端。可以通过 <code>PORT</code> 修改本地端口：

~~~bash
PORT=3001 npm run preview
~~~

### 构建发布包

~~~bash
bash build-theme.sh
~~~

打包脚本会安装依赖、构建静态站点、校验 <code>komari-theme.json</code>、检查 ZIP 内容，并生成 <code>dist-release.zip</code>。该脚本需要 <code>node</code>、<code>npm</code>、<code>jq</code>、<code>zip</code> 和 <code>unzip</code>。

## 主题设置与集成

### 访客本地偏好与管理员默认配置

访客可以使用 Floe 的主题自定义器，为自己的浏览器调整显示效果；这些偏好保存在本地。

管理员可以直接在 Komari 管理后台的 Floe 主题设置表单中，为当前实例发布共享默认配置。表单包括：

- Logo URL、默认外观和默认语言。
- 颜色、布局、卡片、图表、背景和状态卡片设置。
- 面向游客的价格和到期时间显示。
- Uptime Kuma 配置。
- 定时公告管理。

只有 Komari 管理员可以编辑共享设置。

### 定时公告

公告属于共享主题配置，会显示在仪表盘和实例详情页导航栏下方。公告支持 Markdown 标题、列表、链接、代码和表格；原始 HTML 和图片会被禁用。

管理员可以填写公告内容、开始时间、结束时间和文字颜色。开始时间和结束时间使用 <code>YYYY-MM-DD HH:mm</code>，例如 <code>2026-09-15 18:00</code>，按站点约定的 UTC+08:00 解析；已有带时区的 ISO 时间仍然兼容。内容为空、时间无效或已过期的公告不会显示。已打开的页面大约每 30 秒同步一次公告配置。

### Uptime Kuma

在主题设置中填写公开的 Uptime Kuma 状态页基础 URL 和 slug。启用后，Floe 会展示服务分组、运行状态、心跳历史、最新延迟、24 小时可用率，以及返回状态页的链接。

## 部署说明

- Floe 是静态前端。生产环境应通过 Komari 的同源主题入口，或通过 Nginx、Caddy 等正确配置的反向代理托管；静态导出结果不包含 Next.js rewrites。
- 反向代理应将 <code>/api/*</code> 和 <code>/themes/*</code> 转发到 Komari，并为 <code>/api/rpc2</code> 保留 WebSocket 升级。本地静态构建检查可使用 <code>npm run preview</code>，该服务器会提供等效代理。
- 如果 CDN 或代理发送的 <code>HEAD</code> 请求被后端返回 <code>404</code>，请在代理层规范化请求，或修复后端对 <code>HEAD</code> 的处理。
- 建议为静态 JavaScript、CSS 和 JSON 资源启用 Gzip 或 Brotli 压缩。
- 浏览器支持时，同源 Floe 页面会使用 Web Locks 协调设置保存。它不会协调不同浏览器、设备或其他管理客户端；由于 Komari 1.2.1 没有提供 compare-and-swap 版本检查，请避免在多个设备上同时编辑主题设置。

## 常用命令

| 命令 | 用途 |
| --- | --- |
| <code>npm run dev</code> | 启动 Next.js 开发服务器。 |
| <code>npm run build</code> | 在 <code>dist/</code> 中生成静态站点。 |
| <code>npm run preview</code> / <code>npm start</code> | 本地托管 <code>dist/</code> 并代理后端路径。 |
| <code>npm run lint</code> | 对 <code>src/</code> 运行 ESLint。 |
| <code>npm test</code> | 运行 Node.js 回归测试和安全测试。 |
| <code>npm run lint:workflows</code> | 校验 GitHub Actions 工作流。 |
| <code>npm run i18n:validate</code> | 校验语言文件结构和占位符。 |
| <code>npm run i18n:check</code> | 要求翻译文件和源文案快照保持同步。 |
| <code>npm run i18n:sync:dry</code> | 预览翻译变化，不写文件、不调用 API。 |
| <code>npm run i18n:sync</code> | 生成并校验翻译更新。 |
| <code>bash build-theme.sh</code> | 构建并校验 <code>dist-release.zip</code>。 |

## 仓库结构

| 路径 | 作用 |
| --- | --- |
| <code>src/app/page.tsx</code> | 处理仪表盘和 <code>/instance/&lt;uuid&gt;</code> 的客户端路由。 |
| <code>src/components/</code> | 仪表盘、节点、实例、设置和通用 UI 组件。 |
| <code>src/contexts/</code> 和 <code>src/lib/</code> | 实时数据、RPC2、主题设置、公告和集成逻辑。 |
| <code>src/i18n/locales/</code> | English、简体中文和繁体中文翻译。 |
| <code>script/</code> | 本地预览服务器、测试、本地化工具和构建检查。 |
| <code>komari-theme.json</code> | Komari 主题元数据和原生设置表单配置。 |
| <code>build-theme.sh</code> | 可复现的本地主题包构建和校验脚本。 |

## CI 与发布

GitHub Actions 构建工作流会在 Pull Request、<code>main</code> 分支和版本标签上运行语言文件校验、工作流检查、Lint、测试、静态导出、主题元数据校验和 ZIP 校验。使用 <code>vMAJOR.MINOR.PATCH</code> 格式的标签会发布经过校验的 <code>dist-release.zip</code>。

当源语言文件发生需要同步的变化时，翻译工作流会创建可供人工审阅的 Pull Request。详细的自动化和发布策略请参阅 [CI 维护说明](./docs/ci-maintenance.md)。

## 参与贡献

欢迎提交 Issue 和 Pull Request。提交变更前，请至少运行与你的修改相关的检查，尤其是：

~~~bash
npm run lint
npm test
npm run build
~~~

修改用户可见文案时，也请运行语言文件校验或同步命令。涉及项目说明时，请保持 <code>README.md</code> 和 <code>README-CN.md</code> 的内容同步。

## 来源与致谢

Floe 由豕豕豕独立维护，早期技术基础部分来自 [Komari Next](https://github.com/tonyliuzj/komari-next)。同时感谢：

- [piphase/komari-nexus](https://github.com/piphase/komari-nexus)
- [fanchengliu/komari-next-pro](https://github.com/fanchengliu/komari-next-pro)
- [Floe 贡献者](https://github.com/lliooly/komari-theme-floe/graphs/contributors)

## 许可证

Floe 使用 MIT License，原有版权和许可证声明保留在 [LICENSE](./LICENSE) 中。

## Star History

<a href="https://www.star-history.com/?repos=lliooly%2Fkomari-theme-floe&type=date&legend=top-left">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/chart?repos=lliooly/komari-theme-floe&type=date&theme=dark&legend=top-left" />
    <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/chart?repos=lliooly/komari-theme-floe&type=date&legend=top-left" />
    <img alt="Star History Chart" src="https://api.star-history.com/chart?repos=lliooly/komari-theme-floe&type=date&legend=top-left" />
  </picture>
</a>
