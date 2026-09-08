# CI 与自动化维护

## 工作流职责

| 工作流 | 触发 | 权限及产出 |
| --- | --- | --- |
| Build and Release Floe Theme | main push、PR、版本标签、手动 | `build` 只读，执行工作流校验、翻译校验、lint、测试、构建及主题包校验；标签发布 job 单独获得 contents write |
| Dependabot auto-merge | 面向 main 的 pull_request_target | 仅可信 Dependabot patch/minor；不 checkout、不安装依赖、不执行 PR 代码；核验必需检查后审批并启用 Auto-merge |
| i18n sync | main 翻译相关路径变更、main 手动执行 | 无变化不安装依赖；有变化时生成并验证翻译，创建 `automation/i18n-sync` PR，并显式触发该分支的 build |
| Dependabot Updates | 每周 | npm / GitHub Actions 分别最多 5 个待处理 PR；patch/minor 分组，major 单独处理 |

Node 版本统一由 `.nvmrc` 管理。所有 `uses` 固定为已核验的完整 SHA，并保留版本注释，便于 Dependabot 更新。构建限时 15 分钟，发布和自动合并限时 5 分钟；翻译任务限时 15 分钟，生成步骤限时 8 分钟。

## 本地检查

```bash
npm ci --no-audit --no-fund
npm run lint:workflows
npm run i18n:validate
npm run lint
npm test
npm run build
```

`lint:workflows` 优先使用 PATH 中的 actionlint。GitHub 的 Linux x64 runner 没有该工具时，下载固定 1.7.12 版本并验证仓库内固定的 SHA-256；其他平台请先安装 actionlint。升级校验器时同时更新版本与校验和。

普通 PR 产物保留 3 天，main、标签和手动构建产物保留 7 天；已经压缩的 ZIP 不再进行第二次压缩。每个质量检查 job 只安装一次依赖，不拆分成重复安装的 lint/test/build jobs。当前构建较快，未引入跨运行产物复用或额外 Next 缓存。

## 翻译维护

`src/i18n/locales/zh_CN.json` 是源语言，`src/i18n/source-snapshot.json` 记录上次完整同步的源文案。初始化快照对应当前已存在的翻译。源键的增加、删除以及原文修改都会进入同步计划。

- `npm run i18n:sync:dry`：只计算差异，不请求 API、不写文件、不消费翻译额度。
- `npm run i18n:validate`：校验 JSON、非空字符串和已同步文案的占位符。允许尚未同步的新键及原文变更，以便源文案 PR 先合入 main，随后生成翻译 PR。
- `npm run i18n:check`：严格要求翻译和快照已同步；用于翻译生成后的校验。
- `npm run i18n:sync`：实际同步；需要翻译而缺少 API key 时明确失败，不提交残缺结果。
- `--no-ai`：仅允许无需翻译的整理；遇到需要翻译的内容时失败，不做部分同步。

本地通过 Node 内置 `.env` 加载能力读取配置，CI 不需要安装前端依赖来执行同步计划。CI 使用 `OPENAI_API_KEY`、可选 `OPENAI_BASE_URL` secret 和 `OPENAI_MODEL` variable；默认模型沿用 `gpt-4o-mini`。请求超时 30 秒，只有 429/5xx 最多尝试 3 次，每次退避最多 30 秒。

所有语言先解析，再开始请求；所有请求结果和占位符验证成功后才写入文件、推进快照。坏 JSON、空源对象、AI 失败、意外响应键或丢失占位符都会阻止提交。文件通过临时文件 rename 替换；磁盘写入故障仍会使任务失败，不会继续创建 PR。

翻译 PR 不自动审批或自动合并，维护者仍需检查翻译措辞。创建 PR 的 job 只提交语言 JSON 和源快照。由于 `GITHUB_TOKEN` 推送不会触发 push CI，工作流会显式 dispatch `build.yaml` 到翻译分支；若 dispatch 失败，任务报错，不隐藏缺失检查。

## 自动合并与主分支门槛

远端仓库需要：

1. `allow_auto_merge: true`，允许 merge commit。
2. Actions `can_approve_pull_request_reviews: true`；默认 token 权限继续为 read。
3. main 生效规则要求 `build` 检查来自 GitHub Actions（integration ID 15368），并开启 strict 检查。
4. 保留 main 的禁止删除和禁止强推规则。

自动合并任务会重新读取当前 PR，检查头提交、草稿状态、同仓库来源和目标分支；按用户汇总分页 reviews，尊重最新 CHANGES_REQUESTED，审批绑定当前 commit，启用合并使用 `--match-head-commit`。已存在当前提交审批及 Auto-merge 时不重复写入。

major、未知 metadata、存在人工修改请求时保留人工处理。前提设置缺失、API 错误或 merge queue 配置会失败关闭，不用其他 token 重试。`fetch-metadata` 默认作者/签名验证保持开启。

main 的实际 required check 名称是 `build`，不是工作流标题拼接字符串。设置门槛后，不具备该检查的新提交不能直接进入 main；正常通过 PR 检查后合入。不额外要求个人仓库使用多人审批。

新工作流文件需要先合入默认分支，`pull_request_target` 才会使用它。已有 Dependabot PR 在下一次 synchronize/reopened/ready_for_review 事件重新评估；部署文件本身不会追溯审批所有历史 PR。

## 发布及故障恢复

发布 job 全仓库串行，不因新运行取消正在进行的标签发布。仅接受 `vMAJOR.MINOR.PATCH`，使用构建 job 的已校验 ZIP。

新版本先创建 draft 并上传产物，成功后发布；只有没有更高稳定版本时才设置 latest。已公开且包含完整产物的同版本发布直接保留，重跑不会覆盖 ZIP、notes 或 latest。

如果目标版本已存在 draft 或缺少完整产物，任务明确失败，由维护者检查该 Release；不自动删除、覆盖或猜测修复。网络/API 查询失败也不会被误认为“Release 不存在”。

## 2026-09-09 验证记录

- actionlint 1.7.12 检查全部工作流通过，Dependabot YAML 解析及分组边界验证通过。
- 37 项测试通过，其中新增 20 项覆盖翻译失败、dry-run、原文更新、请求超时、自动合并拒绝条件及发布幂等性。
- ESLint 0 错误，保留既有 21 个 Fast Refresh 警告。
- Next.js 完整静态构建成功，Komari 占位符保护执行成功。
- 从工作流中提取实际元数据校验、主题文件校验和 ZIP 打包脚本执行成功。
- 本次不调用真实翻译 API，不创建验收用远端 PR，不发布或重跑已有 Release。
