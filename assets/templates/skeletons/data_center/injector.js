/**
 * DASHBOARD_DATA 运行时注入器
 * 模板: 酷炫智能大屏数据中心 (data_center)
 *
 * 原模板 (skeleton.html 内联 <script>) 已在 chartmain/chartmain_zhe/chartmain_bing
 * 三个容器上 init 了 echarts 实例并 setOption demo 数据。本注入器在 </body> 前运行，
 * 通过 echarts.getInstanceByDom() + setOption() 覆盖数据，并更新 DOM 文本。
 *
 * 数据 schema（详见 assets/templates/data/data_center/README.md）：
 *   title                页面主标题
 *   statCards[4]         顶部 4 个 KPI 卡 {label, value, unit, sublabel1, sublabel2}
 *   sectionTitles[6]     6 个 <h3> 模块标题（按 DOM 顺序）
 *   charts[]             图表数组 {id:"chartmain"|"chartmain_zhe"|"chartmain_bing", type, ...}
 *   ranking[6]           6 项排行榜 {name, percent}
 *   miniStats[6]         6 个小统计盒 {label, value}
 *   table                数据表 {headers[5], rows[][]}
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
      console.warn('[DataCenter Injector] DASHBOARD_DATA not found');
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
      var t = q('.title');
      if (t) t.textContent = D.title;
      document.title = D.title;
    }

    // ====== 2. 4 个 KPI 卡（.leftMain_top .liIn）======
    // DOM: <h3>label</h3> <p class="shu"><span class="shuN">value</span><i>unit</i></p>
    //      <div class="zi"><span class="span1">sub1</span><span>sub2</span></div>
    if (D.statCards && D.statCards.length) {
      var cards = qa('.leftMain_top .liIn');
      cards.forEach(function (box, i) {
        var item = D.statCards[i];
        if (!item) return;
        var h3 = box.querySelector('h3');
        if (h3 && item.label) h3.textContent = item.label;
        if (item.value != null) {
          var shuSpan = box.querySelector('.shu span');
          if (shuSpan) shuSpan.textContent = item.value;
        }
        if (item.unit != null) {
          var unitI = box.querySelector('.shu i');
          if (unitI) unitI.textContent = item.unit;
        }
        var spans = box.querySelectorAll('.zi span');
        if (item.sublabel1 != null && spans[0]) spans[0].textContent = item.sublabel1;
        if (item.sublabel2 != null && spans[1]) spans[1].textContent = item.sublabel2;
      });
    }

    // ====== 3. 6 个 <h3> 模块标题 ======
    // DOM 顺序：chartmain / 排行榜 / chartmain_zhe / miniStats / chartmain_bing / 数据表
    if (D.sectionTitles && D.sectionTitles.length) {
      // 所有非 statCard 的 h3（即不在 .leftMain_top 内的）
      var allH3 = qa('h3');
      var secH3 = allH3.filter(function (h) {
        return !h.closest('.leftMain_top');
      });
      secH3.forEach(function (h, i) {
        if (D.sectionTitles[i] != null) h.textContent = D.sectionTitles[i];
      });
    }

    // ====== 4. ECharts 图表 ======
    if (D.charts && D.charts.length && window.echarts) {
      D.charts.forEach(function (c) {
        if (!c.id) return;
        var el = document.getElementById(c.id);
        var inst = el && echarts.getInstanceByDom(el);
        if (!inst) return;
        var opt = {};
        if (c.type === 'pie') {
          // chartmain_bing 饼图
          opt.series = [{
            data: (c.data || []).map(function (d) { return { name: d.name, value: d.value }; })
          }];
        } else if (c.type === 'bar') {
          // chartmain 柱图（series[0]=shadow, series[1]=actual）
          if (c.data) {
            opt.xAxis = { data: c.data.map(function (d) { return d.name; }) };
            opt.series = [{ data: [] }, { data: c.data.map(function (d) { return d.value; }) }];
          } else if (c.series) {
            opt.series = c.series.map(function (s) { return { name: s.name, data: s.data }; });
          }
        } else if (c.type === 'line') {
          // chartmain_zhe 折线（多系列）
          if (c.data) {
            opt.xAxis = { data: c.data.map(function (d) { return d.name; }) };
            opt.series = [{ data: c.data.map(function (d) { return d.value; }) }];
          } else if (c.series) {
            if (c.categories) opt.xAxis = { data: c.categories };
            opt.series = c.series.map(function (s) { return { name: s.name, data: s.data }; });
          }
        } else if (c.option) {
          opt = c.option;
        }
        inst.setOption(opt);
      });
    }

    // ====== 5. 排行榜 6 项（.biaoge_paiIn > li）======
    // DOM: <li><div class="liIn_left"><span class="bot"></span><span class="zi">第N名</span></div>
    //         <div class="liIn_line"><div class="line_lineIn" style="width:X%"></div></div>
    //         <p class="num">X%</p></div></li>
    if (D.ranking && D.ranking.length) {
      var lis = qa('.biaoge_paiIn > li');
      lis.forEach(function (li, i) {
        var r = D.ranking[i];
        if (!r) return;
        var zi = li.querySelector('.liIn_left .zi');
        if (zi && r.name) zi.textContent = r.name;
        var lineIn = li.querySelector('.line_lineIn');
        var num = li.querySelector('.num');
        var pct = parseFloat(r.percent);
        if (!isNaN(pct)) {
          if (lineIn) lineIn.style.width = pct + '%';
          if (num) num.textContent = pct + '%';
        }
      });
    }

    // ====== 6. 6 个小统计盒（.biaoge_bi li）======
    // DOM: <li><div class="liIn"><p class="shu shuN">23</p><p class="zi">label</p></div></li>
    if (D.miniStats && D.miniStats.length) {
      var ms = qa('.biaoge_bi .liIn');
      ms.forEach(function (box, i) {
        var item = D.miniStats[i];
        if (!item) return;
        var shu = box.querySelector('.shu');
        if (shu && item.value != null) shu.textContent = item.value;
        var zi = box.querySelector('.zi');
        if (zi && item.label) zi.textContent = item.label;
      });
    }

    // ====== 7. 数据表（.biaoge_list）======
    // DOM: <ul class="ul_title"><li>...</li>×5</ul>  表头
    //      <div class="ul_list"><div class="ul_listIn"><ul class="ul_con"><li>...</li>×5</ul>...</div></div>
    if (D.table) {
      if (D.table.headers && D.table.headers.length) {
        var titleLis = qa('.ul_title li');
        titleLis.forEach(function (li, i) {
          if (D.table.headers[i] != null) li.textContent = D.table.headers[i];
        });
      }
      if (D.table.rows && D.table.rows.length) {
        var cons = qa('.ul_con');
        cons.forEach(function (ul, i) {
          var row = D.table.rows[i];
          if (!row) return;
          var cells = ul.querySelectorAll('li');
          cells.forEach(function (cell, j) {
            if (row[j] != null) cell.textContent = row[j];
          });
        });
      }
    }

    console.log('[DataCenter Injector] data injected successfully');
  });
})();
