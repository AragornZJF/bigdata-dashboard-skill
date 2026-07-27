/**
 * DASHBOARD_DATA 运行时注入器
 * 模板: 092 酷炫大屏数据可视化模板 (气象站监控大屏)
 *
 * 页面原始 $(function(){...}) 初始化所有 echarts/Canvas/DOM 后,
 * 本注入器读取 window.DASHBOARD_DATA 并:
 * 1. 更新 DOM 文本(标题/气压/站点信息/风/雨)
 * 2. 通过 echarts.getInstanceByDom 更新所有图表数据
 * 3. 重建气压条动画 + WaterPolo 水球
 */
$(function() {
  setTimeout(function() {
    if (!window.DASHBOARD_DATA) {
      console.warn('[Dashboard Injector] DASHBOARD_DATA not found, using defaults');
      return;
    }

    var D = window.DASHBOARD_DATA;

    // ==================== 1. DOM 文本更新 ====================

    // 标题
    if (D.title !== undefined) $('.headTitle').text(D.title);

    // 气压
    if (D.pressure) {
      if (D.pressure.relative !== undefined) $('.hpa-rel').text(D.pressure.relative);
      if (D.pressure.absolute !== undefined) $('.hpa-abs').text(D.pressure.absolute);
      // 重置气压动画条
      rebuildPressureBars(D.pressure);
    }

    // 测试站点信息
    if (D.testSite) {
      if (D.testSite.area !== undefined) $('.area').text(D.testSite.area);
      if (D.testSite.date !== undefined) $('.date').text(D.testSite.date);
      if (D.testSite.siteId !== undefined) $('.idNum').text(D.testSite.siteId);
      if (D.testSite.days !== undefined) $('.days').text(D.testSite.days);
    }

    // 温度指标
    if (D.temperature) {
      if (D.temperature.indoorMax !== undefined) $('.temperatureN').text(D.temperature.indoorMax);
      if (D.temperature.dewPoint !== undefined) $('.dewpoint').text(D.temperature.dewPoint + '\u2103');
      if (D.temperature.windChill !== undefined) $('.windchill').text(D.temperature.windChill + '\u2103');
      if (D.temperature.heatNumber !== undefined) $('.heatnumber').text(D.temperature.heatNumber + '\u2103');
    }

    // 风数据
    if (D.wind) {
      if (D.wind.speed) {
        if (D.wind.speed.current !== undefined) $('#nowWind').text(D.wind.speed.current);
        if (D.wind.speed.highest !== undefined) $('#highWind').text(D.wind.speed.highest);
        // 调整风扇转速
        updateFanSpeed('.windSpeed .windFan', D.wind.speed.current);
      }
      if (D.wind.gust) {
        if (D.wind.gust.current !== undefined) $('#nowGust').text(D.wind.gust.current);
        if (D.wind.gust.highest !== undefined) $('#highGust').text(D.wind.gust.highest);
        updateFanSpeed('.gust .windFan', D.wind.gust.current);
      }
    }

    // 降雨量
    if (D.rainfall) {
      updateRainfallText('day', D.rainfall.day);
      updateRainfallText('week', D.rainfall.week);
      updateRainfallText('month', D.rainfall.month);
      updateRainfallText('year', D.rainfall.year);
      // 重建水球
      rebuildWaterPolos(D.rainfall);
    }

    // ==================== 2. echarts 图表更新 ====================

    // 温度仪表盘
    if (D.temperature) {
      updateGaugeChart('temChart', D.temperature.indoor, D.temperature.outdoor);
      $('.tem-val .indoor').text((D.temperature.indoor || 22) + '\u2103');
      $('.tem-val .outdoor').text((D.temperature.outdoor || 33) + '\u2103');
    }

    // 湿度仪表盘
    if (D.humidity) {
      updateGaugeChart('humChart', D.humidity.indoor, D.humidity.outdoor);
      $('.hum-val .indoor').text((D.humidity.indoor || 22) + '%');
      $('.hum-val .outdoor').text((D.humidity.outdoor || 33) + '%');
    }

    // 温度蜡烛图
    if (D.temperature && D.temperature.kline) {
      updateKlineChart('tempKChart', D.temperature.kline, '\u2103');
    }

    // 湿度蜡烛图
    if (D.humidity && D.humidity.kline) {
      updateKlineChart('dityKChart', D.humidity.kline, '%');
    }

    // 地图观测点
    if (D.mapMarkers) {
      updateMapMarkers('map', D.mapMarkers);
    }

    // 风向雷达图
    if (D.wind && D.wind.radar) {
      updateRadarChart('windChart', D.wind.radar);
    }

    console.log('[Dashboard Injector] Data injection complete for template 092');
  }, 300);
});

// ==================== 辅助函数 ====================

/**
 * 重建气压动画条
 * 原始逻辑: 50 个 gray span, N 个 light span, 每个 light span = 2 HPA
 */
function rebuildPressureBars(pressure) {
  // 相对气压
  var relVal = pressure.relative || 64;
  var relSpans = Math.round(relVal / 2);
  var relContainer = $('.air-relative');
  relContainer.find('.light').empty();
  relContainer.find('.gray').empty();
  for (var i = 0; i < 50; i++) {
    relContainer.find('.gray').append('<span></span>');
  }
  for (var j = 0; j < Math.min(relSpans, 50); j++) {
    relContainer.find('.light').append('<span></span>');
  }
  $('.hpa-rel').text(relVal);

  // 绝对气压
  var absVal = pressure.absolute || 42;
  var absSpans = Math.round(absVal / 2);
  var absContainer = $('.air-absolutely');
  absContainer.find('.light').empty();
  absContainer.find('.gray').empty();
  for (var k = 0; k < 50; k++) {
    absContainer.find('.gray').append('<span></span>');
  }
  for (var m = 0; m < Math.min(absSpans, 50); m++) {
    absContainer.find('.light').append('<span></span>');
  }
  $('.hpa-abs').text(absVal);
}

/**
 * 更新仪表盘 (温度和湿度共用结构: 4 series, series[2]=indoor, series[3]=outdoor)
 */
function updateGaugeChart(domId, indoorVal, outdoorVal) {
  var dom = document.getElementById(domId);
  if (!dom) return;
  var chart = echarts.getInstanceByDom(dom);
  if (!chart) return;

  var opt = chart.getOption();
  if (!opt || !opt.series || opt.series.length < 4) return;

  if (indoorVal !== undefined && indoorVal !== null) {
    opt.series[2].data[0].value = indoorVal;
  }
  if (outdoorVal !== undefined && outdoorVal !== null) {
    opt.series[3].data[0].value = outdoorVal;
  }
  chart.setOption(opt);
}

/**
 * 更新蜡烛图 (K-line)
 * 输入: [{date, open, close, low, high}, ...]
 */
function updateKlineChart(domId, klineData, unit) {
  var dom = document.getElementById(domId);
  if (!dom) return;
  var chart = echarts.getInstanceByDom(dom);
  if (!chart) return;

  var categoryData = [];
  var values = [];
  for (var i = 0; i < klineData.length; i++) {
    var d = klineData[i];
    categoryData.push(d.date);
    values.push([d.open, d.close, d.low, d.high]);
  }

  function calcMA(dayCount) {
    var result = [];
    for (var i = 0; i < values.length; i++) {
      if (i < dayCount) { result.push('-'); continue; }
      var sum = 0;
      for (var j = 0; j < dayCount; j++) { sum += values[i - j][1]; }
      result.push((sum / dayCount).toFixed(2));
    }
    return result;
  }

  var newOption = {
    xAxis: { data: categoryData },
    yAxis: {
      axisLabel: { formatter: '{value}' + (unit || '') }
    },
    series: [
      { type: 'candlestick', name: '\u65E5K', data: values },
      { type: 'line', name: 'MA5', data: calcMA(5), smooth: true },
      { type: 'line', name: 'MA10', data: calcMA(10), smooth: true,
        itemStyle: { normal: { color: '#B0CC35' } } }
    ]
  };
  chart.setOption(newOption);
}

/**
 * 更新地图涟漪散点
 */
function updateMapMarkers(domId, markers) {
  var dom = document.getElementById(domId);
  if (!dom) return;
  var chart = echarts.getInstanceByDom(dom);
  if (!chart) return;

  var series = [];
  for (var i = 0; i < markers.length; i++) {
    var m = markers[i];
    series.push({
      type: 'effectScatter',
      coordinateSystem: 'geo',
      zlevel: 2,
      rippleEffect: { brushType: 'stroke' },
      symbolSize: 10,
      itemStyle: { normal: { color: '#B0CC35' } },
      data: [{ name: m.name, value: [m.lng, m.lat] }],
      tooltip: { formatter: m.name + '\u89C2\u6D4B\u70B9' }
    });
  }

  var opt = chart.getOption();
  if (opt) {
    opt.series = series;
    chart.setOption(opt);
  }
}

/**
 * 更新风向雷达图 (16 方向)
 */
function updateRadarChart(domId, radarData) {
  var dom = document.getElementById(domId);
  if (!dom) return;
  var chart = echarts.getInstanceByDom(dom);
  if (!chart) return;

  chart.setOption({
    series: [{
      data: [{ value: radarData, name: '2016' }]
    }]
  });
}

/**
 * 调整风扇转速: animation-duration = (50 - speed) * 10 ms
 */
function updateFanSpeed(selector, speed) {
  var duration = Math.max((50 - (speed || 23)) * 10, 50);
  $(selector).css('animation-duration', duration + 'ms');
}

/**
 * 更新降雨量文本
 */
function updateRainfallText(period, data) {
  if (!data) return;
  var cap = period.charAt(0).toUpperCase() + period.slice(1);
  if (data.current !== undefined) $('#now' + cap).text(data.current);
  if (data.highest !== undefined) $('#high' + cap).text(data.highest);
}

/**
 * 重建 WaterPolo 水球
 */
function rebuildWaterPolos(rainfall) {
  if (typeof WaterPolo === 'undefined') return;

  var map = {
    day: 'rainfallOne',
    week: 'rainfallTwo',
    month: 'rainfallThree',
    year: 'rainfallFour'
  };

  Object.keys(map).forEach(function(period) {
    var data = rainfall[period];
    if (!data || data.waterPolo === undefined) return;
    var canvasId = map[period];
    var canvas = document.getElementById(canvasId);
    if (!canvas) return;
    // 清空 canvas
    var ctx = canvas.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    // 重建
    new WaterPolo(canvasId, {
      cW: 55,
      cH: 55,
      baseY: data.waterPolo
    });
  });
}
