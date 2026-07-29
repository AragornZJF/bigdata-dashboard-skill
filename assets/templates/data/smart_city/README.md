# smart_city 数据填写说明

> 对应源模板：**sc01 智慧城市综合监管一体化平台**（**内置源，免 --source-dir**）
> 渲染骨架：`assets/templates/skeletons/smart_city/`（含 injector.js + template_config.json）
> 源文件：`assets/templates/skeletons/smart_city/index.html`
> 注入方式：**原生 JS**（不依赖 jQuery），通过 `data-f` / `data-ball` 锚点定位 DOM

## 顶层字段

| 字段 | 类型 | 说明 |
|---|---|---|
| `title` | string | 大屏主标题 |
| `sectionTitles` | object | 8 个区块标题字典（键见下方映射） |
| `kpis` | array[5] | 整体指标 KPI，每项 `{label, value}` |
| `liquidBalls` | array[4] | 水波球（内部指标评价），每项 `{label, value}`，value 0-100 |
| `centerProgress` | object | 中心进度 `{value}`（0-100） |
| `industryBar` | object | 产业结构对比横向柱 `{categories[8], values[8]}` |
| `objectPie` | object | 监管对象类型环形饼 `{legendNames[], pieData[{name,value}]}` |
| `alarmTable` | object | 实时告警表（5 列）`{headers[], rows[][]}` |
| `rectTable` | object | 发现问题及整改数据表（7 列）`{headers[], rows[][]}` |
| `wordCloud` | array | 事件相关部门词云字符串数组（最多 16 个） |

## 字段 -> 渲染目标映射

| 字段 | 渲染目标 | 类型 |
|---|---|---|
| `title` | DOM `[data-f="title"]` + `document.title` | text |
| `sectionTitles.internal` | DOM `[data-f="sec-internal"]` | text |
| `sectionTitles.industry` | DOM `[data-f="sec-industry"]` | text |
| `sectionTitles.departments` | DOM `[data-f="sec-departments"]` | text |
| `sectionTitles.rectData` | DOM `[data-f="sec-rectdata"]` | text |
| `sectionTitles.overall` | DOM `[data-f="sec-overall"]` | text |
| `sectionTitles.matters` | DOM `[data-f="sec-matters"]` | text |
| `sectionTitles.objectTypes` | DOM `[data-f="sec-objecttypes"]` | text |
| `sectionTitles.alarms` | DOM `[data-f="sec-alarms"]` | text |
| `kpis[0..4]` | DOM `[data-f="kpi-0..4"]` | kpi_list |
| `liquidBalls[0..3].label` | DOM `[data-f="ball-label-0..3"]` | text |
| `liquidBalls[0..3].value` | DOM `[data-f="ball-pct-0..3"]` + `[data-ball="0..3"]` SVG | liquid_ball |
| `centerProgress.value` | DOM `[data-f="center-progress"]` | percent_text |
| `industryBar.categories` | echarts `#chart_876930` (horizontal_bar)，yAxis.data | bar |
| `industryBar.values` | echarts `#chart_876930` series[0].data | bar |
| `objectPie.legendNames` | echarts `#chart_407810` (donut_pie)，legend.data | pie |
| `objectPie.pieData` | echarts `#chart_407810` series[0].data | pie |
| `alarmTable.headers/rows` | DOM `[data-f="alarmTable"]`，第 5 列状态自动着色 | status_table |
| `rectTable.headers/rows` | DOM `[data-f="rectTable"]` | table |
| `wordCloud` | DOM `[data-f="wordCloud"] .wc`（按顺序替换 span） | text_list |

## 填写注意事项

- `kpis` 数组顺序对应 `kpi-0..4`，必须按顺序填
- `liquidBalls[].value` 取值 0-100，自动拟合 SVG 波位（`rectY = 110.10 - 0.8975*v`），超出范围会被 clamp
- `alarmTable.rows` 每行必须 5 列，第 5 列状态值仅识别 `处理中`/`未处理`/`已解决`（其它默认白色）
- `rectTable.rows` 每行必须 7 列
- `wordCloud` 按数组顺序替换 span，多出的词被忽略，不足则保留原词
- `objectPie` 的百分比由 injector 按合计动态计算，`pieData` 只需填 `{name, value}` 原始值
- `industryBar.values` 的 xAxis.max 由 injector 自动 `Math.ceil(max*1.15)`

## 构建命令

```bash
python scripts/build_dashboard.py assets/templates/data/smart_city/example.json \
    --template smart_city \
    --output dashboard.html
```

> 注：无需 `--source-dir`，源文件已内置
