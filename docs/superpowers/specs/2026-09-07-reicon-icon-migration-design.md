# Reicon 图标库全量迁移设计

- 日期：2026-09-07
- 项目：`komari-theme-floe`
- 状态：待用户审查

## 1. 背景

当前项目的 UI 图标来自多个来源：

- `lucide-react`：业务组件、基础 UI 组件、菜单图标和动态状态图标；
- `@radix-ui/react-icons`：管理面板关闭和展开图标；
- `src/components/Icones/Tabler.tsx`：部分 Settings、Menu 等本地封装的 Tabler SVG。

菜单配置通过 `src/utils/iconHelper.ts` 将字符串名称映射到 React 图标组件。项目还在 `src/global.css` 中为反馈图标和语义状态图标定义了现有动画。

本次目标是将上述三类图标统一迁移到 Reicon 的 React 包 `reicon-react`，同时保持现有 UI 行为和动画观感。

## 2. 目标与边界

### 目标

1. 所有运行时的 Lucide、Radix Icons 和 Tabler 图标都由 Reicon 组件提供。
2. 通过一个项目内适配层集中处理 Reicon 的组件类型、默认属性和名称映射。
3. 保持现有图标的布局契约：尺寸、颜色继承、间距、`aria-hidden`、按钮结构和状态切换方式不变。
4. 保持现有动画契约：动画 class、时长、关键帧、`key` 触发方式和 `motion-reduce` 行为不变。
5. 迁移完成后移除 `lucide-react` 和 `@radix-ui/react-icons` 直接依赖，并删除不再使用的 Tabler 封装。

### 不在本次范围内

- 不重新设计页面布局、按钮尺寸、颜色主题或动画时序。
- 不移除 Radix UI 的 Dialog、Dropdown、Themes 等组件依赖；仅移除专门的 Radix Icons 包。
- 不修改品牌 Logo、系统 Logo、国家旗帜、外部 URL 图标和其他图片资源。
- 不改变 `menuConfig.json` 的字符串图标配置格式。
- `src/components/Icones/icon.tsx` 中未被引用的本地 `LoadingIcon` 不作为本次旧图标库迁移对象，保持文件现状。

## 3. 方案选择

采用“统一适配层 + 全量替换调用点”。

新增 `src/components/Icones/Reicon.tsx`，业务代码和基础 UI 组件统一从该文件导入图标。适配层可以把当前组件名映射到 Reicon 的实际命名，并提供项目统一的图标组件类型；调用方不需要了解 Reicon 的内部属性差异。

不采用各组件直接从 `reicon-react` 导入的方式，因为那会把命名映射、默认权重和类型调整分散到多个文件。也不采用单一字符串 `<Icon name="..." />` 工厂，因为这会削弱静态导入和 tree-shaking，并使动态名称错误更难在 TypeScript 检查阶段发现。

## 4. 架构与接口

### 4.1 Reicon 适配层

`src/components/Icones/Reicon.tsx` 负责：

- 从 `reicon-react` 导入并重新导出所需的 Reicon 图标；
- 对名称不同或语义需要调整的图标提供本地别名；
- 定义可用于 `ActionFeedbackIcon`、状态元数据和菜单映射的统一图标组件类型；
- 默认设置 `weight="Outline"` 和 `color="currentColor"`，让未特别指定的图标接近当前线框图标表现；
- 让 `className`、标准 SVG/ARIA 属性和 Tailwind 的尺寸类继续传递到最终 SVG；
- 对原本明确使用实心表现的图标选择 `weight="Filled"`，不通过旧图标库兜底。

适配层内部允许使用 Reicon 的真实组件名，但外部可继续使用当前项目已经存在的语义名称，例如 `Check`、`ChevronDown`、`Settings`、`UserCircle` 等。菜单 `iconMap` 继续以这些名称作为稳定键。

### 4.2 调用方迁移

- `src/utils/iconHelper.ts` 改为从 Reicon 适配层导入菜单图标。
- `src/components/ui/action-feedback-icon.tsx` 改用适配层的 `Check`、`X`、`LoaderCircle` 和统一图标类型。
- 所有业务组件和基础 UI 文件移除对 `lucide-react`、`@radix-ui/react-icons` 及 `Tabler.tsx` 的导入。
- `UptimeKumaStatus` 的状态元数据继续使用组件引用，不改变状态到图标的业务映射。
- `menuConfig.json` 保持不变；URL/相对路径图标的现有渲染逻辑保持不变。
- `Tabler.tsx` 在确认无引用后删除。

### 4.3 现有动画兼容

迁移只替换 SVG 图标组件，不改变承载动画的 DOM 结构：

- `ActionFeedbackIcon` 保留外层 `span`、绝对定位、`key={status}` 和现有状态 class；
- `DarkModeToggle` 保留 `key={appearance}`、`semantic-icon-transition` 和 reduced-motion 过渡；
- 排序、展开/收起、视图切换等图标继续保留现有 `semantic-icon-transition`、`semantic-icon-chevron`、`transition-transform` 和 `motion-reduce` class；
- `src/global.css` 的 keyframes、动画时长和 easing 不修改；
- Reicon 图标根节点必须继续接收 `className`，保证旋转、缩放、淡入和抖动仍作用于 SVG 本身。

Reicon 与现有库的笔画细节可能存在固有差异。本次以“结构和动效不变、默认使用 Reicon Outline、语义和尺寸尽量一致”为视觉验收标准；若某个图标不存在完全同形版本，使用 Reicon 中语义最接近的图标，并在适配层旁留下清晰的映射注释。

## 5. 依赖与文件变更

### 依赖

- 新增生产依赖：`reicon-react`；
- 移除生产依赖：`lucide-react`、`@radix-ui/react-icons`；
- 保留其他 `@radix-ui/*` 包，因为它们仍被 UI 组件使用；
- 同步更新 `package-lock.json`。

### 代码

- 新增：`src/components/Icones/Reicon.tsx`；
- 修改：所有当前导入旧图标库的组件、`src/utils/iconHelper.ts`、`src/components/ui/action-feedback-icon.tsx`；
- 删除：不再使用的 `src/components/Icones/Tabler.tsx`；
- 不修改：菜单配置、动画 CSS、业务状态逻辑和非图标资源。

## 6. 验证与验收

### 静态验证

- 全仓库运行搜索，不应再有运行时代码导入 `lucide-react`、`@radix-ui/react-icons` 或 `Tabler.tsx`。
- 所有 `iconMap` 键仍能解析到组件；URL/相对路径图标分支仍可用。
- TypeScript 能通过所有图标组件类型检查，特别是动态组件引用和 `ActionFeedbackIcon`。

### 构建验证

- 执行项目现有的生产构建命令：`npm run build`。
- 检查依赖树中不再存在项目直接声明的旧图标包。

### 行为验证

- 搜索框清除、主题切换、菜单展开、排序、上传/保存/刷新/删除反馈、状态卡图标和管理面板按钮都能正常渲染。
- 反馈图标的 loading 旋转、success 缩放进入、error 抖动和语义图标的缩放/旋转过渡保持原有时序。
- 图标仍继承父级颜色，Tailwind 尺寸类仍能覆盖默认尺寸，并保持现有无障碍属性。

