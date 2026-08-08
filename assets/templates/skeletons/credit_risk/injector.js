/**
 * DASHBOARD_DATA 运行时注入器
 * 模版: 045 信用风险定位系统(银行版)
 *
 * 在页面渲染完成后读取 window.DASHBOARD_DATA 并:
 * 1. 更新所有 DOM 文本 (公司信息/指标/表格/舆论列表)
 * 2. 覆写全局 chart option 变量使其使用注入数据
 * 3. 更新当前已渲染的图表实例 (经营动态 tab 为默认)
 * 4. 处理力导向图 (替代 sanlian.js 的 require.js 方案)
 * 5. 劫持 tab 点击以确保切换时使用注入数据
 */
$(function() {
  // 延迟执行,确保所有脚本加载完毕 & 默认 tab 已触发
  setTimeout(function() {
    if (!window.DASHBOARD_DATA) {
      console.warn('[Dashboard Injector] DASHBOARD_DATA not found');
      return;
    }

    var D = window.DASHBOARD_DATA;
    var injectorInterval = null; // 动画定时器引用

    // ================================================================
    // 1. DOM 文本更新
    // ================================================================

    // 公司标题 (HTML 含 <span> 子标签)
    if (D.company) {
      $('.title.ttbg').html(D.company.name + '</br><span>' + (D.company.industry || '') + '</span>');
    }

    // 三个风险指标
    if (D.indicators && D.indicators.length >= 3) {
      for (var i = 0; i < 3; i++) {
        var ind = D.indicators[i];
        var $fxzt = $('.czl .fxzt').eq(i);
        if (ind.date != null) $fxzt.find('.litime p').text(ind.date);
        if (ind.riskStatus != null) {
          $fxzt.find('.listate p').text(ind.riskStatus);
          // 风险状态颜色
          if (ind.riskStyle === 'yellow') {
            $fxzt.find('.listate p').css('color', 'yellow');
          } else if (ind.riskStyle === 'red') {
            $fxzt.find('.listate p').css('color', '#ff4d4d');
          } else {
            $fxzt.find('.listate p').css('color', '#3AFF57');
          }
        }
        if (ind.value != null) $fxzt.find('.linumber p').text(ind.value);
        // 风险图标
        var $icon = $fxzt.find('.baojing, .baojing1, .baojing2');
        if (ind.icon) {
          $icon.attr('class', ind.icon);
        }
      }
    }

    // 偿债来源表
    if (D.debtSources && D.debtSources.rows) {
      var $srcTable = $('.tb_pos table.table1');
      var srcRows = D.debtSources.rows;
      // 保留表头, 替换数据行
      var srcThead = $srcTable.find('tr.tb_title').prop('outerHTML');
      var srcHtml = srcThead;
      for (var r = 0; r < srcRows.length; r++) {
        srcHtml += '<tr>';
        for (var c = 0; c < srcRows[r].length; c++) {
          var cell = srcRows[r][c];
          // 解析 ↑ ↓ 标记
          if (typeof cell === 'string' && cell.indexOf('↑') > -1) {
            cell = cell.replace('↑', '<span class="sheng">↑</span>');
          } else if (typeof cell === 'string' && cell.indexOf('↓') > -1) {
            cell = cell.replace('↓', '<span class="jiang">↓</span>');
          }
          srcHtml += '<td>' + cell + '</td>';
        }
        srcHtml += '</tr>';
      }
      $srcTable.html(srcHtml);
    }

    // 负债表
    if (D.debtItems && D.debtItems.rows) {
      var $debtTable = $('.tb_pos2 table.table1');
      var debtRows = D.debtItems.rows;
      var debtThead = $debtTable.find('tr.tb_title').prop('outerHTML');
      var debtHtml = debtThead;
      for (var r = 0; r < debtRows.length; r++) {
        debtHtml += '<tr><td>' + debtRows[r][0] + '</td><td>' + debtRows[r][1] + '</td></tr>';
      }
      $debtTable.html(debtHtml);
    }

    // 舆论监控列表
    if (D.opinionList && D.opinionList.length > 0) {
      var $opinList = $('.gxlist ul');
      var opinHtml = '';
      for (var o = 0; o < D.opinionList.length; o++) {
        var op = D.opinionList[o];
        opinHtml += '<li>' + op.text + '<span class="' + (op.class || '') + '">' + (op.sentiment || '') + '</span></li>';
      }
      $opinList.html(opinHtml);
    }

    // 库存表格 (复杂表格, 含 rowspan)
    if (D.inventory) {
      var inv = D.inventory;
      var $invTable = $('.lines1tb .tb table.table1');
      var dates = inv.dates || ['', '', '', '', ''];
      var invHtml = '<tr style="height:30px;" class="tb_title"><td></td><td></td>';
      for (var d = 0; d < 5; d++) {
        invHtml += '<td>' + (dates[d] || '') + '</td>';
      }
      invHtml += '</tr>';

      // 原材料行
      var rmNames = ['坯布', '棉纱', '棉花', '亚麻'];
      var rmData = inv.rawMaterials || {};
      for (var ri = 0; ri < rmNames.length; ri++) {
        invHtml += '<tr>';
        if (ri === 0) invHtml += '<td rowspan="4">原材料</td>';
        invHtml += '<td>' + rmNames[ri] + '</td>';
        var rd = rmData[rmNames[ri]] || [0, 0, 0, 0, 0];
        for (var rc = 0; rc < 5; rc++) {
          invHtml += '<td>' + (rd[rc] || 0).toLocaleString() + '</td>';
        }
        invHtml += '</tr>';
      }

      // 制成品行
      var fgNames = ['家纺成品', '坯布', '印染布', '面纱', '原棉', '其他'];
      var fgData = inv.finishedGoods || {};
      for (var fi = 0; fi < fgNames.length; fi++) {
        invHtml += '<tr>';
        if (fi === 0) invHtml += '<td rowspan="6">制成品</td>';
        invHtml += '<td>' + fgNames[fi] + '</td>';
        var fd = fgData[fgNames[fi]] || [0, 0, 0, 0, 0];
        for (var fc = 0; fc < 5; fc++) {
          invHtml += '<td>' + (fd[fc] || 0).toLocaleString() + '</td>';
        }
        invHtml += '</tr>';
      }

      // 总计行
      invHtml += '<tr><td>总计</td><td>金额(元)</td>';
      var totals = [0, 0, 0, 0, 0];
      for (var t = 0; t < 5; t++) {
        var sum = 0;
        for (var i = 0; i < 4; i++) {
          var key = rmNames[i];
          var d = rmData[key];
          if (d && d[t]) sum += d[t];
        }
        for (var j = 0; j < 6; j++) {
          var k2 = fgNames[j];
          var d2 = fgData[k2];
          if (d2 && d2[t]) sum += d2[t];
        }
        totals[t] = sum;
      }
      for (var tt = 0; tt < 5; tt++) {
        invHtml += '<td>' + totals[tt].toLocaleString() + '</td>';
      }
      invHtml += '</tr>';

      $invTable.html(invHtml);
    }

    // 指数表格
    if (D.indexData) {
      var idx = D.indexData;
      var $idxTable = $('.lines4tb .tb table.table1');
      var idxDates = idx.dates || ['', '', '', '', ''];
      var idxHtml = '<tr style="height:30px;" class="tb_title"><td></td><td></td>';
      for (var dd = 0; dd < 5; dd++) {
        idxHtml += '<td>' + (idxDates[dd] || '') + '</td>';
      }
      idxHtml += '</tr>';

      var idxRows = [
        { label: '产品或服务产能指数', key: '产能指数' },
        { label: '产品或服务销售指数', key: '销售指数' },
        { label: '盈利能力指数', key: '盈利能力指数' }
      ];
      for (var ir = 0; ir < idxRows.length; ir++) {
        idxHtml += '<tr><td colspan="2">' + idxRows[ir].label + '</td>';
        var iData = idx[idxRows[ir].key] || [0, 0, 0, 0, 0];
        for (var ic = 0; ic < 5; ic++) {
          idxHtml += '<td>' + (iData[ic] || '') + '</td>';
        }
        idxHtml += '</tr>';
      }
      $idxTable.html(idxHtml);
    }

    // ================================================================
    // 2. 覆写全局 chart option 变量
    // ================================================================
    if (!D.charts) return;

    function updateLineBandsOpt(optVar, chartData) {
      // 更新 option/optioncenter/optionbtm 三组 line+bands 结构
      if (!chartData || !optVar) return;
      if (chartData.xAxis) optVar.xAxis[0].data = chartData.xAxis;
      if (chartData.yMax != null) optVar.yAxis[0].max = chartData.yMax;
      if (chartData.yMin != null) optVar.yAxis[0].min = chartData.yMin;
      if (chartData.series) {
        for (var s = 0; s < Math.min(chartData.series.length, optVar.series.length); s++) {
          if (chartData.series[s].initial) {
            optVar.series[s].data = chartData.series[s].initial.slice();
          } else if (chartData.series[s].data) {
            optVar.series[s].data = chartData.series[s].data.slice();
          }
        }
      }
    }

    // 三个折线带区域图 (偿债能力 tab)
    if (D.charts.profitCoverage) updateLineBandsOpt(option, D.charts.profitCoverage);
    if (D.charts.liquidityCoverage) updateLineBandsOpt(optioncenter, D.charts.liquidityCoverage);
    if (D.charts.solvencyCoverage) updateLineBandsOpt(optionbtm, D.charts.solvencyCoverage);

    // 库存混合图
    if (D.charts.inventoryBarLine) {
      var ibl = D.charts.inventoryBarLine;
      if (ibl.xAxis) option1.xAxis[0].data = ibl.xAxis;
      if (ibl.series) {
        for (var ss = 0; ss < Math.min(ibl.series.length, option1.series.length); ss++) {
          if (ibl.series[ss].data) {
            option1.series[ss].data = ibl.series[ss].data.slice();
          }
        }
      }
    }

    // 两个饼图
    if (D.charts.totalAssetsPie) {
      var tap = D.charts.totalAssetsPie;
      if (tap.centerTitle) option2.title[0].text = tap.centerTitle;
      if (tap.centerSubtitle) option2.title[0].subtext = tap.centerSubtitle;
      if (tap.data) {
        option2.series[0].data = tap.data.map(function(d) {
          return { value: d.value, name: d.name };
        });
        option2.legend.data = tap.data.map(function(d) { return d.name; });
      }
    }
    if (D.charts.liquidAssetsPie) {
      var lap = D.charts.liquidAssetsPie;
      if (lap.centerTitle) option22.title[0].text = lap.centerTitle;
      if (lap.centerSubtitle) option22.title[0].subtext = lap.centerSubtitle;
      if (lap.data) {
        option22.series[0].data = lap.data.map(function(d) {
          return { value: d.value, name: d.name };
        });
        option22.legend.data = lap.data.map(function(d) { return d.name; });
      }
    }

    // ================================================================
    // 3. 更新当前已渲染图表 (经营动态 tab 为默认选中)
    // ================================================================

    // lins1 库存柱状+折线混合图
    var lins1Chart = echarts.getInstanceByDom(document.getElementById('lins1'));
    if (lins1Chart && D.charts.inventoryBarLine) {
      lins1Chart.setOption({
        xAxis: [{ data: option1.xAxis[0].data }],
        series: option1.series.map(function(s) { return { data: s.data }; }),
        legend: { data: option1.legend.data }
      });
    }

    // lins2/lins3/lins4 三条指数折线
    var indexCharts = {
      lins2: D.charts.productivityIndex,
      lins3: D.charts.consumptionIndex,
      lins4: D.charts.profitabilityIndex
    };
    for (var cid in indexCharts) {
      var iChart = echarts.getInstanceByDom(document.getElementById(cid));
      var iData = indexCharts[cid];
      if (iChart && iData && iData.data) {
        optionl2.series[0].data = iData.data.slice();
        if (iData.xAxis) optionl2.xAxis.data = iData.xAxis;
        iChart.setOption({
          xAxis: { data: optionl2.xAxis.data },
          series: [{ data: iData.data }]
        });
      }
    }

    // ================================================================
    // 4. 力导向图 (三链图) - 替代 sanlian.js 的 require.js 方案
    // ================================================================

    function initRelationGraph(graphData) {
      if (!graphData || !graphData.nodes) return;

      var guanxiDom = document.getElementById('guanxi');
      if (!guanxiDom) return;

      // 销毁旧实例 (避免 echarts.init 的重复初始化问题)
      var oldInstance = echarts.getInstanceByDom(guanxiDom);
      if (oldInstance) oldInstance.dispose();

      // 处理节点样式
      var nodes = graphData.nodes.map(function(n, idx) {
        var node = {
          name: n.name,
          value: n.value,
          category: n.category,
          id: n.id != null ? n.id : idx,
          symbolSize: (n.value || 10) * 1.2
        };
        // 中心节点特殊样式
        if (n.id === 0 || n.id === '0') {
          node.itemStyle = {
            normal: {
              borderColor: '#000',
              color: 'blue'
            }
          };
          node.label = { show: true };
        }
        return node;
      });

      // 处理高亮节点
      for (var ni = 0; ni < nodes.length; ni++) {
        if (nodes[ni].id === 22) {
          nodes[ni].itemStyle = {
            normal: {
              label: { show: true, textStyle: { color: 'yellow' } }
            }
          };
        }
      }

      var categories = [
        { name: '四级' },
        { name: '三级' },
        { name: '二级' }
      ];

      var option3 = {
        title: { x: 'right', y: 'bottom' },
        tooltip: { trigger: 'item', formatter: '{b}' },
        legend: {
          x: 'left',
          data: ['四级', '三级', '二级'],
          orient: 'left',
          x: 10,
          y: 10,
          textStyle: { fontSize: 14, color: '#fff' }
        },
        series: [{
          type: 'force',
          name: 'Force tree',
          ribbonType: false,
          categories: categories,
          itemStyle: {
            normal: {
              label: { show: true, textStyle: { color: '#fff' } },
              nodeStyle: {
                brushType: 'both',
                borderColor: 'rgba(255,215,0,0.6)',
                borderWidth: 1
              }
            }
          },
          minRadius: 2,
          maxRadius: 10,
          coolDown: 0.995,
          steps: 10,
          nodes: nodes,
          links: graphData.links || [],
          force: { edgeLength: 105, repulsion: 100 }
        }]
      };

      var guanxi = echarts.init(guanxiDom);
      guanxi.setOption(option3);
    }

    // 保存图数据供 tab 切换时使用
    window.__INJECTOR_GRAPH_DATA = D.charts.relationGraph;

    // ================================================================
    // 5. 劫持 tab 点击,确保切换时使用注入数据
    // ================================================================

    // 保存偿债能力 tab 的动画数据
    window.__INJECTOR_ANIMATE = {
      profit: D.charts.profitCoverage ? D.charts.profitCoverage.animateData : null,
      liquidity: D.charts.liquidityCoverage ? D.charts.liquidityCoverage.animateData : null,
      solvency: D.charts.solvencyCoverage ? D.charts.solvencyCoverage.animateData : null
    };

    // 重新绑定 tab 点击 (移除原事件 + 注入新逻辑)
    $('.baner a').off('click').on('click', function() {
      // 清除旧的动画定时器
      if (window.__INJECTOR_TIMER) {
        clearInterval(window.__INJECTOR_TIMER);
        window.__INJECTOR_TIMER = null;
      }

      $('.baner a').removeClass('ahover');
      $('.cznl>div').css('display', 'none');
      $('.cznl').css('display', 'block');
      $('.content1>div').css('display', 'none');
      $('#pie1,.piebt').css('display', 'none');
      $('#pie2,.piebt').css('display', 'none');
      $('#guanxi,.gxlist').css('display', 'none');

      var chartid = $(this).attr('class');
      $(this).addClass('ahover');

      if (chartid === 'jybt') {
        // 经营动态
        $('.jydt').css('display', 'block');
        $('.ctitle').html('经营动态');

        var _l1 = echarts.init(document.getElementById('lins1'));
        var _l2 = echarts.init(document.getElementById('lins2'));
        var _l3 = echarts.init(document.getElementById('lins3'));
        var _l4 = echarts.init(document.getElementById('lins4'));
        _l1.setOption(option1);

        if (D.charts.productivityIndex && D.charts.productivityIndex.data) {
          optionl2.series[0].data = D.charts.productivityIndex.data.slice();
        }
        _l2.setOption(optionl2);

        if (D.charts.consumptionIndex && D.charts.consumptionIndex.data) {
          optionl2.series[0].data = D.charts.consumptionIndex.data.slice();
        }
        _l3.setOption(optionl2);

        if (D.charts.profitabilityIndex && D.charts.profitabilityIndex.data) {
          optionl2.series[0].data = D.charts.profitabilityIndex.data.slice();
        }
        _l4.setOption(optionl2);
      }
      else if (chartid === 'czbt') {
        // 偿债能力平衡
        $('.czl').css('display', 'block');
        $('.ctitle').html('偿债能力平衡');

        // 先用 DASHBOARD_DATA 更新 option 变量
        if (D.charts.profitCoverage) updateLineBandsOpt(option, D.charts.profitCoverage);
        if (D.charts.liquidityCoverage) updateLineBandsOpt(optioncenter, D.charts.liquidityCoverage);
        if (D.charts.solvencyCoverage) updateLineBandsOpt(optionbtm, D.charts.solvencyCoverage);

        var myChart = echarts.init(document.getElementById('line1'));
        var myChart01 = echarts.init(document.getElementById('line2'));
        var myChart02 = echarts.init(document.getElementById('line3'));

        myChart.setOption(option);
        myChart01.setOption(optioncenter);
        myChart02.setOption(optionbtm);

        // 动画数据
        var animate = window.__INJECTOR_ANIMATE;
        var linedata = animate.profit || [5.54, 5.48, 5.33, 5.55, 5.63, 5.71, 5.45, 5.55, 5.47, 5.58, 5.67];
        var linedatacenter = animate.liquidity || [5.62, 5.58, 5.35, 5.43, 5.33, 5.51, 5.56, 5.53, 5.44, 5.45];
        var linedatabtm = animate.solvency || [3.79, 3.61, 3.6, 3.51, 3.85, 3.73, 3.53, 3.65, 3.57, 3.79];

        var timei = 0;
        window.__INJECTOR_TIMER = setInterval(function() {
          if (linedata.length > timei) {
            option.series[0].data.push(linedata[timei]);
            optionbtm.series[0].data.push(linedatabtm[timei]);
            optioncenter.series[0].data.push(linedatacenter[timei]);
            timei++;
          } else {
            timei = 0;
            option.series[0].data = (D.charts.profitCoverage && D.charts.profitCoverage.series[0].initial) ? D.charts.profitCoverage.series[0].initial.slice() : [5.53];
            optionbtm.series[0].data = (D.charts.solvencyCoverage && D.charts.solvencyCoverage.series[0].initial) ? D.charts.solvencyCoverage.series[0].initial.slice() : [3.78];
            optioncenter.series[0].data = (D.charts.liquidityCoverage && D.charts.liquidityCoverage.series[0].initial) ? D.charts.liquidityCoverage.series[0].initial.slice() : [5.69];
          }
          myChart.setOption(option);
          myChart01.setOption(optioncenter);
          myChart02.setOption(optionbtm);
        }, 1000);
      }
      else if (chartid === 'kbbt') {
        // 可变现资产结构
        $('.ctitle').html('可变现资产结构');
        $('#pie1,.piebt').css('display', 'block');
        $('#pie2,.piebt').css('display', 'block');

        if (D.charts.totalAssetsPie) {
          var tap = D.charts.totalAssetsPie;
          option2.title[0].text = tap.centerTitle || '合计';
          option2.title[0].subtext = tap.centerSubtitle || '';
          option2.series[0].data = tap.data.map(function(d) { return { value: d.value, name: d.name }; });
          option2.legend.data = tap.data.map(function(d) { return d.name; });
        }
        if (D.charts.liquidAssetsPie) {
          var lap = D.charts.liquidAssetsPie;
          option22.title[0].text = lap.centerTitle || '合计';
          option22.title[0].subtext = lap.centerSubtitle || '';
          option22.series[0].data = lap.data.map(function(d) { return { value: d.value, name: d.name }; });
          option22.legend.data = lap.data.map(function(d) { return d.name; });
        }

        var myChart2 = echarts.init(document.getElementById('pie1'));
        var myChart3 = echarts.init(document.getElementById('pie2'));
        myChart2.setOption(option2);
        myChart3.setOption(option22);
      }
      else if (chartid === 'wbgl') {
        // 外部关联 - 三链图
        $('.ctitle').html('三链图');
        $('#guanxi,.gxlist').css('display', 'block');

        // 使用注入器自建的力导向图
        if (window.__INJECTOR_GRAPH_DATA) {
          initRelationGraph(window.__INJECTOR_GRAPH_DATA);
        }
      }
    });

    // 触发默认 tab (模拟原代码的 $(".baner .jybt").click())
    var hash = window.location.href;
    if (hash.indexOf('?') > -1 && hash.split('?')[1] === '1') {
      $('.baner .wbgl').click();
      // 清理 URL 参数
      var url = window.location.href;
      url = url.split('?')[0];
      if (window.history && window.history.pushState) {
        window.history.pushState({}, 0, url);
      }
    } else {
      $('.baner .jybt').click();
    }

  }, 600);
});
