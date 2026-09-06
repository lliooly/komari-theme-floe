# Floe 主题设置鉴权与毛玻璃卡片实施计划

## 目标

为嵌入式主题设置页补充防御性管理员保护，并让所有设置卡片复用主页现有的卡片毛玻璃系统。

## 实施步骤

1. 在页面模式 `ThemeSwitcher` 增加管理员状态保护，保留 `ThemeSettingsPage` 现有的 `/api/me` 加载与无权限分支。
2. 为设置页的通用设置分组、公告卡片、基础设置卡片和状态卡片增加 `data-card-blur-surface` 标记，并让页面模式分组使用主页同样的 surface 视觉。
3. 更新鉴权/视觉说明和版本号，执行 TypeScript、变更文件 ESLint、JSON、静态构建与主题包验证。
4. 提交并发布 `v0.1.3`，确认 GitHub Actions 和 Release 资产成功。

## 完成标准

- 游客无法看到主题管理控件，且保存接口仍保持 `/api/admin/settings` 的后端鉴权。
- 设置页卡片跟随全局卡片模糊开关与强度。
- `v0.1.3` 主题包可以从 GitHub Release 下载。
