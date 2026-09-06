# Floe

Floe 是一个独立维护的 Komari 第三方主题。
它基于 **Next.js**、**TypeScript**、**Tailwind CSS** 和 **Shadcn UI** 构建，并打包为可作为 Komari 主题使用的静态站点。

[English](./README.md)

[演示站点](https://probes.top)

[下载主题文件](https://github.com/lliooly/komari-theme-floe/releases/latest/download/dist-release.zip)

> 本仓库仅包含前端部分。你需要一个正在运行的 Komari 后端实例供该 UI 调用。或者，你也可以下载主题文件，并通过 Komari 管理后台上传；这是推荐的使用方式。

![预览](https://github.com/lliooly/komari-theme-floe/blob/main/preview.png?raw=true)
![深色主题](https://github.com/lliooly/komari-theme-floe/blob/main/images/dark-theme.png?raw=true)

## 功能特性

* 服务器与节点状态的实时仪表盘
* 实例详情页，包含负载与延迟图表
* 节点列表与管理视图
* 基于 `react-i18next` 的国际化（i18n）
* 使用 Shadcn + Tailwind CSS 的响应式布局与深色模式
* 适配 Komari 主题系统的主题打包方案
* **丰富的自定义选项：**

  * **6 种配色主题：** Default、Ocean、Sunset、Forest、Midnight、Rose
  * **4 种卡片布局：** Classic、Modern、Minimal、Detailed —— 每种都有独特的视觉设计与元素布局
  * **4 种图表样式：** Circle、Progress Bar、Bar Chart、Minimal —— 均会跟随所选配色主题
  * **可自定义状态卡片：** 可在仪表盘中显示/隐藏单项指标
  * **自带背景图！** 使用图片 URL 将其设置为背景。
  * **背景模糊：** 可为自定义背景图启用 Soft 或 Glass 模糊效果，并调整模糊强度。
  * **卡片模糊：** 可启用 Soft 或 Glass 卡片背景，分别调整卡片透明强度与额外模糊强度。
  * 内嵌主题设置页不渲染页面级背景，同时与主页共用同一套卡片背景和毛玻璃系统。
  * **Ping 统计显示** 在首页即可直接展示数据包信息！
  * 所有设置会在本地持久化保存，并可在主题切换时同步

## 技术栈

* **框架：** Next.js（App Router，静态导出）
* **语言：** TypeScript、React
* **UI：** Shadcn UI + Radix UI primitives、Tailwind CSS v4
* **图表：** Recharts
* **状态 / 数据：** 自定义 Context、RPC2 客户端、基于 fetch 的 API

## 前置要求

* **Node.js** 22 或更高版本（推荐使用 LTS）
* 一个可从浏览器访问的 **Komari 后端**（API）
* **Komari 1.2.1 或更高版本**，用于支持 Floe 内嵌式主题设置页

## 快速开始

* 直接 [下载主题文件](https://github.com/lliooly/komari-theme-floe/releases/latest/download/dist-release.zip)，并通过 Komari 管理后台上传，这是推荐方式。

## 开发

克隆本仓库并安装依赖：

```bash
npm install
```

### 配置 API 目标地址

前端通过 `next.config.ts` 中配置的 `/api/*` rewrites 与 Komari 后端通信。
使用 `NEXT_PUBLIC_API_TARGET` 设置后端基础地址：

在项目根目录创建 `.env.local` 文件：

```env
NEXT_PUBLIC_API_TARGET=http://127.0.0.1:25774
```

请根据你的 Komari 后端实例调整该 URL。

### 本地开发运行

```bash
npm run dev
```

然后在浏览器中打开 `http://localhost:3000`。

### 生产构建 / 主题打包

本项目已配置为静态导出（`next.config.ts` 中的 `output: "export"`），构建产物会输出到 `dist/`。

```bash
npm run build
```

构建完成后：

* 使用任意静态 Web 服务器托管 `dist` 目录，**或**
* 将 `dist` 内容作为 Komari 主题包的一部分使用。

## Nginx 生产环境优化建议

如果你使用 Nginx 或 OpenResty 作为反向代理，建议参考以下配置以优化性能，并解决 `HEAD` 请求返回 404 的问题。

### 1. 处理 HEAD 请求（推荐）

Next.js 的预取（Prefetching）机制和部分 CDN（如腾讯云 EdgeOne）可能会频繁发起 HTTP `HEAD` 请求。由于后端目前可能未对 `HEAD` 方法进行完整处理，建议在 Nginx 层将其转换为 `GET` 请求回源，以确保预取功能正常：

```nginx
location / {
    # 将 HEAD 转换为 GET 发往后端，解决预取 404
    if ($request_method = "HEAD") {
        rewrite_by_lua_block { ngx.req.set_method(ngx.HTTP_GET) } # OpenResty 方案
        # 或者使用：proxy_method GET;（需注意配置位置）
    }

    proxy_pass http://127.0.0.1:25774;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
```

### 2. 开启 Gzip 压缩

可显著提升 Next.js 静态资源的加载速度：

```nginx
gzip on;
gzip_proxied any;
gzip_types text/plain text/css application/json application/javascript text/xml;
gzip_vary on;
```

### 3. 安全防护建议

建议配合 `fail2ban` 监控 Nginx 日志，防止僵尸网络对 `/api/rpc2` 或 `/instance/` 等路径进行大规模恶意扫描。

这些配置可以改善页面跳转体验，提升套用 EdgeOne、Cloudflare 等 CDN 后的兼容性，并减少控制台和 Nginx 日志中的无效 404 报警。

## 主题开发

### 定时公告

登录前台后，打开导航栏的主题设置 → 公告管理。Komari 会在管理后台的主内容区域内嵌打开 Floe 的自定义设置面板。Floe 自带日期时间选择器、即时预览和“立即关闭”按钮，保存后会作为所有访客共用的主题配置。这个内嵌式主题设置页需要 Komari 1.2.1 或更高版本。

公告在设定时段内与导航栏共同置顶，并作为导航栏下方独立的毛玻璃岛展示；首页和节点详情页都可见，长内容在横幅内部滚动。支持标题、列表、链接、代码和表格，禁用 HTML 和图片。文字颜色仅支持白色、绿色、黄色和红色。结束时间到达后自动隐藏，配置保留供后续修改。过期、内容为空或时间无效时不展示。

已打开的页面每 30 秒同步一次配置，实际同步时间受网络影响；定时判断依赖访客设备时钟。主题横幅不能替代整站离线时的独立维护页。

本仓库设计为可作为自定义 Komari 主题使用。

1. 根据需要配置并自定义 UI。
2. 编辑 `komari-theme.json`，匹配你的主题元数据和设置项。
3. 构建项目：

   ```bash
   npm run build
   ```

4. 静态资源会生成到 `dist` 目录。
   按照 Komari 主题系统要求，将其与 `komari-theme.json` 组合，并根据 Komari 文档进行打包。

## 脚本

* `npm run dev` - 启动 Next.js 开发服务器
* `npm run build` - 将静态站点构建到 `dist/`
* `npm run lint` - 对项目运行 ESLint

## 贡献

欢迎贡献。
如果你发现问题或有改进建议，欢迎提交 issue 或 pull request。

## 来源与致谢

Floe 是独立维护的 Komari 第三方主题，部分代码源自 [Komari Next](https://github.com/tonyliuzj/komari-next)，以此向原作者 Tony Liu 致敬。Floe 的 UI、交互细节和后续开发由豕豕豕独立维护。本项目不是 Komari 或 Komari Next 的官方发布版本，也不代表其官方背书。

感谢以下项目提供参考和启发：

* [Komari Next](https://github.com/tonyliuzj/komari-next)
* [piphase/komari-nexus](https://github.com/piphase/komari-nexus)
* [fanchengliu/komari-next-pro](https://github.com/fanchengliu/komari-next-pro)

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
