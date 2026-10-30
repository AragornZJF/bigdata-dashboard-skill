# credit_risk 数据填写说明

> 对应源模板：**045 信用风险定位系统（银行版）**
> 渲染骨架：`assets/templates/skeletons/credit_risk/`（（含 injector.js + template_config.json + 内置源，入口 index.html，免 --source-dir））
> 布局：四 Tab（经营动态 / 偿债能力 / 可变现资产 / 外部关联）

## 顶层字段

| 字段 | 类型 | 说明 |
|---|---|---|
| `company` | object | 企业信息 `{name, industry}` |
| `indicators` | array[3] | 风险指标 `{date, riskStatus, riskStyle, value}`，riskStyle 为 `green`/`yellow`/`red` |
| `debtSources` | object | 偿债来源表 `{rows[]}`，3 列（类别/金额亿元/任务覆盖率） |
| `debtItems` | object | 负债表 `{rows[]}`，2 列（类别/金额亿元） |
| `opinionList` | array | 舆论列表 `{text, sentiment, class}`，class 为 `good`/`bad` |
| `inventory` | object | 库存表 `{dates[5], rawMaterials{}, finishedGoods{}}` |
| `indexData` | object | 指数表 `{dates[5], 产能指数[], 销售指数[], 盈利能力指数[]}` |
| `charts.profitCoverage` 等 3 个 | object | 偿债能力折线 `{xAxis, series[0].initial, animateData[]}` |
| `charts.inventoryBarLine` | object | 库存柱+折线 `{xAxis, series[{data}]}` |
| `charts.totalAssetsPie` / `liquidAssetsPie` | object | 两个饼图 `{centerTitle, centerSubtitle, data[{name,value}]}` |
| `charts.productivityIndex` 等 3 个 | object | 指数折线 `{xAxis, data[]}` |
| `charts.relationGraph` | object | 力导向图 `{nodes[{name,value,category,id}], links[{source,target}]}` |

## 字段 -> 渲染目标映射

| 字段 | 渲染目标 | 类型 |
|---|---|---|
| `company.name+industry` | DOM `.title.ttbg` | html |
| `indicators[0..2]` | DOM `.czl .fxzt:eq(0..2)` | indicator |
| `debtSources.rows` | DOM `.tb_pos table.table1` tbody | table |
| `debtItems.rows` | DOM `.tb_pos2 table.table1` tbody | table |
| `opinionList` | DOM `.gxlist ul` | list |
| `inventory` | DOM `.lines1tb .tb table.table1`（含 rowspan 合并） | complex_table |
| `indexData` | DOM `.lines4tb .tb table.table1` | table |
| `charts.profitCoverage` | echarts `#line1` (line_with_bands) | line |
| `charts.liquidityCoverage` | echarts `#line2` | line |
| `charts.solvencyCoverage` | echarts `#line3` | line |
| `charts.inventoryBarLine` | echarts `#lins1` (bar_line_mixed) | bar+line |
| `charts.productivityIndex` | echarts `#lins2` (line_area) | line |
| `charts.consumptionIndex` | echarts `#lins3` | line |
| `charts.profitabilityIndex` | echarts `#lins4` | line |
| `charts.totalAssetsPie` | echarts `#pie1` | pie |
| `charts.liquidAssetsPie` | echarts `#pie2` | pie |
| `charts.relationGraph` | echarts `#guanxi` (force_graph) | force |

## 填写注意事项

- `indicators` 必须 ≥3 项；`riskStyle` 仅识别 `yellow`/`red`，其它视为 green
- `debtSources.rows` 单元格内可含 `↑`/`↓` 字符，自动转为着色 span
- `inventory.rawMaterials` 固定 4 个键（坯布/棉纱/棉花/亚麻），`finishedGoods` 固定 6 个键；缺失按 0 处理；"总计"行自动累加
- `indexData` 的键名必须用中文（产能指数/销售指数/盈利能力指数），不可改名
- `charts.profitCoverage/liquidityCoverage/solvencyCoverage` 的 `series[0].initial` 为静态初始数据，`animateData` 为动画推进数据（切换到 czbt tab 后每秒 push 一项，循环播放）
- `relationGraph.nodes` 的 `id=0` 节点会被特殊着色（蓝色边框），`id=22` 节点会被高亮（黄色标签）
- `relationGraph.nodes.category`：0=四级 / 1=三级 / 2=二级
- tab 切换由 injector 劫持 `.baner a` 点击事件；URL 带 `?1` 参数时默认打开"外部关联"tab

## 构建命令

```bash
python scripts/build_dashboard.py assets/templates/data/credit_risk/example.json \
    --template credit_risk \
    --source-dir "<BigDataView 源目录>/web" \
    --output dashboard.html
```
