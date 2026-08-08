# data_center 数据填写说明

> 对应源模板：**003 酷炫智能大屏数据中心**
> 渲染骨架：`assets/templates/skeletons/data_center/`（含 `injector.js`，已自带源资源）
> 注入方式：skeleton.html 内嵌 `<script id="dashboard-data">/* DATA_PLACEHOLDER */</script>`，构建时由 build_dashboard.py 替换为 JSON 数据；`injector.js` 在 `</body>` 前追加，通过 `window.DASHBOARD_DATA` 更新 DOM 文本与 ECharts 实例。

## 顶层字段

| 字段 | 类型 | 说明 |
|---|---|---|
| `title` | string | 页面主标题（`.title`） |
| `statCards` | array[4] | 顶部 4 个 KPI 卡片 |
| `sectionTitles` | array[6] | 6 个 `<h3>` 模块标题（按 DOM 顺序） |
| `charts` | array | 图表数组，3 个槽位：`chartmain` / `chartmain_zhe` / `chartmain_bing` |
| `ranking` | array[6] | 区域访问排行 6 项 |
| `miniStats` | array[6] | 6 个小统计盒（业务收益） |
| `table` | object | 实时告警列表 `{headers[5], rows[][]}` |

### statCards 字段

| 子字段 | 说明 |
|---|---|
| `label` | 卡片标题（替换"这里是标题N"） |
| `value` | 主数值（如 `"1,286"`） |
| `unit` | 单位（如 `"台"` / `"%"`） |
| `sublabel1` | 副标签 1（`.zi .span1`） |
| `sublabel2` | 副标签 2（`.zi span:last-child`） |

### sectionTitles 顺序

按 DOM 顺序对应：
1. `chartmain` 上方标题（柱图）
2. 排行榜标题
3. `chartmain_zhe` 上方标题（折线）
4. miniStats 标题
5. `chartmain_bing` 上方标题（饼图）
6. 数据表标题

### charts 字段

每个 chart 必须有 `id`（`chartmain` / `chartmain_zhe` / `chartmain_bing`）+ `type`。

| type | id 适用 | 数据格式 |
|---|---|---|
| `bar` | `chartmain` | `data:[{name,value}]`，自动映射到 xAxis + series[1]（保留原 shadow 系列） |
| `line` | `chartmain_zhe` | `categories:[...]` + `series:[{name, data}]`，多系列 |
| `pie` | `chartmain_bing` | `data:[{name, value}]` |

也可用 `option` 字段透传完整 ECharts option 覆盖。

### ranking 字段

| 子字段 | 说明 |
|---|---|
| `name` | 替换"第N名" |
| `percent` | 0–100 数值，同时控制进度条宽度和右侧百分比显示 |

### miniStats 字段

6 个小统计盒，每项 `{label, value}`。

### table 字段

| 子字段 | 说明 |
|---|---|
| `headers` | 5 列表头 |
| `rows` | 二维数组，每行 5 个单元格；行数与骨架 `.ul_con` 数量对应（默认 6+） |

## 填写注意事项

- 所有槽位都有 fallback：不填保留模板原文本
- `charts[].id` 是严格 DOM id 匹配
- `ranking[].percent` 直接驱动进度条，不要传小数（0–100）
- `table.rows` 行数应匹配骨架的 `.ul_con` 数量；多出的行不会显示，少了则末尾保留原占位

## 构建命令

```bash
# 自带源，无需 --source-dir
py scripts/build_dashboard.py assets/templates/data/data_center/example.json \
    --template data_center \
    --output dashboard.html
```
