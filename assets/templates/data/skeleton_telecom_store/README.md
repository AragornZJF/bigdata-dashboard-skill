# skeleton_telecom_store 数据填写说明

> 对应源模板：**068 中国电信厅店营业效能分析**
> 渲染骨架：`assets/templates/skeletons/skeleton_telecom_store/`（含 injector.js + template_config.json）
> 注意：原模板 `index.html` 在 `page/` 子目录下；注入策略为**全局变量覆写**（替换 `window.data`）

## 顶层字段（最小可工作子集）

| 字段 | 类型 | 说明 |
|---|---|---|
| `code` | number | 必须 `0`（触发正常渲染分支） |
| `title` | string | 大屏标题 |
| `dataDate` | string | 数据日期（YYYY-MM-DD） |
| `channelName` | string | 渠道/门店名称 |
| `custType` | string | 客户类型 `person`（公众）/ `enterprise`（政企） |
| `businessTypeAnalysis` | object | 业务类型耗时 `{categoryArr[], orderNum[], avgTime[], legendArr[]}` |
| `timeStepAnalysis` | object | 耗时步骤 `{categoryArr[], channelTime[], provinceTime[], legendArr[]}` |

> 完整模板还有 `staffHandleInfo` / `channelDeviceInfo` / `channelHandleInfo` 等字段，由原模板 `office_efficiency_index.js` 消费，参考原模板 `static/js/office_efficiency_data.js`

## 字段 -> 渲染目标映射

injector 采用"覆写全局 `data` 变量"策略，字段映射由原模板 JS 完成：

| 字段 | 渲染目标 | 类型 |
|---|---|---|
| `title` | DOM `.title-info` | text |
| `custType` | DOM `.cust-type-default[type=custType]` 加 `.active` 类 | toggle |
| `dataDate` | DOM `#td-data-date` | text |
| `channelName` | 全局 `window.g_channelName` + DOM `.channel-name` | text |
| `businessTypeAnalysis.*` | echarts `#business-type-time-detial` (bar_line_mixed) | bar+line |
| `timeStepAnalysis.*` | echarts `#time-step-detial` (bar_grouped) | bar |
| `staffHandleInfo.channelJfMap` | echarts `#integral_echart` (pie) | pie |
| `staffHandleInfo.staffHandleInfo` | DOM `#staff-info` swiper 滚动卡片 | swiper_table |
| `channelDeviceInfo.deviceInfo` | DOM `#device-info` swiper 滚动卡片 | swiper_table |
| `channelHandleInfo.*` | echarts `#channel_handle_detail` (line_multi) | line |

## 填写注意事项

- `code` 必须为 `0`（或缺省，injector 会自动补 0），否则触发原模板的错误分支
- `custType` 仅识别 `person`/`enterprise`
- 评分字段（`finalDeviceScore`/`channelStartWeiGui`/`yingxiaoScore`/`avgTimeScore`/`yewuliangScore`）为数值，原模板按阈值映射为 star1/star2/star3 图片
- `businessTypeAnalysis` 与 `timeStepAnalysis` 的 `categoryArr` 长度需与各数据数组一致
- 完整数据结构参考原模板 `static/js/office_efficiency_data.js`
- 顶部右上角分析文案由原模板 `channelReportContent()` 函数根据数据自动生成，无需填
- 营业员/台席卡片用 Swiper 滚动，数据条数不限

## 构建命令

```bash
python scripts/build_dashboard.py assets/templates/data/skeleton_telecom_store/example.json \
    --template skeleton_telecom_store \
    --source-dir "<BigDataView 源目录>/web" \
    --output dashboard.html
```
