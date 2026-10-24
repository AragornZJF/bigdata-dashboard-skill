# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目定位

**单文件 HTML 数据大屏生成器**。输入 Excel（`.xlsx`）或 JSON 数据，输出自包含 `.html`（CSS/JS/图片全部 base64 内联，无 CDN 依赖，双击即可打开）。基于 ECharts + Python 构建。

## 权威说明书

**任何任务开始前先读 `SKILL.md`** —— 它是构建流水线、模板清单、数据契约的唯一权威来源。模板名、CLI 参数、字段 schema 都不要凭记忆，每次以 SKILL.md 当前内容为准。

## 环境（Windows 专项）

- 通过 **`py` launcher** 调用 Python，**禁止**使用 `python` / `python3`。
- 路径用正斜杠；用 `/dev/null` 而非 `NUL`。
- 终端中文输出乱码只是 Windows bash 的 GBK 显示问题，HTML 内中文是正确的 UTF-8，**不要**当成 bug 去"修复"。
- 浏览器预览：`start output/foo.html`。

## 常用命令

```bash
# 构建（模式1：布局引擎，默认 / 模式2：骨架模板）
py scripts/build_dashboard.py data.json --theme dark --output dashboard.html
py scripts/build_dashboard.py data.json --template pharma --output dashboard.html

# Excel 输入会被自动识别，无需预先转 JSON
py scripts/build_dashboard.py data.xlsx --output dashboard.html

# 清单查询
py scripts/build_dashboard.py --list                 # 列出所有可构建模板
py scripts/build_dashboard.py --list-data-templates  # 列出可填写的数据样本及渲染策略

# Excel ⇄ JSON 双向转换
py scripts/make_xlsx_template.py assets/templates/data/<skeleton>/example.json user_data.xlsx
py scripts/xlsx_to_json.py user_data.xlsx user_data.json     # make_xlsx_template 产物 → JSON
py scripts/excel_to_json.py any.xlsx any.json                # 统一入口：_meta / legacy / 启发式 三分支
```

`build_dashboard.py` 没有 `--help`（该 flag 会被当作数据路径报错）。不带参数运行可查看 usage。

## 架构：两种模式

```
用户数据 (Excel/JSON)
   │
   ├─ 模式1 · 布局引擎（默认）
   │   data_processor.py → layout_builder.py → renderer.html → dashboard.html
   │
   └─ 模式2 · 骨架适配（需 --template）
       template_adapter.py → 注入骨架 index.html → dashboard.html
```

**模式1** 根据数据形状自动决定最优布局。**模式2** 复用预置 HTML 骨架，通过 `injector.js` 注入数据。

## 目录结构

```
bigdata-dashboard/
├── SKILL.md / CLAUDE.md      # 技能说明书 / 工程指南
├── scripts/                  # 执行层（8 个 Python 脚本）
│   ├── build_dashboard.py    # 构建入口（模式1 布局引擎 / 模式2 骨架适配）
│   ├── data_processor.py     # Excel/JSON 解析
│   ├── layout_builder.py     # 数据 → 布局配置
│   ├── excel_to_json.py      # 任意 Excel → JSON（_meta/legacy/启发式三分支）
│   ├── xlsx_to_json.py       # 模板回填 Excel → JSON（反向）
│   ├── make_xlsx_template.py # 数据 JSON → 可填写 Excel 模板
│   ├── template_adapter.py   # 源模板 → 数据可注入骨架
│   └── template_scanner.py   # 扫描源模板 → registry.json
├── assets/
│   ├── renderer.html         # 动态渲染引擎（模式1 核心）
│   ├── vendor/               # 共享第三方库集中目录（echarts.min.js=5.5.0、jquery-3.2.1.min.js 及通用插件 jquery.numscroll / jquery.liMarquee / jquery.cxselect / autofit.umd）。各模板 HTML 以无前缀路径引用，构建时先查骨架目录再查 vendor；骨架 js/ 只留模板特有业务文件
│   └── templates/
│       ├── registry.json     # 模板注册表（template_scanner 产物）
│       ├── data/             # 15 个数据样本：example.json + example.xlsx + README.md
│       ├── skeletons/        # 15 个渲染骨架：injector.js + template_config.json + metadata.json（全部含完整源资源：index.html + 主题/静态资源）
│       └── custom/           # 自定义模板扩展点
└── references/
    ├── layout_schema.md      # 布局配置 + 用户数据契约规范
    └── data_schema.md        # 旧数据格式规范
```

## 双目录模式（关键，最易踩坑）

`assets/templates/data/<skeleton>/` 与 `assets/templates/skeletons/<skeleton>/` 一一对应但职责不同。混淆这两者是头号错误来源：

| 目录 | 内容 | 用途 | 谁读取 |
|---|---|---|---|
| `templates/data/<skeleton>/` | `example.json` `example.xlsx` `README.md` | **给用户填写的业务数据样本** + 字段映射文档 | 仅 SKILL.md 流程中 `cp` 给用户 |
| `templates/skeletons/<skeleton>/` | `index.html` `injector.js` `template_config.json` `metadata.json`（15 个骨架全部自带源资源；`theme.css` 仅在入口 HTML 引用时存在） | **渲染层配置** | `build_dashboard.py` 构建时 |

字段映射链路：`example.json` 业务字段 → `injector.js` → `template_config.json` 中的 DOM selector / echarts 实例 id。每个模板的字段映射细节见对应 `templates/data/<skeleton>/README.md`。

## 模板清单

共 15 个骨架，**全部自带源文件**（入口 `index.html` + 源资源在骨架目录），构建均无需 `--source-dir`：`smart_city`、`power_plant`、`pharma`、`weather`、`lpl`、`generic`、`data_center`、`new_consumption`、`smart_dashboard`、`new_energy_vehicle`、`property_management`、`revenue`、`device_monitor`、`credit_risk`、`telecom_store`。

`--source-dir` 参数仍保留，仅作为覆盖骨架源的外部目录补充（正常流程不用传）。

**15 个骨架全部含 `injector.js`**（完整数据注入）：revenue / device_monitor / weather / credit_risk / telecom_store / smart_city / power_plant / pharma / generic / data_center / lpl / new_consumption / smart_dashboard / new_energy_vehicle / property_management。

## 数据注入机制

对深度定制模板（图表数据嵌在外部 JS 中），构建流程：
1. 把源 HTML 资产内联（CSS/JS/图片全部 base64）。
2. 通用 JSON → `template_config.json` 形态映射。
3. 注入 `injector.js`，读取 `window.DASHBOARD_DATA` 并更新 DOM + ECharts。
4. 输出完全自包含的单文件 HTML。

注入器通过 `echarts.getInstanceByDom()` 拿到已初始化的图表实例，再用 `setOption()` 更新数据 —— 不修改原始 JS 文件，也不向全局暴露图表变量。

## Gotchas（易踩点）

- **`data_schema.json` 和 `metadata.json` 是 `template_adapter.py` 的副产物**，`build_dashboard.py` **不读取**，可直接忽略。其中 chart id 可能是占位符（如 `myChart` / `a` / `b`），DOM id 以 `template_config.json` 与 `templates/data/<skeleton>/README.md` 为准。
- **骨架目录入口统一为 `index.html`**：15 个骨架根目录均放 `index.html`（credit_risk 入口取自源模板 sanlian.html 四 Tab 主屏）。
- **第三方库统一放 `assets/vendor/`**（echarts 5.5.0、jquery 3.2.1 + 通用插件），骨架 `js/` 只留模板特有业务文件（如 js.js / render.js / china.js / index.js / mymap.js——同名文件在不同模板内容不同，不可共享）；HTML 以无前缀路径（`echarts.min.js` / `jquery-3.2.1.min.js` / `jquery.numscroll.js`）引用，构建时先查骨架目录再查 vendor。`theme.css` 仅在入口 HTML 显式 `<link>` 引用时保留，其余为死文件已清理。
- **布局引擎会自动升级旧版 `window.DASHBOARD_DATA`** 格式 → `layout_config` schema，不要手动迁移旧数据。
- **Excel 三分支识别**（`excel_to_json.py` 按优先级）：(1) 隐藏 `_meta` sheet（`make_xlsx_template.py` 产物）→ 完整还原原 JSON；(2) legacy sheet 名（`config`/`stats_left`/`summary`/`bignumber`/`gauges`/`ranking`）；(3) 启发式（2 列「文本+数值」且 ≤10 行的 sheet → statCards，其余「文本+数值」sheet → 柱状图，多列 sheet → 表格）。
- **布局规则**：statCards 顶部通栏；charts + tables 按每行最多 3 个自动均分。
- 产物体积通常 1–8 MB，主要来自内联的 `echarts.min.js`（~777 KB）+ 背景图。

## 数据契约（速查）

**通用 / 布局引擎 JSON** —— 支持 `title`、`statCards[]`、`charts[]`（type：`bar`/`line`/`area`/`pie`/`rose`/`hbar`/`scatter`；支持多系列 `{categories, series}` 或直接透传完整 ECharts `option`）、`tables[]`。完整 schema 见 `references/data_schema.md` + `references/layout_schema.md`。

**行业专用 schema**（如医药的 `classKpis` / `centerKpis` / `checkDetailPie` / `yearlyBar` / `sampleLine` / `waterfall` / `registrationBar`）—— 按模板定义，位置 `templates/data/<skeleton>/example.json`，字段说明见同目录 `README.md`。

## 自定义模板

最小可行：`assets/templates/custom/<name>/` 下仅放一个 `metadata.json` 即可。详见 `assets/templates/custom/README.md` 与 `metadata.example.json`。不提供 `skeleton.html` 时由 renderer 引擎按 `metadata.json` 的布局配置兜底渲染。

## 何时使用 bigdata-dashboard-expert 智能体

仓库内置子智能体 `.claude/agents/bigdata-dashboard-expert.md`。当用户想生成 / 定制大屏、或挑选模板时，委派给它即可 —— 它的 system prompt 已经编码了完整 SKILL.md 工作流，主上下文无需重复推导。

标准工作流为「选模板 → Mock 数据先行预览 → 用户数据替换重建」（SKILL.md 流程A）：选定模板后先用 Mock 数据立即出屏让用户看风格，满意后再换真实数据同模板重建；Mock 质量标准与命名隔离规则见 SKILL.md 1.1 节。
