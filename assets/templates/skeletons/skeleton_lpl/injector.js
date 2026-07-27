/**
 * DASHBOARD_DATA 运行时注入器
 * 模板: 英雄联盟LPL比赛数据可视化 (skeleton_lpl)
 *
 * 原模板 (js.js) 已在 document.ready 初始化所有 echarts 实例（echart1-5、zb1-6）
 * 并 setOption demo 数据。本注入器在 </body> 前运行，按 DASHBOARD_DATA 覆盖。
 *
 * 数据 schema（详见 assets/templates/data/skeleton_lpl/README.md）：
 *   title              页面主标题
 *   sectionTitles[]    .alltitle 模块标题（按 DOM 顺序）
 *   heroData[]         英雄数据轮播 [{name, appearances, pickRate, winRate}]
 *   gaugeLabels[6]     zb1-6 标签（"TES\n胜率最高"，\n 转 <br>）
 *   gaugeValues[6]     zb1-6 中心数值
 *   teamTable          战队排行榜 {headers, rows}
 *   playerTable        个人排行榜 {headers, rows}
 *   charts[]           ECharts 数据 [{id, ...}]
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
      console.warn('[LPL Injector] DASHBOARD_DATA not found');
      return;
    }
    var D = window.DASHBOARD_DATA;

    function q(sel) { return document.querySelector(sel); }
    function qa(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }
    function esc(s) {
      return String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    // ====== 1. 页面主标题 ======
    if (D.title) {
      var h1 = q('.head h1') || q('h1');
      if (h1) h1.textContent = D.title;
      document.title = D.title;
    }

    // ====== 2. 模块标题 .alltitle ======
    if (D.sectionTitles && D.sectionTitles.length) {
      var ts = qa('.alltitle');
      ts.forEach(function (el, i) {
        if (D.sectionTitles[i] != null) el.textContent = D.sectionTitles[i];
      });
    }

    // ====== 3. 英雄数据轮播 ======
    // DOM: .wrap > ul > li > p > span ×4（英雄名 / 出场次数 / Pick比率 / 胜率）
    if (D.heroData && D.heroData.length) {
      var lis = qa('.wrap > ul > li');
      lis.forEach(function (li, i) {
        var h = D.heroData[i];
        if (!h) return;
        var spans = li.querySelectorAll('p span');
        if (h.name != null && spans[0]) spans[0].textContent = h.name;
        if (h.appearances != null && spans[1]) spans[1].textContent = h.appearances;
        if (h.pickRate != null && spans[2]) spans[2].textContent = h.pickRate;
        if (h.winRate != null && spans[3]) spans[3].textContent = h.winRate;
      });
    }

    // ====== 4. zb1-6 标签 + 中心数值 ======
    // DOM: <div class="zbN"><span>NAME<br>SUBLABEL</span><div id="zbN"></div></div>
    if (D.gaugeLabels && D.gaugeLabels.length) {
      ['zb1', 'zb2', 'zb3', 'zb4', 'zb5', 'zb6'].forEach(function (id, i) {
        var lab = D.gaugeLabels[i];
        if (lab == null) return;
        var div = q('.' + id + ' > span');
        if (div) {
          // 支持 "NAME\nSUBLABEL" 或纯字符串
          var parts = String(lab).split(/\n|\s*\/\s*/);
          if (parts.length > 1) {
            div.innerHTML = esc(parts[0]) + '<br>' + esc(parts.slice(1).join(' '));
          } else {
            div.textContent = lab;
          }
        }
      });
    }
    if (D.gaugeValues && D.gaugeValues.length && window.echarts) {
      ['zb1', 'zb2', 'zb3', 'zb4', 'zb5', 'zb6'].forEach(function (id, i) {
        var v = D.gaugeValues[i];
        if (v == null) return;
        var el = document.getElementById(id);
        var inst = el && echarts.getInstanceByDom(el);
        if (!inst) return;
        // 原 zb 配置：series[0].data[0] 是 {value:胜利, name:'胜利', label:{formatter:val}}
        // 我们更新第一个 data 点的 value + label.formatter，第二个点（loss）按 100-val 模拟
        var numVal = parseFloat(v);
        var opt = {
          series: [{
            data: [
              { value: numVal, name: '胜利', label: { normal: { formatter: numVal + '' } } },
              { value: Math.max(0, 100 - numVal), name: '战败' }
            ]
          }]
        };
        inst.setOption(opt);
      });
    }

    // ====== 5. 战队排行榜表 ======
    if (D.teamTable) {
      var t1 = qa('.boxall')[qa('.boxall').length - 3] || null;
      // 更稳妥：定位含"战队排行榜"的 alltitle 之后的 table1
      var tables = qa('.table1');
      if (tables[0]) fillTable(tables[0], D.teamTable);
    }
    // ====== 6. 个人排行榜表 ======
    if (D.playerTable) {
      var tables2 = qa('.table1');
      if (tables2[1]) fillTable(tables2[1], D.playerTable);
    }

    function fillTable(table, def) {
      if (def.headers) {
        var ths = table.querySelectorAll('tr:first-child th');
        ths.forEach(function (th, i) {
          if (def.headers[i] != null) th.textContent = def.headers[i];
        });
      }
      if (def.rows) {
        var trs = table.querySelectorAll('tr');
        // 跳过第 0 行（表头）
        for (var r = 1; r < trs.length; r++) {
          var row = def.rows[r - 1];
          if (!row) continue;
          var tds = trs[r].querySelectorAll('td');
          for (var c = 0; c < tds.length; c++) {
            if (row[c] != null) {
              // td 内可能含 <span> 或 <br>，简单策略：保留第一个 span（排名徽标），其他用文本
              var span = tds[c].querySelector('span');
              if (c === 0 && span) {
                span.textContent = row[c];
              } else {
                tds[c].textContent = row[c];
              }
            }
          }
        }
      }
    }

    // ====== 7. ECharts 图表（echart1-5，按 id 匹配）======
    if (D.charts && D.charts.length && window.echarts) {
      D.charts.forEach(function (c) {
        if (!c.id) return;
        var el = document.getElementById(c.id);
        var inst = el && echarts.getInstanceByDom(el);
        if (!inst) return;
        var opt = {};
        if (c.option) {
          opt = c.option;
        } else if (c.type === 'pie') {
          opt.series = [{
            data: (c.data || []).map(function (d) { return { name: d.name, value: d.value }; })
          }];
          if (c.legend) opt.legend = { data: c.legend };
        } else if (c.type === 'bar' || c.type === 'line') {
          if (c.categories) opt.xAxis = { data: c.categories };
          if (c.series) {
            opt.series = c.series.map(function (s) { return { name: s.name, data: s.data }; });
            opt.legend = { data: c.series.map(function (s) { return s.name; }) };
          } else if (c.data) {
            opt.xAxis = { data: c.data.map(function (d) { return d.name; }) };
            opt.series = [{ data: c.data.map(function (d) { return d.value; }) }];
          }
        }
        inst.setOption(opt);
      });
    }

    console.log('[LPL Injector] data injected successfully');
  });
})();
