/**
 * 智能看板新中心 - 运行时数据注入器
 *
 * 源模板（jquery + ECharts，3 栏布局）图表在 index.js / mymap.js 的 IIFE 中初始化，
 * 早于本注入器执行（构建把 DASHBOARD_DATA + 本注入器追加在最后一个 </body> 前）。
 * 故用 echarts.getInstanceByDom() 取已初始化实例 setOption 更新；KPI/表格/排行榜走 DOM。
 *
 * 数据契约（window.DASHBOARD_DATA，友好键）见 data/skeleton_smart_dashboard/README.md。
 * 未提供的键保持源默认值（演示数据）。order/sales 的 tab 切换仍用源内置演示序列
 * （自动轮播已在 index.js 中移除，保证初始注入数据稳定显示）。
 */
(function () {
  function setH4(sel, val) {
    if (val == null) return;
    var el = $(sel).find('h4');
    if (el.length) el.text(val);
  }

  // 更新 marquee 表格（保留无缝滚动：双份复制）
  function fillMarquee($marquee, rows) {
    if (!rows || !rows.length) return;
    var html = '';
    // 双份以维持 CSS 无缝滚动
    for (var pass = 0; pass < 2; pass++) {
      rows.forEach(function (r) {
        html += '<div class="row">';
        r.forEach(function (c) { html += '<span class="col">' + c + '</span>'; });
        html += '<span class="icon-dot"></span></div>';
      });
    }
    $marquee.html(html);
  }

  function apply(data) {
    if (!data || typeof data !== 'object') return;
    if (typeof window.$ === 'undefined') return; // jquery 未就绪则放弃

    // 1) 标题
    if (typeof data.title === 'string') document.title = data.title;

    // 2) overview 4 KPI
    if (Array.isArray(data.overview)) {
      $('.overview .inner .item').each(function (i, el) {
        var it = data.overview[i];
        if (it) $(el).find('h4').text(it.value != null ? it.value : it);
      });
    }

    // 3) 点位分布（pie + 2 KPI）
    if (data.point) {
      setH4('.point', data.point.total);
      if (data.point.monthNew != null) $('.point .data .item:eq(1) h4').text(data.point.monthNew);
      if (Array.isArray(data.point.pie)) {
        var pieEl = $('.point .pie')[0];
        var inst = pieEl && echarts.getInstanceByDom(pieEl);
        if (inst) inst.setOption({ series: [{ data: data.point.pie }] });
      }
    }

    // 4) 监控表（故障 / 异常）
    if (data.monitor) {
      var cs = $('.monitor .content');
      if (data.monitor.fault) fillMarquee($(cs[0]).find('.marquee'), data.monitor.fault);
      if (data.monitor.exception) fillMarquee($(cs[1]).find('.marquee'), data.monitor.exception);
    }

    // 5) 用户统计（bar + 2 KPI）
    if (data.users) {
      setH4('.users', data.users.total);
      if (data.users.monthNew != null) $('.users .data .item:eq(1) h4').text(data.users.monthNew);
      var barEl = $('.users .bar')[0];
      var binst = barEl && echarts.getInstanceByDom(barEl);
      if (binst) {
        var patch = {};
        if (Array.isArray(data.users.cities)) patch.xAxis = [{ data: data.users.cities }];
        if (Array.isArray(data.users.data)) patch.series = [{ data: data.users.data }];
        if (Object.keys(patch).length) binst.setOption(patch);
      }
    }

    // 6) 订单（初始 KPI；tab 切换走源内置演示序列）
    if (data.order && data.order.day365) {
      $('.order .item h4:eq(0)').text(data.order.day365.orders);
      $('.order .item h4:eq(1)').text(data.order.day365.amount);
    }

    // 7) 销售额折线（2 系列，初始视图 = year）
    if (data.sales) {
      var lineEl = $('.sales .line')[0];
      var linst = lineEl && echarts.getInstanceByDom(lineEl);
      if (linst) {
        var arr = data.sales.year || data.sales[Object.keys(data.sales)[0]];
        if (Array.isArray(arr) && arr.length >= 2) {
          linst.setOption({ series: [{ name: '预期销售额', data: arr[0] }, { name: '实际销售额', data: arr[1] }] });
        }
      }
    }

    // 8) 渠道分布（4 百分比）
    if (Array.isArray(data.channel)) {
      $('.channel .data .item').each(function (i, el) {
        var it = data.channel[i];
        if (!it) return;
        $(el).find('h4').html(it.value + ' <small>%</small>');
      });
    }

    // 9) 一季度销售进度（gauge 标签 + 2 KPI）
    if (data.quarter) {
      if (data.quarter.percent != null) $('.quarter .box .label').html(data.quarter.percent + '<small> %</small>');
      if (data.quarter.sales != null) $('.quarter .data .item:eq(0) h4').text(data.quarter.sales);
      if (data.quarter.growth != null) $('.quarter .data .item:eq(1) h4').text(data.quarter.growth);
    }

    // 10) 排行榜（全国热榜 top3 + 各省热销 sup）
    if (data.ranking) {
      if (Array.isArray(data.ranking.hot)) {
        var cup = ['icon-cup1', 'icon-cup2', 'icon-cup3'];
        var col = ['#d93f36', '#68d8fe', '#4c9bfd'];
        var h = '';
        data.ranking.hot.slice(0, 3).forEach(function (it, i) {
          h += '<li><i class="' + (it.icon || cup[i]) + '" style="color: ' + (it.color || col[i]) + ';"></i>' + it.name + '</li>';
        });
        $('.top .all ul').html(h);
      }
      if (Array.isArray(data.ranking.provinces)) {
        var p = '';
        data.ranking.provinces.forEach(function (it) {
          p += '<li><span>' + it.name + '</span><span>' + it.value + ' <s class="' + (it.up ? 'icon-up' : 'icon-down') + '"></s></span></li>';
        });
        $('.top .province .sup').html(p);
        // 触发一次高亮（与源交互一致）
        try { $('.province .sup li').eq(0).mouseenter(); } catch (e) {}
      }
    }
  }

  function readAndApply() {
    var data = window.DASHBOARD_DATA;
    if (!data) {
      var tag = document.getElementById('dashboard-data');
      if (tag) { try { data = JSON.parse(tag.textContent || '{}'); } catch (e) { data = null; } }
    }
    if (data) apply(data);
  }

  // index.js/mymap.js 在本注入器之前同步执行；延迟到 DOM 完成后稳妥覆盖。
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(readAndApply, 400); });
  } else {
    setTimeout(readAndApply, 400);
  }
})();
