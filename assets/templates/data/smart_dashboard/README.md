# smart_dashboard 数据填写说明

**模板名**：智能看板新中心（3 栏，rem 响应式 1024–1920，深蓝科技风）
**来源**：BigDataView `web/069 智能看板新中心`（jquery + ECharts）
**构建命令**：
```bash
py scripts/build_dashboard.py assets/templates/data/smart_dashboard/example.json \
  --template smart_dashboard --output output/smart_dashboard.html
```

## 数据契约

`example.json` 为**友好键** object（不是 viewId）。注入器（`smart_dashboard/injector.js`）
在图表初始化后用 `echarts.getInstanceByDom` + DOM 文本覆盖。**未提供的键保留源默认演示值。**

## 字段映射

| 键 | 类型 | 对应区域 | 说明 |
|---|---|---|---|
| `title` | string | 浏览器标签标题 | |
| `overview` | `[{value,label}]` ×4 | 左栏顶部设备总览 | 设备总数/季度新增/运营设备/异常设备；label 仅存档，注入只改数值 |
| `point` | `{total,monthNew,pie[]}` | 左栏点位分布 | `pie`=`[{name,value}]`，南丁格尔玫瑰图 |
| `monitor` | `{fault[],exception[]}` | 左栏监控表 | 每项 `[[时间,地址,代码], ...]`；注入器双份复制维持无缝滚动 |
| `users` | `{total,monthNew,cities[],data[]}` | 中栏用户柱图 | `cities` 与 `data` 长度一致；空串=`......`占位 |
| `order` | `{day365,day90,day30,day1}` | 右栏订单 | 每个值 `{orders,amount}`；**仅初始注入 day365，tab 切换用源内置演示序列** |
| `sales` | `{year,quarter,month,week}` | 右栏销售额折线 | 每个值 `[[预期12值],[实际12值]]`；**仅初始注入 year，tab 切换用源内置演示序列** |
| `channel` | `[{value,name}]` ×4 | 右栏渠道分布 | value 带 `%` 后缀；机场/商场/地铁/火车站 |
| `quarter` | `{percent,sales,growth}` | 右栏一季度进度 | 仪表盘百分比标签 + 销售额/同比增长 KPI |
| `ranking` | `{hot[],provinces[]}` | 右栏排行榜 | `hot`=全国热榜 top3 `[{name}]`；`provinces`=`[{name,value,up}]` |

## 不纳入注入（装饰性）

- **中国地图**（`.map .geo`）：用 `china.js` 注册的 `china` 地图，设备散点为固定演示。
- **仪表盘图形**（`.quarter .gauge`）：半圆装饰，仅百分比文字标签可注入（`quarter.percent`）。

## 注意

- 源模板原含 Gitee 推广点击跳转（饼图/柱图点击）、订单/销售额 tab 自动轮播，**已在 `index.js` 移除**：
  - 移除推广跳转 → 点击图表不再跳走
  - 移除自动轮播 → 初始注入数据稳定显示；**手动点 tab 仍切换源内置演示数据**（如需把某周期也改掉，需编辑 `js/index.js` 对应闭包数据）
- `users.data` 用纯数字注入时，源中"......"占位柱的特殊灰色会丢失（被普通渐变柱替代），属预期。

## Excel 流程

```bash
py scripts/make_xlsx_template.py assets/templates/data/smart_dashboard/example.json user.xlsx
# 填好后
py scripts/xlsx_to_json.py user.xlsx user.json
py scripts/build_dashboard.py user.json --template smart_dashboard --output output/smart_dashboard.html
```
> 注：当前 Python 3.14-32 环境下 openpyxl 会 segfault；`make_xlsx_template.py` 可能失败。`example.xlsx`
> 由 stdlib 等价流程生成。JSON 输入直接构建不受影响。
