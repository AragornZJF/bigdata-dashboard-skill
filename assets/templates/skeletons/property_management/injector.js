/**
 * 物业管理数据中心 - 运行时数据注入器
 * 读取 window.DASHBOARD_DATA 并覆盖图表 / 标题 / 表格。
 *
 * window.DASHBOARD_DATA 形态：
 * {
 *   title: "新标题",                    // 覆盖大屏标题（class=dv-title 的元素）
 *   charts: [
 *     { id: "chart_0", option: { ...完整 ECharts option... } },
 *     ...
 *   ],
 *   tables: [
 *     { id: "table_0", columns: ["列A","列B"], rows: [[v1,v2], ...] }
 *   ]
 * }
 *
 * 注入器通过 echarts.getInstanceByDom() 拿到已初始化实例，再用 setOption() 更新，
 * 不修改原始内联脚本，也不向全局暴露图表变量。
 */
(function () {
  function applyData(data) {
    if (!data || typeof data !== 'object') return;

    // 1) 标题覆盖
    if (typeof data.title === 'string') {
      var t = document.querySelector('.dv-title, [data-title]');
      if (t) t.textContent = data.title;
      document.title = data.title;
    }

    // 2) 图表覆盖
    var list = Array.isArray(data.charts) ? data.charts : [];
    list.forEach(function (item) {
      if (!item || !item.id) return;
      var el = document.getElementById(item.id);
      if (!el) return;

      if (item.option && typeof item.option === 'object') {
        try {
          var inst = echarts.getInstanceByDom(el);
          if (inst) {
            inst.setOption(item.option, item.replace || false);
          } else {
            // 兜底：实例尚未初始化，先 init 再 setOption
            var fresh = echarts.init(el);
            fresh.setOption(item.option);
            window.__dashboard_charts__ = window.__dashboard_charts__ || {};
            window.__dashboard_charts__[item.id] = fresh;
          }
        } catch (e) {
          console.warn('[injector] chart ' + item.id + ' setOption failed:', e);
        }
      }
    });

    // 3) 表格覆盖
    var tables = Array.isArray(data.tables) ? data.tables : [];
    tables.forEach(function (tb) {
      if (!tb || !tb.id || !Array.isArray(tb.columns)) return;
      var el = document.getElementById(tb.id);
      if (!el) return;
      var html = '<table class="dv-table"><thead><tr>';
      tb.columns.forEach(function (c) { html += '<th>' + (c == null ? '' : c) + '</th>'; });
      html += '</tr></thead><tbody>';
      var rows = Array.isArray(tb.rows) ? tb.rows : [];
      rows.forEach(function (r) {
        html += '<tr>';
        var arr = Array.isArray(r) ? r : (tb.columns.map(function (c) { return (r && r[c]) != null ? r[c] : ''; }));
        arr.forEach(function (v) { html += '<td>' + (v == null ? '' : v) + '</td>'; });
        html += '</tr>';
      });
      html += '</tbody></table>';
      el.innerHTML = html;
    });
  }

  function readAndApply() {
    // 优先 window.DASHBOARD_DATA，其次 <script id="dashboard-data">
    var data = window.DASHBOARD_DATA;
    if (!data) {
      var tag = document.getElementById('dashboard-data');
      if (tag) {
        try { data = JSON.parse(tag.textContent || '{}'); } catch (e) { data = null; }
      }
    }
    if (data) applyData(data);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      // 延迟让内联图表初始化脚本先跑完
      setTimeout(readAndApply, 350);
    });
  } else {
    setTimeout(readAndApply, 350);
  }
})();
