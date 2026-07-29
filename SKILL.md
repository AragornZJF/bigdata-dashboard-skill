---
name: bigdata-dashboard
description: "数字大屏/数据可视化驾驶舱生成器。当用户要求生成数据大屏、可视化大屏、数字驾驶舱、BI大屏、数据看板、dashboard、数据监控屏，或提供 Excel 或 JSON 数据想要渲染成可视化大屏页面时，Excel/JSON 双入口适配渲染，模板可自由扩展。"
---

# 数字大屏生成器 (BigData Dashboard)

## 核心架构

两种模式，按需选择：

```
用户数据 (Excel/JSON)
    │
    ├─ 模式1: 布局配置引擎（默认，推荐）
    │   layout_builder.py -> renderer.html -> dashboard.html
    │
    └─ 模式2: 源模板适配（从已适配的 11 个骨架中选）
        template_adapter.py -> 骨架注入数据 -> dashboard.html
```

**关键特性**：

- **布局可配**：行/列/组件通过 JSON 描述，不依赖固定模板
- **样式可配**：深色/浅色主题 + CSS 变量自定义覆盖
- **模板分层**：`assets/templates/data/`（用户填写的数据样本）与 `assets/templates/skeletons/`（渲染骨架配置）一一对应但职责分离
- **真实可用模板**：11 个已适配骨架（各含源文件+injector.js），其中 3 个自带源文件（smart_city/power_plant/pharma），8 个需 `--source-dir` 指定外部源目录
- **组件丰富**：统计卡片、摘要条、大数字、环形仪表、ECharts 图表、排行榜、表格、文本共 9 种
- **向后兼容**：旧 DASHBOARD_DATA 格式自动升级为布局配置

### `assets/templates/data/` vs `assets/templates/skeletons/` 职责区分

两目录下的 11 个 `skeleton_xxx` 子目录**一一对应但内容不同**，是**数据样本**与**渲染配置**的关系，不是重复：

| 目录 | 文件 | 用途 | 被谁引用 |
|---|---|---|---|
| `assets/templates/data/<skeleton>/` | `example.json` `example.xlsx` `README.md` | **给用户填写的业务数据样本** + 字段映射说明文档 | 仅 SKILL.md 流程命令引用（`cp` 发给用户） |
| `assets/templates/skeletons/<skeleton>/` | `skeleton.html` `theme.css` `injector.js` `template_config.json` | **渲染层配置**：HTML 骨架 + 主题样式 + 数据注入器 + 图表 DOM id 映射 | `build_dashboard.py` 构建时读取 |

**字段映射关系**：`example.json` 的业务字段（如 `temperature.indoor`）通过 `injector.js` 映射到具体的渲染目标（DOM 选择器或 echarts 实例 id，如 `#temChart` gauge）。`template_config.json` 记录所有 echarts 实例的 dom id 与类型（gauge/candlestick/radar 等）。具体映射详见各 `assets/templates/data/<skeleton>/README.md`。

> ⚠️ `data_schema.json` 和 `metadata.json` 是 `template_adapter.py` 适配过程的**副产物**，不被 `build_dashboard.py` 读取，可忽略。部分模板的 `data_schema.json` 中 chart id 为占位符（如 `myChart`/`a`/`b`），并非真实 DOM id，请以 `template_config.json` 和 `README.md` 为准。

---

## 交互式生成流程（默认推荐）

当用户要求「生成数据大屏 / 可视化大屏 / 数字驾驶舱」时，**不要直接套模板**，按下面三步引导：

### 第 1 步 · 选行业模板

用 `AskUserQuestion`（或编号列表）展示下方「行业模板菜单」让用户选择。
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

### 行业模板菜单

| 菜单选项              | `--template`              | 适用场景                                                | 数据模板目录                              |
| --------------------- | ------------------------- | ------------------------------------------------------- | ----------------------------------------- |
| 企业营收 / 销售额大屏 | `revenue`        | 营收、销售、业绩总览                                    | `assets/templates/data/revenue/`        |
| 设备环境监测          | `device_monitor` | IoT、机房、设备运维                                     | `assets/templates/data/device_monitor/` |
| 气象站监控            | `weather`        | 气象、环境、水文监测                                    | `assets/templates/data/weather/`        |
| 银行信用风险          | `credit_risk`    | 企业信用、风险预警                                      | `assets/templates/data/credit_risk/`    |
| 电信厅店效能          | `telecom_store`  | 营业厅、门店效能分析                                    | `assets/templates/data/telecom_store/`  |
| 通用可视化            | `generic`        | 任意通用数据展示                                        | `assets/templates/data/generic/`        |
| 酷炫数据中心          | `data_center`    | 数据中心、资源监控                                      | `assets/templates/data/data_center/`    |
| 电竞 / LPL            | `lpl`            | 赛事、战队数据                                          | `assets/templates/data/lpl/`            |
| 智慧城市综合监管      | `smart_city`     | 城管、政务监管、实时告警（**自带源**） | `assets/templates/data/smart_city/`     |
| 发电厂数据管理        | `power_plant`    | 电厂、能源、机组监控（**自带源**）     | `assets/templates/data/power_plant/`    |
| 药品企业监管          | `pharma`         | 药企监管、抽检、注册申请（**自带源**） | `assets/templates/data/pharma/`         |
| 新消费市场洞察        | `new_consumption` | 新消费、零售、品牌洞察（**自带源**）   | `assets/templates/data/new_consumption/` |
| 智能看板新中心      | `smart_dashboard` | 设备监控、销售运营、3 栏科技风（**自带源**） | `assets/templates/data/smart_dashboard/` |

> 注：带 `injector.js` 的 8 个模板（revenue / device_monitor / weather / credit_risk / telecom_store / smart_city / power_plant / pharma / new_consumption / smart_dashboard）支持**完整数据注入**；`generic / data_center / lpl` 走布局引擎，图表数据为通用结构（statCards / charts / tables）。
> `smart_city` / `power_plant` / `pharma` / `weather` / `new_consumption` / `smart_dashboard` 源文件已合并至骨架目录，无需 `--source-dir`；其余骨架需 `--source-dir` 提供原始 HTML 目录。

---

## 直接数据生成（用户已有 Excel/JSON，无需模板填写）

用户直接提供自己的 Excel(.xlsx) 或 JSON 数据时，**不需要**走上面的「选行业→发模板→填写」流程，`build_dashboard.py` 直接接受两种格式：

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

```json
{
  "title": "大屏标题",
  "statCards": [{ "label": "指标", "value": "1,286", "unit": "万元" }],
  "charts": [
    {
      "id": "c1",
      "type": "bar",
      "title": "柱状图",
      "data": [{ "name": "一月", "value": 120 }]
    },
    {
      "id": "c2",
      "type": "hbar",
      "title": "TOP 排行（倒序+柱子右侧数值）",
      "data": [{ "name": "广东", "value": 9860 }]
    },
    {
      "id": "c3",
      "type": "pie",
      "title": "占比",
      "data": [{ "name": "A", "value": 40 }]
    }
  ],
  "tables": [{ "headers": ["列1", "列2"], "rows": [["a", "b"]] }]
}
```

- `charts[].type` 支持：`bar`（柱状）/ `line`（折线）/ `area`（面积）/ `pie`（饼图）/ `rose`（玫瑰图）/ `hbar`（横向柱状，自动倒序、柱子右侧显示数值）/ `scatter`
- `charts[].data` 也支持多系列 `{ "categories": [...], "series": [{ "name": "...", "data": [...] }] }`，或直接给一个完整 ECharts option（含 `series`/`xAxis` 即原样使用）
- 布局规则：statCards 通栏置顶（无则跳过）；图表+表格按每行最多 3 个自动均分行列

---

## 触发场景

- 用户说「生成数据大屏」「做一个可视化大屏」「数据看板」「数字驾驶舱」
- 用户上传 Excel(.xlsx) 或 JSON 文件要求可视化
- 用户说「帮我把这些数据做成大屏展示」「用XX模板做大屏」
- 用户提到「dashboard」「BI大屏」「监控大屏」

---

## 两种构建模式

### 模式1：布局配置引擎（默认，推荐）

**适用场景**：用户提供数据，不指定模板，自动生成最优布局。

工作流：

```
Excel/JSON → data_processor.py → layout_builder.py → layout_config.json
                ↓
         build_dashboard.py → renderer.html → dashboard.html
```

```bash
# 一键构建（自动处理旧格式升级）
python scripts/build_dashboard.py data.json --theme dark --output dashboard.html
```

### 模式2：源模板适配（从已适配骨架中选）

**适用场景**：用户想要特定风格的已有骨架（如「数据中心」「电厂监控」「LPL电竞风」）。

工作流：

```
用户数据 → template_adapter.py 适配指定模板 → 注入数据 → dashboard.html
```

```bash
# 列出所有可用模板（含骨架/自定义）
python scripts/build_dashboard.py --list

# 列出 assets/templates/data/ 下可填写的数据样本及其渲染策略
python scripts/build_dashboard.py --list-data-templates

# 从已适配的 11 个骨架中选一个
python scripts/build_dashboard.py data.json --template "weather"
python scripts/build_dashboard.py data.json --template "power_plant"

# 指定外部源目录（骨架无自带源时需要）
python scripts/build_dashboard.py data.json --template "credit_risk" --source-dir "path/to/web/"
```

**模板选择建议**：

| 场景          | 推荐模板（--template 值）                                             |
| ------------- | --------------------------------------------------------------------- |
| 通用数据展示  | `generic`                                                    |
| 酷炫数据中心  | `data_center`                                                |
| 气象/环境监测 | `weather`（自带源）                                          |
| 政务/监管     | `smart_city`（智慧城市综合监管，自带源）                     |
| 游戏/电竞     | `lpl`                                                        |
| IoT/设备监测  | `device_monitor`（4图表+地图+环境指标+维保表格）             |
| 电厂/能源     | `power_plant`（发电厂数据管理，自带源）                      |
| 消费/零售     | `new_consumption`（新消费市场洞察，自带源）                 |
| 智能看板/设备 | `smart_dashboard`（3 栏设备/销售运营，自带源）              |
| 销售/电商     | `telecom_store`                                              |
| 教育/校园     | `data_center`                                                |
| 银行/金融     | `credit_risk`                                                |
| 电信营业效能  | `telecom_store`                                              |
| 企业营收统计  | `revenue`                                                    |

---

## 模板扩展体系

### 内置模板

| 来源                          | 数量 | 说明                                   |
| ----------------------------- | ---- | -------------------------------------- |
| `renderer.html`               | 1    | 动态布局引擎（默认，模式1）            |
| `assets/templates/skeletons/` | 11   | 已适配骨架目录（含源文件+injector.js），其中 4 个自带源文件免 `--source-dir` |
| `assets/templates/custom/`    | 0    | 用户自定义模板扩展点（空架子，待填充） |
| `assets/templates/data/`             | 11   | 用户填写的数据样本（example.json + example.xlsx + README.md），与 skeletons 一一对应 |

### 自定义模板（用户扩展）

在 `assets/templates/custom/` 下创建子文件夹：

```
custom/
└── my-template/
    ├── metadata.json     # 模板元数据 + 数据 schema（必需）
    ├── skeleton.html     # HTML 骨架（可选）
    └── theme.css         # 自定义主题 CSS（可选）
```

`metadata.json` 规范参见 `assets/templates/custom/metadata.example.json` 和 `assets/templates/custom/README.md`。

**最小示例**（只需 `metadata.json`）：

```json
{
  "name": "我的大屏",
  "layout": { "type": "flex", "columns": 3, "unit": "vw" },
  "theme": { "background": "#0d1b3e", "primaryColor": "#00f0ff" },
  "data_schema": {
    "statCards": [{ "id": "sales", "label": "销售额" }],
    "charts": [{ "id": "main", "type": "bar" }]
  }
}
```

不提供 `skeleton.html` 时将使用默认 renderer 引擎，按 `metadata.json` 的布局配置动态渲染。

### 模板发现机制

1. **注册表**：运行 `python scripts/template_scanner.py <source_dir>` 生成 `registry.json`
2. **自动适配**：`build_dashboard.py --template NAME` 自动调用 `template_adapter.py` 适配源模板
3. **已适配骨架**：预置在 `assets/templates/skeletons/<id>_english_name/`（纯英文目录名），含 `template_config.json` + `injector.js`，构建时直接复用
4. **数据注入层**（部分模板支持）：对于已配置 `injector.js` 的模板（如 `device_monitor`），会在构建时自动附加运行时注入脚本，通过 `window.DASHBOARD_DATA` 在页面加载后动态刷新 DOM 文本和 ECharts 图表数据，无需修改原始 JS 文件。

### 数据注入工作原理

对于深度定制模板（图表数据深嵌在外部 JS 文件中），使用注入器模式：

```
build_dashboard.py
  ├─ 1. 读取源 HTML + 资产内联（CSS/JS/图片全部 base64）
  ├─ 2. 数据映射：通用 JSON → template_config.json 格式
  ├─ 3. 注入 injector.js（DASHBOARD_DATA + DOM/图表更新逻辑）
  └─ 4. 输出完全自包含的单文件 HTML
```

注入器通过 `echarts.getInstanceByDom()` 获取已初始化的图表实例，用 `setOption()` 更新数据，无需暴露图表变量到全局作用域。

---

## 目录结构

```
bigdata-dashboard/
├── SKILL.md
├── scripts/
│   ├── data_processor.py        # Excel/JSON 解析
│   ├── layout_builder.py        # 数据 → 布局配置
│   ├── build_dashboard.py       # 构建入口（2种模式）
│   ├── template_scanner.py      # 扫描源模板 → 注册表
│   ├── template_adapter.py      # 源模板 → 数据可注入骨架
│   ├── make_xlsx_template.py    # 数据 JSON → 可填写 Excel 模板
│   ├── xlsx_to_json.py          # 填写后的 Excel → 数据 JSON（反向）
│   └── excel_to_json.py         # 任意 Excel → 数据 JSON 统一入口（_meta/legacy/启发式三分支）
├── assets/templates/data/              # 各行业数据填写模板（给用户填的业务数据样本）
│   ├── revenue/        # 每个含: example.json + example.xlsx + README.md（字段映射说明）
│   ├── device_monitor/
│   ├── weather/
│   ├── credit_risk/
│   ├── telecom_store/
│   ├── generic/
│   ├── data_center/
│   ├── lpl/
│   ├── smart_city/
│   ├── power_plant/
│   └── pharma/
├── assets/
│   ├── renderer.html            # 动态渲染引擎（模式1 核心）
│   └── templates/
│       ├── registry.json        # 模板注册表
│       ├── skeletons/           # 11 个已适配骨架（各含源文件 + injector.js + template_config.json，与 data/ 一一对应）
│       └── custom/              # 用户自定义模板扩展点（空架子）
│           ├── README.md        # 自定义模板指导
│           └── metadata.example.json
└── references/
    ├── data_schema.md           # 旧数据格式规范
    └── layout_schema.md         # 布局配置规范
```

---

## 关键规则

1. **布局配置优先**：有 `layout.rows` -> 直接渲染；旧格式 -> 自动升级
2. **源模板需指定**：必须用 `--template` 参数显式选择
3. **自带源 vs 外部源**：6 个骨架（smart_city/power_plant/pharma/weather/new_consumption/smart_dashboard）自带源文件，免 `--source-dir`；其余需通过 `--source-dir` 指定外部源目录
4. **CSS 变量主题**：`--primary-color` `--bg-color` `--panel-bg` 等变量控制全套配色
5. **响应式字体**：基于 `rem`/`vw`/`vh` 单位
6. **ECharts 自适应**：所有图表自动绑定 resize
7. **自定义模板最小依赖**：只需 `metadata.json`，其余由 renderer 引擎兜底
8. **数据样本与渲染配置分离**：`assets/templates/data/<skeleton>/example.json` 是给用户填的业务数据样本；`assets/templates/skeletons/<skeleton>/injector.js` 负责把业务字段映射到具体 DOM/echarts 实例。两者通过 `template_config.json` 的 `dataMapping` / `echartsInstances` 桥接，字段映射详见各 `assets/templates/data/<skeleton>/README.md`
9. **`data_schema.json` / `metadata.json` 是副产物**：由 `template_adapter.py` 自动生成，不被 `build_dashboard.py` 读取，可忽略；其中 chart id 可能是占位符（如 `myChart`/`a`/`b`），请以 `template_config.json` 为准
