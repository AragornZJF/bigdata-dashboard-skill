#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Excel -> 大屏数据 JSON 的统一入口。

三种来源自动识别：
1. 本工具链 make_xlsx_template.py 生成的「填写模板」（含隐藏 _meta）-> 完整还原
2. 布局引擎历史 Excel 约定（config/stats_left/summary/bignumber/...）-> data_processor.parse_excel
3. 任意 Excel -> 启发式转为 statCards/charts/tables（布局引擎契约）

用法：
  python excel_to_json.py <file.xlsx> [output.json]
  或被 build_dashboard.py 直接 import 调用 convert(path)
"""
import json
import os
import sys
from openpyxl import load_workbook

LEGACY_SHEETS = {"config", "stats_left", "stats_right", "summary",
                 "bignumber", "gauges", "ranking"}


def convert(path):
    wb = load_workbook(path, data_only=True)
    names = set(wb.sheetnames)
    if "_meta" in names:
        return _from_template_meta(wb)
    if names & LEGACY_SHEETS:
        from data_processor import parse_excel
        return parse_excel(path)
    return _from_generic(wb, path)


def _from_template_meta(wb):
    from xlsx_to_json import set_path, maybe_json
    meta = []
    for row in wb["_meta"].iter_rows(min_row=2, values_only=True):
        if row[0] is None:
            continue
        meta.append((row[0], row[1], row[2], row[3] or ""))
    result = {}
    for path, kind, sheet, sub in meta:
        ws = wb[sheet]
        if kind == "scalar":
            for row in ws.iter_rows(min_row=2, values_only=True):
                if row[0] == path:
                    set_path(result, path, maybe_json(row[1]))
                    break
        elif kind == "objects":
            keys = [c.value for c in ws[1]]
            arr = []
            for r in range(2, ws.max_row + 1):
                obj = {}
                for ci, k in enumerate(keys, 1):
                    val = ws.cell(r, ci).value
                    if val is not None and val != "":
                        obj[k] = maybe_json(val)
                if obj:
                    arr.append(obj)
            set_path(result, path, arr)
        elif kind == "arrays":
            if sub == "scalar":
                arr = [maybe_json(ws.cell(r, 1).value) for r in range(2, ws.max_row + 1)
                       if ws.cell(r, 1).value not in (None, "")]
                set_path(result, path, arr)
            else:
                maxc = ws.max_column
                arr = []
                for r in range(2, ws.max_row + 1):
                    row = [ws.cell(r, c).value for c in range(1, maxc + 1)]
                    if all(v in (None, "") for v in row):
                        continue
                    arr.append([maybe_json(v) if v not in (None, "") else "" for v in row])
                set_path(result, path, arr)
        elif kind == "json":
            txt = ws["A1"].value
            try:
                set_path(result, path, json.loads(txt))
            except Exception:
                pass
    return result


def _is_num(v):
    return isinstance(v, (int, float)) and not isinstance(v, bool)


def _from_generic(wb, path):
    result = {"title": os.path.splitext(os.path.basename(path))[0],
              "statCards": [], "charts": [], "tables": []}
    stat_done = False  # 统计卡片只取第一个「2 列数值」sheet，其余同类 sheet 视为图表
    for name in wb.sheetnames:
        ws = wb[name]
        if ws.sheet_state != "visible":
            continue
        rows = [list(r) for r in ws.iter_rows(values_only=True)]
        rows = [r for r in rows if any(c is not None and c != "" for c in r)]
        if not rows:
            continue
        header = [("" if h is None else str(h)) for h in rows[0]]
        body = rows[1:]
        ncols = max(len(r) for r in rows)
        # 2 列 label/value（数值、行数不多）-> statCards（仅第一个此类 sheet）
        if (ncols == 2 and body and not stat_done and len(body) <= 10 and all(
                _is_num(r[1]) for r in body if len(r) > 1 and r[1] is not None)):
            for r in body:
                result["statCards"].append({"label": str(r[0]), "value": r[1]})
            stat_done = True
            continue
        # col0 文本 + col1 数值 -> bar chart
        if ncols >= 2 and body and all(len(r) > 1 for r in body):
            try_numeric = all((r[1] is None) or _is_num(r[1]) for r in body)
            if try_numeric and body[0][0] is not None:
                data = [{"name": str(r[0]), "value": (r[1] if r[1] is not None else 0)}
                        for r in body]
                result["charts"].append({"id": name[:16] or "chart",
                                         "type": "bar", "title": name, "data": data})
                continue
        # 其它 -> table
        result["tables"].append({"headers": header,
                                 "rows": [[("" if c is None else c) for c in r] for r in body]})
    return result


def main():
    if len(sys.argv) < 2:
        print("usage: excel_to_json.py <file.xlsx> [output.json]")
        sys.exit(1)
    src = sys.argv[1]
    out = sys.argv[2] if len(sys.argv) > 2 else os.path.splitext(src)[0] + ".json"
    data = convert(src)
    json.dump(data, open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print("written:", out)


if __name__ == "__main__":
    main()
