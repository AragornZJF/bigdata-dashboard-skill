# 数字大屏布局配置手册

## 用户数据契约（DASHBOARD_DATA 输入）

> 这是用户数据（JSON / Excel）的**输入格式**，由 `data_processor.py` 解析、`layout_builder.py` 转换为下方布局配置。用户填数据时只需关心本节。

```json
{
  "title": "大屏标题",
  "statCards": [{ "label": "指标", "value": "1,286", "unit": "万元" }],
  "charts": [
    { "id": "c1", "type": "bar", "title": "柱状图", "data": [{ "name": "一月", "value": 120 }] },
    { "id": "c2", "type": "hbar", "title": "TOP 排行（倒序+柱子右侧数值）", "data": [{ "name": "广东", "value": 9860 }] },
    { "id": "c3", "type": "pie", "title": "占比", "data": [{ "name": "A", "value": 40 }] }
  ],
  "tables": [{ "headers": ["列1", "列2"], "rows": [["a", "b"]] }]
}
```

- `charts[].type` 支持：`bar`（柱状）/ `line`（折线）/ `area`（面积）/ `pie`（饼图）/ `rose`（玫瑰图）/ `hbar`（横向柱状，自动倒序、柱子右侧显示数值）/ `scatter`
- `charts[].data` 也支持多系列 `{ "categories": [...], "series": [{ "name": "...", "data": [...] }] }`，或直接给一个完整 ECharts option（含 `series`/`xAxis` 即原样使用）
- 布局规则：statCards 通栏置顶（无则跳过）；图表+表格按每行最多 3 个自动均分行列

## 渲染行为约定

- **布局配置优先**：数据含 `layout.rows` 时直接渲染；旧版 `window.DASHBOARD_DATA` 由 `layout_builder.py` 自动升级为布局配置，无需手动迁移
- **响应式字体**：基于 `rem` / `vw` / `vh` 单位自适应不同分辨率
- **图表自适应**：所有 ECharts 实例自动绑定 window resize，无需手动处理

## 概述

布局配置（Layout Config）是渲染引擎 `renderer.html` 的输入，通过 `window.DASHBOARD_CONFIG` 全局对象注入。
它统一描述：页面整体布局（行/列网格）、每个组件（类型/位置/尺寸/数据）、主题样式（CSS 变量）。

布局配置可通过以下方式生成：
1. **手动编写 JSON** — 完全自定义
2. **layout_builder.py 自动生成** — 将旧 DASHBOARD_DATA 或松散数据自动转换为布局配置
3. **Excel 描述布局** — 按约定的 Sheet 格式描述布局+数据，脚本自动转换

---

## 完整 JSON Schema

```json
{
  "title": "大屏标题",
  "theme": {
    "mode": "dark",
    "custom": {}
  },
  "layout": {
    "header": { "height": "80px" },
    "rowGap": 10,
    "widgetGap": 10,
    "rows": [
      {
        "height": "100%",
        "padding": [5, 10],
        "cols": [
          {
            "flex": 3,
            "widgets": [...]
          }
        ]
      }
    ]
  }
}
```

---

## 顶层字段

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| title | string | 否 | 大屏标题，显示在顶部 header |
| theme | object | 否 | 主题配置 |
| layout | object | 是 | 页面布局定义 |

---

## theme — 主题配置

```json
{
  "mode": "dark",
  "custom": {
    "--bg-body": "#0a0a2e",
    "--accent": "#ff6b6b",
    "--big-number-color": "#ffd700"
  }
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| mode | string | 是 | `"dark"` 深色科技风 / `"light"` 浅色商务风 |
| custom | object | 否 | 自定义 CSS 变量覆盖（见下方变量表） |

### 可自定义的 CSS 变量

| 变量名 | dark 默认值 | light 默认值 | 说明 |
|--------|-------------|--------------|------|
| --bg-body | #000d4a | #f0f2f5 | 页面背景色 |
| --bg-card | rgba(6,48,109,.5) | #fff | 组件卡片背景 |
| --border-card | rgba(73,188,247,.15) | rgba(0,0,0,.06) | 卡片边框 |
| --text-primary | #fff | #333 | 主文字色 |
| --text-secondary | rgba(255,255,255,.7) | #8c8c8c | 辅助文字色 |
| --accent | #49bcf7 | #1890ff | 主题强调色 |
| --card-radius | 0 | 8px | 卡片圆角 |
| --card-shadow | none | 0 1px 4px rgba(0,0,0,.06) | 卡片阴影 |
| --stat-value-color | #fef000 | #1890ff | 统计卡片数值色 |
| --big-number-color | #fef000 | #1890ff | 大数字颜色 |
| --gauge-colors | #eaff00,#ea4d4d,#395ee6 | #1890ff,#ff4d4f,#36cfc9 | 仪表颜色序列 |
| --trend-up | #52c41a | #52c41a | 上涨色 |
| --trend-down | #ea4d4d | #ff4d4f | 下跌色 |

---

## layout — 布局定义

### layout.header

```json
{ "height": "80px" }
```

| 字段 | 类型 | 说明 |
|------|------|------|
| height | string\|number | 顶部标题栏高度，"80px" 或 80 |

### layout.rowGap / layout.widgetGap

行间距和组件间距，单位 px（数字）或任意 CSS 值（字符串）。

### layout.rows[]

每个 row 是一行，支持 CSS Grid 风格的多列 flex 布局。

```json
{
  "height": "100%",
  "padding": [5, 10],
  "cols": [...]
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| height | string\|number | 行高。"40%", "300px", "auto", 或数字(px)。多行时按比例分配 |
| padding | number\|string\|array | 内边距。数字=px, "10px 0", [上, 右, 下, 左] |
| cols | array | 列数组 |

### row.cols[]

每列是一个纵向组件容器。

```json
{
  "flex": 3,
  "widgets": [...]
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| flex | number | 列宽度比例（flex-grow），如 3:4:3 表示左30%/中40%/右30% |
| widgets | array | 该列中的组件数组 |

---

## 组件（Widget）类型

### 通用字段（所有类型共用）

| 字段 | 类型 | 说明 |
|------|------|------|
| type | string | 组件类型（见下方） |
| title | string\|false | 组件标题。`false` 隐藏标题栏 |
| height | string\|number | 组件高度。"30%", "200px", "auto", 或数字(px) |
| id | string | 唯一标识（用于 ECharts DOM id） |

---

### 1. stat-cards — 统计卡片

横向排列的关键指标卡片。

```json
{
  "type": "stat-cards",
  "title": "核心指标",
  "height": "15%",
  "data": {
    "items": [
      {"label": "用户总数", "value": 1280, "unit": "个"},
      {"label": "在线设备", "value": 856, "unit": "台"},
      {"label": "合作企业", "value": 150, "unit": "家"}
    ],
    "cardsPerRow": 3,
    "altBackground": true
  }
}
```

| data 字段 | 类型 | 说明 |
|-----------|------|------|
| items | array | 卡片数据 [{label, value, unit}] |
| cardsPerRow | number | 每行卡片数，默认=items 数量（最多4） |
| altBackground | boolean | 是否交替背景色，默认 true |

---

### 2. summary-bars — 摘要数据条

带进度条和趋势指示的数据项。

```json
{
  "type": "summary-bars",
  "title": "业务概览",
  "data": {
    "items": [
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
  }
}
```

| item 字段 | 类型 | 说明 |
|-----------|------|------|
| label | string | 指标名 |
| value | number | 数值 |
| unit | string | 单位 |
| trendLabel | string | 趋势标签（同比/环比） |
| trend | number | 趋势百分比 |
| trendUp | boolean | true=涨 false=跌 |
| pct | number | 进度条 0-100 |

---

### 3. big-number — 大数字

突出展示单一核心指标。

```json
{
  "type": "big-number",
  "title": "核心指标",
  "data": {
    "label": "总营收",
    "value": 58600000,
    "unit": "元"
  }
}
```

---

### 4. chart — ECharts 图表

支持柱状图、折线图、饼图、雷达图等所有 ECharts 类型。

```json
{
  "type": "chart",
  "title": "月度销售趋势",
  "height": "40%",
  "data": {
    "tooltip": {"trigger": "axis"},
    "legend": {"data": ["销售额", "利润"]},
    "xAxis": {"type": "category", "data": ["1月","2月",...]},
    "yAxis": {"type": "value"},
    "series": [
      {"name": "销售额", "type": "bar", "data": [123, 154, ...]},
      {"name": "利润", "type": "line", "data": [45, 67, ...]}
    ]
  }
}
```

data 字段直接传入 ECharts option 对象。额外支持：

- 如果 data 包含 `chartType` + `xData` + `seriesData` 简化字段，渲染引擎自动构建 ECharts option
- 颜色随主题自动适配（图例文字、坐标轴等使用 CSS 变量）

---

### 5. gauges — 环形进度仪表

环形图显示百分比指标。

```json
{
  "type": "gauges",
  "title": "系统资源",
  "height": "25%",
  "data": {
    "items": [
      {"label": "CPU", "value": 80},
      {"label": "内存", "value": 73},
      {"label": "磁盘", "value": 30}
    ],
    "colors": "#eaff00,#ea4d4d,#395ee6"
  }
}
```

| data 字段 | 类型 | 说明 |
|-----------|------|------|
| items | array | 仪表数据，value 0-100 |
| colors | string | 颜色序列，逗号分隔 |

---

### 6. ranking — 排行榜

Top N 排名展示。

```json
{
  "type": "ranking",
  "title": "区域排行",
  "height": "35%",
  "data": {
    "title": "区域销售排行",
    "maxItems": 5,
    "items": [
      {"name": "华北区", "value": 21560},
      {"name": "华东区", "value": 18920},
      {"name": "华南区", "value": 14300}
    ]
  }
}
```

| data 字段 | 类型 | 说明 |
|-----------|------|------|
| items | array | 排行数据（自动按 value 降序） |
| maxItems | number | 最多显示条数，默认=全部/8 |
| title | string | 排行榜标题 |

---

### 7. table — 数据表格

```json
{
  "type": "table",
  "title": "明细数据",
  "data": {
    "columns": ["姓名", "销售额", "增长率"],
    "rows": [
      ["张三", "¥120万", "+12%"],
      ["李四", "¥98万", "+8%"]
    ]
  }
}
```

---

### 8. text — 文本块

```json
{
  "type": "text",
  "data": {
    "content": "<h3>关键发现</h3><p>本季度销售额同比增长 23%...</p>"
  }
}
```

支持 HTML 内容。

---

## 完整布局示例（三列标准布局）

```json
{
  "title": "销售数据驾驶舱",
  "theme": {"mode": "dark"},
  "layout": {
    "header": {"height": "80px"},
    "rowGap": 8,
    "widgetGap": 8,
    "rows": [{
      "height": "100%",
      "cols": [
        {
          "flex": 3,
          "widgets": [
            {"type": "stat-cards", "title": "关键指标", "height": "15%", "data": {"items": [...], "cardsPerRow": 3}},
            {"type": "summary-bars", "title": "运营概况", "height": "43%", "data": {"items": [...]}},
            {"type": "chart", "title": "用户增长趋势", "height": "42%", "data": {...}}
          ]
        },
        {
          "flex": 4,
          "widgets": [
            {"type": "gauges", "title": false, "height": "20%", "data": {"items": [...], "bigNumber": {...}}},
            {"type": "chart", "title": "月度对比", "height": "38%", "data": {...}},
            {"type": "chart", "title": "实时流量", "height": "42%", "data": {...}}
          ]
        },
        {
          "flex": 3,
          "widgets": [
            {"type": "stat-cards", "title": "运营指标", "height": "15%", "data": {"items": [...], "cardsPerRow": 3}},
            {"type": "chart", "title": "雷达分析", "height": "43%", "data": {...}},
            {"type": "ranking", "title": "排行榜", "height": "42%", "data": {"items": [...]}}
          ]
        }
      ]
    }]
  }
}
```

## Excel 布局格式

Excel 文件通过 `data_processor.py` → `layout_builder.py` 双阶段处理。

### Sheet 约定

| Sheet 名 | 内容 | 说明 |
|----------|------|------|
| config | A1=标题 | 大屏标题和主题 |
| layout_rows | A=row_id, B=height | 行定义 |
| layout_cols | A=row_id, B=col_idx, C=flex | 列定义 |
| layout_widgets | A=row_id, B=col_idx, C=widget_idx, D=type, E=title, F=height | 组件定义 |
| stats_* | A=label, B=value, C=unit | 统计卡片数据 |
| chart_* | A=key, B=value (JSON string) | 图表数据（每个组件一个 sheet） |
| ranking_* | A=name, B=value | 排行榜数据 |

### 典型 Excel 布局

```
Sheet: config
  A1: 销售数据驾驶舱
  A2: dark

Sheet: layout_widgets
  row1 | col0 | 0 | stat-cards | 关键指标 | 15%
  row1 | col0 | 1 | summary-bars | 运营概况 | 43%
  row1 | col0 | 2 | chart | 用户增长 | 42%
  row1 | col1 | 0 | big-number | 核心指标 | 20%
  row1 | col1 | 1 | chart | 月度对比 | 38%
  row1 | col1 | 2 | chart | 实时流量 | 42%
  row1 | col2 | 0 | stat-cards | 运营指标 | 15%
  row1 | col2 | 1 | chart | 雷达分析 | 43%
  row1 | col2 | 2 | ranking | 排行榜 | 42%

Sheet: stats_关键指标
  用户总数 | 1280 | 个
  在线设备 | 856  | 台

Sheet: chart_用户增长
  (JSON ECharts option 或以行为单位的简化数据)
```
