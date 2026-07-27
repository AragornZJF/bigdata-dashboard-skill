# 数字大屏数据格式参考

## 概述

数字大屏模板采用 `window.DASHBOARD_DATA` 全局 JSON 对象注入数据。
无论是 Excel 还是 JSON 数据源，最终都转换为以下统一格式。

## 完整 JSON Schema

```json
{
  "title": "大屏标题（字符串）",
  "statsLeft": [...],       // 左列统计卡片
  "statsRight": [...],      // 右列统计卡片
  "summaryItems": [...],    // 摘要数据条（带趋势）
  "bigNumber": {...},       // 中心大数字
  "gauges": [...],          // 环形进度仪表
  "chartLeft": {...},       // 左列 ECharts 图表配置
  "chartCenter1": {...},    // 中列上方 ECharts 图表
  "chartCenter2": {...},    // 中列下方 ECharts 图表
  "chartRadar": {...},      // 右列雷达图
  "ranking": {...}          // 排行榜
}
```

## 各字段详细说明

### statsLeft / statsRight — 统计卡片

每列最多 3 个卡片（按比例自适应），显示关键指标。

```json
"statsLeft": [
  {"label": "用户总数", "value": 1280, "unit": "个"},
  {"label": "在线设备", "value": 856, "unit": "台"},
  {"label": "合作企业", "value": 150, "unit": "家"}
]
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| label | string | 是 | 卡片标签 |
| value | number | 是 | 数值 |
| unit | string | 是 | 单位 |

### summaryItems — 摘要数据条

最多 3 条，显示带趋势的数据项。

```json
"summaryItems": [
  {
    "label": "新增用户",
    "value": 24356,
    "unit": "人",
    "trendLabel": "同比",
    "trend": 34,
    "trendUp": true,
    "pct": 80
  }
]
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| label | string | 是 | 指标名称 |
| value | number | 是 | 数值 |
| unit | string | 是 | 单位 |
| trendLabel | string | 是 | 趋势标签（如"同比""环比"） |
| trend | number | 是 | 趋势百分比（自动取绝对值） |
| trendUp | boolean | 是 | true=上升, false=下降 |
| pct | number | 否 | 进度条百分比（0-100，默认50） |

### bigNumber — 中心大数字

```json
"bigNumber": {"label": "业绩总览", "value": 1938272}
```

### gauges — 环形进度仪表

最多 3 个（对应中列上方的 3 个环形图）。

```json
"gauges": [
  {"label": "CPU使用率", "value": 80},
  {"label": "内存使用率", "value": 73},
  {"label": "磁盘使用率", "value": 30}
]
```

value 范围 0-100，表示百分比。

### ECharts 图表配置

`chartLeft`, `chartCenter1`, `chartCenter2`, `chartRadar` 均为标准 ECharts option 对象。
额外支持 `_title` 字段设置模块标题。

```json
"chartCenter1": {
  "_title": "",
  "tooltip": {"trigger": "axis", "axisPointer": {"type": "shadow"}},
  "legend": {"data": ["字段1", "字段2"]},
  "xAxis": {"type": "category", "data": ["1月","2月",...]},
  "yAxis": {"type": "value"},
  "series": [
    {"name": "字段1", "type": "bar", "data": [123, 154, ...]}
  ]
}
```

支持的图表类型：bar（柱状图）、line（折线图）、pie（饼图）、radar（雷达图）。

### ranking — 排行榜

```json
"ranking": {
  "title": "排行榜",
  "items": [
    {"name": "项目A", "value": 500},
    {"name": "项目B", "value": 400}
  ]
}
```

自动按 value 降序排列，前 3 名有特殊颜色标记。

## Excel 数据格式

Excel 文件按 Sheet 名映射到对应字段：

| Sheet 名 | 映射字段 | 列说明 |
|----------|----------|--------|
| config | title | A列=标题 |
| stats_left | statsLeft | A=label, B=value, C=unit |
| stats_right | statsRight | A=label, B=value, C=unit |
| summary | summaryItems | A=label, B=value, C=unit, D=trendLabel, E=trend, F=trendUp("是"/"否"), G=pct |
| bignumber | bigNumber | A=label, B=value |
| gauges | gauges | A=label, B=value(0-100) |
| ranking | ranking | A=标题(第1行), B=name, C=value(第2行起) |

> 注意：Excel 不支持 ECharts 图表配置，图表部分需通过 JSON 补充。
> 推荐做法：先用 Excel 提供核心数据，再用 JSON 补充图表配置。
