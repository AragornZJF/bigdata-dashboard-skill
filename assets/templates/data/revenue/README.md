# revenue 数据填写说明

> 对应源模板：**090 企业营收大数据统计可视化大屏**
> 渲染骨架：`assets/templates/skeletons/revenue/`（（含 injector.js + template_config.json + 内置源，入口 index.html，免 --source-dir））

## 顶层字段

| 字段 | 类型 | 说明 |
|---|---|---|
| `title` | string | 大屏主标题 |
| `bigNumber` | object | 顶部大数字 `{value, label}`，label 渲染时自动追加 `(单位：元)` |
| `gauges` | array[3] | 3 个环形指标 `{label, value, total}` |
| `summaryItems` | array | 滚动订单列表，每项 `{orderNo, amount, product, time}` |
| `rankings` | array[2] | 两个排行榜，每项 `{title, rows[]}`，行 `{rank, company, amount, growth}` |
| `horizontalBar` | object | 横向柱 `{categories[], values[]}` |
| `rosePie` | object | 玫瑰饼 `{legendNames[], pieData[{name,value}]}` |
| `barLineMixed` | object | 双柱+折线 `{months[], legendNames[], bar1Data[], bar2Data[], lineData[]}` |
| `dualLine` | object | 双折线面积 `{months[], legendNames[], salesData[], profitData[]}` |
| `areaRosePie` | object | 面积玫瑰饼 `{legendNames[], pieData[{name,value}]}` |
| `chartTitles` | object | 各区块标题字典，键 `echart1`~`echart5` / `orderList`（选填） |

## 字段 -> 渲染目标映射

| example.json 字段 | 渲染目标 | 类型 |
|---|---|---|
| `title` | DOM `.head h1` | text |
| `bigNumber.value` | DOM `.numtxt` | text |
| `bigNumber.label` | DOM `.numbt`（自动追加单位） | html |
| `gauges[0..2]` | echarts `#zb1/#zb2/#zb3` (pie_gauge) | gauge |
| `gauges[i].label` | DOM `.zb1/.zb2/.zb3 span` | text |
| `summaryItems` | DOM `.wrap ul li` | rolling_list |
| `rankings[0]` | DOM `.table1:eq(0)` tbody | ranking table |
| `rankings[1]` | DOM `.table1:eq(1)` tbody | ranking table |
| `horizontalBar` | echarts `#echart5` (horizontal_bar) | bar |
| `rosePie` | echarts `#echart1` (rose_pie) | pie |
| `barLineMixed` | echarts `#echart4` (bar_line_mixed) | bar+line |
| `dualLine` | echarts `#echart3` (dual_line) | line |
| `areaRosePie` | echarts `#echart2` (area_rose_pie) | pie |
| `chartTitles.echartN` | DOM `#echartN` 最近 `.boxall .alltitle` | text |

## 填写注意事项

- `gauges` 必须 ≥3 项；每项 `value`/`total` 为数值，`total` 缺省时按 `value*2` 处理
- `summaryItems` 每项 4 个字段顺序固定：订单号 / 金额 / 产品 / 时间
- `rankings` 必须 ≥2 项（对应两块 `.table1`）
- `barLineMixed` / `dualLine` 的 `months` 数组长度需与各 series 数据长度一致（建议 12 个月）
- `barLineMixed` 的 yAxis max 由 injector 自动重算，无需手填
- `rosePie`/`areaRosePie` 的 `pieData` 项数应 ≤ `legendNames` 项数
- `bigNumber.label` 渲染时自动追加 `<span>(单位：元)</span>`，label 中不要再重复写单位

## 构建命令

```bash
python scripts/build_dashboard.py assets/templates/data/revenue/example.json \
    --template revenue \
    --source-dir "<BigDataView 源目录>/web" \
    --output dashboard.html
```
