/**
 * 新消费市场洞察报告 - 运行时数据注入器
 *
 * 数据契约：window.DASHBOARD_DATA 为 **viewId-keyed** 的 map，与本模板 render.js 的
 * 原生形态一致。构建管道（build_dashboard.py）会把用户 JSON 原样赋给 window.DASHBOARD_DATA，
 * 且注入语句位于 render.js 之后、render.js 的 window.load 回调之前 —— 因此 render.js 的
 * load 回调会自动用用户数据渲染，本注入器默认 happy-path 无需做事。
 *
 * viewId → 图表：
 *   eaf1443a-…  bar              2022年3-12月社会消费品零售总额   {categories, series}
 *   0c537677-…  chart-mix        新消费市场投融资数量             {categories, series}
 *   66721e70-…  chart-mix        新消费市场投融资金额             {categories, series}
 *   11206b10-…  bar-horizontal   "新消费" 网络信息阅读量          {categories, series}
 *   ace16715-…  bar              "新消费"网络信息地域分布TOP10    {categories, series}
 *   7726e8ec-…  table-info        食品饮料品牌印象表              {columns, rows}
 *   fa4ed026-…  word-cloud        食品功能网络信息关键词云        [{name, value}, …]
 *   6e867661-…  radar             智能家电新消费需求热度          {categories, series}
 *   cafe9eef-…  bar-horizontal   智能家电品类热度                {categories, series}
 *
 * 兜底：若上层误传 property_management 式的 {charts:[{id,option}], tables:[{id,columns,rows}]}
 * 形态，则翻译为 viewId-keyed 并对已初始化的 ECharts 实例 setOption 覆盖。
 */
(function () {
  function applyData(data) {
    if (!data || typeof data !== 'object') return;

    // 已是 viewId-keyed 形态（键为 uuid，或包含 categories/columns/数组）→ render.js 自处理
    var looksViewIdKeyed = Object.keys(data).some(function (k) {
      return /-[0-9a-f]{4}-/.test(k) || k === 'title';
    });
    if (looksViewIdKeyed) return;

    // 兜底：友好形态 {charts, tables} → 逐图覆盖
    var charts = Array.isArray(data.charts) ? data.charts : [];
    charts.forEach(function (item) {
      if (!item || !item.option) return;
      var el = item.id && document.getElementById(item.id);
      if (!el) return;
      try {
        var inst = echarts.getInstanceByDom(el);
        if (inst) inst.setOption(item.option, true);
      } catch (e) { console.warn('[injector] chart override failed:', e); }
    });

    var tables = Array.isArray(data.tables) ? data.tables : [];
    tables.forEach(function (tb) {
      if (!tb || !tb.id || !Array.isArray(tb.columns)) return;
      var el = document.getElementById(tb.id);
      if (!el) return;
      var html = '<table class="de-data"><tr>' + tb.columns.map(function (c) { return '<th>' + c + '</th>'; }).join('') + '</tr>';
      (tb.rows || []).forEach(function (r) {
        html += '<tr>' + (Array.isArray(r) ? r : tb.columns.map(function (c) { return r && r[c] != null ? r[c] : ''; })).map(function (v) { return '<td>' + (v == null ? '' : v) + '</td>'; }).join('') + '</tr>';
      });
      el.innerHTML = html + '</table>';
    });
  }

  function readAndApply() {
    var data = window.DASHBOARD_DATA;
    if (!data) {
      var tag = document.getElementById('dashboard-data');
      if (tag) { try { data = JSON.parse(tag.textContent || '{}'); } catch (e) { data = null; } }
    }
    if (data) applyData(data);
  }

  // render.js 的 load 回调先渲染；延迟到其后再做兜底覆盖，避免竞争。
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(readAndApply, 400); });
  } else {
    setTimeout(readAndApply, 400);
  }
})();
