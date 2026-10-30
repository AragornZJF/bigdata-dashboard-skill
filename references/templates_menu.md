# 行业模板菜单（单源）

> 这是全部 15 个行业模板的**唯一权威菜单**。SKILL.md 与 README.md 均引用本文件，改模板清单只改这里。
> 字段含义：`--template` 列 = 构建时传给 `--template` 的值（支持英文骨架名 / 编号 / 中文名）；「自带源」= 无需 `--source-dir` 即可直接构建。

## 模板菜单

| 菜单选项              | `--template`              | 适用场景                                                | 数据模板目录                              |
| --------------------- | ------------------------- | ------------------------------------------------------- | ----------------------------------------- |
| 企业营收 / 销售额大屏 | `revenue`        | 营收、销售、业绩总览                                    | `assets/templates/data/revenue/`        |
| 设备环境监测          | `device_monitor` | IoT、机房、设备运维                                     | `assets/templates/data/device_monitor/` |
| 气象站监控            | `weather`        | 气象、环境、水文监测                                    | `assets/templates/data/weather/`        |
| 银行信用风险          | `credit_risk`    | 企业信用、风险预警                                      | `assets/templates/data/credit_risk/`    |
| 电信厅店效能          | `telecom_store`  | 营业厅、门店效能分析                                    | `assets/templates/data/telecom_store/`  |
| 通用可视化            | `generic`        | 任意通用数据展示                                        | `assets/templates/data/generic/`        |
| 酷炫数据中心          | `data_center`    | 数据中心、资源监控                                      | `assets/templates/data/data_center/`    |
| 电竞 / LPL            | `lpl`            | 赛事、战队数据                                          | `assets/templates/data/lpl/`            |
| 智慧城市综合监管      | `smart_city`     | 城管、政务监管、实时告警（**自带源**） | `assets/templates/data/smart_city/`     |
| 发电厂数据管理        | `power_plant`    | 电厂、能源、机组监控（**自带源**）     | `assets/templates/data/power_plant/`    |
| 药品企业监管          | `pharma`         | 药企监管、抽检、注册申请（**自带源**） | `assets/templates/data/pharma/`         |
| 新消费市场洞察        | `new_consumption` | 新消费、零售、品牌洞察（**自带源**）   | `assets/templates/data/new_consumption/` |
| 智能看板新中心      | `smart_dashboard` | 设备监控、销售运营、3 栏科技风（**自带源**） | `assets/templates/data/smart_dashboard/` |
| 新能源汽车工业经济  | `new_energy_vehicle` | 汽车产销、新能源渗透率、厂商排行（**自带源**） | `assets/templates/data/new_energy_vehicle/` |
| 物业管理数据中心    | `property_management` | 物业运营、园区管理、52 组件自由布局（**自带源**） | `assets/templates/data/property_management/` |

## 注入与自带源

- 全部 15 个骨架均带 `injector.js`，支持**完整数据注入**（`window.DASHBOARD_DATA` → DOM 文本 + ECharts `setOption()`）；`generic / data_center / lpl` 走布局引擎，图表数据为通用结构（statCards / charts / tables）
- **自带源（15 个全部，免 `--source-dir`）**：`smart_city` / `power_plant` / `pharma` / `weather` / `lpl` / `generic` / `data_center` / `new_consumption` / `smart_dashboard` / `new_energy_vehicle` / `property_management` / `revenue` / `device_monitor` / `credit_risk` / `telecom_store`

## 场景 → 模板选择建议

| 场景          | 推荐模板（--template 值）                                             |
| ------------- | --------------------------------------------------------------------- |
| 通用数据展示  | `generic`                                                    |
| 酷炫数据中心  | `data_center`                                                |
| 气象/环境监测 | `weather`（自带源）                                          |
| 政务/监管     | `smart_city`（智慧城市综合监管，自带源）                     |
| 游戏/电竞     | `lpl`                                                        |
| IoT/设备监测  | `device_monitor`（4图表+地图+环境指标+维保表格）             |
| 电厂/能源     | `power_plant`（发电厂数据管理，自带源）                      |
| 消费/零售     | `new_consumption`（新消费市场洞察，自带源）                 |
| 智能看板/设备 | `smart_dashboard`（3 栏设备/销售运营，自带源）              |
| 新能源车      | `new_energy_vehicle`（汽车产销/渗透率/厂商排行，自带源）    |
| 物业管理      | `property_management`（物业/园区运营，自带源）              |
| 电信营业效能  | `telecom_store`                                              |
| 银行/金融     | `credit_risk`                                                |
| 企业营收统计  | `revenue`                                                    |

> 深度定制型骨架（带地图/特殊组件）选 `device_monitor`、`weather`、`smart_city`、`credit_risk`。
