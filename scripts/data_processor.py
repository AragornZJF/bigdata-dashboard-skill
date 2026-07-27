"""
数字大屏数据处理脚本
支持 Excel (.xlsx) 和 JSON 数据文件解析，输出 DASHBOARD_DATA 格式。
"""
import json
import sys
import os

def parse_excel(filepath):
    """解析 Excel 文件，按 Sheet 名映射为数据结构"""
    try:
        import openpyxl
    except ImportError:
        print("ERROR: openpyxl not installed. Run: pip install openpyxl", file=sys.stderr)
        sys.exit(1)

    wb = openpyxl.load_workbook(filepath, data_only=True)
    result = {"title": "数据可视化大屏", "statsLeft": [], "statsRight": [],
              "summaryItems": [], "bigNumber": {}, "gauges": [],
              "chartLeft": {}, "chartCenter1": {}, "chartCenter2": {},
              "chartRadar": {}, "ranking": {"title": "排行榜", "items": []}}

    sheet_map = {
        "title": "config",
        "statsLeft": "stats_left",
        "statsRight": "stats_right",
        "summaryItems": "summary",
        "bigNumber": "bignumber",
        "gauges": "gauges",
        "ranking": "ranking"
    }

    for key, sheet_name in sheet_map.items():
        if sheet_name not in wb.sheetnames:
            continue
        ws = wb[sheet_name]
        rows = list(ws.iter_rows(min_row=2, values_only=True))
        if not rows:
            continue

        if key == "title":
            result["title"] = str(rows[0][0]) if rows[0] else "数据可视化大屏"
        elif key == "statsLeft" or key == "statsRight":
            result[key] = [
                {"label": str(r[0] or ""), "value": int(r[1] or 0), "unit": str(r[2] or "个")}
                for r in rows if r[0]
            ]
        elif key == "summaryItems":
            result[key] = [
                {"label": str(r[0] or ""), "value": int(r[1] or 0), "unit": str(r[2] or ""),
                 "trendLabel": str(r[3] or "同比"), "trend": int(r[4] or 0),
                 "trendUp": str(r[5] or "是").strip() in ("是", "1", "true", "True", "yes"),
                 "pct": int(r[6] or 50)}
                for r in rows if r[0]
            ]
        elif key == "bigNumber":
            r = rows[0]
            result[key] = {"label": str(r[0] or "业绩总览"), "value": int(r[1] or 0)}
        elif key == "gauges":
            result[key] = [
                {"label": str(r[0] or ""), "value": min(100, max(0, int(r[1] or 0)))}
                for r in rows if r[0]
            ]
        elif key == "ranking":
            result[key]["title"] = str(rows[0][0] or "排行榜") if rows and rows[0] else "排行榜"
            result[key]["items"] = [
                {"name": str(r[1] or ""), "value": int(r[2] or 0)}
                for r in rows if len(r) > 2 and r[1]
            ]

    return result


def parse_json(filepath):
    """解析 JSON 数据文件"""
    with open(filepath, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data


def auto_parse(filepath):
    """根据扩展名自动选择解析器"""
    ext = os.path.splitext(filepath)[1].lower()
    if ext in (".xlsx", ".xls"):
        return parse_excel(filepath)
    elif ext == ".json":
        return parse_json(filepath)
    else:
        print(f"ERROR: Unsupported file format: {ext}", file=sys.stderr)
        sys.exit(1)


def generate_sample_json(output_path):
    """生成示例 JSON 数据文件"""
    sample = {
        "title": "大数据可视化系统数据分析通用模版",
        "statsLeft": [
            {"label": "用户总数", "value": 200, "unit": "个"},
            {"label": "设备在线", "value": 1200, "unit": "台"},
            {"label": "合作企业", "value": 150, "unit": "家"}
        ],
        "statsRight": [
            {"label": "项目数量", "value": 251, "unit": "项"},
            {"label": "覆盖城市", "value": 34, "unit": "座"},
            {"label": "服务类型", "value": 150, "unit": "项"}
        ],
        "summaryItems": [
            {"label": "新增用户", "value": 24356, "unit": "人", "trendLabel": "同比", "trend": 34, "trendUp": True, "pct": 80},
            {"label": "处理工单", "value": 243567, "unit": "件", "trendLabel": "环比", "trend": 12, "trendUp": False, "pct": 65},
            {"label": "完成交易", "value": 20356, "unit": "笔", "trendLabel": "同比", "trend": 50, "trendUp": True, "pct": 45}
        ],
        "bigNumber": {"label": "业绩总览", "value": 1938272},
        "gauges": [
            {"label": "CPU使用率", "value": 80},
            {"label": "内存使用率", "value": 73},
            {"label": "磁盘使用率", "value": 30}
        ],
        "ranking": {
            "title": "排行榜",
            "items": [
                {"name": "标题名称标题名称标题名称", "value": 500},
                {"name": "标题名称B", "value": 400},
                {"name": "标题名称C", "value": 180},
                {"name": "标题名称D", "value": 160},
                {"name": "标题名称E", "value": 140}
            ]
        },
        "chartCenter1": {
            "_title": "",
            "tooltip": {"trigger": "axis", "axisPointer": {"type": "shadow"}},
            "legend": {"data": ["字段1", "字段2", "字段3"], "x": "center", "y": "0",
                       "textStyle": {"color": "rgba(255,255,255,.5)"}},
            "grid": {"left": "0", "top": "30", "right": "15", "bottom": "0", "containLabel": True},
            "xAxis": {"type": "category",
                      "data": ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"],
                      "axisLabel": {"color": "rgba(255,255,255,.6)"}},
            "yAxis": {"type": "value", "splitLine": {"lineStyle": {"color": "rgba(255,255,255,.05)"}},
                      "axisLabel": {"color": "rgba(255,255,255,.6)"}},
            "series": [
                {"name": "字段1", "type": "bar", "barWidth": "15%", "itemStyle": {"barBorderRadius": 11,
                 "color": {"type": "linear", "x": 0, "y": 0, "x2": 0, "y2": 1,
                           "colorStops": [{"offset": 0, "color": "#8bd46e"}, {"offset": 1, "color": "#03b48e"}]}},
                 "data": [123,154,234,321,120,390,634,123,154,234,321,108]},
                {"name": "字段2", "type": "bar", "barWidth": "15%", "itemStyle": {"barBorderRadius": 11,
                 "color": {"type": "linear", "x": 0, "y": 0, "x2": 0, "y2": 1,
                           "colorStops": [{"offset": 0, "color": "#3893e5"}, {"offset": 1, "color": "#248ff7"}]}},
                 "data": [63,194,234,321,278,110,534,63,194,234,321,278]},
                {"name": "字段3", "type": "bar", "barWidth": "15%", "itemStyle": {"barBorderRadius": 11,
                 "color": {"type": "linear", "x": 0, "y": 0, "x2": 0, "y2": 1,
                           "colorStops": [{"offset": 0, "color": "#43cadd"}, {"offset": 1, "color": "#0097c9"}]}},
                 "data": [23,354,334,221,178,190,234,354,334,221,178,190]}
            ]
        },
        "chartCenter2": {
            "_title": "数据趋势",
            "tooltip": {"trigger": "axis"},
            "legend": {"data": ["字段1", "字段2"], "top": 0, "textStyle": {"color": "rgba(255,255,255,.6)"}},
            "grid": {"left": "0", "top": "30", "right": "20", "bottom": "-10", "containLabel": True},
            "xAxis": {"type": "category", "boundaryGap": False,
                      "data": ["8:00","9:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00","20:00","21:00","22:00"],
                      "axisLabel": {"color": "rgba(255,255,255,.6)"}},
            "yAxis": {"type": "value", "splitLine": {"lineStyle": {"color": "rgba(255,255,255,.1)"}},
                      "axisLabel": {"color": "rgba(255,255,255,.6)"}},
            "series": [
                {"name": "字段1", "type": "line", "smooth": True, "symbol": "circle", "symbolSize": 5,
                 "showSymbol": False, "lineStyle": {"color": "rgba(228,228,126,1)", "width": 2},
                 "areaStyle": {"color": {"type": "linear", "x": 0, "y": 0, "x2": 0, "y2": 1,
                              "colorStops": [{"offset": 0, "color": "rgba(228,228,126,.8)"},
                                             {"offset": 1, "color": "rgba(228,228,126,0.1)"}]}},
                 "itemStyle": {"color": "#dddc6b", "borderColor": "rgba(221,220,107,.1)", "borderWidth": 12},
                 "data": [600,200,600,200,400,200,400,300,400,300,400,300,200,400,200]},
                {"name": "字段2", "type": "line", "smooth": True, "symbol": "circle", "symbolSize": 5,
                 "showSymbol": False, "lineStyle": {"color": "rgba(255,128,128,1)", "width": 2},
                 "areaStyle": {"color": {"type": "linear", "x": 0, "y": 0, "x2": 0, "y2": 1,
                              "colorStops": [{"offset": 0, "color": "rgba(255,128,128,.8)"},
                                             {"offset": 1, "color": "rgba(255,128,128,.1)"}]}},
                 "itemStyle": {"color": "#dddc6b", "borderColor": "rgba(221,220,107,.1)", "borderWidth": 12},
                 "data": [300,100,300,400,300,400,300,600,200,400,200,400,100,300,400]}
            ]
        }
    }
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(sample, f, ensure_ascii=False, indent=2)
    print(f"Sample JSON written to: {output_path}")
    return sample


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python data_processor.py <file.xlsx|file.json> [--sample]")
        print("  file.xlsx  - Parse Excel file and output JSON to stdout")
        print("  file.json  - Validate and output JSON to stdout")
        print("  --sample <output.json> - Generate sample JSON data")
        sys.exit(1)

    if sys.argv[1] == "--sample":
        output = sys.argv[2] if len(sys.argv) > 2 else "sample_dashboard.json"
        generate_sample_json(output)
    else:
        filepath = sys.argv[1]
        if not os.path.exists(filepath):
            print(f"ERROR: File not found: {filepath}", file=sys.stderr)
            sys.exit(1)
        data = auto_parse(filepath)
        print(json.dumps(data, ensure_ascii=False, indent=2))
