# Floe 嵌入式设置页透明背景设计

## 1. 目标

让 Komari 后台内嵌的 Floe 设置页不再渲染 Floe 自己的页面底色、背景图片和遮罩，使其能自然融入 Komari 后台内容区域。

设置卡片继续保留上一版接入的主页同款毛玻璃；“不渲染背景”仅指页面级背景，不移除卡片层次。

## 2. 方案

- `AppShell` 根据 `/settings?embedded=1` 设置 `body[data-embedded-theme-settings="true"]`。
- 全局 CSS 在该标记下将 body 背景设为透明，并隐藏自定义背景图与遮罩伪元素。
- 退出嵌入模式时移除标记，主页和独立 `/settings` 自动恢复原有背景逻辑。
- 不修改主题设置数据、鉴权逻辑或 Komari API。

## 3. 验证标准

- 嵌入设置页 body 透明，背景图和遮罩伪元素不显示。
- 设置卡片仍能接收现有卡片模糊 CSS。
- 直接访问主页与 `/settings` 不带 `embedded=1` 时背景不变。
- TypeScript、变更文件 ESLint、静态构建和主题打包通过。
