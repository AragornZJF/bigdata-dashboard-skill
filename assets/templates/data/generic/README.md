# generic 数据填写说明

> 对应源模板：**021 大数据可视化系统数据分析通用模版**
> 渲染骨架：`assets/templates/skeletons/generic/`（含 `injector.js`，已自带源资源）
> 注入方式：index.html 内嵌 `<script id="dashboard-data">/* DATA_PLACEHOLDER */</script>`，构建时由 build_dashboard.py 替换为 JSON 数据；`injector.js` 在 `</body>` 前追加，通过 `window.DASHBOARD_DATA` 更新 DOM 文本与 ECharts 实例。

## 顶层字段

| 字段 | 类型 | 说明 |
|---|---|---|
| `title` | string | 页面 `<h1>` 标题 |
| `statCards` | array[6] | 顶部 3 + 底部 3 共 6 个 KPI 卡片，每项 `{label, value}` |
| `metrics` | array[3] | 中部 3 个指标条，每项 `{label, value, unit, max, yoy, trend}` |
| `centerLabel` | string | 中心标签（默认 "业绩总览"） |
| `centerNumber` | string | 中心大数字（如 `"1,938,272"`） |
| `pieTitles` | array[3] | `pe01`/`pe02`/`pe03` 上方的 `.tit01` 标题 |
| `sectionTitles` | array[3] | 3 个 `.alltitle` 模块标题 |
| `charts` | array | 图表数组，`{id, type, data}` 或 `{id, type, series}` |
| `ranking` | array[5] | 排行榜 5 项，每项 `{name, value}` |

### statCards 字段

| 子字段 | 说明 |
|---|---|
| `label` | 卡片标签（替换 `<span>字段名称</span>`） |
| `value` | 卡片数值，含单位字符串（如 `"200万"` / `"150家"`） |

### metrics 字段

| 子字段 | 说明 |
|---|---|
| `label` | 指标名（替换 icon 旁的"字段名称"） |
| `value` | 数值（数字，用于进度条宽度计算） |
| `unit` | 单位（拼在 value 后显示，如"件"/"封"/"笔"） |
| `max` | 该指标的最大值（用于 `.bar2 span` 宽度计算） |
| `yoy` | 同比百分比数值（如 `34` 表示 34%） |
| `trend` | `"up"` 上涨 / `"down"` 下跌（切换 `images/up.png`/`down.png`） |

### charts 字段

| 子字段 | 说明 |
|---|---|
| `id` | ECharts 容器 DOM id，**必须用骨架真实 id**：`echarts1` / `echarts2` / `echarts3` / `lastecharts` / `pe01` / `pe02` / `pe03`（共 7 个槽位） |
| `type` | `bar`（柱）/ `line`（线）/ `pie`（饼）/ `radar`（雷达，对应 `lastecharts` 槽位） |
| `data` | 通用数据格式 `[{name, value}]`；雷达图为 `[{name, value:[num,...]}]`（value 数组长度需匹配雷达轴数，当前 5 轴） |
| `series` | 可选，多系列数组 `[{name, data}]`（仅 bar/line） |
| `option` | 可选，透传完整 ECharts option（覆盖前两者） |

**渲染逻辑**：
- `bar`/`line`：`xAxis.data = data.map(d=>d.name)`，`series[0].data = data.map(d=>d.value)`（或按 `series` 字段多系列覆盖）
- `pie`：`series[0].data = data.map(d=>({name, value}))`

原模板 `js.js` 已在 document.ready 初始化所有 echarts 实例并设置 demo option；injector 在 `</body>` 前调用 `setOption` 覆盖数据，保留原 demo 的视觉配置（颜色、动画等）。

### ranking 字段

| 子字段 | 说明 |
|---|---|
| `name` | 排行项名称（替换"标题名称"占位文本） |
| `value` | 数值（用于 `.pmbar span` 宽度计算，最大值为 100% 基准） |

## 填写注意事项

- 所有槽位都有 fallback：不填则保留模板原占位文本，不会破布局
- `charts[].id` 是严格 DOM id 匹配，填错则该图表不会更新
- `metrics[].max` 决定中部进度条宽度，建议填该指标在数据集中的合理上限
- `ranking` 数值会自动归一化到 0–100% 宽度（最大值为基准）

## 构建命令

```bash
# 自带源，无需 --source-dir
py scripts/build_dashboard.py assets/templates/data/generic/example.json \
    --template generic \
    --output dashboard.html
```
