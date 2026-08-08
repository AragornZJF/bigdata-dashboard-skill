# lpl 数据填写说明

> 对应源模板：**099 英雄联盟 LPL 比赛数据可视化**
> 渲染骨架：`assets/templates/skeletons/lpl/`（含 `injector.js`，已自带源资源）
> 注入方式：skeleton.html 内嵌 `<script id="dashboard-data">/* DATA_PLACEHOLDER */</script>`，构建时由 build_dashboard.py 替换为 JSON 数据；`injector.js` 在 `</body>` 前追加，通过 `window.DASHBOARD_DATA` 更新 DOM 文本与 ECharts 实例。

## 顶层字段

| 字段 | 类型 | 说明 |
|---|---|---|
| `title` | string | 页面 `<h1>` 标题 |
| `sectionTitles` | array | `.alltitle` 模块标题（按 DOM 顺序） |
| `heroData` | array | 英雄数据轮播，每项 `{name, appearances, pickRate, winRate}` |
| `gaugeLabels` | array[6] | zb1-6 顶部标签，支持 `"NAME\n副标签"` 或 `"NAME/副标签"` 自动转 `<br>` |
| `gaugeValues` | array[6] | zb1-6 中心数值（0–100，会同时设置 100-value 为对立面） |
| `teamTable` | object | 战队排行榜 `{headers, rows}` |
| `playerTable` | object | 个人排行榜 `{headers, rows}` |
| `charts` | array | ECharts 数据，主要支持 `echart1`（pie）+ 透传 `option` |

### heroData 字段

| 子字段 | 说明 |
|---|---|
| `name` | 英雄名（替换"寒冰射手"等） |
| `appearances` | 出场次数 |
| `pickRate` | Pick 率字符串（如 `"56%"`） |
| `winRate` | 胜率字符串（如 `"51%"`） |

### gaugeLabels 字段

DOM 中每个 `.zbN > span` 原本是 `"TES<br>胜率最高"`。本字段提供字符串 `"TES\n胜率最高"` 或 `"TES/胜率最高"`，injector 自动拆分转换为 `<br>`。

### gaugeValues 字段

 zb1-6 中心显示的数字（如 `73` 表示 73%）。injector 用 `{value, 100-value}` 更新饼图两点（胜利/战败）+ label.formatter。

### charts 字段（部分图表）

LPL 模板 js.js 内置 5 个主图 + 6 个仪表盘，结构复杂度不一。injector 提供两种用法：

| 用法 | 适用 |
|---|---|
| `{id, type:"pie", data:[{name,value}]}` | echart1（简单饼图） |
| `{id, type:"bar"\|"line", categories, series}` 或 `{id, type, data:[{name,value}]}` | echart4 / echart5（柱/线） |
| `{id, option:{...}}` | 任意图表，透传完整 ECharts option 覆盖 |

echart2 / echart3 是混合饼+线复合图，建议直接用 `option` 透传完整配置。

### teamTable / playerTable 字段

`{headers:[...], rows:[[...]]}`

- 表头列数与原 DOM 保持一致（默认 4 列）
- 第 1 列若为排名，会保留原 `<span>` 包装（排名徽标样式）
- 行数与骨架行数对应；多出不显示，少了保留原占位

## 填写注意事项

- 所有槽位都有 fallback：不填保留模板原文本
- `gaugeValues` 取值 0–100，超出会被截断到合理范围
- `charts[].id` 必须用骨架真实 DOM id（`echart1`-`echart5` / `zb1`-`zb6`）
- 复杂图表（echart2 / echart3）建议用 `option` 透传

## 构建命令

```bash
# 自带源，无需 --source-dir
py scripts/build_dashboard.py assets/templates/data/lpl/example.json \
    --template lpl \
    --output dashboard.html
```
