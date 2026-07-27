/**
 * DASHBOARD_DATA 运行时注入器
 * 模板: 某发电厂数据管理中心 (skeleton_power_plant)
 *
 * 注意：该模板不加载 jQuery，本注入器为原生 JS。
 * 锚点（data-f / data-ball）在内置源 index.html 中预先打好。
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
      console.warn('[PowerPlant Injector] DASHBOARD_DATA not found, using default demo data');
      return;
    }
    var D = window.DASHBOARD_DATA;

    function q(sel) { return document.querySelector(sel); }
    function qa(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }
    function esc(s) {
      return String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
    function chart(id) {
      var el = document.getElementById(id);
      return (el && window.echarts) ? echarts.getInstanceByDom(el) : null;
    }

    // ====== 1. 主标题 ======
    if (D.title) {
      var t = q('[data-f="title"]');
      if (t) t.textContent = D.title;
      document.title = D.title;
    }

    // ====== 2. 区块标题 ======
    if (D.sectionTitles) {
      ['unitStatus', 'consumption', 'nature', 'plantStats', 'windPlan', 'finance', 'trend', 'finish']
        .forEach(function (k) {
          var v = D.sectionTitles[k];
          if (!v) return;
          var el = q('[data-f="sec-' + k + '"]');
          if (!el) return;
          if (el.classList.contains('ptitle')) { el.textContent = v; return; }
          var pt = el.querySelector('.ptitle');
          if (pt) pt.textContent = v;
        });
    }

    // ====== 3. 温度 KPI（kpi-0..1，按数组顺序）======
    if (D.kpis && D.kpis.length) {
      qa('[data-f^="kpi-"]').forEach(function (box) {
        var idx = parseInt(box.getAttribute('data-f').split('-')[1], 10);
        var item = D.kpis[idx];
        if (!item) return;
        var lab = box.querySelector('.klabel');
        var val = box.querySelector('.kvalue');
        if (item.label && lab) lab.textContent = item.label;
        if (item.value != null && val) val.textContent = item.value;
      });
    }

    // ====== 4. 水波球（0-2 圆波，3-5 柱波）======
    if (D.liquidBalls && D.liquidBalls.length) {
      D.liquidBalls.forEach(function (b, i) {
        if (!b) return;
        var lq = q('[data-ball="' + i + '"]');
        if (!lq) return;
        if (b.label) {
          var lab = lq.querySelector('.lqlabel');
          if (lab) lab.textContent = b.label;
        }
        if (b.value == null) return;
        var v = Math.max(0, Math.min(100, parseFloat(b.value)));
        var txt = lq.querySelector('svg text');
        if (txt) txt.textContent = v.toFixed(2) + '%';
        var type = lq.getAttribute('data-ball-type');
        var rectY, waveG;
        if (type === 'rect') {
          // 柱形波拟合：rectY = 169.05 - 1.35 * v
          rectY = 169.05 - 1.35 * v;
          waveG = rectY - 3;
        } else {
          // 圆形波拟合：rectY = 104.07 - 0.8944 * v
          rectY = 104.07 - 0.8944 * v;
          waveG = rectY - 4;
        }
        // 注水矩形（clip 区域内带 fill 的那个 rect）
        var rects = lq.querySelectorAll('g[clip-path] rect');
        if (rects.length) rects[0].setAttribute('y', rectY.toFixed(1));
        var g = lq.querySelector('g[clip-path] g[transform]');
        if (g) {
          var x = type === 'rect' ? 23 : 0;
          g.setAttribute('transform', 'translate(' + x + ',' + waveG.toFixed(1) + ')');
        }
      });
    }

    // ====== 5. 某机组状态（c1 横向分组柱）======
    if (D.unitStatus) {
      var inst1 = chart('c1');
      if (inst1) {
        var opt1 = {
          tooltip: {
            trigger: 'axis', axisPointer: { type: 'shadow' },
            backgroundColor: 'rgba(18,14,52,0.92)', borderColor: 'rgba(124,108,255,0.45)',
            borderWidth: 1, textStyle: { color: '#eaf0ff', fontSize: 12 }
          }
        };
        if (D.unitStatus.categories) opt1.yAxis = { data: D.unitStatus.categories };
        if (D.unitStatus.series) {
          opt1.series = D.unitStatus.series.map(function (s, i) {
            return { name: s.name, data: s.data };
          });
          opt1.legend = { data: D.unitStatus.series.map(function (s) { return s.name; }) };
        }
        inst1.setOption(opt1);
      }
    }

    // ====== 6. 耗存分析（c3 月度柱）======
    if (D.consumption) {
      var inst3 = chart('c3');
      if (inst3) {
        var opt3 = {
          tooltip: {
            trigger: 'axis', axisPointer: { type: 'shadow' },
            backgroundColor: 'rgba(18,14,52,0.92)', borderColor: 'rgba(124,108,255,0.45)',
            borderWidth: 1, textStyle: { color: '#eaf0ff', fontSize: 12 }
          }
        };
        if (D.consumption.months) opt3.xAxis = { data: D.consumption.months };
        if (D.consumption.values) {
          opt3.series = [{ data: D.consumption.values }];
          var mx3 = Math.max.apply(null, D.consumption.values.map(function (v) { return parseFloat(v) || 0; }));
          opt3.yAxis = { max: Math.ceil(mx3 * 1.15 / 100) * 100 };
        }
        inst3.setOption(opt3);
      }
    }

    // ====== 7. 自然因素（c4 环形）======
    if (D.nature && D.nature.pieData) {
      var inst4 = chart('c4');
      if (inst4) inst4.setOption({
        tooltip: {
          trigger: 'item', formatter: '{b}: {c} ({d}%)',
          backgroundColor: 'rgba(18,14,52,0.92)', borderColor: 'rgba(124,108,255,0.45)',
          borderWidth: 1, textStyle: { color: '#eaf0ff', fontSize: 12 }
        },
        series: [{ data: D.nature.pieData }]
      });
    }

    // ====== 8. 各电厂发电量统计（c7 柱状）======
    if (D.plantStats) {
      var inst7 = chart('c7');
      if (inst7) {
        var opt7 = {
          tooltip: {
            trigger: 'axis', axisPointer: { type: 'shadow' },
            backgroundColor: 'rgba(18,14,52,0.92)', borderColor: 'rgba(124,108,255,0.45)',
            borderWidth: 1, textStyle: { color: '#eaf0ff', fontSize: 12 }
          }
        };
        if (D.plantStats.plants) opt7.xAxis = { data: D.plantStats.plants };
        if (D.plantStats.values) {
          opt7.series = [{ data: D.plantStats.values }];
          var mx7 = Math.max.apply(null, D.plantStats.values.map(function (v) { return parseFloat(v) || 0; }));
          opt7.yAxis = { max: Math.ceil(mx7 * 1.15 / 50) * 50 };
        }
        inst7.setOption(opt7);
      }
    }

    // ====== 9. 发电量趋势（c9 双折线）======
    if (D.trend) {
      var inst9 = chart('c9');
      if (inst9) {
        var opt9 = {
          tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(18,14,52,0.92)', borderColor: 'rgba(124,108,255,0.45)',
            borderWidth: 1, textStyle: { color: '#eaf0ff', fontSize: 12 }
          }
        };
        if (D.trend.dates) opt9.xAxis = { data: D.trend.dates };
        var s9 = [];
        if (D.trend.generation) s9.push({ name: '发电量', data: D.trend.generation });
        if (D.trend.usage) s9.push({ name: '厂用电量', data: D.trend.usage });
        if (s9.length) opt9.series = s9;
        inst9.setOption(opt9);
      }
    }

    // ====== 10. 风电计划完成情况（c8 模板空面板，注入器负责初始化）======
    if (D.windPlan && D.windPlan.pieData && window.echarts) {
      var el8 = document.getElementById('c8');
      if (el8) {
        var inst8 = echarts.getInstanceByDom(el8) || echarts.init(el8);
        inst8.setOption({
          color: ['#35e0e0', 'rgba(120,130,200,0.35)'],
          tooltip: {
            trigger: 'item', backgroundColor: 'rgba(18,14,52,0.92)',
            borderColor: 'rgba(124,108,255,0.45)', borderWidth: 1, padding: [8, 12],
            textStyle: { color: '#eaf0ff', fontSize: 12 },
            formatter: function (p) { return p.marker + ' ' + p.name + '：' + p.percent.toFixed(1) + '%'; }
          },
          legend: { bottom: 6, left: 'center', icon: 'rect', itemWidth: 10, itemHeight: 10,
                    textStyle: { color: '#cfd8ff', fontSize: 12 } },
          series: [{
            type: 'pie', radius: ['52%', '72%'], center: ['50%', '44%'],
            label: { color: '#dfe6ff', fontSize: 12.5,
                     formatter: function (p) { return p.name + '\n' + p.percent.toFixed(1) + '%'; } },
            labelLine: { length: 10, length2: 8, lineStyle: { color: 'rgba(210,220,255,0.5)' } },
            itemStyle: { borderColor: '#17103f', borderWidth: 2 },
            data: D.windPlan.pieData
          }]
        });
        window.addEventListener('resize', function () { inst8.resize(); });
      }
    }

    // ====== 11. 财务信息表 ======
    if (D.financeTable) {
      var ft = q('[data-f="financeTable"]');
      if (ft) {
        if (D.financeTable.headers) {
          var th = ft.querySelector('thead tr');
          if (th) th.innerHTML = D.financeTable.headers.map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('');
        }
        if (D.financeTable.rows) {
          var tb = ft.querySelector('tbody');
          if (tb) {
            tb.innerHTML = D.financeTable.rows.map(function (r) {
              return '<tr>' + r.map(function (c) { return '<td>' + esc(c) + '</td>'; }).join('') + '</tr>';
            }).join('');
          }
        }
      }
    }

    console.log('[PowerPlant Injector] data injected successfully');
  });
})();
