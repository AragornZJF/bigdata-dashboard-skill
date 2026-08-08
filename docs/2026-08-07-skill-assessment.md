# bigdata-dashboard 技能评估报告

> 评估日期：2026-08-07
> 评估标准：`skill-factory-meta-1.0.1`（reference/skill-standards.md + reference/verification-checklist.md + reference/design-patterns.md）
> 评估对象：`D:\devlope\bigdata-dashboard`（SKILL.md 361 行、CLAUDE.md 105 行、scripts/ 8 个、references/ 2 个、assets/templates/data/ 与 skeletons/ 各 15 个模板、output/ 13 个产物）
> 评估方法：非破坏性只读核查（PyYAML frontmatter 解析、wc/grep/ls 事实核对、与 verification-checklist 逐项对照）

## 一、总体结论

**架构强、验证弱、主控层偏厚、文档已漂移。** 四层架构齐全且执行层脚本化是显著强项（8 个确定性 Python 脚本 + 15 个行业模板，无"让 AI 心算"的公式残留）。但按 verification-checklist 双层门禁标准：**Gate 1 有 3 项不通过、2 项部分通过；Gate 2 无结构化验证产物（缺 VERIFICATION.md）**。整体未达"验证通过"标准，处于"架构合格、验证与文档未达标"状态。

## 二、Gate 1 · 静态自检逐项（对照 verification-checklist 11 项）

| # | 检查项 | 结果 | 证据 |
|---|---|---|---|
| 1 | frontmatter 合法（仅 name+description，name 只含字母/数字/连字符） | ✅ 通过 | PyYAML 解析：仅 2 键；`bigdata-dashboard` 合规 |
| 2 | description 是触发条件而非流程概述 | ⚠️ 部分 | 触发词齐全；但末尾"Excel/JSON 双入口适配渲染，模板可自由扩展"偏能力描述 |
| 3 | description 第三人称、含具体触发词 | ⚠️ 部分 | 有 8 个触发词；缺"大屏""图表""监控屏""看板"等近义触发 |
| 4 | 目录结构完整（四层） | ✅ 通过 | scripts/(执行) + references/(知识) + assets/templates/(规范) 齐全 |
| 5 | SKILL.md < 500 行 | ✅ 通过（有保留） | 361 行 < 500；但超"频繁加载 <200 行"目标近 1 倍 |
| 6 | **SKILL.md 含 Quick Reference 路由表** | ❌ 不通过 | references/ 仅在目录结构图中出现一次，无"何时读哪个文件"路由表 |
| 7 | 引用文件路径真实存在 | ✅ 通过 | references/data_schema.md、layout_schema.md 均在 |
| 8 | 分层自检三连 | ⚠️ 部分 | 公式→scripts ✓；但完整数据契约 JSON 示例（~40 行）与 layout_schema.md 重复内联；目录结构图、9 条关键规则等低频细节内联 |
| 9 | **allowed-tools 注释** | ❌ 不通过 | frontmatter 无 allowed-tools 建议注释 |
| 10 | 无辅助文件混入 | ⚠️ 部分 | 根目录有 README.md/README.en.md/CLAUDE.md（属项目文档可宽容；单独抽取为技能时会混入） |
| 11 | 命名合规 | ⚠️ 部分 | `bigdata-dashboard` 名词化，标准建议动词/动名词开头（作项目名可接受） |

**Gate 1 结果：6 通过 / 3 不通过 / 2 部分通过。按 checklist"任何一项不过即迭代修复"，未通过。**

## 三、Gate 2 · 实跑试测评估

- **有事实证据**：`output/` 13 个自包含 HTML 产物（1.3MB–19.8MB）+ `examples/` 8 张截图 → 构建管线真实跑通过
- **缺结构化验证产物**：无 VERIFICATION.md；无试测场景记录、无迭代轮次记录、无沙箱隔离证明 → 无法满足"指令可无歧义、无跳跃执行"的通过标准
- 另：本次评估中 `py scripts/build_dashboard.py --list` 实测被 plan-mode 只读策略拦截，权威模板清单未能现场再生成，恰证明"文档应与脚本输出对齐"的必要性

## 四、四层架构评估（design-patterns 对照）

```
主控层 SKILL.md     361 行 — 偏厚：行业菜单(13行表) + 完整数据契约 + 目录结构 + 9条关键规则全内联
知识层 references/   2 文件  — ✅ 存在；但主控层无路由表指向 → 渐进式披露链路断裂
规范层 templates/   15 模板 — ✅ 强项（data/ 与 skeletons/ 一一对应）
执行层 scripts/      8 脚本  — ✅ 强项：确定性计算全部脚本化
```

- 分层自检三连结论：无公式残留（执行层达标）；契约格式重复内联（规范层越界）；低频细节未下沉（知识层浪费主控层 token）

## 五、问题清单（按严重度）

### 🔴 P0 · 文档漂移（双源维护已失效）

1. **模板数量全错**：CLAUDE.md 与 SKILL.md 均写"11 个骨架"，实际 `assets/templates/data/` 与 `skeletons/` 各 **15 个**（新增 new_consumption / smart_dashboard / property_management / new_energy_vehicle）
2. **SKILL.md 内部不一致**：行业模板菜单表仅 13 行，缺 property_management、new_energy_vehicle 两项
3. **自带源清单矛盾**：CLAUDE.md 称"7 个自带源（含 lpl/generic/data_center）"，SKILL.md 称"6 个自带源（含 new_consumption/smart_dashboard，不含前三者）"——两权威源互相矛盾，且均未同步最近提交（c714847 去 skeleton_ 前缀、38bffc3 新增 4 模板）

### 🟡 P1 · 验证体系缺失

4. 无 VERIFICATION.md / 无双层验证清单 / 无 Gate 2 试测记录

### 🟡 P1 · 主控层偏厚

5. SKILL.md 361 行全部必加载；完整 JSON 数据契约（~40 行）与 references/layout_schema.md 重复；低频细节（目录结构图、9 条关键规则）内联

### 🟢 P2 · 规范细节

6. 无 allowed-tools 注释；无 Quick Reference 路由表；description 触发词可扩充

## 六、改进建议（按优先级，含工作量估计）

### 建议 1 · 修复 P0 文档漂移（约 30 分钟）

- 以 `assets/templates/data/` 实际目录为唯一真相源
- 运行 `py scripts/build_dashboard.py --list` 与 `--list-data-templates` 现场生成权威清单（需在非 plan-mode 环境执行）
- 同步修订：SKILL.md 行业模板菜单表（补 2 行）+ 自带源清单；CLAUDE.md 模板数量与来源说明
- 原则：**单一权威源**——CLAUDE.md 只保留"如何调用"（命令/环境/注意事项），所有清单、契约、模板明细只存在于 SKILL.md，两处重复删除一处

### 建议 2 · 补 Quick Reference 路由表（约 5 分钟）

SKILL.md 开头（正文第一段后）插入：

```markdown
## Quick Reference 路由表

| 阶段 | 读哪个文件 |
|---|---|
| 通用数据契约 / 布局引擎 schema | references/layout_schema.md |
| 旧版 DASHBOARD_DATA 格式兼容 | references/data_schema.md |
| 行业模板字段映射说明 | assets/templates/data/<skeleton>/README.md |
| 模板清单 / CLI 参数 | 以 SKILL.md 本文为准（运行 --list 核实） |
```

### 建议 3 · 主控层减肥（约 60 分钟）

按归属公式（路由必要性 × 使用频率）：

- 完整 JSON 数据契约示例 → 移入 references/layout_schema.md，SKILL.md 保留一句话指针 + 最小示例（3-5 行）
- 目录结构图、9 条关键规则 → 合并入 CLAUDE.md（项目操作视角）或下沉 reference
- 目标：SKILL.md ≤ 250 行

### 建议 4 · 补 allowed-tools 注释（约 2 分钟）

frontmatter 追加：

```yaml
# 建议 allowed-tools（按需裁剪）：
# - Read, Bash（运行 py / cp / start）
# 说明：构建产物由脚本生成，无需 Write/Edit
```

### 建议 5 · 建立验证报告（约 30 分钟，对齐 skill-factory 交付规范）

- 新增 `output/VERIFICATION.md`：记录 Gate 1 静态自检逐项结果 + Gate 2 实跑场景（建议 2 个：① 新模板 new_energy_vehicle 全流程构建 ② 旧格式 DASHBOARD_DATA 自动升级），含迭代轮次与诚实结论

## 七、附录 · 事实核查记录

| 核查项 | 命令/方法 | 结果 |
|---|---|---|
| SKILL.md 行数 | wc -l | 361 |
| CLAUDE.md 行数 | wc -l | 105 |
| frontmatter 键 | PyYAML safe_load | 仅 name + description |
| description 长度 | len() | 127 字符（<1024 ✓） |
| 模板目录数 | ls assets/templates/data | 15 |
| scripts 数量 | ls scripts/*.py | 8 |
| references 文件 | ls references | data_schema.md, layout_schema.md |
| allowed-tools | grep | 无 |
| 路由表 | grep references/ | 仅在目录结构图出现 1 次 |
| git 状态 | git status --short | 1 个未提交删除（generic 模板占位图） |
| git 最近提交 | git log --oneline -5 | c714847 去 skeleton_ 前缀等 |
