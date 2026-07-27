/**
 * 068 中国电信厅店营业效能分析 — 数据注入器
 * 
 * 策略：office_efficiency_data.js 定义全局 var data = {...}，
 * office_efficiency_index.js 通过函数直接引用 data 变量渲染所有面板。
 * 注入器在 data.js 之后、index.js 之前将 data 替换为 DASHBOARD_DATA。
 * 
 * 模板依赖：jQuery, Bootstrap, ECharts, Swiper（均在 index.js 之前加载）
 */

(function() {
  'use strict';

  // 检查是否有注入数据
  if (!window.DASHBOARD_DATA) {
    console.warn('[068 Injector] DASHBOARD_DATA 未设置，使用模板默认数据');
    return;
  }

  var D = window.DASHBOARD_DATA;

  // ===== 更新标题 =====
  if (D.title) {
    var titleEl = document.querySelector('.title-info');
    if (titleEl) titleEl.textContent = D.title;
  }

  // ===== 更新客户类型 =====
  if (D.custType) {
    var custTypeEls = document.querySelectorAll('.cust-type-default');
    custTypeEls.forEach(function(el) {
      if (el.getAttribute('type') === D.custType) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    });
  }

  // ===== 更新数据日期 =====
  if (D.dataDate) {
    var dateEl = document.getElementById('td-data-date');
    if (dateEl) dateEl.textContent = D.dataDate;
  }

  // ===== 合并到全局 data 变量（而非替换）=====
  // 以模板内置的完整 _FALLBACK 为底座，再用用户数据 D 覆盖顶层字段。
  // 不能直接 window.data = D —— 那会丢掉模板默认的 staffHandleInfo /
  // channelDeviceInfo / channelHandleInfo 等字段，导致 loadChannelBaseInfo
  // 读取 data.staffHandleInfo.channelJfMap 时抛 Cannot read properties of undefined。
  // 这也与“未提供的字段保持模板原值”的注入策略保持一致。
  var base = (typeof window._FALLBACK === 'object' && window._FALLBACK) ? window._FALLBACK : {};
  window.data = Object.assign({}, base, D);
  // 确保 code=0 以触发 loadPageData() 的 data.code === 0 分支正常渲染
  if (window.data.code === undefined) {
    window.data.code = 0;
  }

  // 重置渠道名称
  if (D.channelName) {
    window.g_channelName = D.channelName;
  }

  console.log('[068 Injector] 数据注入完成, panels:', 
    Object.keys(D).filter(function(k) { return typeof D[k] === 'object' && D[k] !== null; })
  );

})();
