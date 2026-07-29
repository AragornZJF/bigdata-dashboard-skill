# weather 数据填写说明

> 对应源模板：**092 酷炫大屏数据可视化模板（气象站监控）**
> 渲染骨架：`assets/templates/skeletons/weather/`（含 injector.js + template_config.json + skeleton.html）
> 特色：含仪表盘 / 蜡烛图 / 中国地图 / 雷达图 / 水球图（WaterPolo）/ 气压动画条 / 风扇转速动画

## 顶层字段

| 字段 | 类型 | 说明 |
|---|---|---|
| `title` | string | 大屏标题 |
| `pressure` | object | 气压 `{relative, absolute}`（hPa 数值） |
| `testSite` | object | 测试站点 `{area, date, siteId, days}` |
| `temperature` | object | 温度组 `{indoor, outdoor, indoorMax, dewPoint, windChill, heatNumber, kline[]}` |
| `humidity` | object | 湿度组 `{indoor, outdoor, kline[]}` |
| `wind` | object | 风 `{speed{current,highest}, gust{current,highest}, radar[16]}` |
| `rainfall` | object | 降雨量 `{day, week, month, year}`，每项 `{current, highest, waterPolo}` |
| `mapMarkers` | array | 地图观测点 `[{name, lng, lat}]` |

## 字段 -> 渲染目标映射

| 字段 | 渲染目标 | 类型 |
|---|---|---|
| `title` | DOM `.headTitle` | text |
| `pressure.relative` | DOM `.hpa-rel` + 重建 `.air-relative` 50 格动画条（每 2 hPa 一格） | text+animation |
| `pressure.absolute` | DOM `.hpa-abs` + 重建 `.air-absolutely` 动画条 | text+animation |
| `testSite.*` | DOM `.area` / `.date` / `.idNum` / `.days` | text |
| `temperature.indoorMax` | DOM `.temperatureN` | text |
| `temperature.dewPoint` | DOM `.dewpoint`（追加 ℃） | text |
| `temperature.windChill` | DOM `.windchill`（追加 ℃） | text |
| `temperature.heatNumber` | DOM `.heatnumber`（追加 ℃） | text |
| `temperature.indoor/outdoor` | echarts `#temChart` (gauge)，series[2]/series[3] | gauge |
| `humidity.indoor/outdoor` | echarts `#humChart` (gauge) | gauge |
| `temperature.kline` | echarts `#tempKChart` (candlestick)，自动算 MA5/MA10 | candlestick |
| `humidity.kline` | echarts `#dityKChart` (candlestick) | candlestick |
| `wind.speed.current` | DOM `#nowWind` + 调整风扇 `.windSpeed .windFan` 转速 | text+animation |
| `wind.speed.highest` | DOM `#highWind` | text |
| `wind.gust.current` | DOM `#nowGust` + 调整 `.gust .windFan` 转速 | text+animation |
| `wind.gust.highest` | DOM `#highGust` | text |
| `wind.radar` | echarts `#windChart` (radar) | radar |
| `rainfall.*.current/highest` | DOM `#nowDay/#highDay` 等 | text |
| `rainfall.day.waterPolo` | canvas `#rainfallOne` (WaterPolo) | canvas |
| `rainfall.week.waterPolo` | canvas `#rainfallTwo` | canvas |
| `rainfall.month.waterPolo` | canvas `#rainfallThree` | canvas |
| `rainfall.year.waterPolo` | canvas `#rainfallFour` | canvas |
| `mapMarkers` | echarts `#map` (map+effectScatter) | map |

## 填写注意事项

- `pressure.relative/absolute` 为 0-100 数值，每 2 单位对应 1 格动画（最多 50 格）
- `temperature.kline`/`humidity.kline` 每项必须含 `date/open/close/low/high` 5 字段；MA5/MA10 由 injector 自动计算
- `wind.radar` 数组长度必须为 16（16 方位）
- `rainfall.*.waterPolo` 取值 0-100，是水球液位百分比，与 `current`/`highest`（实际毫米数）相互独立
- `mapMarkers` 的 `lng/lat` 为数值（经度/纬度），必须在中国境内才会落在中国地图上
- 温度的 dewPoint/windChill/heatNumber 渲染时自动追加 ℃，填数值即可
- 湿度的 indoor/outdoor 渲染时自动追加 %

## 构建命令

```bash
python scripts/build_dashboard.py assets/templates/data/weather/example.json \
    --template weather \
    --source-dir "<BigDataView 源目录>/web" \
    --output dashboard.html
```
