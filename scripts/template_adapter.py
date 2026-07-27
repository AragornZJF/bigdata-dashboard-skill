#!/usr/bin/env python3
"""
模板适配器 —— 将 BigDataView_ 源模板改造为数据可注入的骨架模板。

核心思路：
1. 读取源模板的 HTML，找出所有 ECharts init + setOption 代码块
2. 将硬编码的 series.data 替换为 {{data.xxx}} 占位符
3. 将硬编码的表格数据替换为模板循环
4. 将样式变量提取为 CSS 变量（--bg, --primary 等）
5. 输出骨架 HTML + metadata.json

用户工作流：
  python template_adapter.py <source_dir> --template "021 大数据通用模版" --output ./skeleton/

"""
import os, re, json, sys
from pathlib import Path
from typing import Optional


class TemplateAdapter:
    """将源模板转为数据可注入骨架"""

    def __init__(self, source_dir: str):
        self.source_dir = Path(source_dir)

    def find_template(self, name_or_id: str) -> Optional[Path]:
        """按名称或 ID 查找模板目录"""
        for d in self.source_dir.iterdir():
            if not d.is_dir():
                continue
            if name_or_id in d.name:
                return d
        return None

    def adapt(self, template_path: Path) -> dict:
        """
        适配一个模板，返回:
        {
            "metadata": {...},
            "skeleton_html": "...",
            "theme_css": "...",
            "data_schema": {...}
        }
        """
        result = {}

        # 读取源文件
        html_path = template_path / 'index.html'
        if not html_path.exists():
            raise FileNotFoundError(f"index.html not found in {template_path}")

        source_html = html_path.read_text(encoding='utf-8', errors='ignore')

        # === 1. 提取元数据 ===
        result["metadata"] = self._extract_metadata(template_path, source_html)

        # === 2. 生成 CSS 变量 ===
        result["theme_css"] = self._extract_theme_css(source_html, template_path)

        # === 3. 生成数据 schema ===
        result["data_schema"] = self._generate_data_schema(source_html, template_path)

        # === 4. 生成骨架 HTML ===
        result["skeleton_html"] = self._build_skeleton(source_html, template_path)

        return result

    def _extract_metadata(self, dirpath: Path, html: str) -> dict:
        """提取模板元数据"""
        name = dirpath.name

        match = re.search(r'<title>([^<]+)</title>', html)
        title = match.group(1).strip() if match else name

        # 布局
        layout_type = "float"
        if re.search(r'flex|flexbox', html, re.IGNORECASE):
            layout_type = "flex"
        elif 'layui-col' in html:
            layout_type = "layui-grid"
        elif len(re.findall(r'position\s*:\s*absolute', html)) > 5:
            layout_type = "absolute"

        return {
            "source": str(dirpath),
            "name": title,
            "layout_type": layout_type,
            "echarts_version": "4.x" if "echarts-4" in html else "5.x" if "echarts5" in html else "auto",
        }

    def _extract_theme_css(self, html: str, dirpath: Path) -> str:
        """提取主题 CSS 变量"""
        bg = "#000d4a"
        bg_m = re.search(r'background(?:-color)?\s*:\s*([#\w\d]+)', html)
        if bg_m:
            bg = bg_m.group(1).rstrip(';')

        color_matches = re.findall(r'color\s*:\s*(#[0-9A-Fa-f]{6})', html)
        primary = "#0EFCFF"
        if color_matches:
            from collections import Counter
            c = Counter(color_matches)
            # 排除白色和黑色
            for col, _ in c.most_common():
                if col.upper() not in ('#FFFFFF', '#000000', '#FFF', '#000'):
                    primary = col
                    break

        return f"""/* 模板主题变量 */
:root {{
    --bg-color: {bg};
    --bg-secondary: rgba(6, 48, 109, 0.5);
    --primary-color: {primary};
    --primary-light: {primary}80;
    --text-color: #ffffff;
    --text-secondary: rgba(255, 255, 255, 0.6);
    --border-color: rgba(14, 253, 255, 0.2);
    --panel-bg: rgba(6, 48, 109, 0.3);
    --stat-card-bg: rgba(14, 253, 255, 0.05);
}}
"""

    def _find_chart_defs(self, html: str, dirpath: Path = None) -> list[dict]:
        """找出所有 ECharts 图表定义（内联脚本 + 外部 JS 文件）"""
        charts = []

        # 收集所有 JS 代码
        all_js = html

        # 提取内联脚本
        inline_scripts = re.findall(r'<script[^>]*>([\s\S]*?)</script>', html)
        all_js = '\n'.join(inline_scripts)

        # 读取外部 JS 文件
        if dirpath:
            for jsf in dirpath.glob('**/*.js'):
                try:
                    all_js += '\n' + jsf.read_text(encoding='utf-8', errors='ignore')
                except Exception:
                    pass

        # 匹配 echarts.init 和后面的变量名
        pattern = r"(?:var|let|const)\s+(\w+)\s*=\s*echarts\.init\s*\([^)]+\)"
        for m in re.finditer(pattern, all_js):
            var_name = m.group(1)
            # 找这个变量后面的 setOption（允许一定距离内的懒匹配）
            start = m.end()
            # 在后续 3000 字符内找 setOption
            search_region = all_js[start:start + 5000]
            opt_pattern = rf'{re.escape(var_name)}\.setOption\s*\(([\s\S]*?)\);'
            opt_match = re.search(opt_pattern, search_region)
            if opt_match:
                opt_code = opt_match.group(1)
                chart_type = self._infer_chart_type(opt_code)
                charts.append({
                    "id": var_name,
                    "type": chart_type,
                    "option_code": opt_code[:500],
                })
        return charts

    def _infer_chart_type(self, opt_code: str) -> str:
        """推断 ECharts 图表类型"""
        if 'roseType' in opt_code:
            return 'rosePie'
        if re.search(r"type\s*:\s*['\"]pie['\"]", opt_code):
            return 'pie'
        if re.search(r"type\s*:\s*['\"]bar['\"]", opt_code):
            return 'bar'
        if re.search(r"type\s*:\s*['\"]line['\"]", opt_code):
            return 'line'
        if re.search(r"type\s*:\s*['\"]radar['\"]", opt_code):
            return 'radar'
        if re.search(r"type\s*:\s*['\"]gauge['\"]", opt_code):
            return 'gauge'
        if re.search(r"type\s*:\s*['\"]funnel['\"]", opt_code):
            return 'funnel'
        if re.search(r"type\s*:\s*['\"]pictorialBar['\"]", opt_code):
            return 'pictorialBar'
        if re.search(r"type\s*:\s*['\"]scatter['\"]", opt_code):
            return 'scatter'
        if re.search(r"type\s*:\s*['\"]map['\"]", opt_code):
            return 'map'
        return 'unknown'

    def _generate_data_schema(self, html: str, dirpath: Path) -> dict:
        """生成数据 schema"""
        charts = self._find_chart_defs(html, dirpath)
        schema = {
            "title": "",
            "statCards": [],
            "charts": [],
            "tables": [],
            "rankings": [],
        }

        # 从图表定义推断数据字段
        for chart in charts:
            schema["charts"].append({
                "id": chart["id"],
                "type": chart["type"],
                "dataHint": "提供对应图表类型的 data 数组。饼图: [{name, value}]，柱状图/折线图: [number...] 或 [{name, data: [...]}]",
            })

        # 从 HTML 中找表格
        tables = re.findall(r'<table[\s\S]*?</table>', html)
        for i, table_html in enumerate(tables):
            headers = re.findall(r'<th[^>]*>([^<]+)</th>', table_html)
            schema["tables"].append({
                "id": f"table_{i}",
                "headers": headers,
                "dataHint": f"列: {headers}",
            })

        return schema

    def _build_skeleton(self, html: str, dirpath: Path) -> str:
        """
        构建骨架 HTML：在顶部注入 DASHBOARD_DATA，并添加数据驱动标签。
        骨架不改变源布局，只是在 <head> 后插入数据注入脚本。
        """
        skeleton = html

        # 1. 替换 title
        skeleton = re.sub(
            r'<title>.*?</title>',
            '<title>{{title}}</title>',
            skeleton,
        )

        # 2. 在 </head> 前插入 DASHBOARD_DATA 占位
        data_script = """
    <!-- DASHBOARD_DATA: 以下 JSON 由 build_dashboard.py 自动注入，不要手动修改 -->
    <script id="dashboard-data" type="application/json">
    /* DATA_PLACEHOLDER */
    </script>
    <script>
    // 数据驱动适配器 —— 将 DASHBOARD_DATA 注入各图表
    (function() {
        var dataEl = document.getElementById('dashboard-data');
        if (!dataEl) return;
        try {
            window.DASHBOARD_DATA = JSON.parse(dataEl.textContent);
        } catch(e) {
            console.error('仪表盘数据解析失败:', e);
        }
    })();
</script>
"""
        skeleton = skeleton.replace('</head>', data_script + '\n</head>')

        # 3. 标记数据注入点（注释标记，方便用户修改）
        skeleton = re.sub(
            r'(echarts\.init\s*\()',
            r'/* [DATA-INJECTABLE-CHART] */ \1',
            skeleton,
        )

        skeleton = re.sub(
            r'(<table)',
            r'<!-- [DATA-INJECTABLE-TABLE] --> \1',
            skeleton,
            count=3,
        )

        return skeleton

    def save_skeleton(self, result: dict, output_dir: str):
        """保存骨架到目录"""
        out = Path(output_dir)
        out.mkdir(parents=True, exist_ok=True)

        # 保存骨架 HTML
        (out / 'skeleton.html').write_text(result["skeleton_html"], encoding='utf-8')

        # 保存主题 CSS
        (out / 'theme.css').write_text(result["theme_css"], encoding='utf-8')

        # 保存元数据
        with open(out / 'metadata.json', 'w', encoding='utf-8') as f:
            json.dump(result["metadata"], f, ensure_ascii=False, indent=2)

        # 保存 data schema
        with open(out / 'data_schema.json', 'w', encoding='utf-8') as f:
            json.dump(result["data_schema"], f, ensure_ascii=False, indent=2)

        print(f"骨架已保存到: {output_dir}/")
        print(f"  文件: skeleton.html, theme.css, metadata.json, data_schema.json")


def main():
    import argparse
    parser = argparse.ArgumentParser(description='适配源模板为数据可注入骨架')
    parser.add_argument('source_dir', help='模板源目录（如 BigDataView_/web/）')
    parser.add_argument('--template', '-t', required=True, help='模板名称或目录名')
    parser.add_argument('--output', '-o', default='./skeleton', help='输出目录')
    args = parser.parse_args()

    adapter = TemplateAdapter(args.source_dir)
    template_path = adapter.find_template(args.template)

    if not template_path:
        print(f"未找到匹配模板: {args.template}")
        print(f"可用模板目录: {args.source_dir}")
        sys.exit(1)

    print(f"适配模板: {template_path.name}")

    result = adapter.adapt(template_path)
    adapter.save_skeleton(result, args.output)

    # 打印 data schema 摘要
    schema = result["data_schema"]
    print(f"\n数据需求摘要:")
    print(f"  图表数量: {len(schema['charts'])}")
    for ch in schema['charts']:
        print(f"    - {ch['id']}: {ch['type']}")
    print(f"  表格数量: {len(schema['tables'])}")
    for tb in schema['tables']:
        print(f"    - {tb['id']}: 列={tb.get('headers', [])}")


if __name__ == '__main__':
    main()
