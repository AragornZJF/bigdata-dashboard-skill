# 数字大屏生成器 (BigData Dashboard)

把 Excel / JSON 数据一键渲染成震撼、专业、可直接浏览器打开的**单文件 HTML 数据大屏**。无 CDN 依赖，CSS / JS / 图片全部内联，双击即可展示，便于离线分发与汇报投屏。

> 仓库：https://github.com/AragornZJF/bigdata-dashboard-skill

---

## 安装

在 Claude Code 或 Codex 中直接说：

> 请安装 https://github.com/AragornZJF/bigdata-dashboard-skill 技能

代理会自动克隆并注册技能，之后直接说「生成一个数据大屏」即可触发。

> 环境要求：Windows + Python（`py` launcher），无需第三方包。命令行直接用法见下文「核心工作流程」。

---

## 快速开始 · 生成智慧城市可视化大屏

在 Claude Code 中说：

> 用智慧城市模板生成一个可视化大屏

先用 Mock（模拟）数据出屏预览，满意后提供真实数据（Excel / JSON）即可同模板替换重建。

也可以命令行直接构建（用模板自带示例数据）：

```bash
mkdir -p output   # 首次使用先建输出目录
py scripts/build_dashboard.py assets/templates/data/smart_city/example.json --template smart_city --output output/smart_city_dashboard.html
start output/smart_city_dashboard.html
```

---

## 这个 Skill 用来干什么

- **数据可视化**：把表格数据转成 ECharts 驱动的统计卡片、柱/线/面积/饼/玫瑰/散点图、横向排行、表格、环形仪表等 9 类组件
- **行业模板**：内置 15 套已适配骨架（医药监管、智慧城市、发电厂、气象、设备监测、企业营收、信贷风控、电信门店、数据中心、电竞赛事、通用、新消费、智能看板、新能源、物业管理），开箱即用
- **双输入支持**：Excel（`.xlsx`）与 JSON 都可直接喂给构建脚本，Excel 自动识别三种结构
- **完全自包含**：产物单文件 HTML，体积通常 1–8 MB，可直接邮件 / U 盘分发
- **可扩展**：`assets/templates/custom/` 下放一个 `metadata.json` 即可定义自己的模板

---

## 如何触发

在 Claude Code 中直接说出意图即可，无需任何命令。常见触发说法：

- 「生成一个数据大屏」「做一个可视化大屏」「数字驾驶舱」「数据看板」
- 「帮我把这份 Excel 做成大屏」「把这些数据可视化」
- 「用医药模板生成大屏」「做一个电厂监控大屏」
- 提到「dashboard」「BI 大屏」「监控大屏」等关键词

Claude 会自动调用 **`bigdata-dashboard-expert`** 子智能体接管整个流程。

---

## 核心工作流程

### 标准三步（推荐，交互式）

```
① 选行业模板  →  ② 发数据模板让用户填  →  ③ 构建并预览
```

1. **选模板**：Claude 根据你的行业 / 场景，从 15 个内置模板中推荐最合适的一个并说明理由。
2. **准备数据**：
   - 你已有数据 → 直接发 `.xlsx` 或 `.json`，Claude 帮你转成模板需要的结构。
   - 你没数据 → Claude 把模板自带的 `example.json` / `example.xlsx` 发给你，告诉你「填 Excel 或 JSON 任一即可」，附字段映射说明。
3. **构建大屏**：执行 `py scripts/build_dashboard.py ...`，产出自包含 HTML，并自动在浏览器打开预览。

### 直接生成（用户已有 Excel / JSON）

跳过模板流程，一条命令直接出图：

```bash
py scripts/build_dashboard.py <你的数据>.xlsx --output dashboard.html
py scripts/build_dashboard.py <你的数据>.json --theme dark --output dashboard.html
```

### 指定模板生成（想要特定风格）

```bash
# 11 个自带源的模板：无需 --source-dir
py scripts/build_dashboard.py data.json --template pharma --output out.html
py scripts/build_dashboard.py data.json --template smart_city --output out.html
py scripts/build_dashboard.py data.json --template power_plant --output out.html
py scripts/build_dashboard.py data.json --template weather --output out.html
py scripts/build_dashboard.py data.json --template lpl --output out.html
py scripts/build_dashboard.py data.json --template generic --output out.html
py scripts/build_dashboard.py data.json --template data_center --output out.html
py scripts/build_dashboard.py data.json --template new_consumption --output out.html
py scripts/build_dashboard.py data.json --template smart_dashboard --output out.html
py scripts/build_dashboard.py data.json --template new_energy_vehicle --output out.html
py scripts/build_dashboard.py data.json --template property_management --output out.html

# 其余 4 个模板：需要 --source-dir 指定原始 HTML 目录
py scripts/build_dashboard.py data.json --template credit_risk --source-dir path/to/web/ --output out.html
```

### Excel ⇄ JSON 双向转换

```bash
# 由 example.json 生成可填写的 Excel 模板（多 sheet，含字段说明）
py scripts/make_xlsx_template.py assets/templates/data/pharma/example.json user_data.xlsx

# 把填写好的 Excel 转回 JSON
py scripts/xlsx_to_json.py user_data.xlsx user_data.json

# 任意 Excel → JSON（自动三分支识别：模板回填 / legacy / 启发式）
py scripts/excel_to_json.py any.xlsx any.json
```

---

## 内置模板速查

完整菜单（15 个模板：中文名 / 骨架名 / 适用场景 / 自带源标记 / 场景→模板建议）见 **`references/templates_menu.md`**（唯一权威源）。要点：

- **11 个自带源**（无需 `--source-dir`）：`pharma`、`power_plant`、`smart_city`、`weather`、`lpl`、`generic`、`data_center`、`new_consumption`、`smart_dashboard`、`new_energy_vehicle`、`property_management`
- **4 个需 `--source-dir`**：`revenue`、`device_monitor`、`credit_risk`、`telecom_store`
- 全部 15 个模板均带 `injector.js`，支持完整数据注入

> "自带源"指无需额外 `--source-dir` 即可直接构建。

## 模板效果预览

以下为部分内置模板的渲染成品（截图来自 `examples/` 目录，双击产物 HTML 即可达同等效果）：

<table>
  <tr>
    <td width="50%" align="center"><img src="examples/药品企业大数据监控平台.png" width="100%"/><br><sub><code>pharma</code> · 药企监管、抽检、注册申请</sub></td>
    <td width="50%" align="center"><img src="examples/某发电厂数据管理中心.png" width="100%"/><br><sub><code>power_plant</code> · 电厂、能源、机组监控</sub></td>
  </tr>
  <tr>
    <td width="50%" align="center"><img src="examples/智慧城市综合监控一体化平台.png" width="100%"/><br><sub><code>smart_city</code> · 城管、政务监管、实时告警</sub></td>
    <td width="50%" align="center"><img src="examples/大数据可视化数据分析平台.png" width="100%"/><br><sub><code>generic</code> · 任意通用数据展示</sub></td>
  </tr>
  <tr>
    <td width="50%" align="center"><img src="examples/2022年新消费市场.png" width="100%"/><br><sub><code>new_consumption</code> · 新消费市场洞察</sub></td>
    <td width="50%" align="center"><img src="examples/智能看板.png" width="100%"/><br><sub><code>smart_dashboard</code> · 智能看板新中心</sub></td>
  </tr>
  <tr>
    <td width="50%" align="center"><img src="examples/电信营业厅.png" width="100%"/><br><sub><code>telecom_store</code> · 营业厅、门店效能分析</sub></td>
    <td width="50%" align="center"><img src="examples/新能源.png" width="100%"/><br><sub><code>new_energy_vehicle</code> · 新能源汽车工业经济运行</sub></td>
  </tr>
</table>

---

## 进一步阅读

- **`SKILL.md`** —— 完整权威说明书（构建流水线、数据契约、模板扩展体系）。**任何细节问题以它为准。**
- **`CLAUDE.md`** —— Claude Code 工程指南（架构、双目录模式、易踩点）。
- **`assets/templates/data/<skeleton>/README.md`** —— 每个模板的字段映射说明。
- **`assets/templates/custom/README.md`** —— 如何编写自定义模板。
- **`references/data_schema.md`** / **`references/layout_schema.md`** —— 数据格式与布局配置规范。

---

## 环境要求

- **Windows** + Python（通过 `py` launcher 调用）
- 浏览器（任何现代浏览器，用于预览产物）
- 无需额外服务端、无需联网（构建后产物完全离线可用）
