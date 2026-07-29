"""
布局构建器 (Layout Builder)

将用户数据（JSON/Excel）转换为渲染引擎（renderer.html）所需的标准布局配置。

支持三种输入模式：
1. 旧 DASHBOARD_DATA 格式  → 自动转换为布局配置（向后兼容）
2. 新布局配置 JSON         → 验证并规范化
3. Excel 布局描述          → 通过 data_processor 预处理后进入模式 1/2

输出统一格式：
{
  "title": "大屏标题",
  "theme": { "mode": "dark|light", "custom": {...} },
  "layout": {
    "header": { "height": "80px" },
    "rowGap": 10,
    "widgetGap": 10,
    "rows": [
      {
        "height": "100%",
        "padding": [0, 10],
        "cols": [
          { "flex": 3, "widgets": [...] },
          { "flex": 4, "widgets": [...] },
          { "flex": 3, "widgets": [...] }
        ]
      }
    ]
  }
}
"""
import json
import sys
import os
import copy


# ──────────────────── 组件类型检测 ────────────────────

WIDGET_DETECTORS = [
    # (检测函数, 组件类型, 数据提取函数)
    # 检测顺序很重要: 先检测具体类型, 再检测通用类型

    # ECharts 图表配置（有 series 或完整的 ECharts option）
    ("chartCenter1", lambda v: isinstance(v, dict) and has_chart_config(v)),
    ("chartCenter2", lambda v: isinstance(v, dict) and has_chart_config(v)),
    ("chartLeft", lambda v: isinstance(v, dict) and has_chart_config(v)),
    ("chartRadar", lambda v: isinstance(v, dict) and has_chart_config(v)),

    # 统计卡片（数组，每个元素有 label/value）
    ("statsLeft", lambda v: isinstance(v, list) and is_stat_cards(v)),
    ("statsRight", lambda v: isinstance(v, list) and is_stat_cards(v)),

    # 排行榜（有 items 或本身就是排名数组）
    ("ranking", lambda v: isinstance(v, dict) and "items" in v and is_ranking_items(v["items"])),

    # 摘要数据条（数组，每个元素有 label/value/pct/trend）
    ("summaryItems", lambda v: isinstance(v, list) and is_summary_items(v)),
]


def has_chart_config(v):
    """检测是否为 ECharts 配置"""
    return "series" in v or "xAxis" in v or "yAxis" in v or "radar" in v


def is_stat_cards(arr):
    """检测是否为统计卡片数组"""
    if not arr or not isinstance(arr, list):
        return False
    return all(
        isinstance(item, dict) and ("label" in item) and ("value" in item)
        for item in arr
    )


def is_ranking_items(arr):
    """检测是否为排行榜条目"""
    if not arr or not isinstance(arr, list):
        return False
    return all(
        isinstance(item, dict) and ("name" in item) and ("value" in item)
        for item in arr
    )


def is_summary_items(arr):
    """检测是否为摘要数据条"""
    if not arr or not isinstance(arr, list):
        return False
    return all(
        isinstance(item, dict) and ("label" in item) and ("value" in item)
        for item in arr
    )


def is_gauges(arr):
    """检测是否为仪表数据"""
    if not arr or not isinstance(arr, list):
        return False
    return all(
        isinstance(item, dict) and ("label" in item) and ("value" in item)
        for item in arr
    )


# ──────────────────── 布局构建 ────────────────────

def build_layout_config(raw_data, theme="dark", title=None):
    """
    主入口: 将原始数据转换为布局配置

    Args:
        raw_data: 原始 JSON 数据（dict）
        theme: "dark" | "light"
        title: 可选的大屏标题（覆盖数据中的 title）

    Returns:
        完整的布局配置 dict
    """
    # 如果已有 layout 字段 → 新格式，直接规范化
    if "layout" in raw_data and "rows" in raw_data.get("layout", {}):
        return normalize_layout_config(raw_data, theme, title)

    # 通用数据格式（statCards / charts[] / tables[]）→ 通用转换
    if is_generic_shape(raw_data):
        return convert_generic_to_layout(raw_data, theme, title)

    # 旧 DASHBOARD_DATA 格式 → 自动转换
    return convert_legacy_to_layout(raw_data, theme, title)


def normalize_layout_config(data, theme, title):
    """规范化和补全新布局配置"""
    cfg = {
        "title": title or data.get("title", "数据可视化大屏"),
        "theme": _merge_theme(data.get("theme", {}), theme),
        "layout": data["layout"]
    }
    # 确保 header 配置
    if "header" not in cfg["layout"]:
        cfg["layout"]["header"] = {"height": "80px"}
    # 确保 gaps
    cfg["layout"].setdefault("rowGap", 10)
    cfg["layout"].setdefault("widgetGap", 10)
    return cfg


def _merge_theme(user_theme, fallback_mode):
    """合并主题配置"""
    merged = {"mode": user_theme.get("mode", fallback_mode)}
    if "custom" in user_theme:
        merged["custom"] = user_theme["custom"]
    return merged


def convert_legacy_to_layout(data, theme, title):
    """将旧 DASHBOARD_DATA 格式转换为布局配置"""
    cfg = {
        "title": title or data.get("title", "数据可视化大屏"),
        "theme": {"mode": theme},
        "layout": {
            "header": {"height": "80px"},
            "rowGap": 10,
            "widgetGap": 10,
            "rows": []
        }
    }

    left_col = {"flex": 3, "widgets": []}
    mid_col = {"flex": 4, "widgets": []}
    right_col = {"flex": 3, "widgets": []}

    # === 左列 ===
    if data.get("statsLeft"):
        left_col["widgets"].append({
            "type": "stat-cards",
            "data": {"items": data["statsLeft"], "cardsPerRow": 3},
            "height": "15%"
        })

    if data.get("summaryItems"):
        left_col["widgets"].append({
            "type": "summary-bars",
            "data": {"items": data["summaryItems"]},
            "height": "43%"
        })

    if data.get("chartLeft"):
        left_col["widgets"].append({
            "type": "chart",
            "title": data["chartLeft"].get("_title", "趋势图"),
            "data": strip_title(data["chartLeft"]),
            "height": "42%"
        })

    # === 中列 ===
    # 大数字 + 仪表（组合在一个卡片中）
    has_big = bool(data.get("bigNumber") and data["bigNumber"].get("value"))
    has_gauge = bool(data.get("gauges"))
    if has_big or has_gauge:
        mid_col["widgets"].append({
            "type": "gauges",
            "title": False,
            "data": {"items": data.get("gauges", []), "bigNumber": data.get("bigNumber", {})},
            "height": "20%",
            "_legacyMidTop": True
        })

    if data.get("chartCenter1"):
        mid_col["widgets"].append({
            "type": "chart",
            "title": data["chartCenter1"].get("_title", ""),
            "data": strip_title(data["chartCenter1"]),
            "height": "38%"
        })

    if data.get("chartCenter2"):
        mid_col["widgets"].append({
            "type": "chart",
            "title": data["chartCenter2"].get("_title", "数据趋势"),
            "data": strip_title(data["chartCenter2"]),
            "height": "42%"
        })

    # === 右列 ===
    if data.get("statsRight"):
        right_col["widgets"].append({
            "type": "stat-cards",
            "data": {"items": data["statsRight"], "cardsPerRow": 3},
            "height": "15%"
        })

    if data.get("chartRadar"):
        right_col["widgets"].append({
            "type": "chart",
            "title": data["chartRadar"].get("_title", "雷达分析"),
            "data": strip_title(data["chartRadar"]),
            "height": "43%"
        })

    if data.get("ranking") and data["ranking"].get("items"):
        right_col["widgets"].append({
            "type": "ranking",
            "title": data["ranking"].get("title", "排行榜"),
            "data": {"items": data["ranking"]["items"], "title": data["ranking"].get("title", "排行榜")},
            "height": "42%"
        })

    cfg["layout"]["rows"].append({
        "height": "100%",
        "cols": [left_col, mid_col, right_col]
    })

    return cfg


def strip_title(chart_cfg):
    """去除 _title 字段（它是渲染元信息，不是 ECharts 配置的一部分）"""
    c = {k: v for k, v in chart_cfg.items() if k != "_title"}
    return c


# ──────────────────── 通用数据格式（statCards / charts[] / tables[]）────────────────────

GENERIC_PALETTE_DARK = ["#49bcf7", "#eaff00", "#ea4d4d", "#395ee6",
                        "#27c24c", "#ff8c42", "#9b59b6", "#1abc9c"]
GENERIC_PALETTE_LIGHT = ["#395ee6", "#27c24c", "#ea4d4d", "#ff8c42",
                         "#9b59b6", "#1abc9c", "#e6a23c", "#49bcf7"]


def is_generic_shape(data):
    """检测通用数据格式: {title, statCards[], charts[], tables[]}

    这是 excel_to_json._from_generic 与 generic/data_center/lpl
    数据模板共用的结构。charts 必须是 list（dict 形态的 charts 属于
    源模板 injector 契约，不走布局引擎）。
    """
    if not isinstance(data, dict):
        return False
    if isinstance(data.get("statCards"), list) and data["statCards"]:
        return True
    if isinstance(data.get("charts"), list):
        return True
    if isinstance(data.get("tables"), list) and data["tables"]:
        return True
    return False


def generic_chart_to_echarts(chart, theme="dark"):
    """将通用图表描述 {id,type,title,data} 转为 ECharts option。

    支持的输入形态：
    1. data: [{name, value}, ...]                          单系列
    2. data: {categories:[...], series:[{name,data:[...]}]} 多系列
    3. chart 或 data 本身是 ECharts option（含 series/xAxis/yAxis/radar）→ 原样使用
    """
    if not isinstance(chart, dict):
        return None
    ctype = str(chart.get("type", "bar")).lower()
    payload = chart.get("data")

    # 形态 3：本身已是 ECharts option
    if isinstance(payload, dict) and has_chart_config(payload):
        return payload
    if has_chart_config(chart):
        return strip_title(chart)

    dark = (theme != "light")
    text_main = "#e6eef8" if dark else "#333333"
    text_sub = "#9fb3c8" if dark else "#666666"
    split_clr = "rgba(160,180,200,0.18)" if dark else "rgba(0,0,0,0.08)"
    palette = GENERIC_PALETTE_DARK if dark else GENERIC_PALETTE_LIGHT

    # 归一化为 categories + series_list（+ pie_data）
    categories = []
    series_list = []
    pie_data = None

    if isinstance(payload, list):
        for d in payload:
            if not isinstance(d, dict):
                continue
            categories.append(str(d.get("name", "")))
            v = d.get("value", 0)
            series_list.append(v)  # 暂存 values，下面统一组装
        values = series_list
        series_list = [{"name": chart.get("title", "系列1"), "data": values}]
        pie_data = [{"name": n, "value": v} for n, v in zip(categories, values)]
    elif isinstance(payload, dict):
        categories = [str(c) for c in (payload.get("categories") or payload.get("xData") or [])]
        raw_series = payload.get("series") or payload.get("seriesData") or []
        for i, s in enumerate(raw_series):
            if isinstance(s, dict):
                series_list.append({
                    "name": s.get("name", "系列%d" % (i + 1)),
                    "data": s.get("data", s.get("values", []))
                })
    else:
        return None

    if not series_list and pie_data is None:
        return None

    # ── 饼图 / 玫瑰图 ──
    if ctype in ("pie", "rose"):
        if pie_data is None:
            pie_data = [{"name": c, "value": v}
                        for c, v in zip(categories, series_list[0]["data"])]
        series_item = {
            "type": "pie",
            "radius": "62%",
            "center": ["50%", "46%"],
            "label": {"color": text_sub},
            "data": pie_data,
        }
        if ctype == "rose":
            series_item["roseType"] = "radius"
            series_item["radius"] = ["18%", "68%"]
        return {
            "color": palette,
            "tooltip": {"trigger": "item", "textStyle": {"color": text_main}},
            "legend": {"bottom": 0, "textStyle": {"color": text_sub}},
            "series": [series_item],
        }

    # ── 横向柱状图（排行语义：倒序 + 柱子右侧显示数值）──
    if ctype in ("hbar", "barh"):
        return {
            "color": palette,
            "tooltip": {"trigger": "axis", "textStyle": {"color": text_main}},
            "grid": {"left": "3%", "top": 30, "right": "10%", "bottom": "2%", "containLabel": True},
            "xAxis": {"type": "value",
                      "axisLabel": {"color": text_sub},
                      "splitLine": {"lineStyle": {"color": split_clr}}},
            "yAxis": {"type": "category", "data": categories, "inverse": True,
                      "axisLabel": {"color": text_sub}},
            "series": [{"name": s["name"], "type": "bar", "data": s["data"],
                        "barMaxWidth": 22,
                        "label": {"show": True, "position": "right", "color": text_sub},
                        "itemStyle": {"borderRadius": [0, 6, 6, 0]}}
                       for s in series_list],
        }

    # ── 柱状 / 折线 / 面积 / 散点 ──
    stype = {"line": "line", "area": "line", "scatter": "scatter"}.get(ctype, "bar")
    series = []
    for s in series_list:
        item = {"name": s["name"], "type": stype, "data": s["data"]}
        if stype == "line":
            item["smooth"] = True
            if ctype == "area":
                item["areaStyle"] = {"opacity": 0.25}
        elif stype == "bar":
            item["itemStyle"] = {"borderRadius": [6, 6, 0, 0]}
        series.append(item)

    option = {
        "color": palette,
        "tooltip": {"trigger": "axis", "textStyle": {"color": text_main}},
        "grid": {"left": "3%", "top": 34, "right": "4%", "bottom": "2%", "containLabel": True},
        "xAxis": {"type": "category", "data": categories,
                  "axisLabel": {"color": text_sub}},
        "yAxis": {"type": "value",
                  "axisLabel": {"color": text_sub},
                  "splitLine": {"lineStyle": {"color": split_clr}}},
        "series": series,
    }
    if len(series_list) > 1:
        option["legend"] = {"top": 0, "textStyle": {"color": text_sub}}
    return option


def convert_generic_to_layout(data, theme, title):
    """将通用格式 {title, statCards[], charts[], tables[]} 转换为布局配置"""
    cfg = {
        "title": title or data.get("title", "数据可视化大屏"),
        "theme": {"mode": theme},
        "layout": {
            "header": {"height": "80px"},
            "rowGap": 10,
            "widgetGap": 10,
            "rows": []
        }
    }
    rows = cfg["layout"]["rows"]

    stat_cards = [c for c in (data.get("statCards") or []) if isinstance(c, dict)]
    chart_cfgs = [c for c in (data.get("charts") or []) if isinstance(c, dict)]
    table_cfgs = [t for t in (data.get("tables") or []) if isinstance(t, dict)]

    # 中间区组件：图表 + 表格（保持用户书写顺序，图表在前）
    mid_widgets = []
    for ch in chart_cfgs:
        opt = generic_chart_to_echarts(ch, theme)
        if opt is None:
            continue
        mid_widgets.append({
            "type": "chart",
            "title": ch.get("title", ""),
            "data": opt
        })
    for t in table_cfgs:
        mid_widgets.append({
            "type": "table",
            "title": t.get("title", "数据明细"),
            "data": {"columns": t.get("headers", []), "rows": t.get("rows", [])}
        })

    # ── 行 1：统计卡片通栏 ──
    stat_h = 15 if stat_cards else 0
    if stat_cards:
        rows.append({
            "height": "%d%%" % stat_h,
            "cols": [{"flex": 1, "widgets": [{
                "type": "stat-cards",
                "title": False,
                "data": {"items": stat_cards,
                         "cardsPerRow": min(len(stat_cards), 6)}
            }]}]
        })

    # ── 中间区：每行最多 3 个组件，行数尽量少且均衡 ──
    remaining = 100 - stat_h
    if mid_widgets:
        nrows = (len(mid_widgets) + 2) // 3
        per_row = (len(mid_widgets) + nrows - 1) // nrows
        row_h = remaining / nrows
        for i in range(0, len(mid_widgets), per_row):
            chunk = mid_widgets[i:i + per_row]
            rows.append({
                "height": "%.1f%%" % row_h,
                "cols": [{"flex": 1, "widgets": [w]} for w in chunk]
            })
    elif not stat_cards:
        # 完全没有可识别组件 → 占位提示，避免空白页
        rows.append({
            "height": "100%",
            "cols": [{"flex": 1, "widgets": [{
                "type": "text",
                "data": {"content": "未识别到可视化数据，请检查数据格式"}
            }]}]
        })

    return cfg


# ──────────────────── 智能自动布局 ────────────────────

def auto_layout_from_data(raw_data, theme="dark", title=None):
    """
    智能自动布局: 根据数据字段自动推断组件类型和最优布局。
    适用于用户提供了松散 JSON 数据但未指定布局的场景。
    """
    widgets = []  # 所有发现的组件
    detected = {}  # 已检测的字段

    # 检测所有已知字段
    for key, value in raw_data.items():
        if key == "title":
            continue
        if key == "layout":
            continue
        if key == "theme":
            continue

        for field_name, detector, _ in WIDGET_DETECTORS:
            if key == field_name and detector(value):
                detected[key] = value
                break

    # 如果标准检测器未覆盖，尝试通用检测
    for key, value in raw_data.items():
        if key in detected or key in ("title", "layout", "theme"):
            continue

        if isinstance(value, list) and is_stat_cards(value):
            detected[key] = value
        elif isinstance(value, list) and is_summary_items(value):
            detected[key] = value
        elif isinstance(value, list) and is_gauges(value):
            detected[key] = value
        elif isinstance(value, dict) and has_chart_config(value):
            detected[key] = value
        elif isinstance(value, dict) and "items" in value and is_ranking_items(value["items"]):
            detected[key] = value

    # 构建三列布局
    left_widgets = []
    mid_widgets = []
    right_widgets = []

    for dkey, dval in detected.items():
        w = _classify_widget(dkey, dval)
        if w is None:
            continue

        # 智能分配列
        if dkey in ("statsLeft", "summaryItems"):
            left_widgets.append(w)
        elif dkey in ("statsRight"):
            right_widgets.append(w)
        elif dkey in ("chartLeft",):
            left_widgets.append(w)
        elif dkey in ("chartCenter1", "chartCenter2"):
            mid_widgets.append(w)
        elif dkey in ("chartRadar",):
            right_widgets.append(w)
        elif dkey in ("ranking",):
            right_widgets.append(w)
        elif w["type"] == "chart":
            # 未分类的图表 → 均衡分配
            if len(mid_widgets) <= len(left_widgets):
                mid_widgets.append(w)
            elif len(left_widgets) <= len(right_widgets):
                left_widgets.append(w)
            else:
                right_widgets.append(w)
        elif w["type"] == "stat-cards":
            if not left_widgets or left_widgets[-1]["type"] != "stat-cards":
                left_widgets.append(w)
            elif not right_widgets or right_widgets[-1]["type"] != "stat-cards":
                right_widgets.append(w)
            else:
                left_widgets.append(w)
        else:
            left_widgets.append(w)

    # 组装最终配置
    rows = []
    if left_widgets or mid_widgets or right_widgets:
        rows.append({
            "height": "100%",
            "cols": [
                {"flex": 3, "widgets": left_widgets},
                {"flex": 4, "widgets": mid_widgets},
                {"flex": 3, "widgets": right_widgets}
            ]
        })

    return {
        "title": title or raw_data.get("title", "数据可视化大屏"),
        "theme": {"mode": theme},
        "layout": {
            "header": {"height": "80px"},
            "rowGap": 10,
            "widgetGap": 10,
            "rows": rows
        }
    }


def _classify_widget(key, value):
    """将检测到的字段分类为组件配置"""
    if key in ("statsLeft", "statsRight") or (isinstance(value, list) and is_stat_cards(value)):
        return {"type": "stat-cards", "data": {"items": value, "cardsPerRow": 3}}
    if key == "summaryItems" or (isinstance(value, list) and is_summary_items(value)):
        return {"type": "summary-bars", "data": {"items": value}}
    if key == "bigNumber" or (isinstance(value, dict) and "label" in value and "value" in value and "series" not in value):
        return {"type": "big-number", "data": value}
    if key == "gauges" or (isinstance(value, list) and is_gauges(value)):
        return {"type": "gauges", "data": {"items": value}}
    if key in ("ranking",) or (isinstance(value, dict) and "items" in value and is_ranking_items(value.get("items", []))):
        items = value["items"] if isinstance(value, dict) else value
        return {"type": "ranking", "title": value.get("title", "排行榜") if isinstance(value, dict) else "排行榜",
                "data": {"items": items}}
    if isinstance(value, dict) and has_chart_config(value):
        title = value.get("_title", key)
        return {"type": "chart", "title": title, "data": strip_title(value)}
    # 通用: 如果看起来像 ECharts
    if isinstance(value, dict):
        return {"type": "chart", "data": value}
    return None


# ──────────────────── CLI ────────────────────

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python layout_builder.py <data.json> [--theme dark|light] [--title 'Title'] [--output layout.json]")
        print()
        print("  data.json  - 原始数据（旧 DASHBOARD_DATA 格式 或 新布局配置）")
        print("  --theme    - 主题: dark (默认) | light")
        print("  --title    - 大屏标题")
        print("  --output   - 输出布局配置 JSON（默认 stdout）")
        print()
        print("Examples:")
        print("  python layout_builder.py sample_dashboard.json --theme dark")
        print("  python layout_builder.py my_data.json --theme light --output layout.json")
        sys.exit(1)

    data_path = sys.argv[1]
    theme = "dark"
    title = None
    output_path = None

    i = 2
    while i < len(sys.argv):
        if sys.argv[i] == "--theme" and i + 1 < len(sys.argv):
            theme = sys.argv[i + 1]
            i += 2
        elif sys.argv[i] == "--title" and i + 1 < len(sys.argv):
            title = sys.argv[i + 1]
            i += 2
        elif sys.argv[i] == "--output" and i + 1 < len(sys.argv):
            output_path = sys.argv[i + 1]
            i += 2
        else:
            i += 1

    if not os.path.exists(data_path):
        print(f"ERROR: Data file not found: {data_path}", file=sys.stderr)
        sys.exit(1)

    with open(data_path, "r", encoding="utf-8") as f:
        raw_data = json.load(f)

    layout_cfg = build_layout_config(raw_data, theme, title)
    json_str = json.dumps(layout_cfg, ensure_ascii=False, indent=2)

    if output_path:
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(json_str)
        print(f"Layout config written to: {output_path}")
        print(f"  Title: {layout_cfg['title']}")
        print(f"  Theme: {layout_cfg['theme']['mode']}")
        row_count = len(layout_cfg["layout"]["rows"])
        widget_count = sum(
            len(col["widgets"])
            for row in layout_cfg["layout"]["rows"]
            for col in row["cols"]
        )
        print(f"  Rows: {row_count}, Widgets: {widget_count}")
    else:
        print(json_str)
