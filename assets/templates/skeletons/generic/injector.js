/**
 * DASHBOARD_DATA 运行时注入器
 * 模板: 大数据可视化系统数据分析通用模版 (generic)
 *
 * 原模板 (js.js) 已在 document.ready 初始化所有 echarts 实例（echarts1/2/3、
 * lastecharts、pe01/02/03）并 setOption 了 demo 数据。本注入器在 </body> 前
 * 运行，按 DASHBOARD_DATA 调用 setOption 覆盖数据 + 更新 DOM 文本。
 *
 * 数据 schema（详见 assets/templates/data/generic/README.md）：
 *   title            页面标题
 *   statCards[6]     6 个顶部/底部 KPI 卡片 {label, value}
 *   metrics[3]       3 个中部 icon 行 {label, value, unit, yoy, trend:"up"|"down"}
 *   centerLabel      中心标签（默认"业绩总览"）
 *   centerNumber     中心大数字
 *   pieTitles[3]     pe01/pe02/pe03 上方的 .tit01 标题
 *   sectionTitles[3] 3 个 .alltitle 模块标题
 *   charts[]         {id, type:"bar"|"line"|"pie", data:[{name,value}]}
 *   ranking[5]       排行榜 {name, value}
 */
(function () {
  function ready(fn) {
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      setTimeout(fn, 300);
    } else {
      document.addEventListener('DOMContentLoaded', function () { setTimeout(fn, 300); });
    }
  }

  ready(function () {
    if (!window.DASHBOARD_DATA) {
      console.warn('[Generic Injector] DASHBOARD_DATA not found');
      return;
    }
    var D = window.DASHBOARD_DATA;

    function q(sel) { return document.querySelector(sel); }
    function qa(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }
    function esc(s) {
      return String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    // ====== 1. 页面标题 ======
    if (D.title) {
      var h1 = q('.head h1');
      if (h1) h1.textContent = D.title;
      document.title = D.title;
    }

    // ====== 2. 6 个 KPI 卡片（顶部 3 + 底部 3）======
    // DOM: <div class="bar1"> <img/> <h3><span>label</span>value</h3> </div>
    if (D.statCards && D.statCards.length) {
      var cards = qa('.bar1 h3, .bar1.bar2 h3');
      // .bar1.bar2 也匹配 .bar1，所以 qa('.bar1 h3') 已包含全部 6 个
      cards = qa('.bar1 h3');
      cards.forEach(function (h3, i) {
        var item = D.statCards[i];
        if (!item) return;
        var span = h3.querySelector('span');
        if (item.label && span) span.textContent = item.label;
        // h3 末尾有一个文本节点（"200个" 等），更新它
        // 简单做法：清掉 span 之后的文本，再 append
        if (item.value != null) {
          // 找到 span 后的文本节点
          var found = false;
          for (var n = h3.firstChild; n; n = n.nextSibling) {
            if (n.nodeType === 3 && n.textContent.trim() !== '') {
              if (found) { n.textContent = ''; }
              else { n.textContent = item.value; found = true; }
            } else if (n === span) {
              found = true;
            }
          }
          // 兜底：若没找到合适文本节点，直接 append
          if (!found) h3.appendChild(document.createTextNode(' ' + item.value));
        }
      });
    }

    // ====== 3. 3 个中部 icon 行（指标条）======
    // DOM: <li><div><p><img/>字段名称</p><div class="barnav">...<span>24356件</span></div></div><div class="zaf"><p>同比</p><p><span>34<i>%</i></span><img/></p></div></div></li>
    if (D.metrics && D.metrics.length) {
      var lis = qa('.sec li');
      lis.forEach(function (li, i) {
        var m = D.metrics[i];
        if (!m) return;
        var p = li.querySelector('p:first-of-type');
        if (p && m.label) {
          // 保留 <img>，替换文本
          var img = p.querySelector('img');
          p.textContent = m.label;
          if (img) p.insertBefore(img, p.firstChild);
        }
        var valSpan = li.querySelector('.barnav > span:last-child');
        if (valSpan && m.value != null) {
          valSpan.textContent = m.value + (m.unit || '');
        }
        // bar2 进度条宽度按 value 比例（最大值=100%）
        var bar2span = li.querySelector('.bar2 span');
        if (bar2span && m.value != null && m.max) {
          bar2span.style.width = Math.min(100, (m.value / m.max) * 100).toFixed(1) + '%';
        }
        // 同比
        var zafSpan = li.querySelector('.zaf span');
        if (zafSpan && m.yoy != null) {
          // 保留 <i>%</i>
          var iEl = zafSpan.querySelector('i');
          zafSpan.textContent = String(m.yoy);
          if (iEl) zafSpan.appendChild(iEl);
          var zafImg = li.querySelector('.zaf img');
          if (zafImg && m.trend) {
            zafImg.src = m.trend === 'down' ? 'images/down.png' : 'images/up.png';
          }
        }
      });
    }

    // ====== 4. 中心大数字 ======
    if (D.centerNumber != null) {
      var cn = q('.sqzs h1');
      if (cn) cn.textContent = D.centerNumber;
    }
    if (D.centerLabel) {
      var cl = q('.sqzs p');
      if (cl) cl.textContent = D.centerLabel;
    }

    // ====== 5. pe 图表标题（.tit01）======
    if (D.pieTitles && D.pieTitles.length) {
      var tits = qa('.tit01');
      tits.forEach(function (t, i) {
        if (D.pieTitles[i] != null) t.textContent = D.pieTitles[i];
      });
    }

    // ====== 6. 模块标题（.alltitle）======
    if (D.sectionTitles && D.sectionTitles.length) {
      var sts = qa('.alltitle');
      sts.forEach(function (s, i) {
        if (D.sectionTitles[i] != null) s.textContent = D.sectionTitles[i];
      });
    }

    // ====== 7. echarts 图表数据（按 id 匹配）======
    if (D.charts && D.charts.length && window.echarts) {
      D.charts.forEach(function (c) {
        if (!c.id) return;
        var el = document.getElementById(c.id);
        var inst = el && echarts.getInstanceByDom(el);
        if (!inst) return;
        var data = c.data || [];
        var opt = {};
        if (c.type === 'pie') {
          opt.series = [];
          // 多数饼图是单系列，覆盖 series[0].data
          opt.series[0] = { data: data.map(function (d) { return { name: d.name, value: d.value }; }) };
        } else if (c.type === 'bar' || c.type === 'line') {
          opt.xAxis = { data: data.map(function (d) { return d.name; }) };
          // 多系列支持：若 c.series 提供，按系列覆盖；否则单系列
          if (c.series && c.series.length) {
            opt.series = c.series.map(function (s) { return { name: s.name, data: s.data }; });
          } else {
            opt.series = [{ data: data.map(function (d) { return d.value; }) }];
          }
        } else if (c.option) {
          // 透传完整 ECharts option
          opt = c.option;
        }
        inst.setOption(opt);
      });
    }

    // ====== 8. 排行榜（5 项）======
    // DOM: .paim li > span(序号) .pmnav > p(title) .pmbar > span(width) > i(value)
    if (D.ranking && D.ranking.length) {
      var lis2 = qa('.paim li');
      var maxVal = 1;
      D.ranking.forEach(function (r) {
        if (r && r.value != null) maxVal = Math.max(maxVal, parseFloat(r.value) || 0);
      });
      lis2.forEach(function (li, i) {
        var r = D.ranking[i];
        if (!r) return;
        var p = li.querySelector('.pmnav p');
        if (p && r.name) p.textContent = r.name;
        var iEl = li.querySelector('.pmbar i');
        if (iEl && r.value != null) iEl.textContent = r.value;
        var barSpan = li.querySelector('.pmbar span');
        if (barSpan && r.value != null) {
          var w = (parseFloat(r.value) / maxVal) * 100;
          barSpan.style.width = w.toFixed(1) + '%';
        }
      });
    }

    console.log('[Generic Injector] data injected successfully');
  });
})();
