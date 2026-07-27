# skeleton_pharma 数据填写说明

> 对应源模板：**ph01 药品企业大数据监管平台**（**内置源，免 --source-dir**）
> 渲染骨架：`assets/templates/skeletons/skeleton_pharma/`（含 injector.js + template_config.json）
> 源文件：`assets/templates/skeletons/skeleton_pharma/index.html`
> 注入方式：**原生 JS**，通过 `data-f` 锚点定位；KPI 数值定位用模板自带 `changeText-*` span

## 顶层字段

| 字段 | 类型 | 说明 |
|---|---|---|
| `title` | string | 大屏主标题 |
| `sectionTitles` | object | 6 个区块标题字典（键见下方映射） |
| `classKpis` | array[4] | 左侧分类 KPI（一类/二类/三类企业 + 出动检查人次），每项 `{label, value}` |
| `centerKpis` | array[6] | 中央 KPI（药品生产/医疗器械/化妆品/一类/二类/三类药品企业），每项 `{label, value}` |
| `checkDetailPie` | object | 今年抽检详情环形饼 `{pieData[{name,value}]}` |
| `yearlyBar` | object | 历年抽检次数分组柱 `{years[], series[{name,data}]}` |
| `sampleLine` | object | 抽查样品总量面积折线 `{years[], values[]}` |
| `waterfall` | object | 不合格药品瀑布图 `{years[], increase[], decrease[]}` |
| `registrationBar` | object | 注册申请堆叠横向柱 `{years[], series[{name,data}]}` |

## 字段 -> 渲染目标映射

| 字段 | 渲染目标 | 类型 |
|---|---|---|
| `title` | DOM `[data-f="title"]`（改最内层 strong/span）+ `document.title` | text |
| `sectionTitles.deviceClass` | DOM `[data-f="sec-deviceClass"]` | text |
| `sectionTitles.yearlyCheck` | DOM `[data-f="sec-yearlyCheck"]` | text |
| `sectionTitles.checkDetail` | DOM `[data-f="sec-checkDetail"]` | text |
| `sectionTitles.sampleTotal` | DOM `[data-f="sec-sampleTotal"]` | text |
| `sectionTitles.unqualified` | DOM `[data-f="sec-unqualified"]` | text |
| `sectionTitles.registration` | DOM `[data-f="sec-registration"]` | text |
| `classKpis[0..3]` | DOM `[data-f="kpi-0..3"]` | kpi_list |
| `centerKpis[0..5]` | DOM `[data-f="ckpi-0..5"]` | kpi_list |
| `checkDetailPie.pieData` | echarts `#chart_804928` (donut_pie) | pie |
| `yearlyBar.years` | echarts `#chart_302528` (grouped_bar)，xAxis.data | bar |
| `yearlyBar.series` | echarts `#chart_302528` series + legend.data | bar |
| `sampleLine.years` | echarts `#chart_256128` (area_line)，xAxis.data | line |
| `sampleLine.values` | echarts `#chart_256128` series[0].data | line |
| `waterfall.years` | echarts `#chart_939712` (waterfall)，xAxis.data（末尾追加"合计"列） | waterfall |
| `waterfall.increase` | echarts `#chart_939712` series[1].data | waterfall |
| `waterfall.decrease` | echarts `#chart_939712` series[2].data | waterfall |
| `registrationBar.years` | echarts `#chart_870976` (stacked_hbar)，yAxis.data | bar |
| `registrationBar.series` | echarts `#chart_870976` series + legend.data | bar |

## 填写注意事项

- `classKpis` 数组顺序对应 `kpi-0..3`（4 项），`centerKpis` 对应 `ckpi-0..5`（6 项），必须按顺序填
- KPI 的 `value` 写入模板自带的 `changeText-*` span（取非空的那个；全空则写第一个）
- `checkDetailPie` 的百分比由 injector 按合计动态计算，`pieData` 只需填原始 value
- `yearlyBar.series` / `registrationBar.series` 的 `name` 字段会同时写入 legend.data
- `waterfall` 是特殊图表：injector 会自动计算 `assist`（累计辅助列）和 `合计` 列，用户只需填 `years`/`increase`/`decrease`
  - `decrease` 可为全 0 数组（表示每年只增不减）
  - `years`/`increase`/`decrease` 三数组长度必须一致
  - 渲染时 xAxis 末尾自动追加"合计"列，series 末位存累计值
- `sampleLine` 为面积折线，`values` 为数值数组
- `registrationBar` 为堆叠横向柱，`series` 多项会自动堆叠

## 构建命令

```bash
python scripts/build_dashboard.py assets/templates/data/skeleton_pharma/example.json \
    --template skeleton_pharma \
    --output dashboard.html
```

> 注：无需 `--source-dir`，源文件已内置
