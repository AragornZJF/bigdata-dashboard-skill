/**
 * DASHBOARD_DATA 运行时注入器
 * 模板: 090 企业营收大数据统计可视化大屏
 *
 * 在页面渲染完成后,读取 window.DASHBOARD_DATA 并:
 * 1. 更新 DOM 文本(标题/大数字/指标标签/排行榜/滚动列表)
 * 2. 通过 echarts.getInstanceByDom 获取图表实例并 setOption 更新数据
 */
$(function() {
  setTimeout(function() {
    if (!window.DASHBOARD_DATA) {
      console.warn('[Dashboard Injector] DASHBOARD_DATA not found, using default demo data');
      return;
    }

    var D = window.DASHBOARD_DATA;

    // ====== 1. DOM 文本更新 ======

    // 标题
    if (D.title) $('.head h1').text(D.title);

    // 大数字 + 标签
    if (D.bigNumber) {
      if (D.bigNumber.value) $('.numtxt').text(D.bigNumber.value);
      if (D.bigNumber.label) $('.numbt').html(D.bigNumber.label + '<span>(单位：元)</span>');
    }

    // 3个指标环形图标签
    if (D.gauges && D.gauges.length >= 3) {
      $('.zb1 span').text(D.gauges[0].label || '');
      $('.zb2 span').text(D.gauges[1].label || '');
      $('.zb3 span').text(D.gauges[2].label || '');
    }

    // 滚动订单列表
    if (D.summaryItems && D.summaryItems.length > 0) {
      var itemsHtml = '';
      D.summaryItems.forEach(function(item) {
        itemsHtml += '<li><p><span>' + (item.orderNo || '') + '</span><span>' +
          (item.amount || '') + '</span><span>' + (item.product || '') +
          '</span><span>' + (item.time || '') + '</span></p></li>';
      });
      $('.wrap ul').html(itemsHtml);
    }

    // 排行榜
    if (D.rankings && D.rankings.length >= 2) {
      $('.table1').each(function(idx) {
        if (!D.rankings[idx]) return;
        var $table = $(this);
        // 更新标题
        if (D.rankings[idx].title) {
          $table.closest('.boxall').find('.alltitle').text(D.rankings[idx].title);
        }
        // 更新表头后重新构建tbody
        if (D.rankings[idx].rows && D.rankings[idx].rows.length > 0) {
          var tbodyHtml = '';
          D.rankings[idx].rows.forEach(function(row, i) {
            var rank = row.rank || (i + 1);
            tbodyHtml += '<tr><td><span>' + rank + '</span></td><td>' +
              (row.company || '') + '</td><td>' + (row.amount || '') +
              '<br></td><td>' + (row.growth || '') + '<br></td></tr>';
          });
          $table.find('tbody').html(tbodyHtml);
        }
      });
    }

    // 各区块标题（图表框 / 订单列表框）
    if (D.chartTitles) {
      var chartTitleMap = {
        echart5: D.chartTitles.echart5,
        echart1: D.chartTitles.echart1,
        echart4: D.chartTitles.echart4,
        echart3: D.chartTitles.echart3,
        echart2: D.chartTitles.echart2
      };
      Object.keys(chartTitleMap).forEach(function(id) {
        if (chartTitleMap[id]) {
          var el = document.getElementById(id);
          if (el) $(el).closest('.boxall').find('.alltitle').text(chartTitleMap[id]);
        }
      });
      if (D.chartTitles.orderList) {
        $('.wrap').closest('.boxall').find('.alltitle').text(D.chartTitles.orderList);
      }
    }

    // ====== 2. ECharts 图表更新 ======

    // echart5: 横向进度条 (yAxis categories + bar values)
    if (D.horizontalBar) {
      var inst5 = echarts.getInstanceByDom(document.getElementById('echart5'));
      if (inst5) {
        var opt5 = inst5.getOption();
        if (D.horizontalBar.categories) opt5.yAxis[0].data = D.horizontalBar.categories;
        if (D.horizontalBar.values) opt5.series[0].data = D.horizontalBar.values;
        inst5.setOption(opt5);
      }
    }

    // echart1: 南丁格尔玫瑰饼图 (左侧底部)
    if (D.rosePie) {
      var inst1 = echarts.getInstanceByDom(document.getElementById('echart1'));
      if (inst1) {
        var opt1 = inst1.getOption();
        if (D.rosePie.legendNames) opt1.legend[0].data = D.rosePie.legendNames;
        if (D.rosePie.pieData) opt1.series[0].data = D.rosePie.pieData;
        inst1.setOption(opt1);
      }
    }

    // echart4: 双柱+折线混合图 (中部)
    if (D.barLineMixed) {
      var inst4 = echarts.getInstanceByDom(document.getElementById('echart4'));
      if (inst4) {
        var opt4 = inst4.getOption();
        if (D.barLineMixed.months) opt4.xAxis[0].data = D.barLineMixed.months;
        if (D.barLineMixed.legendNames) opt4.legend[0].data = D.barLineMixed.legendNames;
        if (D.barLineMixed.bar1Data) opt4.series[0].data = D.barLineMixed.bar1Data;
        if (D.barLineMixed.bar2Data) opt4.series[1].data = D.barLineMixed.bar2Data;
        if (D.barLineMixed.lineData) opt4.series[2].data = D.barLineMixed.lineData;
        // 根据数据调整y轴最大值
        var maxVal = Math.max.apply(null, D.barLineMixed.bar1Data.concat(D.barLineMixed.bar2Data));
        opt4.yAxis[0].max = Math.ceil(maxVal / 10) * 10 + 10;
        inst4.setOption(opt4);
      }
    }

    // echart3: 双折线面积图 (中部底部)
    if (D.dualLine) {
      var inst3 = echarts.getInstanceByDom(document.getElementById('echart3'));
      if (inst3) {
        var opt3 = inst3.getOption();
        if (D.dualLine.months) opt3.xAxis[0].data = D.dualLine.months;
        if (D.dualLine.legendNames) opt3.legend[0].data = D.dualLine.legendNames;
        if (D.dualLine.salesData) opt3.series[0].data = D.dualLine.salesData;
        if (D.dualLine.profitData) opt3.series[1].data = D.dualLine.profitData;
        inst3.setOption(opt3);
      }
    }

    // echart2: 面积玫瑰饼图 (右侧底部)
    if (D.areaRosePie) {
      var inst2 = echarts.getInstanceByDom(document.getElementById('echart2'));
      if (inst2) {
        var opt2 = inst2.getOption();
        if (D.areaRosePie.legendNames) opt2.legend[0].data = D.areaRosePie.legendNames;
        if (D.areaRosePie.pieData) opt2.series[0].data = D.areaRosePie.pieData;
        inst2.setOption(opt2);
      }
    }

    // echart zb1/zb2/zb3: 指标环形图
    if (D.gauges && D.gauges.length >= 3) {
      ['zb1','zb2','zb3'].forEach(function(id, idx) {
        var g = D.gauges[idx];
        if (!g) return;
        var inst = echarts.getInstanceByDom(document.getElementById(id));
        if (inst) {
          var opt = inst.getOption();
          var val = g.value || 0;
          var total = g.total || (g.value || 0) * 2;
          var pct = total > 0 ? Math.round(val / total * 100) : 0;
          opt.series[0].data[0].value = val;
          opt.series[0].data[0].name = g.label || '';
          opt.series[0].data[0].label.normal.formatter = val + '';
          opt.series[0].data[1].value = total - val;
          opt.series[0].data[1].label.normal.formatter = '占比' + pct + '%';
          inst.setOption(opt);
        }
      });
    }

    console.log('[Dashboard Injector] 090 企业营收大屏 - data injected successfully');
  }, 500);
});
