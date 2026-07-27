"""
数字大屏构建脚本

将 JSON 数据注入 HTML 模板，生成完整的大屏页面。

两种模式：
1. 布局配置模式（默认）: 使用 layout_builder 将数据转为布局配置，注入 renderer.html
   支持旧 DASHBOARD_DATA 自动升级 + 新布局配置直接渲染
2. 源模板模式（--template）: 从 BigDataView_ 118 个模板中选一个，适配并注入数据
"""
import json
import sys
import os
import re
import base64
import shutil
from pathlib import Path

SKILL_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# 渲染引擎路径（默认模式 + --template 模式共用）
RENDERER_PATH = os.path.join(SKILL_DIR, "assets", "renderer.html")

# 模板注册表 + 骨架目录
REGISTRY_PATH = os.path.join(SKILL_DIR, "assets", "templates", "registry.json")
SKELETONS_DIR = os.path.join(SKILL_DIR, "assets", "templates", "skeletons")
CUSTOM_DIR = os.path.join(SKILL_DIR, "assets", "templates", "custom")
# 数据填写模板目录（给用户填的业务数据样本，与 skeletons 一一对应）
DATA_TEMPLATES_DIR = os.path.join(SKILL_DIR, "assets", "templates", "data")

# 默认源模板目录（空 = 仅使用骨架内置源）
DEFAULT_SOURCE = ""


def find_source_templates(source_dir):
    """扫描源模板目录，返回所有可用模板（过滤隐藏目录）"""
    sd = Path(source_dir)
    if not sd.exists():
        return []
    return sorted([d.name for d in sd.iterdir() if d.is_dir() and not d.name.startswith('.')])


def _load_registry():
    """加载模板注册表（模板元数据列表）"""
    try:
        with open(REGISTRY_PATH, "r", encoding="utf-8") as f:
            return json.load(f).get("templates", [])
    except Exception:
        return []


def _resolve_template_ref(name):
    """将用户传入的模板名/ID/英文名解析为 (source_dir_name, skeleton_dir_name)。

    source_dir_name   : 源模板在 BigDataView_/web 下的中文目录名（用于定位源文件）
    skeleton_dir_name : assets/templates/skeletons 下的【英文】骨架目录名
    """
    reg = _load_registry()
    name_l = (name or "").strip().lower()
    # pass 1: 精确匹配 id / name / dir / skeleton
    for e in reg:
        for k in ("id", "name", "dir", "skeleton"):
            v = str(e.get(k, ""))
            if v and v.lower() == name_l:
                return e.get("dir") or e.get("name"), e.get("skeleton") or e.get("dir")
    # pass 2: 子串匹配（兼容用户只输入部分名称）
    for e in reg:
        for k in ("id", "name", "dir", "skeleton"):
            v = str(e.get(k, ""))
            if v and name_l and name_l in v.lower():
                return e.get("dir") or e.get("name"), e.get("skeleton") or e.get("dir")
    # 兜底：当作源目录名直接使用
    return name, name


def build_dashboard(data_json_path, theme="dark", output_path=None, title=None,
                    template_name=None, source_dir=None):
    """
    主构建函数

    Args:
        data_json_path: JSON 数据文件路径
        theme: "dark" / "light"（布局引擎主题）
        output_path: 输出 HTML 路径
        title: 大屏标题
        template_name: 源模板名称/ID/英文名（如 "skeleton_weather" 或 "092"）
        source_dir: 源模板目录（默认 BigDataView_/web/）
    """
    # 支持直接传入 Excel(.xlsx/.xls) 或 JSON 数据文件
    ext = os.path.splitext(data_json_path)[1].lower()
    if ext in (".xlsx", ".xls"):
        from excel_to_json import convert
        data = convert(data_json_path)
    else:
        with open(data_json_path, "r", encoding="utf-8") as f:
            data = json.load(f)

    if title:
        data["title"] = title

    if template_name:
        return _build_source_template(data, template_name, source_dir, output_path)
    else:
        return _build_layout_mode(data, data_json_path, theme, output_path)


def _resolve_asset_path(ref_path, *search_dirs):
    """将相对路径解析为搜索目录列表下的绝对路径（按顺序匹配第一个命中）"""
    if not ref_path or ref_path.startswith(('http://', 'https://', '//', 'data:')):
        return None

    # 去掉开头的 ./ 或 ../
    clean = ref_path.strip().lstrip('./').lstrip('../')
    for source_template_dir in search_dirs:
        if not source_template_dir:
            continue
        # 在当前搜索目录中直接拼路径
        candidate = os.path.join(source_template_dir, clean)
        if os.path.isfile(candidate):
            return candidate
        # 递归搜索子目录
        for root, dirs, files in os.walk(source_template_dir):
            for f in files:
                full = os.path.join(root, f)
                rel = os.path.relpath(full, source_template_dir).replace('\\', '/')
                if rel.endswith(clean):
                    return full
    return None


def _get_mime_type(filepath):
    """根据扩展名返回 MIME type"""
    ext = os.path.splitext(filepath)[1].lower()
    return {
        '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
        '.gif': 'image/gif', '.svg': 'image/svg+xml', '.webp': 'image/webp',
        '.ico': 'image/x-icon', '.bmp': 'image/bmp', '.woff': 'font/woff',
        '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.eot': 'application/vnd.ms-fontobject',
    }.get(ext, 'application/octet-stream')


def _inline_assets(html, *search_dirs):
    """
    将 HTML 中所有外部资源内联：
    - <link href="...css"> → <style>...</style>
    - <script src="...js">  → <script>...</script>
    - <img src="...png/jpg/..."> → <img src="data:image/...;base64,...">
    - CSS url(...) 引用 → data: URI
    search_dirs: 多个搜索目录（按顺序匹配），用于支持「骨架目录 + --source-dir」组合
    返回 (inlined_html, stats)
    """
    stats = {"css": 0, "js": 0, "image": 0, "font": 0}

    # --- 1. 内联 CSS <link> ---
    def inline_link(m):
        href = m.group(1)
        abs_path = _resolve_asset_path(href, *search_dirs)
        if abs_path and href.lower().endswith('.css'):
            try:
                with open(abs_path, 'r', encoding='utf-8', errors='ignore') as f:
                    css_content = f.read()
                stats["css"] += 1
                print(f"  [inline css] {href} ({len(css_content)} bytes)")
                return f'<style>\n/* inlined from {href} */\n{css_content}\n</style>'
            except Exception as e:
                print(f"  [WARN] Failed to inline CSS {href}: {e}")
        return m.group(0)

    html = re.sub(r'<link[^>]*href=["\']([^"\']+)["\'][^>]*/?>', inline_link, html)

    # --- 2. 内联 JS <script src> ---
    def inline_script(m):
        src = m.group(1)
        abs_path = _resolve_asset_path(src, *search_dirs)
        if abs_path:
            try:
                with open(abs_path, 'r', encoding='utf-8', errors='ignore') as f:
                    js_content = f.read()
                stats["js"] += 1
                print(f"  [inline js] {src} ({len(js_content)} bytes)")
                # 关键：JS 文件内部可能包含字面量 </script>（如 echarts.js 中的字符串），
                # 直接内联会让 HTML 解析器提前闭合 <script> 标签，破坏整段 JS，
                # 导致 echarts 等库"未定义"。转义为 <\/script>（JS 中 \/ 等价于 /，
                # 但 HTML 解析器不再将其视为标签结束）。
                js_content = re.sub(r'</script', r'<\\/script', js_content, flags=re.IGNORECASE)
                # 保留其他属性（如 id, type），只替换 src
                tag_open = m.group(0).replace(f'src="{src}"', '').replace(f"src='{src}'", '')
                # 清理空的 script 标签属性
                tag_open = re.sub(r'<script\s+>', '<script>', tag_open)
                return f'{tag_open}\n/* inlined from {src} */\n{js_content}\n</script>'
            except Exception as e:
                print(f"  [WARN] Failed to inline JS {src}: {e}")
        return m.group(0)

    html = re.sub(r'<script[^>]*src=["\']([^"\']+)["\'][^>]*>', inline_script, html)

    # --- 3. 内联 <img src> ---
    def inline_img(m):
        src = m.group(1)
        abs_path = _resolve_asset_path(src, *search_dirs)
        if abs_path:
            try:
                with open(abs_path, 'rb') as f:
                    img_data = f.read()
                mime = _get_mime_type(abs_path)
                b64 = base64.b64encode(img_data).decode('ascii')
                stats["image"] += 1
                print(f"  [inline img] {src} ({len(img_data)} bytes -> {mime})")
                return m.group(0).replace(src, f'data:{mime};base64,{b64}')
            except Exception as e:
                print(f"  [WARN] Failed to inline image {src}: {e}")
        return m.group(0)

    html = re.sub(r'<img[^>]+src=["\']([^"\']+)["\']', inline_img, html)

    # --- 4. 内联 CSS 中的 url() 引用 ---
    def inline_css_url(m):
        url_path = m.group(1).strip().strip('"').strip("'")
        abs_path = _resolve_asset_path(url_path, *search_dirs)
        if abs_path:
            try:
                with open(abs_path, 'rb') as f:
                    data = f.read()
                mime = _get_mime_type(abs_path)
                b64 = base64.b64encode(data).decode('ascii')
                key = "font" if mime.startswith('font/') else "image"
                stats[key] += 1
                print(f"  [inline css-url] {url_path} ({len(data)} bytes)")
                return f'url(data:{mime};base64,{b64})'
            except Exception as e:
                print(f"  [WARN] Failed to inline CSS url {url_path}: {e}")
        else:
            # 源模板缺失该资源（作者遗漏等）：回退为 1x1 透明像素，
            # 避免输出文件中残留相对路径导致 404。
            print(f"  [WARN] CSS url 资源不存在，回退透明像素: {url_path}")
            TRANSPARENT_PX = ("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M8AAAMBAQDJ/pLvAAAAAElFTkSuQmCC")
            return f'url({TRANSPARENT_PX})'

    # 处理 <style> 块内的 url()
    def inline_style_block(m):
        style_content = m.group(1)
        new_style = re.sub(r'url\(\s*([^)]+)\s*\)', inline_css_url, style_content)
        return f'<style>{new_style}</style>'

    html = re.sub(r'<style>([\s\S]*?)</style>', inline_style_block, html)

    # --- 5. 内联 inline style="..." 属性中的 url() ---
    def inline_style_attr(m):
        full_match = m.group(0)
        has_url = re.search(r'url\(\s*([^)]+)\s*\)', full_match)
        if not has_url:
            return full_match
        new_style = re.sub(r'url\(\s*([^)]+)\s*\)', inline_css_url, full_match)
        return new_style

    html = re.sub(r'style="([^"]*)"', inline_style_attr, html)
    html = re.sub(r"style='([^']*)'", inline_style_attr, html)

    return html, stats


def _map_generic_to_template(data, template_name):
    """将通用 DASHBOARD_DATA 映射为模板专用格式"""
    config_path = os.path.join(SKELETONS_DIR, template_name, "template_config.json")
    if not os.path.exists(config_path):
        return data

    with open(config_path, "r", encoding="utf-8") as f:
        cfg = json.load(f)

    dp = cfg.get("dataPoints", {})
    if not dp:
        return data

    mapped = {}
    mapped["title"] = data.get("title", "数据可视化大屏")

    # 映射 statCards
    if "statCards" in dp and "statCards" in data:
        src = data["statCards"]
        mapped["statCards"] = []
        for i, tpl in enumerate(dp["statCards"]):
            item = {"label": "", "value": ""}
            if i < len(src):
                s = src[i]
                item["label"] = s.get("label", s.get("title", tpl.get("labelSel", "")))
                item["value"] = str(s.get("value", s.get("count", "")))
            mapped["statCards"].append(item)

    # 映射 navItems
    if "navItems" in dp and "navItems" in data:
        src = data["navItems"]
        mapped["navItems"] = []
        for i, tpl in enumerate(dp["navItems"]):
            item = {"label": "", "value": ""}
            if i < len(src):
                s = src[i]
                item["label"] = s.get("label", s.get("title", ""))
                item["value"] = str(s.get("value", s.get("count", "")))
            mapped["navItems"].append(item)

    # 映射 switchCount
    if "switchCount" in dp:
        sc = data.get("switchCount", data.get("summary"))
        if isinstance(sc, dict):
            mapped["switchCount"] = {"value": str(sc.get("value", ""))}
        elif sc:
            mapped["switchCount"] = {"value": str(sc)}
        else:
            mapped["switchCount"] = {"value": "0"}

    # 映射 environment
    if "environment" in dp:
        src = data.get("environment", data.get("indicators", []))
        mapped["environment"] = []
        for i, tpl in enumerate(dp["environment"]):
            item = {"label": tpl.get("label", ""), "value": ""}
            if isinstance(src, dict):
                label_lower = tpl.get("label", "").lower()
                for k in ["温度", "temperature", "湿度", "humidity", "信号", "signal", "光线", "light"]:
                    if k in src:
                        item["value"] = str(src[k])
                        break
            elif i < len(src):
                item["value"] = str(src[i]) if not isinstance(src[i], dict) else str(src[i].get("value", ""))
            mapped["environment"].append(item)

    # 映射 table
    if "table" in dp:
        src = data.get("table", data.get("tables", []))
        rows = []
        if isinstance(src, dict) and "rows" in src:
            rows = src["rows"]
        elif isinstance(src, list) and len(src) > 0:
            if isinstance(src[0], dict) and "rows" in src[0]:
                rows = src[0]["rows"]
            elif isinstance(src[0], dict) and "cells" in src[0]:
                rows = src
            elif isinstance(src[0], list):
                rows = [{"cells": r} for r in src]
        mapped["table"] = {"rows": rows}

    # 映射 charts
    if "charts" in dp:
        mapped["charts"] = {}
        src_charts = data.get("charts", {})

        if "pie" in dp["charts"]:
            pie_src = src_charts.get("pie", src_charts.get("chart_1"))
            if isinstance(pie_src, dict) and "data" in pie_src:
                mapped["charts"]["pie"] = pie_src
            elif isinstance(data, dict):
                # 尝试从 statCards 或其他位置提取
                mapped["charts"]["pie"] = {"data": [{"name": "正常", "value": 85}, {"name": "故障", "value": 15}]}

        if "barLine" in dp["charts"]:
            bl_src = src_charts.get("barLine", src_charts.get("chart_2"))
            if isinstance(bl_src, dict):
                mapped["charts"]["barLine"] = bl_src
            else:
                mapped["charts"]["barLine"] = {"xAxis": [], "yAxis": [[]], "lines": [[]]}

        if "map" in dp["charts"]:
            map_src = src_charts.get("map", src_charts.get("chart_3"))
            if isinstance(map_src, dict) and "data" in map_src:
                mapped["charts"]["map"] = map_src
            else:
                mapped["charts"]["map"] = {"data": []}

        if "hbar" in dp["charts"]:
            hb_src = src_charts.get("hbar", src_charts.get("chart_4"))
            if isinstance(hb_src, dict):
                mapped["charts"]["hbar"] = hb_src
            else:
                mapped["charts"]["hbar"] = {"names": [], "values": [], "valdata": []}

    return mapped


def _find_entry_html(template_path, template_name=None):
    """在模板目录中查找入口 HTML 文件

    优先级:
    1. template_config.json 中的 entryFile 字段
    2. 根目录 index.html
    3. 递归搜索 index.html
    4. 根目录下的任意 .html 文件（如 sanlian.html）
    5. 递归搜索任意 .html 文件
    """
    # 1. 检查 template_config.json 中的 entryFile
    config_path = os.path.join(SKELETONS_DIR, template_name or "", "template_config.json")
    if template_name and os.path.exists(config_path):
        try:
            with open(config_path, "r", encoding="utf-8") as f:
                cfg = json.load(f)
            entry = cfg.get("entryFile")
            if entry:
                candidate = template_path / entry
                if candidate.exists():
                    return candidate
                # 搜索子目录
                for p in template_path.rglob(entry):
                    if p.is_file():
                        return p
        except Exception:
            pass

    # 2. 根目录 index.html
    root_idx = template_path / "index.html"
    if root_idx.exists():
        return root_idx

    # 3. 递归搜索 index.html
    for p in template_path.rglob("index.html"):
        if p.is_file():
            return p

    # 4. 根目录下任意 .html 文件
    html_files = list(template_path.glob("*.html"))
    if html_files:
        return html_files[0]

    # 5. 递归搜索任意 .html 文件
    for p in template_path.rglob("*.html"):
        if p.is_file():
            return p

    return None


def _build_source_template(data, template_name, source_dir, output_path):
    """模式2：适配源模板并注入数据 + 资产内联"""
    from template_adapter import TemplateAdapter

    adapter = TemplateAdapter(source_dir)
    # 解析出「源目录中文名」与「英文骨架目录名」
    source_name, skeleton_dir_name = _resolve_template_ref(template_name)
    template_path = adapter.find_template(source_name)

    if not template_path:
        # 回退：尝试骨架目录自带的 HTML（index.html 或 skeleton.html）
        skeleton_dir = Path(SKELETONS_DIR) / skeleton_dir_name
        if skeleton_dir.exists():
            # _find_entry_html 会搜索 index.html → *.html
            template_path = skeleton_dir
            print(f"  使用骨架自带源: {skeleton_dir.name}")
        else:
            available = find_source_templates(source_dir)
            print(f"模板 '{template_name}' 未找到。可用模板:")
            for t in available[:20]:
                print(f"  - {t}")
            if len(available) > 20:
                print(f"  ... 共 {len(available)} 个模板")
            sys.exit(1)

    print(f"使用源模板: {template_path.name}")

    # 查找入口 HTML（支持 index.html / sanlian.html 等）
    html_path = _find_entry_html(template_path, skeleton_dir_name)
    if not html_path:
        print(f"ERROR: 模板 {template_path.name} 中未找到 HTML 文件")
        sys.exit(1)

    print(f"  HTML: {html_path.relative_to(template_path)}")

    # 读取源 HTML
    skeleton = html_path.read_text(encoding='utf-8', errors='ignore')

    # 注入标题
    title_str = data.get("title", template_path.name)
    skeleton = skeleton.replace("{{title}}", title_str)
    skeleton = skeleton.replace("{{TITLE}}", title_str)

    # 注入数据占位符（布局引擎型模板如 LPL 在 <script type="application/json"> 里用）
    dashboard_json = json.dumps(data, ensure_ascii=False)
    if "/* DATA_PLACEHOLDER */" in skeleton:
        skeleton = skeleton.replace("/* DATA_PLACEHOLDER */", dashboard_json)
        print("  已注入数据: 替换 /* DATA_PLACEHOLDER */")

    # 移除死链 CDN 引用（如 echarts.baidu.com 已不可用）
    skeleton = re.sub(
        r'<script[^>]*src=["\']https?://[^"\']*(?:echarts\.baidu\.com|echarts\.baidu)[^"\']*["\'][^>]*>\s*</script>',
        '', skeleton, flags=re.IGNORECASE
    )

    # 检查是否有模板专用注入器
    injector_path = os.path.join(SKELETONS_DIR, skeleton_dir_name, "injector.js")
    has_injector = os.path.exists(injector_path)
    if has_injector:
        with open(injector_path, "r", encoding="utf-8") as f:
            injector_code = f.read()
        print(f"  使用模板注入器: {injector_path}")

    # 适配模板（用于提取元数据）
    try:
        result = adapter.adapt(template_path)
        theme_css = result.get("theme_css", "")
    except Exception as e:
        print(f"  适配器跳过（使用原始 HTML）: {e}")
        result = {}
        theme_css = ""

    # 注入主题 CSS
    if theme_css:
        skeleton = skeleton.replace("</head>", f"<style>\n{theme_css}\n</style>\n</head>")

    # === 关键：内联所有外部资源 ===
    print("内联外部资源...")
    # 搜索目录顺序：先骨架目录（自带源模板），再 --source-dir（布局引擎型模板依赖）
    search_dirs = [str(template_path)]
    if source_dir and os.path.isdir(source_dir) and Path(source_dir) != template_path:
        search_dirs.append(str(source_dir))
    skeleton, inline_stats = _inline_assets(skeleton, *search_dirs)
    print(f"  内联完成: CSS={inline_stats['css']}, JS={inline_stats['js']}, "
          f"Image={inline_stats['image']}, Font={inline_stats['font']}")

    # === 数据注入：替换 office_efficiency_data.js 内容 ===
    # 查找内联的 data.js 块并将内容替换为 DASHBOARD_DATA 引用
    data_file_pattern = r'(/\*\s*inlined from .*?office_efficiency_data\.js\s*\*/)[\s\S]*?var\s+data\s*=\s*\{([\s\S]*?)\};'
    data_file_match = re.search(data_file_pattern, skeleton, re.IGNORECASE)

    if data_file_match and has_injector:
        # 保留原数据作为 JSON fallback
        orig_data_json = "{" + data_file_match.group(2) + "}"
        new_block = (
            data_file_match.group(1) + "\n"
            "/* DASHBOARD_DATA injected */\n"
            "var data = window.DASHBOARD_DATA || {};\n"
            "window._FALLBACK = " + orig_data_json + ";\n"
            "if (!data || !data.code) { data = window._FALLBACK; }\n"
        )
        # 替换整个从 inlined 注释到 var data={...}; 的块
        skeleton = skeleton.replace(data_file_match.group(0), new_block)
        print(f"  已注入数据: 替换 office_efficiency_data.js 内容")

    # 在 </body> 前插入 DASHBOARD_DATA + 注入器脚本
    if has_injector:
        injector_block = f'\n<script>\n/* 模板注入器: {template_path.name} */\nwindow.DASHBOARD_DATA = {dashboard_json};\n{injector_code}\n</script>\n'
    else:
        injector_block = f'\n<script>\nwindow.DASHBOARD_DATA = {dashboard_json};\n</script>\n'

    # 插入到 </body> 前。
    # 关键：被内联的库（如 echarts.js）内部可能包含字面量 '</body>'（导出 HTML 字符串），
    # 若用 str.replace 会替换【第一个】匹配，把注入器塞进库的字符串里，破坏 JS。
    # 用 rfind 取【最后一个】</body>（即真实闭合标签），确保注入器追加在页面末尾。
    idx = skeleton.rfind("</body>")
    if idx != -1:
        skeleton = skeleton[:idx] + f"{injector_block}\n" + skeleton[idx:]
    else:
        # 兜底：没有 </body> 就直接拼到末尾
        skeleton = skeleton + injector_block

    # 输出
    if output_path is None:
        safe_name = template_path.name.split()[0] if template_path.name[0].isdigit() else template_path.name[:10]
        output_path = f"dashboard_{safe_name}.html"

    with open(output_path, "w", encoding="utf-8") as f:
        f.write(skeleton)

    print(f"Dashboard built (source template mode): {output_path}")
    print(f"  Template: {template_path.name}")
    print(f"  Title: {title_str}")
    print(f"  Injector: {'yes' if has_injector else 'no'}")
    print(f"  Size: {os.path.getsize(output_path)} bytes")

    return output_path


def _build_layout_mode(data, data_path, theme, output_path):
    """模式1：使用布局配置引擎"""
    from layout_builder import build_layout_config

    title_str = data.get("title", "数据可视化大屏")
    if "theme" in data and isinstance(data["theme"], dict):
        effective_theme = data["theme"].get("mode", theme)
    else:
        effective_theme = theme

    layout_cfg = build_layout_config(data, effective_theme, title_str)

    with open(RENDERER_PATH, "r", encoding="utf-8") as f:
        template = f.read()

    html = template.replace("{{TITLE}}", layout_cfg["title"])

    config_json = json.dumps(layout_cfg, ensure_ascii=False)
    html = html.replace(
        'var CFG = window.DASHBOARD_CONFIG || { title: "数据可视化大屏" };',
        "var CFG = window.DASHBOARD_CONFIG = " + config_json + ";"
    )

    if output_path is None:
        base = os.path.splitext(data_path)[0]
        output_path = f"{base}_dashboard.html"

    with open(output_path, "w", encoding="utf-8") as f:
        f.write(html)

    print(f"Dashboard built (layout mode): {output_path}")
    print(f"  Theme: {layout_cfg['theme']['mode']}")
    print(f"  Title: {layout_cfg['title']}")
    rows = layout_cfg["layout"]["rows"]
    widget_count = sum(len(col.get("widgets", [])) for row in rows for col in row.get("cols", []))
    print(f"  Rows: {len(rows)}, Widgets: {widget_count}")
    print(f"  Size: {os.path.getsize(output_path)} bytes")
    return output_path


def list_templates(source_dir=None):
    """列出所有可用模板"""
    sd = source_dir or DEFAULT_SOURCE

    # 内置模板（已适配、可直接注入数据的骨架）
    print("=== 内置骨架模板（已适配，推荐）===")
    for sk in sorted(Path(SKELETONS_DIR).iterdir()):
        if not sk.is_dir():
            continue
        cfg = sk / "template_config.json"
        label = sk.name
        if cfg.exists():
            try:
                with open(cfg, encoding="utf-8") as f:
                    c = json.load(f)
                label = c.get("template") or c.get("name") or sk.name
            except Exception:
                pass
        print(f"  [{sk.name}] {label}")

    # 自定义模板
    custom = Path(CUSTOM_DIR)
    if custom.exists():
        customs = sorted([c for c in custom.iterdir() if c.is_dir()])
        if customs:
            print("\n=== 用户自定义模板 ===")
            for c in customs:
                meta_file = c / "metadata.json"
                if meta_file.exists():
                    with open(meta_file, encoding='utf-8') as f:
                        meta = json.load(f)
                    print(f"  [{c.name}] {meta.get('name', c.name)}")
                else:
                    print(f"  [{c.name}] (无 metadata.json)")

    # 源模板
    if sd:
        templates = find_source_templates(sd)
        if templates:
            print(f"\n=== BigDataView_ 源模板 ({len(templates)} 个) ===")
            for t in templates:
                print(f"  {t}")
        else:
            print(f"\n源模板目录不存在: {sd}")
            print("提示: 使用 --source-dir 指定源模板目录")


def list_data_templates():
    """列出 assets/templates/data/ 下所有可填写的数据模板（example.json + example.xlsx + README）"""
    base = Path(DATA_TEMPLATES_DIR)
    if not base.exists():
        print(f"数据模板目录不存在: {DATA_TEMPLATES_DIR}")
        return

    entries = sorted([d for d in base.iterdir() if d.is_dir()])
    if not entries:
        print("assets/templates/data/ 下无模板目录")
        return

    print(f"=== 数据填写模板（assets/templates/data/，共 {len(entries)} 个）===")
    print()
    print("这些是给用户填写的业务数据样本，与 assets/templates/skeletons/ 下的渲染骨架一一对应。")
    print("每个目录含: example.json（数据样本）/ example.xlsx（Excel 模板）/ README.md（字段映射说明）")
    print()
    for d in entries:
        skeleton_dir = Path(SKELETONS_DIR) / d.name
        has_skeleton = skeleton_dir.exists()
        has_config = has_skeleton and (skeleton_dir / "template_config.json").exists()
        has_injector = has_skeleton and (skeleton_dir / "injector.js").exists()
        has_skeleton_html = has_skeleton and (skeleton_dir / "skeleton.html").exists()
        # 骨架目录自带 index.html（源文件合并后） = 免 --source-dir
        has_source = has_skeleton and (skeleton_dir / "index.html").exists()

        example_json = d / "example.json"
        example_xlsx = d / "example.xlsx"
        readme = d / "README.md"
        files = []
        if example_json.exists():
            files.append("example.json")
        if example_xlsx.exists():
            files.append("example.xlsx")
        if readme.exists():
            files.append("README.md")
        files_str = " + ".join(files) if files else "(空)"

        source_flag = "自带源(免--source-dir)" if has_source else "需--source-dir"
        # 注入策略分类
        if has_injector:
            inject_strategy = "独立injector(精确数据注入)"
        elif has_skeleton_html:
            inject_strategy = "布局引擎(通用statCards/charts/tables结构)"
        elif has_source:
            inject_strategy = "原生JS injector(data-f锚点)"
        else:
            inject_strategy = "无骨架(仅数据样本)"
        print(f"  [{d.name}]")
        print(f"    文件: {files_str}")
        print(f"    渲染: {source_flag} | {inject_strategy}")
        print()


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage:")
        print("  # 列出可用模板")
        print("  python build_dashboard.py --list")
        print("  python build_dashboard.py --list --source-dir 'path/to/web/'")
        print("  python build_dashboard.py --list-data-templates")
        print()
        print("  # 模式1: 布局配置引擎（默认，推荐）")
        print("  python build_dashboard.py data.json")
        print("  python build_dashboard.py data.json --theme dark --output dashboard.html")
        print()
        print("  # 模式2: 源模板适配（从骨架模板中选一个）")
        print("  python build_dashboard.py data.json --template 'skeleton_weather'")
        print("  python build_dashboard.py data.json --template 'skeleton_power_plant'")
        print("  python build_dashboard.py data.json --template 'skeleton_weather' --source-dir 'path/to/web/'")
        print()
        print("Options:")
        print("  --list                   列出所有可用模板（含骨架/自定义/源模板）")
        print("  --list-data-templates    列出 assets/templates/data/ 下可填写的数据样本")
        print("  --template NAME          指定源模板（ID / 英文名 / 中文名）")
        print("  --source-dir DIR         源模板目录（默认 BigDataView_/web/）")
        print("  --theme dark|light       布局引擎主题（默认 dark）")
        print("  --output FILE            输出路径")
        print("  --title 'TITLE'          大屏标题")
        sys.exit(1)

    # --list
    if sys.argv[1] == "--list":
        source_dir = DEFAULT_SOURCE
        for i, arg in enumerate(sys.argv):
            if arg == "--source-dir" and i + 1 < len(sys.argv):
                source_dir = sys.argv[i + 1]
        list_templates(source_dir)
        sys.exit(0)

    # --list-data-templates
    if sys.argv[1] == "--list-data-templates":
        list_data_templates()
        sys.exit(0)

    # 解析参数
    data_path = sys.argv[1]
    theme = "dark"
    output = None
    title = None
    template_name = None
    source_dir = DEFAULT_SOURCE

    i = 2
    while i < len(sys.argv):
        if sys.argv[i] == "--theme" and i + 1 < len(sys.argv):
            theme = sys.argv[i + 1]
            i += 2
        elif sys.argv[i] == "--output" and i + 1 < len(sys.argv):
            output = sys.argv[i + 1]
            i += 2
        elif sys.argv[i] == "--title" and i + 1 < len(sys.argv):
            title = sys.argv[i + 1]
            i += 2
        elif sys.argv[i] == "--template" and i + 1 < len(sys.argv):
            template_name = sys.argv[i + 1]
            i += 2
        elif sys.argv[i] == "--source-dir" and i + 1 < len(sys.argv):
            source_dir = sys.argv[i + 1]
            i += 2
        else:
            i += 1

    if not os.path.exists(data_path):
        print(f"ERROR: Data file not found: {data_path}", file=sys.stderr)
        sys.exit(1)

    build_dashboard(data_path, theme, output, title, template_name, source_dir)
