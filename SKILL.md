---
name: bigdata-dashboard
description: "数字大屏/数据可视化驾驶舱生成器。当用户要求生成数据大屏、可视化大屏、数字驾驶舱、BI大屏、数据看板、dashboard、数据监控屏、监控大屏、图表大屏、可视化页面，或提供 Excel 或 JSON 数据想要渲染成可视化大屏页面时使用。触发词：大屏、看板、驾驶舱、dashboard、BI、可视化。Excel/JSON 双入口适配渲染，模板可自由扩展。"
# 建议 allowed-tools（按需裁剪）：
# - Read, Bash（运行 py / cp / start 构建与预览）
# 说明：构建产物由脚本生成，无需 Write/Edit
---

# 数字大屏生成器 (BigData Dashboard)

## 0. 入口路由

| 用户情况 | 走哪条路 |
|---|---|
| 无数据，需要选行业模板 | ↓ **流程A · 交互式生成**（第 1 节） |
| 已有 Excel/JSON，无风格要求 | ↓ **流程B · 直接生成**（第 2 节） |
| 已有数据 + 想要特定风格 | 流程B + `--template <骨架名>`（选模板见第 3 节菜单） |
| 想扩展 / 自定义模板 | 第 5 节 模板扩展体系 |

## 1. 流程A · 交互式生成（默认推荐）

当用户要求「生成数据大屏 / 可视化大屏 / 数字驾驶舱」时，**不要直接套模板**，按下面三步引导：

### 第 1 步 · 选行业模板

用 `AskUserQuestion`（或编号列表）展示「行业模板菜单」（见第 3 节）让用户选择。
`--template` 支持三种写法：编号（如 `092`）、英文骨架名（如 `revenue`）、中文名（如 `企业营收大数据统计可视化大屏`）。

### 第 2 步 · 发数据模板（Excel + JSON）

选定行业后，把对应的示例数据模板交给用户填写：

```bash
# 0) 可选：程序化列出所有可用数据模板及其渲染策略（避免凭记忆）
python scripts/build_dashboard.py --list-data-templates

# 1) 复制 JSON 模板到用户工作区
cp assets/templates/data/<skeleton>/example.json  <用户目录>/<行业>_data.json

# 2) 生成可填写的 Excel 模板（多 sheet：说明 / 概览 / 各字段 / 复杂字段以 JSON 文本存放）
python scripts/make_xlsx_template.py assets/templates/data/<skeleton>/example.json <用户目录>/<行业>_data.xlsx
```

把 `<行业>_data.json` 和 `<行业>_data.xlsx` 一并交给用户，**明确告诉他「填 Excel 或 JSON 任一即可」**。
Excel 中：「概览」表填标量（标题/标签/数值），「字段」表填数组（对象按列、数值按行），复杂嵌套字段为单元格内 JSON 文本可直接编辑。

**字段映射说明**：每个 `assets/templates/data/<skeleton>/` 下都有 `README.md`，记录了 `example.json` 每个字段对应的渲染目标（DOM 选择器 / echarts 实例 id / canvas）和填写注意事项。用户填写时如不确定字段含义，可参考该 README。

### 第 3 步 · 生成大屏

用户填回数据后：

```bash
# 若用户返回的是 Excel，先转回 JSON
python scripts/xlsx_to_json.py <用户目录>/<行业>_data.xlsx <用户目录>/<行业>_data.json

# 再构建
python scripts/build_dashboard.py <用户目录>/<行业>_data.json \
    --template <skeleton> --output dashboard.html
```

构建产物为自包含单文件 HTML（无 CDN 依赖），可直接浏览器打开。

## 2. 流程B · 直接数据生成（用户已有 Excel/JSON）

用户直接提供自己的 Excel(.xlsx) 或 JSON 数据时，**不需要**走流程A，`build_dashboard.py` 直接接受两种格式：

```bash
# Excel 直接生成（自动识别，无需先转 JSON）
python scripts/build_dashboard.py <用户数据>.xlsx --output dashboard.html

# JSON 直接生成
python scripts/build_dashboard.py <用户数据>.json --theme dark --output dashboard.html
```

### Excel 自动识别规则（excel_to_json.py）

按优先级三分支：

1. **模板回填的 Excel**（含隐藏 `_meta` sheet，即 `make_xlsx_template.py` 产物）→ 完整还原原 JSON 结构
2. **布局引擎历史约定**（含 `config/stats_left/summary/bignumber/gauges/ranking` 等 sheet 名）→ `data_processor.parse_excel`
3. **任意 Excel** → 启发式转换：
   - 第一个「2 列 文本+数值」sheet（≤10 行）→ 顶部统计卡片 statCards
   - 其余「文本+数值」sheet → 柱状图（每 sheet 一张）
   - 其它多列 sheet → 数据表格

### 通用 JSON 数据契约（布局引擎）

用户数据格式：`{ title, statCards[], charts[], tables[] }`。完整 schema 与示例见 `references/layout_schema.md`「用户数据契约」节，要点：

- `charts[].type`：`bar` / `line` / `area` / `pie` / `rose` / `hbar` / `scatter`
- `charts[].data`：单系列 `[{name, value}]`、多系列 `{categories, series}`，或透传完整 ECharts option
- 布局规则：statCards 通栏置顶；图表+表格每行最多 3 个自动均分

## 3. 行业模板菜单与两种构建模式

### 行业模板菜单（单源）

完整菜单（15 个模板：中文名 / 骨架名 / 适用场景 / 自带源标记 / 场景→模板建议）见 **`references/templates_menu.md`** —— 选模板与发模板时以它为准，勿凭记忆。运行时核实：`py scripts/build_dashboard.py --list` / `--list-data-templates`。

### 两种构建模式

```
用户数据 (Excel/JSON)
    │
    ├─ 模式1: 布局配置引擎（默认，推荐）
    │   Excel/JSON → data_processor.py → layout_builder.py → renderer.html → dashboard.html
    │   适用：有数据、不指定模板，自动按数据形状排布
    │
    └─ 模式2: 源模板适配（需 --template，从 15 个骨架中选）
        template_adapter.py → 骨架 HTML 注入数据 → dashboard.html
        适用：想要特定风格（如「数据中心」「电厂监控」「LPL电竞风」）
```

```bash
# 从已适配的 15 个骨架中选一个（11 个自带源免 --source-dir）
python scripts/build_dashboard.py data.json --template "weather"
python scripts/build_dashboard.py data.json --template "power_plant"

# 指定外部源目录（4 个骨架无自带源时需要）
python scripts/build_dashboard.py data.json --template "credit_risk" --source-dir "path/to/web/"
```

### 概念速览

- **双目录职责**：`templates/data/<skeleton>/`（example.json + example.xlsx + README.md，给用户填的业务数据样本）与 `templates/skeletons/<skeleton>/`（入口 index.html + injector.js + template_config.json + metadata.json，渲染层配置）一一对应但职责不同，由 `build_dashboard.py` 构建时读取后者；11 个自带源骨架含完整源资源，其余 4 个（revenue / device_monitor / credit_risk / telecom_store）需 `--source-dir`
- **字段映射链路**：`example.json` 业务字段 → `injector.js` → `template_config.json` 中的 DOM selector / echarts 实例 id（详见各 `templates/data/<skeleton>/README.md`）
- **数据注入**：全部 15 个骨架带 `injector.js`，构建时自动附加，读 `window.DASHBOARD_DATA` 用 `echarts.getInstanceByDom()` + `setOption()` 更新，不修改原始 JS、不暴露全局变量
- **布局引擎自动升级**旧版 `window.DASHBOARD_DATA` → `layout_config` schema，不要手动迁移旧数据
- **样式与响应式**：CSS 变量（`--primary-color`/`--bg-color`/`--panel-bg`）控制配色；`rem`/`vw`/`vh` 响应式字体；ECharts 自动绑定 resize
- ⚠️ **`data_schema.json` / `metadata.json` 是 `template_adapter.py` 的副产物**，不被 `build_dashboard.py` 读取，可忽略；其中 chart id 可能是占位符（如 `myChart`/`a`/`b`），DOM id 以 `template_config.json` 与 `README.md` 为准

## 4. CLI 速查

```bash
py scripts/build_dashboard.py data.json --theme dark --output dashboard.html   # 模式1 构建
py scripts/build_dashboard.py data.xlsx --output dashboard.html                # Excel 输入自动识别
py scripts/build_dashboard.py data.json --template pharma --output out.html    # 模式2 构建
py scripts/build_dashboard.py --list                 # 列出所有可构建模板
py scripts/build_dashboard.py --list-data-templates  # 列出可填写的数据样本及渲染策略
py scripts/make_xlsx_template.py assets/templates/data/<skeleton>/example.json user_data.xlsx  # JSON → 可填 Excel
py scripts/xlsx_to_json.py user_data.xlsx user_data.json   # 回填 Excel → JSON
py scripts/excel_to_json.py any.xlsx any.json              # 任意 Excel → JSON（三分支）
```

> `build_dashboard.py` 没有 `--help`（该 flag 会被当作数据路径报错）。不带参数运行可查看 usage。
> 模板清单 / CLI 参数有疑虑时，以 `--list` 输出为准，勿凭记忆。

## 5. 模板扩展体系

### 内置模板

| 来源                          | 数量 | 说明                                   |
| ----------------------------- | ---- | -------------------------------------- |
| `renderer.html`               | 1    | 动态布局引擎（默认，模式1）            |
| `assets/templates/skeletons/` | 15   | 已适配骨架（各含 injector.js + template_config.json），11 个自带源免 `--source-dir` |
| `assets/templates/data/`             | 15   | 用户填写的数据样本（example.json + example.xlsx + README.md），与 skeletons 一一对应 |
| `assets/templates/custom/`    | 0    | 用户自定义模板扩展点（空架子，待填充） |

### 自定义模板（用户扩展）

在 `assets/templates/custom/` 下创建子文件夹：

```
custom/
└── my-template/
    ├── metadata.json     # 模板元数据 + 数据 schema（必需）
    ├── skeleton.html     # HTML 骨架（可选）
    └── theme.css         # 自定义主题 CSS（可选）
```

`metadata.json` 规范参见 `assets/templates/custom/metadata.example.json` 和 `assets/templates/custom/README.md`。最小示例（仅 metadata.json 即可，其余由 renderer 引擎兜底渲染）见 `metadata.example.json`。

### 模板发现机制

1. **注册表**：运行 `python scripts/template_scanner.py <source_dir>` 生成 `registry.json`
2. **自动适配**：`build_dashboard.py --template NAME` 自动调用 `template_adapter.py` 适配源模板
3. **已适配骨架**：预置在 `assets/templates/skeletons/<english_name>/`（纯英文目录名），含 `template_config.json` + `injector.js`，构建时直接复用

## 6. Quick Reference 路由表

| 阶段 | 读哪个文件 |
|---|---|
| 选模板 / 场景→模板建议 | `references/templates_menu.md` |
| 通用数据契约 / 布局引擎 schema | `references/layout_schema.md` |
| 旧版 DASHBOARD_DATA 格式兼容 | `references/data_schema.md` |
| 行业模板字段映射说明 | `assets/templates/data/<skeleton>/README.md` |
| 自定义模板规范 | `assets/templates/custom/README.md` + `metadata.example.json` |
| 完整目录结构（工程视角） | `CLAUDE.md` |
| 模板清单运行时核实 | `py scripts/build_dashboard.py --list` |
