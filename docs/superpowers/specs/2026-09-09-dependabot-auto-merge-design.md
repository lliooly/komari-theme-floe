# Dependabot patch/minor 自动审批与合并

## 文档状态

- 状态：待用户审查，尚未进入实现阶段。
- 日期：2026-09-09。
- 范围：为 `lliooly/komari-theme-floe` 增加 GitHub Actions 对 Dependabot PR 的自动审批和自动合并策略。
- 已确认方案：单个 `pull_request_target` workflow。

## 背景

仓库已经在 `.github/dependabot.yml` 中启用 npm 和 GitHub Actions 的每周更新，并将每个生态的未合并 PR 数量限制为 5 个。现有 `.github/workflows/build.yaml` 会在目标为 `main` 的 PR 上执行 lint、测试、静态构建和主题包校验，但目前没有 Dependabot 专用的审批或合并自动化。

仓库历史中已经出现过 patch、minor 和 major 依赖更新。为了减少低风险依赖更新的人工维护成本，同时避免 major 更新绕过人工判断，本次只自动处理 patch/minor 更新。

## 目标

1. 识别由 `dependabot[bot]` 创建的 PR。
2. 仅当 Dependabot 元数据明确表示更新类型为 `version-update:semver-patch` 或 `version-update:semver-minor` 时，自动审批该 PR。
3. 对同一范围的 PR 启用 GitHub Auto-merge，使用现有分支保护和必需状态检查作为最终合并门槛。
4. 对 major、无法识别更新类型、非 Dependabot PR 或存在人工变更请求的 PR 不执行自动审批和合并。
5. 保持 workflow 可重复运行，避免重复审批和重复设置自动合并。

## 非目标

- 不修改 Dependabot 的更新频率、生态、目录或未合并 PR 数量限制。
- 不自动审批或自动合并 major 更新。
- 不在 `pull_request_target` workflow 中 checkout 或执行 Dependabot PR 分支的代码。
- 不引入 PAT、GitHub App 私钥或其他长期凭据。
- 不通过本次仓库文件变更修改 GitHub 仓库设置、分支保护规则或合并队列配置。
- 不创建 Git worktree 或额外开发分支。

## 方案选择

### 方案 A：单个 `pull_request_target` workflow（采用）

新增 `.github/workflows/dependabot-auto-merge.yml`，在 `opened`、`reopened`、`synchronize` 和 `ready_for_review` 事件触发。workflow 使用 `dependabot/fetch-metadata` 读取 PR 元数据，并通过 GitHub CLI 执行审批和启用自动合并。

该方案只有一处策略判断，权限边界明确，不需要执行 PR 中的代码。`pull_request_target` 能在 Dependabot 普通 `pull_request` 默认只读的情况下使用仓库级写权限；由于 workflow 不 checkout PR 内容，仍保持对不可信变更的隔离。

### 方案 B：拆分审批和合并 workflow

分别维护自动审批和自动合并 workflow。这样可以独立观察两个动作的失败，但会重复 Dependabot 作者判断、元数据读取和版本范围判断，长期维护成本更高。

### 方案 C：普通 `pull_request` 加仓库级写 token 或 PAT

沿用普通 `pull_request` 事件，并通过仓库设置允许写 token 或配置 PAT。文件结构较短，但依赖额外的仓库级安全设置；PAT 还会增加凭据生命周期和泄露风险，不作为默认方案。

## 行为规则

| PR 条件 | 自动审批 | 启用自动合并 | 结果 |
| --- | --- | --- | --- |
| Dependabot，`version-update:semver-patch` | 是 | 是 | 等待必需检查和分支保护通过后合并 |
| Dependabot，`version-update:semver-minor` | 是 | 是 | 等待必需检查和分支保护通过后合并 |
| Dependabot，`version-update:semver-major` | 否 | 否 | 保留人工审核 |
| Dependabot，元数据缺失或其他类型 | 否 | 否 | 失败关闭，不产生写操作 |
| Dependabot，已有 `CHANGES_REQUESTED` | 否 | 否 | 尊重人工意见，保留人工处理 |
| 非 Dependabot PR | 否 | 否 | workflow job 跳过 |

安全更新只有在 `fetch-metadata` 返回上述明确的 patch/minor 更新类型时才会自动处理；无法从元数据确认 SemVer 范围时按人工审核处理。这样不会因为 Dependabot 的安全更新语义变化而误放宽 major 更新策略。

## Workflow 设计

### 触发与权限

- 事件：`pull_request_target`。
- 类型：`opened`、`reopened`、`synchronize`、`ready_for_review`。
- job 条件同时检查：
  - `github.event.pull_request.user.login == 'dependabot[bot]'`；
  - `github.repository == 'lliooly/komari-theme-floe'`；
  - PR 不是 draft。
- workflow 只声明：
  - `contents: write`，用于启用自动合并；
  - `pull-requests: write`，用于提交审批和更新 PR 状态。

### 步骤顺序

1. 使用 `dependabot/fetch-metadata` 的稳定 v3.1.0 版本读取更新类型。
2. 只在 patch/minor 条件满足时继续。
3. 读取当前 review 状态：
   - 已经 `APPROVED` 时跳过重复审批；
   - `CHANGES_REQUESTED` 时结束 job，不覆盖人工意见；
   - 其他状态下使用 `gh pr review --approve` 审批。
4. 使用 `gh pr merge --auto --merge` 启用自动合并。
5. 不 checkout 仓库，不安装依赖，不运行 PR 分支脚本，不读取任何自定义 secret。

### 数据流

```text
Dependabot 创建或更新 PR
        |
        v
pull_request_target workflow
        |
        +-- 作者/仓库/draft 检查失败 --> 跳过
        |
        v
fetch-metadata 读取 update-type
        |
        +-- major/未知类型 --> 不写入，保留人工处理
        |
        v
检查 review 状态
        |
        +-- CHANGES_REQUESTED --> 不审批、不合并
        |
        v
审批（必要时） -> 启用 Auto-merge
                         |
                         v
          必需状态检查和分支保护通过后由 GitHub 合并
```

## 安全边界

`pull_request_target` 使用目标分支上的 workflow 定义，并具备写权限，因此不允许任何来自 PR 的代码进入执行路径。`fetch-metadata` 只通过 GitHub API 读取 Dependabot PR 信息；`gh` 只操作事件中已经确定的 PR URL。

workflow 不使用 `actions/checkout`，不使用 `npm install` 或 `npm run`，不把 PR 内容拼接成 shell 代码，也不访问仓库自定义 secrets。第三方 action 在实现时固定到稳定版本，避免无意升级 action 主版本。

自动合并不是绕过 CI 的强制合并。GitHub Auto-merge 会继续等待目标分支要求的状态检查、审批和其他分支保护条件。如果仓库使用 merge queue，内置 `GITHUB_TOKEN` 可能无法把 PR 加入队列，需要后续单独配置 GitHub App 或 PAT；这不属于本次默认实现。

## 错误处理

- `fetch-metadata` 失败：job 失败且不执行审批或合并，按失败关闭处理。
- 元数据不是 patch/minor：job 不执行写操作，PR 保留人工处理。
- 已存在审批：跳过重复审批，继续尝试确认自动合并。
- 存在 `CHANGES_REQUESTED`：正常结束但不执行自动审批和合并。
- GitHub CLI 审批或启用自动合并失败：job 失败，错误保留在 Actions 日志中，不使用备用凭据重试。
- CI 或必需检查失败：GitHub 不会合并，Auto-merge 等待后续状态变化。

## 仓库设置前提

代码 workflow 之外，仓库维护者需要确认：

1. Actions 设置允许 GitHub Actions 创建和审批 pull request。
2. Settings → General → Pull Requests 已启用 Allow auto-merge。
3. `main` 的分支保护将 `Build and Release Floe Theme / build` 及其他希望强制通过的检查设置为 required。
4. 如果启用了 merge queue，先确认当前 token 是否有权加入队列；否则改用最小权限的 GitHub App 或 PAT。

这些设置不写入仓库文件，因此本次实现只负责提供可审计的 workflow。

## 验证计划

### 静态检查

- 检查 workflow YAML 可以解析。
- 检查 workflow 包含 `pull_request_target`、Dependabot 作者保护、最小写权限和 patch/minor 条件。
- 检查 workflow 不包含 checkout、依赖安装、PR 代码执行或自定义 secret。
- 检查现有 `.github/dependabot.yml` 和 `build.yaml` 未被无关修改。

### 项目回归

- 运行 `npm test`。
- 运行 `npm run lint`。
- 如环境提供 `actionlint`，运行 `actionlint .github/workflows/dependabot-auto-merge.yml`；否则使用 YAML 解析和人工条件审查替代。

### GitHub 上的验收

- 观察一个 patch/minor Dependabot PR：workflow 成功、出现 GitHub Actions 审批、Auto-merge 已启用，并在必需检查通过后合并。
- 观察一个 major Dependabot PR：workflow 不提交审批，不启用 Auto-merge。
- 在 PR 更新提交后确认 `synchronize` 会重新评估条件。
- 验证人工 `CHANGES_REQUESTED` 不会被自动化覆盖。

## 参考资料

- [Automating Dependabot with GitHub Actions](https://docs.github.com/en/code-security/tutorials/secure-your-dependencies/automate-dependabot-with-actions)
- [Dependabot on GitHub Actions](https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-on-actions)
- [`dependabot/fetch-metadata` README](https://github.com/dependabot/fetch-metadata)
- [Automatically merging a pull request](https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/automatically-merging-a-pull-request)
