/**
 * 新能源汽车工业经济运行情况 - 数据注入器
 *
 * 策略：index.html 内联 JS 中已初始化所有 ECharts 实例（window.__CHARTS__），
 * 注入器读取 window.DASHBOARD_DATA，更新 DOM 文本和图表数据。
 */

(function() {
  'use strict';

  if (!window.DASHBOARD_DATA) {
    console.warn('[NEV Injector] DASHBOARD_DATA 未设置，使用模板默认数据');
    return;
  }

  var D = window.DASHBOARD_DATA;
  var charts = window.__CHARTS__ || {};

  // ===== 标题 =====
  if (D.title) {
    var titleEl = document.querySelector('.main-title');
    if (titleEl) titleEl.textContent = D.title;
  }

  // ===== 日期 =====
  if (D.datetime) {
    var dateEl = document.querySelector('.datetime');
    if (dateEl) dateEl.textContent = D.datetime;
  }

  // ===== KPI 卡片 =====
  if (D.statCards) {
    var cardClasses = ['card-auto-prod', 'card-auto-sale', 'card-nev-prod', 'card-nev-sale'];
    D.statCards.forEach(function(card, i) {
      if (i >= cardClasses.length) return;
      var sel = '.' + cardClasses[i];
      var valEl = document.querySelector(sel + ' .card-value');
      var labelEl = document.querySelector(sel + ' .card-label');
      var growthEl = document.querySelector(sel + ' .card-growth');
      if (valEl && card.value !== undefined) valEl.textContent = card.value;
      if (labelEl && card.label) labelEl.textContent = card.label;
      if (growthEl && card.growth !== undefined) growthEl.textContent = card.growth;
    });
  }

  // ===== 图表数据更新 =====
  // 1. 月度销量对比
  if (D.salesMonthly && charts.chartSalesMonthly) {
    var sm = D.salesMonthly;
    charts.chartSalesMonthly.setOption({
      xAxis: { data: sm.categories || [] },
      series: [
        { name: sm.legend ? sm.legend[0] : '2022年', data: sm.series2022 || [] },
        { name: sm.legend ? sm.legend[1] : '2023年', data: sm.series2023 || [] }
      ]
    });
  }

  // 2. 新能源车与燃油车销量对比
  if (D.fuelVsNEV && charts.chartFuelVsNEV) {
    var fn = D.fuelVsNEV;
    charts.chartFuelVsNEV.setOption({
      xAxis: { data: fn.categories || [] },
      series: [
        { name: '燃油车', data: fn.fuel || [] },
        { name: '新能源汽车', data: fn.nev || [] }
      ]
    });
  }

  // 3. 渗透率走势
  if (D.penetration && charts.chartPenetration) {
    charts.chartPenetration.setOption({
      xAxis: { data: D.penetration.categories || [] },
      series: [{ data: D.penetration.values || [] }]
    });
  }

  // 4. 厂商零售排行
  if (D.manufacturerRetail && charts.chartManufacturerRetail) {
    var mr = D.manufacturerRetail;
    var sorted = mr.slice().sort(function(a, b) { return a.value - b.value; });
    charts.chartManufacturerRetail.setOption({
      yAxis: { data: sorted.map(function(d) { return d.name; }) },
      series: [{ data: sorted.map(function(d) { return d.value; }) }]
    });
  }

  // 5. 各动力类型月度走势
  if (D.powerTypeTrend && charts.chartPowerTypeTrend) {
    var pt = D.powerTypeTrend;
    charts.chartPowerTypeTrend.setOption({
      xAxis: { data: pt.categories || [] },
      series: [
        { name: '纯电动', data: pt.ev || [] },
        { name: '插电混动', data: pt.phev || [] },
        { name: '增程式', data: pt.erev || [] }
      ]
    });
  }

  // 6. 各动力类型销量占比
  if (D.powerTypeShare && charts.chartPowerTypeShare) {
    charts.chartPowerTypeShare.setOption({
      series: [{ data: D.powerTypeShare }]
    });
  }

  console.log('[NEV Injector] 数据注入完成');
})();
