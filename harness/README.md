# 里程碑验收说明

> v1.0.0 规则总册已沉淀在 [`rules-v1.0.0.md`](/Users/didi/CodeBase/GithubCode/zora-blog/harness/rules-v1.0.0.md)，包含技术栈、代码规范、里程碑交付矩阵、质量闸门、API 基线、部署基线与发版 checklist。本文件仅保留里程碑验收约定与使用说明。

里程碑验收的目标不是替代单元测试，而是给 `M1-M8` 提供统一的验收口径，让每个里程碑提交在自测或提 PR 前都能回答三件事：

1. 结构是否落到位
2. 构建和基础命令是否可跑
3. 需要哪些手动证据才能说明“真的完成了”

## 组成

- [`.github/pull_request_template.md`](/Users/didi/CodeBase/GithubCode/zora-blog/.github/pull_request_template.md)：PR 证据模板
- [`docs/milestone-pr-plan.md`](/Users/didi/CodeBase/GithubCode/zora-blog/docs/milestone-pr-plan.md)：每个 `M` 的范围、交付标准和验证方式
- [`harness/rules-v1.0.0.md`](/Users/didi/CodeBase/GithubCode/zora-blog/harness/rules-v1.0.0.md)：统一规则总册

## 使用方式

在对应里程碑开发完成后，执行该里程碑对应的检查命令。例如：

```bash
npm run lint
npm run build:frontend
npm run build:backend
```

当前验收分两类：

- 自动检查：与当前里程碑相关的 `lint/build`、部署配置、关键命令是否可执行
- 手动检查提示：补对应的 `curl`、页面截图、录屏、Lighthouse 报告或部署记录

## 推荐提交流程

1. 按 [`docs/milestone-pr-plan.md`](/Users/didi/CodeBase/GithubCode/zora-blog/docs/milestone-pr-plan.md) 选定当前 `M`
2. 完成功能后执行当前里程碑对应的自动验证命令
3. 将输出结果粘贴到 PR 的“自动验证”部分
4. 按当前里程碑要求的“手动验证清单”补截图、录屏、`curl` 摘要
5. 在 PR 模板中补齐风险、未覆盖项和回归点

## 当前策略

### M1-M3

优先做“结构 + 构建 + 基础链路”验证：

- 后端项目结构
- 前端正式目录结构
- 关键页面 / 路由 / API 接口
- `lint/build`

### M4-M6

在基础构建检查之外，增加业务链路证据：

- 评论提交流程
- 专题关联流程
- 搜索 / 主题切换

### M7-M8

更强调质量报告和运维证据：

- Lighthouse
- 移动端截图
- 部署日志 / workflow 结果

## 后续演进建议

当前验收流程是轻量版本，适合项目仍在快速搭骨架的阶段。此前基于 shell 的里程碑脚本已退场，避免在 monorepo / GitHub Actions 下产生误报。随着实现推进，可以继续补：

- `Playwright` 页面冒烟和视觉回归
- 后端 `curl` / `HTTPie` smoke test 脚本
- 基于 seed 数据的固定验收数据集
- CI 中按 `M` 运行分层检查
