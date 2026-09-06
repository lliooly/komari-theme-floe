# Floe 后台内嵌主题设置实施计划

## 目标

将 Floe 的主题管理入口从 `redirect` 改为 `raw`，由 Komari 后台内嵌加载 Floe 自定义设置页，同时保留现有设置逻辑与公告日期时间选择器。

## 实施步骤

1. 将 manifest 配置切换为 `raw`，写入只负责跳转的 HTML 启动页，并兼容 Komari 的部署 base path。
2. 增加嵌入模式检测 Hook 与应用壳层，在嵌入设置页时隐藏全局导航、公告横幅和页脚。
3. 调整 `ThemeSettingsPage` 的页面间距和标题区，保证独立访问与后台嵌入两种场景都可用。
4. 更新主题打包校验、README 和方案文档，明确 `raw` 入口和 Komari 版本要求。
5. 将版本号提升到 `0.1.2`，执行 JSON、类型、Lint（变更文件）、静态构建和主题包验证。
6. 提交、推送并发布 `v0.1.2`，确认 GitHub Actions 与 Release 资产成功。

## 验证命令

```bash
jq empty komari-theme.json
npx eslint src/app/layout.tsx src/components/AppShell.tsx src/components/ThemeSettingsPage.tsx src/hooks/useEmbeddedThemeSettings.ts
npm run build
bash build-theme.sh
git diff --check
```

## 完成标准

- Komari 主题配置入口类型为 `raw`。
- raw HTML 导航 iframe 自身到 `/settings?embedded=1`，不导航顶层后台。
- 嵌入页面不重复显示 Floe 的全局导航与页脚。
- 设置与公告功能不回归，正式 Release 包可下载。
