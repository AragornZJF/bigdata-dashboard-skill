#!/usr/bin/env python3
"""
模板扫描器 —— 扫描 BigDataView_ 全部 118 个模板（或任意目录），
提取每个模板的元数据，生成 registry.json 注册表。

输出 metadata 字段：
  - id, name, path: 基本信息
  - layout: { type, columns, rows, unit }
  - components: { charts, tables, stats, gauges, maps, rankings, ... }
  - dependencies: { echarts, jquery, frameworks, maps, plugins }
  - theme: { background, primaryColor, fontFamily }
  - data_fields: 模板需要的数据字段名
  - data_mode: "hardcoded" | "ajax" | "mixed"
  - features: [ "粒子背景", "词云", "百度地图", ... ]

用法：
  python template_scanner.py <source_dir> [--output registry.json]
"""

import os, re, json, sys
from pathlib import Path


class TemplateScanner:
    """扫描目录下所有模板，生成元数据注册表"""

    # 已知框架关键词
    FRAMEWORKS = {
        'layui': 'layui',
        'bootstrap': 'Bootstrap',
        'easyui': 'EasyUI',
        'vue': 'Vue',
        'react': 'React',
    }

    # 图表类型关键词映射
    CHART_KEYWORDS = {
        'pie': 'pie',
        'funnel': 'funnel',
        'gauge': 'gauge',
        'radar': 'radar',
        'scatter': 'scatter',
        'bar': 'bar',
        'line': 'line',
        'area': 'area',
        'pictorialBar': 'pictorialBar',
        'wordCloud': 'wordCloud',
        'map': 'map',
        'geo': 'geo',
        'heatmap': 'heatmap',
        'treemap': 'treemap',
        'sankey': 'sankey',
        'graph': 'graph',
        'boxplot': 'boxplot',
        'candlestick': 'candlestick',
        'roseType': 'rosePie',
    }

    PLUGIN_KEYWORDS = {
        'particles': '粒子背景',
        'numscroll': '数字动画',
        'liMarquee': '无缝滚动',
        'cxselect': '级联选择',
        'wordcloud': '词云',
        'echarts-gl': '3D图表',
        'datatool': '数据工具',
        'jcarousel': '内容轮播',
    }

    MAP_KEYWORDS = {
        'china': '中国地图',
        'BMap': '百度地图',
        'guangxi': '广西地图',
        'beijing': '北京地图',
        'shanghai': '上海地图',
    }

    FEATURE_PATTERNS = [
        ('自动刷新', re.compile(r'setInterval|setTimeout.*?setOption|clearInterval')),
        ('轮播切换', re.compile(r'swiper|carousel|tabSwitch|toggle')),
        ('全屏', re.compile(r'fullscreen|FullScreen|requestFullscreen')),
        ('响应式', re.compile(r'media\s*\(|@media|resize\s*=|addEventListener.*resize')),
        ('加载动画', re.compile(r'loading|\.loading|loadAnimate|preloader')),
        ('弹窗交互', re.compile(r'dialog|popup|modal|layer\.open|alert')),
        ('数据导出', re.compile(r'export|download|table2excel|saveAs')),
        ('钻取/联动', re.compile(r'drill|click.*chart|on.*click.*getOption')),
    ]

    def __init__(self, source_dir: str):
        self.source_dir = Path(source_dir)

    def scan_all(self) -> list[dict]:
        """扫描所有模板目录"""
        results = []
        dirs = sorted(d for d in self.source_dir.iterdir() if d.is_dir())
        for d in dirs:
            try:
                meta = self._scan_one(d)
                results.append(meta)
            except Exception as e:
                results.append({
                    "id": d.name,
                    "name": d.name,
                    "path": str(d),
                    "error": str(e),
                })
        return results

    def _scan_one(self, dirpath: Path) -> dict:
        """扫描单个模板目录"""
        name = dirpath.name
        html_path = dirpath / 'index.html'

        if not html_path.exists():
            raise FileNotFoundError(f"index.html not found in {name}")

        html = html_path.read_text(encoding='utf-8', errors='ignore')

        # 提取标题（去掉编号前缀）
        match = re.search(r'<title>([^<]+)</title>', html)
        title = match.group(1).strip() if match else name

        # === 布局分析 ===
        layout = self._analyze_layout(html)

        # === 组件清单 ===
        components = self._count_components(html, dirpath)

        # === 依赖分析 ===
        dependencies = self._analyze_deps(html, dirpath)

        # === 主题提取 ===
        theme = self._extract_theme(html, dirpath)

        # === 数据字段 ===
        data_fields = self._extract_data_fields(html)

        # === 数据模式 ===
        data_mode = 'hardcoded'
        if 'ajax' in html.lower() or 'fetch' in html.lower() or '$.get' in html or '$.post' in html:
            data_mode = 'mixed'
        if re.search(r'\.ajax|fetch\s*\(|axios', html, re.IGNORECASE):
            js_files = list(dirpath.glob('**/*.js'))
            has_real_ajax = False
            for jsf in js_files:
                try:
                    js = jsf.read_text(encoding='utf-8', errors='ignore')
                    if re.search(r'\.ajax\s*\(\{|fetch\s*\([\'"]https?://', js):
                        has_real_ajax = True
                        break
                except Exception:
                    pass
            if has_real_ajax:
                data_mode = 'ajax'

        # === 特性检测 ===
        features = self._detect_features(html, dirpath)

        return {
            "id": self._safe_id(name),
            "name": title,
            "path": str(dirpath),
            "layout": layout,
            "components": components,
            "dependencies": dependencies,
            "theme": theme,
            "data_fields": data_fields,
            "data_mode": data_mode,
            "features": features,
        }

    def _safe_id(self, name: str) -> str:
        """生成安全的 ID"""
        return re.sub(r'[^\w\u4e00-\u9fff-]', '-', name).strip('-')

    def _analyze_layout(self, html: str) -> dict:
        """分析布局结构"""
        layout = {"type": "unknown", "columns": 1}

        # 检测 flexbox
        if re.search(r'flex|flexbox', html, re.IGNORECASE):
            layout["type"] = "flex"
        # 检测 grid
        elif re.search(r'display\s*:\s*grid', html):
            layout["type"] = "grid"
        # 检测 layui 栅格
        elif 'layui-col' in html:
            layout["type"] = "layui-grid"
        # 检测 position absolute 布局
        elif re.search(r'position\s*:\s*absolute', html) and len(re.findall(r'position\s*:\s*absolute', html)) > 5:
            layout["type"] = "absolute"
        # 检测 float
        elif re.search(r'float\s*:\s*(left|right)', html):
            layout["type"] = "float"
        # 检测表格布局
        elif 'display:table' in html:
            layout["type"] = "table"

        # 列数检测
        col_patterns = [
            (re.compile(r'\.column|col-\d|main_left|leftMain|left\d*', re.IGNORECASE), 'left'),
            (re.compile(r'\.center|col-\d|main_center|mid\d*', re.IGNORECASE), 'center'),
            (re.compile(r'\.right|col-\d|main_right|rightMain|right\d*', re.IGNORECASE), 'right'),
        ]
        found_cols = []
        for pattern, name in col_patterns:
            if pattern.search(html):
                found_cols.append(name)
        layout["columns"] = len(found_cols) if found_cols else 1

        # 响应单位
        if 'vw' in html:
            layout["unit"] = "vw"
        elif 'vh' in html:
            layout["unit"] = "vh"
        elif 'rem' in html:
            layout["unit"] = "rem"
        else:
            layout["unit"] = "px"

        # 是否固定画布
        if re.search(r'width\s*:\s*\d{4,}px|height\s*:\s*\d{4,}px', html):
            layout["fixedCanvas"] = True

        return layout

    def _count_components(self, html: str, dirpath: Path) -> dict:
        """统计各类组件数量"""
        components = {}

        # ECharts 图表
        chart_count = self._count_echarts(html, dirpath)
        components["charts"] = chart_count

        # 统计卡片
        stat_patterns = [r'class="[^"]*num[^"]*"', r'统计', r'数量卡', r'数字卡']
        components["statCards"] = max(
            len(re.findall(r'class="[^"]*num[^"]*"', html)),
            len(re.findall(r'\.num|\.stat|\.count|\.number', html)),
        )

        # 表格
        components["tables"] = len(re.findall(r'<table', html))

        # 进度条 / 仪表
        components["gauges"] = len(re.findall(r'gauge|仪表|progress|circular|环形|进度环', html))

        # 地图
        map_count = 0
        for keyword in self.MAP_KEYWORDS:
            if keyword.lower() in html.lower():
                map_count += 1
        components["maps"] = map_count

        # 排行榜
        components["rankings"] = len(re.findall(r'排行榜|排名|paiming|ranking|排行|paihang|list_top', html))

        # 滚动列表
        components["scrollLists"] = len(re.findall(r'marquee|carousel|scroll|滚动|轮播', html))

        # 返回总数
        total = sum(components.get(k, 0) for k in ['charts', 'tables', 'gauges', 'maps'])
        components["totalPanels"] = total
        return components

    def _count_echarts(self, html: str, dirpath: Path) -> dict:
        """详细统计 ECharts 图表类型"""
        ec_types = {}
        js_files = list(dirpath.glob('**/*.js'))

        # 从 HTML 内联脚本中检测
        inline_scripts = re.findall(r'<script[^>]*>([\s\S]*?)</script>', html)
        all_js = '\n'.join(inline_scripts)

        # 也读取外部 JS
        for jsf in js_files:
            try:
                all_js += '\n' + jsf.read_text(encoding='utf-8', errors='ignore')
            except Exception:
                pass

        # 检测类型
        type_hints = {
            'echarts\\.init': 'unknown',
        }
        # 按 JS 中 setOption 前面的变量名推断
        chart_vars = re.findall(r'(var|let|const)\s+(\w+)\s*=\s*echarts\.init', all_js)
        ec_types["total"] = len(chart_vars)

        # 检测具体图表类型
        for keyword, label in self.CHART_KEYWORDS.items():
            count = len(re.findall(rf'{keyword}', all_js))
            if count > 0:
                ec_types[label] = count

        return ec_types

    def _analyze_deps(self, html: str, dirpath: Path) -> dict:
        """分析外部依赖"""
        deps = {"echarts": False, "jquery": False, "frameworks": [], "maps": [], "plugins": [], "cdns": []}

        # ECharts
        if re.search(r'echarts', html, re.IGNORECASE):
            deps["echarts"] = True

        # jQuery
        if re.search(r'jquery', html, re.IGNORECASE):
            deps["jquery"] = True

        # 框架
        for keyword, name in self.FRAMEWORKS.items():
            if keyword.lower() in html.lower():
                deps["frameworks"].append(name)

        # 地图
        for keyword, name in self.MAP_KEYWORDS.items():
            if keyword.lower() in html.lower():
                deps["maps"].append(name)

        # 插件
        for keyword, name in self.PLUGIN_KEYWORDS.items():
            if keyword.lower() in html.lower():
                deps["plugins"].append(name)

        # CDN
        cdns = re.findall(r'(https?://[^"\'>\s]+\.js)', html)
        deps["cdns"] = cdns[:10]  # 最多保留10个

        # 本地 JS 文件
        js_files = list(dirpath.glob('**/*.js'))
        deps["localJS"] = [f.name for f in js_files[:20]]  # 最多20个

        return deps

    def _extract_theme(self, html: str, dirpath: Path) -> dict:
        """提取主题色彩"""
        theme = {"background": "#000d4a", "primaryColor": "#0EFCFF"}

        # 背景色
        bg_m = re.search(r'background(?:-color)?\s*:\s*([#\w\d]+)', html)
        if bg_m:
            theme["background"] = bg_m.group(1).rstrip(';')

        # 主色调
        color_matches = re.findall(r'color\s*:\s*(#[0-9A-Fa-f]{3,6}|rgba?\([^)]+\))', html)
        if color_matches:
            # 取出现最多的颜色作为主色调
            from collections import Counter
            c = Counter(color_matches)
            theme["primaryColor"] = c.most_common(1)[0][0]

        # 字体
        font_m = re.search(r'font-family\s*:\s*([^;]+)', html)
        if font_m:
            theme["fontFamily"] = font_m.group(1).strip()

        # 提取 CSS 变量
        css_vars = re.findall(r'--[\w-]+', html)
        theme["cssVariables"] = list(set(css_vars))[:20]

        return theme

    def _extract_data_fields(self, html: str) -> list[str]:
        """提取模板中可能的数据字段名"""
        fields = set()

        # data.name / data.value 模式
        for m in re.finditer(r"name\s*:\s*['\"]([^'\"]+)['\"]", html):
            fields.add(m.group(1))

        # ECharts data 中的 name 字段
        for m in re.finditer(r"text\s*:\s*['\"]([^'\"]+)['\"]", html):
            fields.add(m.group(1))

        # 表头
        for m in re.finditer(r'<th[^>]*>([^<]+)</th>', html):
            fields.add(m.group(1).strip())

        return sorted(fields)[:30]

    def _detect_features(self, html: str, dirpath: Path) -> list[str]:
        """检测特殊功能"""
        features = []
        for name, pattern in self.FEATURE_PATTERNS:
            if pattern.search(html):
                features.append(name)

        # 检测特殊组件
        if 'wordCloud' in html or 'wordcloud' in html.lower():
            features.append('词云')
        if '3d' in html.lower() or 'echarts-gl' in html.lower():
            features.append('3D图表')
        if 'datav' in html.lower():
            features.append('DataV组件')

        return features

    def generate_registry(self, results: list[dict]) -> dict:
        """生成标准注册表"""
        # 分类
        categories = {}
        for r in results:
            layout_type = r.get("layout", {}).get("type", "unknown")
            categories.setdefault(layout_type, [])

            # 精简版条目（去掉大字段）
            entry = {
                "id": r["id"],
                "name": r["name"],
                "path": r["path"],
                "layout": r.get("layout", {}),
                "components": r.get("components", {}),
                "deps": {
                    "echarts": r.get("dependencies", {}).get("echarts", False),
                    "frameworks": r.get("dependencies", {}).get("frameworks", []),
                    "maps": r.get("dependencies", {}).get("maps", []),
                },
                "theme": r.get("theme", {}),
                "data_mode": r.get("data_mode", "hardcoded"),
                "features": r.get("features", []),
                "data_fields": r.get("data_fields", []),
            }
            categories[layout_type].append(entry)

        return {
            "version": "1.0",
            "total": len(results),
            "categories": categories,
            "templates": [r for r in results],  # 完整数据
        }


def main():
    import argparse
    parser = argparse.ArgumentParser(description='扫描大屏模板目录，生成注册表')
    parser.add_argument('source_dir', help='模板源目录（如 BigDataView_/web/）')
    parser.add_argument('-o', '--output', default='registry.json', help='输出 JSON 路径')
    parser.add_argument('--fast', action='store_true', help='快速模式：只读 HTML 前5000字符，不扫描 JS 文件')
    args = parser.parse_args()

    if args.fast:
        # 快速模式：只提取基本信息
        import json, re
        from collections import Counter
        source = Path(args.source_dir)
        templates = []
        for d in sorted(source.iterdir()):
            if not d.is_dir():
                continue
            html_path = d / 'index.html'
            if not html_path.exists():
                continue
            try:
                html = html_path.read_text(encoding='utf-8', errors='ignore')[:5000]
                title_m = re.search(r'<title>([^<]+)</title>', html)
                title = title_m.group(1).strip() if title_m else d.name
            except:
                title = d.name
            deps = []
            for kw in ['echarts', 'jquery', 'layui', 'bootstrap', 'easyui', 'bmap', 'baidu', 'china']:
                if kw in html.lower():
                    deps.append(kw)
            lt = 'float'
            if 'flex' in html.lower(): lt = 'flex'
            elif 'layui-col' in html: lt = 'layui-grid'
            elif 'bootstrap' in html.lower(): lt = 'bootstrap'
            elif 'absolute' in html.lower(): lt = 'absolute'
            templates.append({'id': d.name.split()[0] if d.name[0:1].isdigit() else d.name, 'name': title, 'dir': d.name, 'layout': lt, 'deps': deps})
        registry = {'version': '1.0', 'total': len(templates), 'source': str(source), 'templates': templates}
        with open(args.output, 'w', encoding='utf-8') as f:
            json.dump(registry, f, ensure_ascii=False, indent=2)
        print(f'快速扫描完成: {len(templates)} 个模板 -> {args.output}')
        lt_counts = Counter(t['layout'] for t in templates)
        for lt, cnt in lt_counts.most_common():
            print(f'  {lt}: {cnt}')
        return

    scanner = TemplateScanner(args.source_dir)
    results = scanner.scan_all()
    registry = scanner.generate_registry(results)

    with open(args.output, 'w', encoding='utf-8') as f:
        json.dump(registry, f, ensure_ascii=False, indent=2)

    print(f"扫描完成: {len(results)} 个模板 -> {args.output}")

    # 统计
    by_layout = {}
    for r in results:
        lt = r.get("layout", {}).get("type", "unknown")
        by_layout[lt] = by_layout.get(lt, 0) + 1
    print("\n布局分布:")
    for lt, cnt in sorted(by_layout.items(), key=lambda x: -x[1]):
        print(f"  {lt}: {cnt}")

    by_mode = {}
    for r in results:
        dm = r.get("data_mode", "hardcoded")
        by_mode[dm] = by_mode.get(dm, 0) + 1
    print(f"\n数据模式: hardcoded={by_mode.get('hardcoded',0)}, mixed={by_mode.get('mixed',0)}, ajax={by_mode.get('ajax',0)}")


if __name__ == '__main__':
    main()
