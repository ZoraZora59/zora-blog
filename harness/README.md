# Milestone Harness

这个 harness 的目标不是替代单元测试，而是给 `M1-M8` 提供统一的里程碑验收入口，让每个 PR 在合并前都能回答三件事：

1. 结构是否落到位
2. 构建和基础命令是否可跑
3. 需要哪些手动证据才能说明“真的完成了”

## 组成

- [`scripts/verify-milestone.sh`](/Users/didi/CodeBase/GithubCode/zora-blog/scripts/verify-milestone.sh)：里程碑检查入口
- [`.github/pull_request_template.md`](/Users/didi/CodeBase/GithubCode/zora-blog/.github/pull_request_template.md)：PR 证据模板
- [`docs/milestone-pr-plan.md`](/Users/didi/CodeBase/GithubCode/zora-blog/docs/milestone-pr-plan.md)：每个 `M` 的范围、交付标准和验证方式

## 使用方式

在对应里程碑开发完成后执行：

```bash
./scripts/verify-milestone.sh M1
./scripts/verify-milestone.sh M2
./scripts/verify-milestone.sh M3
```

脚本会做两类事情：

- 自动检查：关键目录/文件是否存在，`lint/build` 是否可执行
- 手动检查提示：告诉你这个里程碑还需要补哪些 `curl`、页面截图、录屏、Lighthouse 报告

## 推荐 PR 工作流

1. 按 [`docs/milestone-pr-plan.md`](/Users/didi/CodeBase/GithubCode/zora-blog/docs/milestone-pr-plan.md) 选定当前 `M`
2. 完成功能后运行 `./scripts/verify-milestone.sh Mx`
3. 将输出结果粘贴到 PR 的“自动验证”部分
4. 按脚本给出的“手动验证清单”补截图、录屏、`curl` 摘要
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
- 搜索 / RSS / 主题切换

### M7-M8

更强调质量报告和运维证据：

- Lighthouse
- 移动端截图
- 部署日志 / workflow 结果

## 后续演进建议

当前 harness 是轻量版本，适合项目仍在快速搭骨架的阶段。随着实现推进，可以继续补：

- `Playwright` 页面冒烟和视觉回归
- 后端 `curl` / `HTTPie` smoke test 脚本
- 基于 seed 数据的固定验收数据集
- CI 中按 `M` 运行分层检查
