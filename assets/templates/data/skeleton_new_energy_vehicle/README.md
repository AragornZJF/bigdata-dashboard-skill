# skeleton_new_energy_vehicle 数据填写说明

> 对应模板：**新能源汽车工业经济运行情况**
> 渲染骨架：`assets/templates/skeletons/skeleton_new_energy_vehicle/`（含 index.html + injector.js + echarts.min.js + theme.css）

## 顶层字段

| 字段 | 类型 | 说明 |
|---|---|---|
| `title` | string | 大屏标题 |
| `datetime` | string | 显示日期 |
| `statCards[]` | array | 4 张 KPI 卡片（汽车产/销、新能源产/销） |
| `salesMonthly` | object | 月度销量对比（双系列柱状图） |
| `fuelVsNEV` | object | 燃油车 vs 新能源车季度对比 |
| `penetration` | object | 渗透率走势折线图 |
| `manufacturerRetail[]` | array | 厂商零售排行（横向柱状图） |
| `powerTypeTrend` | object | 各动力类型月度走势（多折线） |
| `powerTypeShare[]` | array | 动力类型销量占比（饼图） |

## 字段 -> 渲染目标映射

| 字段 | 渲染目标 | 类型 |
|---|---|---|
| `title` | DOM `.main-title` | text |
| `datetime` | DOM `.datetime` | text |
| `statCards[0].value` | DOM `.card-auto-prod .card-value` | text |
| `statCards[1].value` | DOM `.card-auto-sale .card-value` | text |
| `statCards[2].value` | DOM `.card-nev-prod .card-value` | text |
| `statCards[3].value` | DOM `.card-nev-sale .card-value` | text |
| `salesMonthly` | echarts `#chartSalesMonthly` (bar) | bar |
| `fuelVsNEV` | echarts `#chartFuelVsNEV` (bar) | bar |
| `penetration` | echarts `#chartPenetration` (line) | line |
| `manufacturerRetail` | echarts `#chartManufacturerRetail` (hbar) | hbar |
| `powerTypeTrend` | echarts `#chartPowerTypeTrend` (line_multi) | line |
| `powerTypeShare` | echarts `#chartPowerTypeShare` (pie) | pie |

## 构建命令

```bash
py scripts/build_dashboard.py assets/templates/data/skeleton_new_energy_vehicle/example.json \
    --template skeleton_new_energy_vehicle \
    --output dashboard.html
```

> 本模板自带源文件（index.html + echarts.min.js + theme.css），无需 `--source-dir`。
