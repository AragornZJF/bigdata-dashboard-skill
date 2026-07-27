#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Generate a fillable Excel template from an example JSON data file.

Usage:
  python make_xlsx_template.py <example.json> [output.xlsx]

Produces a multi-sheet workbook:
  - 说明      : instructions + field map
  - 概览      : all scalar leaves (incl. flattened nested) as 字段/值
  - <field>   : one sheet per array field
                (objects -> columns by keys, lists-of-lists -> 列1..列N, scalars -> single column)
  - <field>   : complex nested dicts stored as JSON text in cell A1
A hidden "_meta" sheet records (path, kind, sheet, sub) for xlsx_to_json.py.
"""
import json
import sys
import os
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment
from openpyxl.utils import get_column_letter

HEADER_FILL = PatternFill("solid", fgColor="1F4E78")
HEADER_FONT = Font(color="FFFFFF", bold=True, size=11)
TITLE_FONT = Font(bold=True, size=12, color="1F4E78")
WRAP = Alignment(wrap_text=True, vertical="top")


def is_scalar(v):
    return isinstance(v, (str, int, float, bool)) or v is None


def all_scalar_leaves(d):
    if not isinstance(d, dict):
        return False
    for v in d.values():
        if isinstance(v, (dict, list)):
            return False
    return True


def main():
    if len(sys.argv) < 2:
        print("usage: make_xlsx_template.py <example.json> [output.xlsx]")
        sys.exit(1)
    src = sys.argv[1]
    data = json.load(open(src, encoding="utf-8"))
    out = sys.argv[2] if len(sys.argv) > 2 else os.path.splitext(src)[0] + ".xlsx"

    wb = Workbook()
    wb.remove(wb.active)
    meta = []  # (path, kind, sheet, sub)

    # ---- 概览 sheet (scalars) ----
    ws_over = wb.create_sheet("概览")
    ws_over.append(["字段", "值"])
    for c in ws_over[1]:
        c.fill = HEADER_FILL
        c.font = HEADER_FONT
    for k, v in data.items():
        if isinstance(v, dict) and all_scalar_leaves(v):
            for kk, vv in v.items():
                ws_over.append([k + "." + kk, "" if vv is None else vv])
                meta.append((k + "." + kk, "scalar", "概览", ""))
        elif is_scalar(v):
            ws_over.append([k, "" if v is None else v])
            meta.append((k, "scalar", "概览", ""))
    ws_over.column_dimensions["A"].width = 28
    ws_over.column_dimensions["B"].width = 42

    # ---- arrays and complex dicts ----
    for k, v in data.items():
        if is_scalar(v) or (isinstance(v, dict) and all_scalar_leaves(v)):
            continue
        if isinstance(v, list):
            sheet_name = k[:28]
            ws = wb.create_sheet(title=sheet_name[:31])
            if v and isinstance(v[0], dict):
                keys = []
                for o in v:
                    if isinstance(o, dict):
                        for kk in o:
                            if kk not in keys:
                                keys.append(kk)
                ws.append(keys)
                for c in ws[1]:
                    c.fill = HEADER_FILL
                    c.font = HEADER_FONT
                for o in v:
                    row_vals = []
                    for kk in keys:
                        val = o.get(kk, "") if isinstance(o, dict) else ""
                        if isinstance(val, (dict, list)):
                            val = json.dumps(val, ensure_ascii=False)
                        row_vals.append(val)
                    ws.append(row_vals)
                meta.append((k, "objects", sheet_name[:31], ""))
            elif v and isinstance(v[0], list):
                maxc = max(len(r) for r in v if isinstance(r, list))
                ws.append(["列" + str(i + 1) for i in range(maxc)])
                for c in ws[1]:
                    c.fill = HEADER_FILL
                    c.font = HEADER_FONT
                for r in v:
                    if isinstance(r, list):
                        ws.append(list(r) + [""] * (maxc - len(r)))
                meta.append((k, "arrays", sheet_name[:31], "list"))
            else:
                ws.append([k])
                for c in ws[1]:
                    c.fill = HEADER_FILL
                    c.font = HEADER_FONT
                for item in v:
                    ws.append([item])
                meta.append((k, "arrays", sheet_name[:31], "scalar"))
            _autofit(ws)
        elif isinstance(v, dict):
            sheet_name = k[:28]
            ws = wb.create_sheet(title=sheet_name[:31])
            ws["A1"] = json.dumps(v, ensure_ascii=False)
            ws["A1"].alignment = WRAP
            ws.column_dimensions["A"].width = 100
            ws.row_dimensions[1].height = 320
            meta.append((k, "json", sheet_name[:31], ""))

    # ---- 说明 sheet (first) ----
    ws_info = wb.create_sheet("说明", 0)
    ws_info["A1"] = "数据填写说明"
    ws_info["A1"].font = TITLE_FONT
    lines = [
        "1. 本工作簿由数据大屏模板生成，用于填写大屏数据。",
        "2. 「概览」表：填写所有标量字段（标题、标签、数值等）。",
        "3. 各「字段」表：填写数组类数据（对象数组按列、数值数组按行）。",
        "4. 标记为 JSON 文本的表：直接编辑单元格内的 JSON 对象。",
        "5. 填写完成后，用 xlsx_to_json.py 转回 JSON，再交给 build_dashboard.py 生成大屏。",
        "",
        "字段对照：",
    ]
    r = 3
    for c in lines:
        ws_info.cell(r, 1, c)
        r += 1
    for path, kind, sheet, sub in meta:
        ws_info.cell(r, 1, f"{path}  ->  [{sheet}] ({kind})")
        r += 1
    ws_info.column_dimensions["A"].width = 72

    # ---- _meta sheet (hidden) ----
    ws_meta = wb.create_sheet("_meta")
    ws_meta.append(["path", "kind", "sheet", "sub"])
    for m in meta:
        ws_meta.append(list(m))
    ws_meta.sheet_state = "hidden"

    wb.save(out)
    print("written:", out)
    print("sheets:", [s.title for s in wb.worksheets])


def _autofit(ws, maxw=42):
    for col in ws.columns:
        m = 0
        letter = get_column_letter(col[0].column)
        for cell in col:
            if cell.value is not None:
                m = max(m, len(str(cell.value)))
        ws.column_dimensions[letter].width = min(max(m + 2, 10), maxw)


if __name__ == "__main__":
    main()
