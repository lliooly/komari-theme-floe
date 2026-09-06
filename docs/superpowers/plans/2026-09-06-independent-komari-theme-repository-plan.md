# 独立 Komari 主题仓库与发布基线实施计划

本计划依据 docs/superpowers/specs/2026-09-06-independent-komari-theme-repository-design.md 制定。计划直接在当前仓库执行，不创建额外工作树。

本计划只覆盖阶段 A：仓库独立化与发布基线。具体 UI 视觉系统属于阶段 B，需要另行进行 UI 头脑风暴、视觉方向确认和实现计划。

## 执行前置条件

- 主题名称已确定为 Floe，计划仓库名为 `komari-theme-floe`，主题短名为 `floe`。实际迁移仍需用户提供新仓库创建后的准确 URL。
- 新仓库必须是公开的独立仓库，不创建为原项目的 fork。
- 新仓库创建时不自动初始化 README、LICENSE、.gitignore 或其他首个提交，避免产生与当前历史无关的根提交。
- 迁移源以实际开始迁移时的当前 HEAD 为准；迁移前确认工作区没有用户未提交的代码改动。
- 迁移只保留源代码、文档、配置和已纳入 Git 的资源，不把 .env.local、data、node_modules、.next 或其他忽略内容推送到新仓库。
- 在新仓库首个 Release 验证通过前，不归档或删除当前 fork。

## 1. 创建独立 GitHub 仓库

由用户在 GitHub 创建空的公开仓库，并完成以下基础设置：

- 使用独立主题名称 `komari-theme-floe`，主题展示名为 `Floe`，不再使用 `Komari Next` 或 `next`。
- 设置简短描述，明确这是 Komari 的第三方主题。
- 默认分支使用 main。
- 开启 Issues；是否开启 Discussions 不影响本计划。
- 不勾选自动创建 README、许可证或 .gitignore。

仓库创建后记录准确的仓库 URL，作为后续 manifest、README、Footer 和 Release 工作流的唯一项目地址。

验证点：GitHub 页面显示该仓库不是 fork，仓库为空或只包含平台元数据，且用户拥有推送和创建 Release 的权限。

## 2. 迁移完整 Git 历史

迁移前执行只读检查：

- 确认当前分支是 main，工作区干净。
- 记录当前 HEAD、提交数量、标签列表和最近提交。
- 检查 Git 提交邮箱是否与用户的 GitHub 账户关联。
- 使用 rg 检查未跟踪文件和敏感配置不会进入提交。

迁移步骤：

1. 临时添加名为 standalone 的新仓库 remote。
2. 将当前 main 和所有现有标签推送到新仓库。
3. 在 GitHub 页面确认 main 的提交历史、作者、标签和文件内容完整。
4. 比较源仓库与新仓库的 HEAD 和提交数量。
5. 验证完成后，将本地 origin 切换为新仓库 URL。
6. 移除 standalone 和原作者 upstream，确保日常 Git 操作不再默认访问原项目。

不执行 force push、squash、rebase、filter-repo 或删除提交。当前 fork 在整个迁移过程中保持不变；新仓库首个可安装版本完成后，再由用户决定是否将 fork 归档。

验证点：新仓库默认分支包含完整历史，原作者提交仍由原作者显示，当前维护者提交保留原有作者邮箱；本地 remote 列表不再包含 upstream。

## 3. 更新项目身份和来源说明

### README

修改 README.md 和 README-CN.md：

- 更新项目标题、简介、演示地址和下载地址。
- 将所有下载、预览图、Release 和贡献者链接指向新仓库。
- 删除原仓库的 Star History 和 Contributors 展示，改为新仓库的链接。
- 增加「来源与致谢」章节，明确部分代码源自 Komari Next，列出原项目地址和 Tony Liu 信息。
- 明确本项目是独立的第三方 Komari 主题，后续 UI 和交互由当前维护者独立演进。
- 说明本项目与原项目没有持续同步关系，不代表原项目或 Komari 官方背书。
- 保留本地开发、构建、主题安装和兼容性说明，但删除指向原作者 Release 的安装入口。

README 中只允许在来源致谢和许可证说明中保留原项目 URL。运行时安装、更新和项目推广入口不能继续指向原作者仓库。

### 主题 manifest

修改 komari-theme.json：

- 将 name 改为 `Floe`。
- 将 short 改为唯一短名称 `floe`，不再使用 `next`。
- 将 description 改为 Floe 的流动数据、柔和层次和实时反馈定位。
- 将 version 重置为独立主题自己的版本序列，首个开发版本建议为 0.1.0。
- 将 author 改为当前维护者或维护团队。
- 将 url 改为新独立仓库 URL。
- 保留 preview 的相对路径，并确认主题包内存在对应文件。

主题名称、仓库名和 short 已确定；实际仓库 URL 仍须在首个 Release 前确认，不发布指向占位地址的主题包。

### 运行时品牌链接

修改 src/components/Footer.tsx：

- 移除指向原项目的 GitHub 链接和 Komari-Next 文案。
- 保留 Komari 要求的 Powered by Komari Monitor. 页脚文本。
- 如需展示项目链接，使用新主题名称和新仓库 URL，并与 Komari 品牌文案区分。
- 保留现有响应式布局、浅色/深色适配和无障碍标签。

检查 src/components/admin/AdminPanelBar.tsx 中的 Komari 官方版本检查地址。该地址用于检查 Komari 后端版本，不属于原主题更新入口，应保持指向 Komari 官方仓库；不要将它误改成新主题仓库。

### 包管理元数据

修改 package.json 中的 name 和 version，使其体现独立主题身份。private 保持为 true，避免主题源代码被误当作 npm 公共包发布。依赖版本和锁文件只有在构建验证确实需要时才调整。

## 4. 保留许可证并完成归属审计

### 代码许可证

保留当前 LICENSE 文件中的 MIT License 文本和 Tony Liu 的版权声明，不用新的版权声明覆盖原声明。

在 README 的来源与致谢章节补充原项目链接和独立演进说明。当前维护者新增代码继续使用兼容 MIT 的项目许可，但不删除来源代码的原有归属。

### 资源许可证

对以下资源做一次发布前清单检查：

- preview.png、images 目录和 public 目录中的图片。
- Tabler、Lucide、Radix 或其他图标资源。
- 字体、外部图片、地图数据和复制来的代码片段。
- 构建产物中实际打包的静态资源。

若某项资源需要额外归属说明，则增加有实际内容的 NOTICE 或资源归属清单；如果没有额外要求，不增加空文件。任何不兼容 MIT 的资源必须替换，或按其许可要求分发。

验证点：新仓库中存在完整 LICENSE；README 的来源说明和资源归属与实际内容一致；主题 ZIP 不包含来源不明的新增资产。

## 5. 迁移 Komari 主题 manifest 配置

当前 manifest 的 configuration 使用 managedFields，包含 35 个配置项。当前 Komari 主题文档采用 configuration.type 和 configuration.data，因此需要在首个 Release 前完成一次结构迁移和运行验证。

迁移规则：

- configuration.type 设置为 managed。
- configuration.data 保存配置项数组。
- 每个配置项的 label 映射为 name。
- text 映射为 string，option 映射为 select，bool 映射为 switch，number 保持为 number。
- 保留 key、required、default 和 help 等语义；options 按目标 Komari 版本要求的格式序列化。
- configuration.name、icon 和多语言文本按当前主题显示名称更新。
- 不同时保留旧 managedFields 和新 data 两套字段，避免服务端读取歧义。

实现时先对照目标 Komari 后端版本和官方示例确认字段类型，再修改 manifest。不要仅凭前端当前代码推断服务端兼容性。

兼容性要求：

- 没有 configuration 时主题仍能加载。
- managed 的 data 缺失、为空或包含未知类型时，主题配置页面不会导致整个主题崩溃。
- 主题设置中的公开字段不包含 Token、密钥或私密 URL。
- 目标版本低于动态配置支持版本时，主题核心页面仍可使用，README 说明配置能力的版本要求。

验证点：在目标 Komari 版本中可以打开主题设置、保存全部类型配置、刷新后读取配置，并确认前端默认值和服务端返回值一致。

## 6. 重构构建与 Release 工作流

### 稳定 Release 入口

修改 .github/workflows/build.yaml，将当前每次推送 main 自动创建开发 Release 的流程改为版本标签驱动：

- Pull Request 和推送 main 只执行构建与校验，不创建 Release。
- 推送符合 vX.Y.Z 格式的标签时构建稳定主题包并创建 GitHub Release。
- 可保留 workflow_dispatch 作为手动构建入口，但手动发布必须显式提供并校验版本。
- manifest 的 version 必须与标签去掉 v 后的版本完全一致。
- manifest 的 url 必须等于新仓库 URL。
- manifest 的 short 必须等于新主题的唯一 short。

这样可以避免 UI 实验提交自动成为 Komari 的 latest 更新，稳定版本由维护者明确打标签发布。

### 构建环境

Release 和 CI 使用 Node.js 22，使用 npm ci 安装锁定依赖，并执行：

1. TypeScript 检查。
2. npm run build。
3. 检查 dist/index.html 的 Komari title、description 和 body 占位内容。
4. 检查主题 manifest 可解析且元数据完整。

继续保留 script/protect-komari-placeholders.mjs，并确认它在构建后运行且不会破坏服务端替换占位内容。

### 打包与校验

工作流在临时目录组装以下内容：

~~~text
theme.zip
├── komari-theme.json
├── preview.png
└── dist/
~~~

打包后执行：

- ZIP 完整性测试。
- 确认根目录存在 komari-theme.json。
- 确认根目录存在 preview.png。
- 确认 ZIP 中存在 dist/。
- 对最终 ZIP 计算小写 SHA-256。

Release 只上传一个可安装的主题 ZIP，例如 dist-release.zip。SHA-256 写入 Release 说明或市场提交资料，不另传一个可能被 Komari 误识别为主题包的附件。

GitHub Actions 只使用当前仓库的 GITHUB_TOKEN，并限制为 contents: write。失败时不创建不完整 Release，也不访问原作者仓库。

### 本地构建脚本

更新 build-theme.sh：

- 使用 npm ci 或明确的锁文件安装方式。
- 使用安全的临时目录组装主题包。
- 从 manifest 读取版本，不再使用原项目版本语义。
- 使用与 CI 一致的根目录结构和校验规则。
- 输出可直接安装的主题 ZIP，并打印 SHA-256。

脚本不修改远程仓库、不提交生成文件，也不覆盖源 manifest 的版本。

## 7. 清理不适合迁移的工作流

### 预览主题工作流

移除 .github/workflows/preview-theme.yaml。该工作流绑定不存在的 radix 分支，且只生成旧式 artifact，与稳定主题 Release 流程重复。

### 环境专用部署工作流

不将当前 .github/workflows/development.yaml 中的 SSH 生产部署逻辑带入独立主题仓库。它依赖特定服务器、路径和密钥，不属于主题发布基线。

独立仓库如需持续集成，新增只构建和校验的 CI 工作流，不包含服务器登录、rsync 或生产环境密钥。

### 国际化同步工作流

暂保留 .github/workflows/i18n-sync.yml，但检查其仓库权限、分支触发范围和用户自有 API Secret 配置。它不应引用原作者仓库，也不能因为同步失败阻断主题 Release；是否长期保留作为后续维护决策。

## 8. 首个 Release 与 Komari themes 上架

新仓库完成迁移和代码变更后，按以下顺序发布：

1. 在新仓库 main 上完成身份、manifest、许可证和工作流变更。
2. 运行本地 TypeScript 检查、生产构建和主题打包。
3. 在一个实际 Komari 实例中安装主题。
4. 验证首页、节点详情、登录、浅色/深色、移动端、国际化、主题设置和更新流程。
5. 为稳定版本更新 manifest version，并创建对应 vX.Y.Z 标签。
6. 检查 GitHub Release 只有一个可安装 ZIP，下载后重新计算 SHA-256。
7. 使用新仓库地址、主题名称、short、版本、作者、描述和预览图准备市场提交。
8. 按 Komari Theme Market 当前 Issue 模板、校验脚本和工作流要求提交。

主题市场登记信息必须和 Release 内的 manifest 一致。主题更新只能跟随新仓库的 Release，不能再请求原作者仓库。

## 9. 验证清单

### Git 与仓库

- 新仓库不是 fork，公开可访问。
- main 是默认分支。
- 源仓库与新仓库 HEAD、提交数量和标签一致。
- 原作者和当前维护者提交的作者信息没有被改写。
- 本地 origin 指向新仓库，upstream 已移除。
- README、manifest、Footer 和工作流不再把原仓库作为运行时来源。

### 静态检查

- npx tsc --noEmit 通过。
- npm run build 通过。
- git diff --check 通过。
- 所有 JSON 文件可解析。
- 主题 manifest 使用目标 Komari 版本支持的 configuration 结构。

### 主题包

- ZIP 根目录存在 komari-theme.json。
- ZIP 根目录存在 preview.png。
- ZIP 中存在 dist/ 和 dist/index.html。
- manifest 的 name、short、version、author、url、preview 正确。
- 版本标签、manifest version 和市场提交版本一致。
- ZIP 的 SHA-256 已记录且为小写。
- 不包含 GitHub 自动生成的 Source code ZIP 作为安装包。

### 运行时

- 主题可以从 ZIP 安装并正常加载。
- 主题设置可以读取、保存和刷新回显。
- title、description、body 占位内容仍能被 Komari 自定义配置替换。
- /admin 和 /terminal 仍由 Komari 系统接管。
- 页脚保留 Powered by Komari Monitor.。
- 主题更新不访问原作者仓库。

## 10. 执行顺序与停止条件

执行顺序：

1. 用户创建空的公开独立仓库，并提供准确 URL。
2. 迁移完整历史并验证远程内容。
3. 切换 origin，移除 upstream。
4. 更新项目身份、来源说明、Footer 和 manifest。
5. 完成许可证和资源审计。
6. 迁移并验证 Komari manifest 配置。
7. 更新 CI、打包和 Release 工作流。
8. 运行完整验证。
9. 创建首个稳定 Release 并提交主题市场。

以下情况立即停止发布流程，但保留已完成的本地可恢复改动：

- 用户尚未提供新仓库 URL。
- 新仓库不是独立仓库或无法推送。
- manifest 兼容性无法在目标 Komari 版本中确认。
- 主题 ZIP 缺少根 manifest、dist 或预览图。
- 新增资源的许可证无法确认。
- Release 生成了多个可能被 Komari 误识别的安装附件。

## 预计影响文件

### 阶段 A 修改或新增

- 修改 README.md。
- 修改 README-CN.md。
- 修改 komari-theme.json。
- 修改 package.json。
- 修改 src/components/Footer.tsx。
- 修改 .github/workflows/build.yaml。
- 修改 build-theme.sh。
- 删除 .github/workflows/preview-theme.yaml。
- 删除或替换 .github/workflows/development.yaml。
- 按资源审计结果新增 NOTICE 或归属清单。

### 阶段 A 保持不变但需要验证

- LICENSE。
- src/components/admin/AdminPanelBar.tsx 中的 Komari 官方版本检查地址。
- script/protect-komari-placeholders.mjs。
- next.config.ts。
- .github/workflows/i18n-sync.yml。

### 阶段 B 单独处理

- src/global.css。
- src/components/NavBar.tsx。
- src/components/NodeDisplay.tsx 及其样式。
- src/components/AdaptiveChart.tsx、CircleChart.tsx 和图表样式。
- src/components/ThemeSwitcher.tsx。
- src/contexts/ThemeContext.tsx。
- 其他由 UI 视觉方向确认后确定的页面和组件。
