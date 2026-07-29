# property_management 数据填写说明

> 模板来源：DataEase 大屏导出（`.DET`）转换而来。
> 画布 1600×900，自由绝对布局，深色主题 `#01040F`。

## 构建命令

```bash
# 用本目录 example.json 直接构建
py scripts/build_dashboard.py assets/templates/data/property_management/example.json \
  --template property_management --output dashboard.html

# Excel 输入也行（字段与 example.json 对应）
py scripts/build_dashboard.py your_data.xlsx --template property_management --output dashboard.html
```

## 注入机制

skeleton.html 已内联全部 52 个组件（6 图表 + 文本 + 图片 + 日期）的初始数据，
打开即可看完整效果。`injector.js` 在运行时读取 `window.DASHBOARD_DATA`，
按 `id` 定位图表 DOM，用 `echarts.getInstanceByDom() + setOption()` 覆盖数据。

**图表 DOM id 为 `chart_0` ~ `chart_5`、表格为 `table_0` 起编号**，与下方清单一一对应。

## 数据契约

```json
{
  "title": "物业管理数据中心",
  "charts": [
    { "id": "chart_0", "option": { ...完整 ECharts option... } }
  ],
  "tables": [
    { "id": "table_0", "columns": ["列A","列B"], "rows": [[v1,v2]] }
  ]
}
```

| 字段 | 类型 | 说明 |
|---|---|---|
| `title` | string | 可选，覆盖大屏标题 |
| `charts[]` | array | 可选，每项 `{id, option}`；`option` 是完整 ECharts 配置，会整体替换对应图表 |
| `tables[]` | array | 可选，每项 `{id, columns, rows}`；`columns` 为表头字符串数组，`rows` 为二维数组或对象数组 |

> 不传 `charts` / `tables` 时，沿用 skeleton 内置的原始数据。

## 图表清单（id ↔ 业务含义）

| DOM id | 类型 | 原始标题 | 说明 |
|---|---|---|---|
| `chart_0` | pie | 安全 | 总物业安全状况占比（环形） |
| `chart_1` | bar（多系列） | 专项检查 | 近期专项检查情况 |
| `chart_2` | line（多系列） | 巡查轨迹图 | 巡查数据走势 |
| `chart_3` | pie | 物业费-copy(1) | 物业费相关占比 |
| `chart_4` | pie | 物业费 | 物业费相关占比 |
| `chart_5` | scatter | 网点地图 | 网点分布散点（原 symbol-map） |

## charts[].option 速查（按类型）

**pie（环形图）** — `chart_0` / `chart_3` / `chart_4`
```json
{
  "tooltip": {"trigger": "item", "formatter": "{b}: {c} ({d}%)"},
  "legend": {"type": "scroll", "bottom": 0, "left": "center", "textStyle": {"color": "#ccc"}},
  "series": [{
    "type": "pie", "radius": ["28%", "52%"], "center": ["50%", "45%"],
    "label": {"color": "#fff"},
    "data": [{"name": "类别A", "value": 120}, {"name": "类别B", "value": 80}]
  }]
}
```

**bar / line（柱状/折线，多系列）** — `chart_1` / `chart_2`
```json
{
  "tooltip": {"trigger": "axis"},
  "legend": {"textStyle": {"color": "#fff"}, "top": 0},
  "grid": {"left": "3%", "right": "4%", "bottom": "3%", "top": "15%", "containLabel": true},
  "xAxis": {"type": "category", "data": ["1月","2月","3月"], "axisLabel": {"color": "#ccc"}},
  "yAxis": {"type": "value", "axisLabel": {"color": "#ccc"}},
  "series": [
    {"name": "系列1", "type": "bar", "data": [10,20,30]},
    {"name": "系列2", "type": "bar", "data": [5,15,25]}
  ]
}
```

**scatter（散点）** — `chart_5`
```json
{
  "xAxis": {"type": "value", "axisLabel": {"color": "#ccc"}},
  "yAxis": {"type": "value", "axisLabel": {"color": "#ccc"}},
  "series": [{"type": "scatter", "data": [[10,20],[30,40]], "symbolSize": 8}]
}
```

## 修改建议

- **换数据**：改 `option.series[0].data` / `option.xAxis.data` 即可，颜色/样式保持原值。
- **换标题**：在 skeleton.html 里找对应 `dv-text` 的 `<span>` 改文字，或在数据里加 `"title": "新标题"` 覆盖大屏标题。
- **加图表**：在 skeleton.html 里复制一个 `<div id="chart_N" class="dv-chart" style="position:absolute;left:Xpx;top:Ypx;width:Wpx;height:Hpx;"></div>`，再加对应的 `echarts.init` 行。
- **主题色**：改 `theme.css` 里的 CSS 变量 `--primary-color` / `--bg-color`。

## 注意事项

1. 原 `.DET` 里另有 11 个图表配置（funnel / map / word-cloud / table-info 等）只有数据、**没摆到画布上**，转换时未渲染。需要时可在 skeleton.html 里手动加 div + init。
2. `map` / `word-cloud` 类型因 echarts.min.js 未含对应扩展模块，已降级为横向柱状；要还原需自行引入 `echarts/extension` 资源。
3. 画布按 1600×900 设计，通过 `transform: scale()` 自适应屏幕，不保证超宽屏完美无拉伸。
