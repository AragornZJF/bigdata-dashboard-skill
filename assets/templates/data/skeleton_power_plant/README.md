# skeleton_power_plant 数据填写说明

> 对应源模板：**pp01 某发电厂数据管理中心**（**内置源，免 --source-dir**）
> 渲染骨架：`assets/templates/skeletons/skeleton_power_plant/`（含 injector.js + template_config.json）
> 源文件：`assets/templates/skeletons/skeleton_power_plant/index.html`
> 注入方式：**原生 JS**，通过 `data-f` / `data-ball` 锚点定位

## 顶层字段

| 字段 | 类型 | 说明 |
|---|---|---|
| `title` | string | 大屏主标题 |
| `sectionTitles` | object | 8 个区块标题字典（键见下方映射） |
| `kpis` | array[2] | 温度 KPI（最高/最低温度），每项 `{label, value}` |
| `liquidBalls` | array[6] | 6 个水波球，前 3 圆形 / 后 3 柱形，每项 `{label, value}`，value 0-100 |
| `unitStatus` | object | 机组状态横向分组柱 `{categories[], series[{name,data}]}` |
| `consumption` | object | 耗存分析月度柱 `{months[], values[]}` |
| `nature` | object | 自然因素环形饼 `{pieData[{name,value}]}` |
| `plantStats` | object | 各电厂发电量统计柱 `{plants[], values[]}` |
| `trend` | object | 发电量趋势双折线 `{dates[], generation[], usage[]}` |
| `windPlan` | object | 风电计划完成情况环形饼 `{pieData[{name,value}]}` |
| `financeTable` | object | 财务信息表（2 列）`{headers[], rows[][]}` |

## 字段 -> 渲染目标映射

| 字段 | 渲染目标 | 类型 |
|---|---|---|
| `title` | DOM `[data-f="title"]` + `document.title` | text |
| `sectionTitles.unitStatus` | DOM `[data-f="sec-unitStatus"]` | text |
| `sectionTitles.consumption` | DOM `[data-f="sec-consumption"]` | text |
| `sectionTitles.nature` | DOM `[data-f="sec-nature"]` | text |
| `sectionTitles.plantStats` | DOM `[data-f="sec-plantStats"]` | text |
| `sectionTitles.windPlan` | DOM `[data-f="sec-windPlan"]` | text |
| `sectionTitles.finance` | DOM `[data-f="sec-finance"]` | text |
| `sectionTitles.trend` | DOM `[data-f="sec-trend"]` | text |
| `sectionTitles.finish` | DOM `[data-f="sec-finish"]` | text |
| `kpis[0..1]` | DOM `[data-f="kpi-0..1"]` | kpi_list |
| `liquidBalls[0..2]` | DOM `[data-ball="0..2"]` 圆形波（rectY = 104.07 - 0.8944*v） | liquid_ball(circle) |
| `liquidBalls[3..5]` | DOM `[data-ball="3..5"]` 柱形波（rectY = 169.05 - 1.35*v） | liquid_ball(rect) |
| `unitStatus.categories` | echarts `#c1` (grouped_hbar)，yAxis.data | bar |
| `unitStatus.series` | echarts `#c1` series + legend.data | bar |
| `consumption.months` | echarts `#c3` (bar)，xAxis.data | bar |
| `consumption.values` | echarts `#c3` series[0].data | bar |
| `nature.pieData` | echarts `#c4` (donut_pie) | pie |
| `plantStats.plants` | echarts `#c7` (bar)，xAxis.data | bar |
| `plantStats.values` | echarts `#c7` series[0].data | bar |
| `trend.dates` | echarts `#c9` (dual_line)，xAxis.data | line |
| `trend.generation` | echarts `#c9` series[0].data | line |
| `trend.usage` | echarts `#c9` series[1].data | line |
| `windPlan.pieData` | echarts `#c8` (donut_pie)，注入器负责初始化空面板 | pie |
| `financeTable.headers/rows` | DOM `[data-f="financeTable"]` | table |

## 填写注意事项

- `kpis` 数组顺序对应 `kpi-0..1`（仅 2 个温度 KPI）
- `liquidBalls` 必须 6 项：前 3 个为圆形波，后 3 个为柱形波（`data-ball-type=rect`）；value 0-100，超出 clamp
- `liquidBalls[3..5]`（月收入/利润/成本）的 value 是百分比（0-100），不是金额；金额写在 `financeTable` 里
- `windPlan` 的 `#c8` 在原模板中是空面板，injector 会用 echarts.init 初始化并 setOption 完整配置
- `consumption.values` 与 `plantStats.values` 的 yAxis.max 由 injector 自动取整
- `financeTable.rows` 每行 2 列（指标/数额），单元格内容会 HTML 转义
- `unitStatus.series` 的 `name` 字段会同时写入 legend.data

## 构建命令

```bash
python scripts/build_dashboard.py assets/templates/data/skeleton_power_plant/example.json \
    --template skeleton_power_plant \
    --output dashboard.html
```

> 注：无需 `--source-dir`，源文件已内置
