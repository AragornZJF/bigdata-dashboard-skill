/**
 * DASHBOARD_DATA 运行时注入器
 * 模板: 智慧城市综合监管一体化平台 (skeleton_smart_city)
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
      console.warn('[SmartCity Injector] DASHBOARD_DATA not found, using default demo data');
      return;
    }
    var D = window.DASHBOARD_DATA;

    function q(sel) { return document.querySelector(sel); }
    function qa(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }
    function esc(s) {
      return String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
    function setRichText(box, text) {
      // 优先改最内层 span（保留外层排版），否则直接改 box
      if (!box || text == null) return;
      var s = box.querySelector('.s1') || box.querySelector('span');
      (s || box).textContent = text;
    }

    // ====== 1. 主标题 ======
    if (D.title) {
      setRichText(q('[data-f="title"]'), D.title);
      document.title = D.title;
    }

    // ====== 2. 区块标题 ======
    if (D.sectionTitles) {
      var secMap = {
        internal: 'sec-internal', industry: 'sec-industry', departments: 'sec-departments',
        rectData: 'sec-rectdata', overall: 'sec-overall', matters: 'sec-matters',
        objectTypes: 'sec-objecttypes', alarms: 'sec-alarms'
      };
      Object.keys(secMap).forEach(function (k) {
        if (D.sectionTitles[k]) setRichText(q('[data-f="' + secMap[k] + '"]'), D.sectionTitles[k]);
      });
    }

    // ====== 3. 整体指标 KPI（kpi-0..4，按数组顺序）======
    if (D.kpis && D.kpis.length) {
      qa('[data-f^="kpi-"]').forEach(function (box) {
        var idx = parseInt(box.getAttribute('data-f').split('-')[1], 10);
        var item = D.kpis[idx];
        if (!item) return;
        var ps = box.querySelectorAll('.rt-in p');
        if (!ps.length) return;
        if (item.label) setRichText(ps[0], item.label);
        if (item.value != null) {
          var vp = ps[ps.length - 1];
          vp.innerHTML = '<strong style="color:#daefff;font-size:28px;font-weight:700;">' + esc(item.value) + '</strong>';
        }
      });
    }

    // ====== 4. 内部指标评价 · 液位球（水波球）======
    if (D.liquidBalls && D.liquidBalls.length) {
      D.liquidBalls.forEach(function (b, i) {
        if (!b) return;
        if (b.label) setRichText(q('[data-f="ball-label-' + i + '"]'), b.label);
        if (b.value != null) {
          var v = Math.max(0, Math.min(100, parseFloat(b.value)));
          setRichText(q('[data-f="ball-pct-' + i + '"]'), v.toFixed(2) + '%');
          var lq = q('[data-ball="' + i + '"]');
          if (lq) {
            // 模板波位拟合：rectY = 110.10 - 0.8975 * v （与原始 4 球像素一致）
            var rectY = 110.10 - 0.8975 * v;
            var rect = lq.querySelector('rect');
            if (rect) rect.setAttribute('y', rectY.toFixed(1));
            var gs = lq.querySelectorAll('g[transform]');
            if (gs[0]) gs[0].setAttribute('transform', 'translate(0,' + (rectY - 6).toFixed(1) + ')');
            if (gs[1]) gs[1].setAttribute('transform', 'translate(0,' + (rectY - 3).toFixed(1) + ')');
          }
        }
      });
    }

    // ====== 5. 中心进度百分比 ======
    if (D.centerProgress && D.centerProgress.value != null) {
      var cp = q('[data-f="center-progress"]');
      if (cp) {
        var ps = cp.querySelectorAll('.rt-in p');
        if (ps.length) {
          var target = ps[0].querySelector('strong') || ps[0].querySelector('span') || ps[0];
          target.textContent = D.centerProgress.value + '%';
        }
      }
    }

    // ====== 6. 产业结构对比 · 横向柱状图 ======
    if (D.industryBar && window.echarts) {
      var elBar = document.getElementById('chart_876930');
      var instBar = elBar && echarts.getInstanceByDom(elBar);
      if (instBar) {
        var optBar = {
          tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            backgroundColor: 'rgba(13, 27, 62, 0.92)',
            borderColor: '#00f0ff',
            borderWidth: 1,
            textStyle: { color: '#daefff', fontSize: 12 }
          }
        };
        if (D.industryBar.categories) optBar.yAxis = { data: D.industryBar.categories };
        if (D.industryBar.values && D.industryBar.values.length) {
          optBar.series = [{ data: D.industryBar.values }];
          var mx = Math.max.apply(null, D.industryBar.values.map(function (v) { return parseFloat(v) || 0; }));
          optBar.xAxis = { max: Math.ceil(mx * 1.15), interval: Math.ceil(mx * 1.15 / 4) };
        }
        instBar.setOption(optBar);
      }
    }

    // ====== 7. 监管对象类型 · 环形饼图（百分比按合计动态计算）======
    if (D.objectPie && D.objectPie.pieData && window.echarts) {
      var elPie = document.getElementById('chart_407810');
      var instPie = elPie && echarts.getInstanceByDom(elPie);
      if (instPie) {
        var total = D.objectPie.pieData.reduce(function (s, d) { return s + (parseFloat(d.value) || 0); }, 0) || 1;
        instPie.setOption({
          tooltip: {
            trigger: 'item',
            formatter: '{b}: {c} ({d}%)',
            backgroundColor: 'rgba(13, 27, 62, 0.92)',
            borderColor: '#00f0ff',
            borderWidth: 1,
            textStyle: { color: '#daefff', fontSize: 12 }
          },
          legend: { data: D.objectPie.legendNames || D.objectPie.pieData.map(function (d) { return d.name; }) },
          series: [{
            data: D.objectPie.pieData,
            label: { formatter: function (p) { return (p.value / total * 100).toFixed(2) + '%'; } }
          }]
        });
      }
    }

    // ====== 8. 实时告警表（状态自动着色）======
    if (D.alarmTable) {
      var at = q('[data-f="alarmTable"]');
      if (at) {
        if (D.alarmTable.headers) {
          var th = at.querySelector('thead tr');
          if (th) th.innerHTML = D.alarmTable.headers.map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('');
        }
        if (D.alarmTable.rows) {
          var colorMap = { '处理中': '#f0a34e', '未处理': '#ef6a5a', '已解决': '#36d6c3' };
          var tb = at.querySelector('tbody');
          if (tb) {
            tb.innerHTML = D.alarmTable.rows.map(function (r) {
              var status = r[4] || '';
              var color = colorMap[status] || '#dcebff';
              return '<tr><td>' + esc(r[0]) + '</td><td>' + esc(r[1]) + '</td><td>' + esc(r[2]) +
                '</td><td>' + esc(r[3]) + '</td><td><span style="color:' + color +
                ';font-weight:600;">' + esc(status) + '</span></td></tr>';
            }).join('');
          }
        }
      }
    }

    // ====== 9. 发现问题及整改数据表 ======
    if (D.rectTable) {
      var rt = q('[data-f="rectTable"]');
      if (rt) {
        if (D.rectTable.headers) {
          var th2 = rt.querySelector('thead tr');
          if (th2) th2.innerHTML = D.rectTable.headers.map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('');
        }
        if (D.rectTable.rows) {
          var tb2 = rt.querySelector('tbody');
          if (tb2) {
            tb2.innerHTML = D.rectTable.rows.map(function (r) {
              return '<tr>' + r.map(function (c) { return '<td>' + esc(c) + '</td>'; }).join('') + '</tr>';
            }).join('');
          }
        }
      }
    }

    // ====== 10. 事件相关部门词云（按顺序替换现有词）======
    if (D.wordCloud && D.wordCloud.length) {
      qa('[data-f="wordCloud"] .wc').forEach(function (sp, i) {
        if (D.wordCloud[i]) sp.textContent = D.wordCloud[i];
      });
    }

    console.log('[SmartCity Injector] data injected successfully');
  });
})();
