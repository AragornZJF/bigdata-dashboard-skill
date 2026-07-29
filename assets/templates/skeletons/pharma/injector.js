/**
 * DASHBOARD_DATA 运行时注入器
 * 模板: 药品企业大数据监管平台 (pharma)
 *
 * 注意：该模板不加载 jQuery，本注入器为原生 JS。
 * 锚点（data-f）在内置源 index.html 中预先打好；
 * KPI 数值定位用模板自带的 changeText-* span（取非空的那个）。
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
      console.warn('[Pharma Injector] DASHBOARD_DATA not found, using default demo data');
      return;
    }
    var D = window.DASHBOARD_DATA;

    function q(sel) { return document.querySelector(sel); }
    function qa(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }
    function chart(id) {
      var el = document.getElementById(id);
      return (el && window.echarts) ? echarts.getInstanceByDom(el) : null;
    }
    // 找块内"有文字"的最内层 strong/span 并替换（保留外层排版）
    function setRichText(box, text) {
      if (!box || text == null) return;
      var cands = box.querySelectorAll('strong, span');
      var target = null;
      for (var i = cands.length - 1; i >= 0; i--) {
        if (cands[i].textContent.replace(/ /g, '').trim()) { target = cands[i]; break; }
      }
      (target || box).textContent = text;
    }
    // KPI 块：label 在第一个 <p>，数值在非空 changeText span
    function setKpi(box, item) {
      if (!box || !item) return;
      if (item.label) {
        var ps = box.querySelectorAll('.rt-in p');
        if (ps.length) setRichText(ps[0], item.label);
      }
      if (item.value != null) {
        var spans = box.querySelectorAll('span[id^="changeText-"]');
        for (var i = 0; i < spans.length; i++) {
          if (spans[i].textContent.trim()) { spans[i].textContent = String(item.value); return; }
        }
        // 全为空则写第一个
        if (spans.length) spans[0].textContent = String(item.value);
      }
    }

    // ====== 1. 主标题 ======
    if (D.title) {
      setRichText(q('[data-f="title"]'), D.title);
      document.title = D.title;
    }

    // ====== 2. 区块标题 ======
    if (D.sectionTitles) {
      ['deviceClass', 'yearlyCheck', 'checkDetail', 'sampleTotal', 'unqualified', 'registration']
        .forEach(function (k) {
          if (D.sectionTitles[k]) setRichText(q('[data-f="sec-' + k + '"]'), D.sectionTitles[k]);
        });
    }

    // ====== 3. 左侧分类 KPI（kpi-0..3）======
    if (D.classKpis && D.classKpis.length) {
      qa('[data-f^="kpi-"]').forEach(function (box) {
        var idx = parseInt(box.getAttribute('data-f').split('-')[1], 10);
        setKpi(box, D.classKpis[idx]);
      });
    }

    // ====== 4. 中央 6 块 KPI（ckpi-0..5）======
    if (D.centerKpis && D.centerKpis.length) {
      qa('[data-f^="ckpi-"]').forEach(function (box) {
        var idx = parseInt(box.getAttribute('data-f').split('-')[1], 10);
        setKpi(box, D.centerKpis[idx]);
      });
    }

    // ====== 5. 今年抽检详情（chart_804928 环形，百分比按合计动态算）======
    if (D.checkDetailPie && D.checkDetailPie.pieData) {
      var inst0 = chart('chart_804928');
      if (inst0) {
        var total = D.checkDetailPie.pieData.reduce(function (s, d) { return s + (parseFloat(d.value) || 0); }, 0) || 1;
        inst0.setOption({
          legend: { data: D.checkDetailPie.pieData.map(function (d) { return d.name; }) },
          series: [{
            data: D.checkDetailPie.pieData,
            label: { formatter: function (p) { return (p.value / total * 100).toFixed(2) + '%'; } }
          }]
        });
      }
    }

    // ====== 6. 历年抽检次数（chart_302528 分组柱）======
    if (D.yearlyBar) {
      var inst1 = chart('chart_302528');
      if (inst1) {
        var opt1 = {};
        if (D.yearlyBar.years) opt1.xAxis = { data: D.yearlyBar.years };
        if (D.yearlyBar.series) {
          opt1.series = D.yearlyBar.series.map(function (s) { return { data: s.data }; });
          opt1.legend = { data: D.yearlyBar.series.map(function (s) { return s.name; }) };
        }
        inst1.setOption(opt1);
      }
    }

    // ====== 7. 抽查样品总量（chart_256128 面积折线）======
    if (D.sampleLine) {
      var inst2 = chart('chart_256128');
      if (inst2) {
        var opt2 = {};
        if (D.sampleLine.years) opt2.xAxis = { data: D.sampleLine.years };
        if (D.sampleLine.values) opt2.series = [{ data: D.sampleLine.values }];
        inst2.setOption(opt2);
      }
    }

    // ====== 8. 不合格药品（chart_939712 瀑布图，assist/合计重算）======
    if (D.waterfall && D.waterfall.years && D.waterfall.increase) {
      var inst3 = chart('chart_939712');
      if (inst3) {
        var years = D.waterfall.years;
        var inc = D.waterfall.increase.map(function (v) { return parseFloat(v) || 0; });
        var dec = (D.waterfall.decrease || inc.map(function () { return 0; }))
          .map(function (v) { return parseFloat(v) || 0; });
        var assist = [0], run = 0;
        for (var i = 0; i < years.length; i++) {
          run += (inc[i] || 0) - (dec[i] || 0);
          assist.push(run);
        }
        // 结构：[年份..., 合计]，assist/inc/dec 末位补 0，合计列存累计值
        var cats = years.concat(['合计']);
        var zeros = years.map(function () { return 0; });
        inst3.setOption({
          xAxis: { data: cats },
          series: [
            { data: assist.slice(0, years.length).concat([0]) },   // assist
            { data: inc.concat([0]) },                             // 增加
            { data: dec.concat([0]) },                             // 减少
            { data: zeros.concat([run]) }                          // 合计
          ]
        });
      }
    }

    // ====== 9. 注册申请（chart_870976 堆叠横向柱）======
    if (D.registrationBar) {
      var inst4 = chart('chart_870976');
      if (inst4) {
        var opt4 = {};
        if (D.registrationBar.years) opt4.yAxis = { data: D.registrationBar.years };
        if (D.registrationBar.series) {
          opt4.series = D.registrationBar.series.map(function (s) { return { data: s.data }; });
          opt4.legend = { data: D.registrationBar.series.map(function (s) { return s.name; }) };
        }
        inst4.setOption(opt4);
      }
    }

    console.log('[Pharma Injector] data injected successfully');
  });
})();
