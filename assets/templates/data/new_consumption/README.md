# new_consumption 数据填写说明

**模板名**：新消费市场洞察报告（1600×900，DataEase 导出风格，浅色背景）
**构建命令**：
```bash
py scripts/build_dashboard.py assets/templates/data/new_consumption/example.json \
  --template new_consumption --output output/new_consumption.html
```

## 数据契约

本模板的 `example.json` 是 **viewId-keyed** 结构（键为图表 viewId，uuid 形式）。构建管道把
该 JSON 原样赋给 `window.DASHBOARD_DATA`，模板自带 `render.js` 在 `window.load` 时读取并渲染。
**因此只需按下面的图表清单替换数值即可，不要改键名。**

## 9 个图表字段映射

| viewId（JSON 键） | 类型 | 图表标题 | 数据形态 | 说明 |
|---|---|---|---|---|
| `eaf1443a-7e8e-475b-9d95-53b4db80c84b` | bar | 2022年3-12月社会消费品零售总额 | `{categories, series}` | `categories`=月份；`series[0].data`=亿元 |
| `0c537677-154d-4aed-8e40-8b9792a44e13` | chart-mix | 新消费市场投融资数量 | `{categories, series}` | `categories`=年份；`series[0].data`=起数 |
| `66721e70-750a-4d7a-9b3c-98e3783a424b` | chart-mix | 新消费市场投融资金额 | `{categories, series}` | `categories`=年份；`series[0].data`=亿元 |
| `11206b10-b69f-470f-bd21-9234d7a33501` | bar-horizontal | “新消费” 网络信息阅读量 | `{categories, series}` | 横向柱；`categories`=月份 |
| `ace16715-5348-488d-88a3-abd8dd24b0a9` | bar | “新消费”网络信息地域分布TOP10 | `{categories, series}` | `categories`=省份 |
| `7726e8ec-7825-4d73-8894-9e4732dc92c1` | table-info | 食品饮料新消费品牌印象 | `{columns, rows}` | `columns`=表头；`rows`=行数组 |
| `fa4ed026-4823-42f2-a5da-2344f54c1993` | word-cloud | 食品功能网络信息关键词云 | `[{name,value}]` | **根级数组**；render.js 降级为柱状图展示前 12 热词 |
| `6e867661-9db7-49cf-b3d7-14b53bde8e1d` | radar | 智能家电新消费需求热度 | `{categories, series}` | 雷达图；`categories`=品类 |
| `cafe9eef-3e08-4881-ae46-31df7173e536` | bar-horizontal | 智能家电品类热度 | `{categories, series}` | 横向柱 |

## 形态细则

- **柱/线/雷达/横向柱**（8 个）：`{ "categories": ["标签1","标签2",...], "series": [{"name":"系列名","data":[v1,v2,...]}] }`
  `categories` 与每个 `series.data` 长度需一致。多系列可在 `series` 数组中追加。
- **表格** `table-info`：`{ "columns": ["列A","列B",...], "rows": [[v1,v2,...], ...] }`，`rows` 每行长度 = `columns` 长度。
- **词云** `word-cloud`：整个 viewId 的值是**数组**而非对象：`[{"name":"关键词","value":数值}, ...]`。

## 修改示例

只改社会消费品零售总额的数据：
```json
{
  "eaf1443a-7e8e-475b-9d95-53b4db80c84b": {
    "categories": ["1月","2月","3月","4月","5月","6月"],
    "series": [{ "name": "单位：亿元", "data": [41000, 38000, 35000, 39000, 42000, 45000] }]
  }
}
```

## Excel 流程

```bash
# JSON → 可填写 Excel
py scripts/make_xlsx_template.py assets/templates/data/new_consumption/example.json user_data.xlsx
# 填好后 → JSON
py scripts/xlsx_to_json.py user_data.xlsx user_data.json
py scripts/build_dashboard.py user_data.json --template new_consumption --output output/new_consumption.html
```

## 备注

- 大屏标题、政策时间轴文本、装饰图片均为静态（写在 `index.html` 里），不参与数据注入；如需改文字直接编辑 `assets/templates/skeletons/new_consumption/index.html`。
- 画布 1600×900，`render.js` 的 `fitCenter()` 按 contain 模式等比缩放居中（可能有黑边但不裁切）。
- 顶部黄色 `#banner` 仅在某个图表缺数据（render.js 用 mock 兜底）时显示；数据齐全时自动隐藏。
