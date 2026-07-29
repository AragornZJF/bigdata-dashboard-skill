window.DASHBOARD_DATA = window.DASHBOARD_DATA || {"eaf1443a-7e8e-475b-9d95-53b4db80c84b": {"categories": ["3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"], "series": [{"name": "单位：亿元", "data": [34278, 29483, 33547, 38266, 35870, 36258, 37645, 40270, 38615, 40542]}]}, "0c537677-154d-4aed-8e40-8b9792a44e13": {"categories": ["2010", "2011", "2012", "2013", "2014", "2015", "2016", "2017", "2018", "2019", "2020", "2021", "2022"], "series": [{"name": "投融资数量（起）", "data": [35, 58, 72, 95, 128, 186, 215, 248, 312, 285, 198, 276, 195]}]}, "66721e70-750a-4d7a-9b3c-98e3783a424b": {"categories": ["2010", "2011", "2012", "2013", "2014", "2015", "2016", "2017", "2018", "2019", "2020", "2021", "2022"], "series": [{"name": "投融资金额（亿元）", "data": [45.2, 78.6, 102.3, 156.8, 215.4, 328.7, 412.5, 486.2, 625.8, 548.3, 385.6, 512.7, 368.4]}]}, "11206b10-b69f-470f-bd21-9234d7a33501": {"categories": ["2022.01", "2022.02", "2022.03", "2022.04", "2022.05", "2022.06", "2022.07", "2022.08", "2022.09", "2022.10"], "series": [{"name": "阅读量", "data": [185000, 212000, 358000, 425000, 312000, 268000, 395000, 448000, 376000, 512000]}]}, "ace16715-5348-488d-88a3-abd8dd24b0a9": {"categories": ["广东", "北京", "上海", "江苏", "浙江", "四川", "山东", "湖北", "福建", "河南"], "series": [{"name": "信息总量（万条）", "data": [586.3, 512.8, 478.5, 395.2, 368.7, 285.4, 268.9, 215.6, 198.3, 182.7]}]}, "7726e8ec-7825-4d73-8894-9e4732dc92c1": {"columns": ["排名", "品牌", "代表产品/品牌印象", "热度", "阅读量"], "rows": [["1", "元气森林", "元气森林", 9865, 528000], ["2", "喜茶", "喜茶", 8752, 462000], ["3", "完美日记", "完美日记", 8236, 415000], ["4", "钟薛高", "钟薛高", 7685, 388000], ["5", "自嗨锅", "自嗨锅", 7128, 352000], ["6", "三顿半", "三顿半", 6854, 325000], ["7", "王饱饱", "王饱饱", 6235, 298000], ["8", "拉面说", "拉面说", 5862, 276000], ["9", "空刻", "空刻", 5348, 245000], ["10", "花西子", "花西子", 4985, 218000]]}, "fa4ed026-4823-42f2-a5da-2344f54c1993": [{"name": "低糖", "value": 9856}, {"name": "无糖", "value": 8932}, {"name": "健康", "value": 8567}, {"name": "代餐", "value": 7845}, {"name": "零食", "value": 7234}, {"name": "功能性", "value": 6856}, {"name": "植物基", "value": 6234}, {"name": "低脂", "value": 5987}, {"name": "高蛋白", "value": 5623}, {"name": "益生菌", "value": 5345}, {"name": "胶原蛋白", "value": 4987}, {"name": "维生素", "value": 4756}, {"name": "膳食纤维", "value": 4523}, {"name": "有机", "value": 4234}, {"name": "天然", "value": 3987}, {"name": "抗氧化", "value": 3756}, {"name": "0卡", "value": 3523}, {"name": "轻食", "value": 3287}, {"name": "酵素", "value": 3056}, {"name": "冻干", "value": 2845}], "6e867661-9db7-49cf-b3d7-14b53bde8e1d": {"categories": ["智能音箱", "扫地机器人", "智能门锁", "智能投影", "空气净化器", "智能空调"], "series": [{"name": "热度", "data": [85, 78, 72, 68, 62, 56]}]}, "cafe9eef-3e08-4881-ae46-31df7173e536": {"categories": ["智能音箱", "扫地机器人", "智能门锁", "智能投影仪", "空气净化器", "智能空调", "智能灯具", "智能冰箱"], "series": [{"name": "热度", "data": [9256, 8485, 7862, 7234, 6587, 5945, 5234, 4567]}]}};
window.DASHBOARD_STYLE = {};
function getData(viewId){ return window.DASHBOARD_DATA[viewId] || null; }
function getStyle(vid){ return window.DASHBOARD_STYLE[vid] || {}; }

// 自适应窗口：等比缩放 + 水平垂直居中（contain 模式，可能有黑边但不裁切）
var CW=1600, CH=900;
function fitCenter(){
  var vw=window.innerWidth, vh=window.innerHeight;
  var s=Math.min(vw/CW, vh/CH);
  var cv=document.getElementById('canvas');
  cv.style.transform='scale('+s+')';
  cv.style.transformOrigin='top left';
  cv.style.position='absolute';
  cv.style.left=((vw-CW*s)/2)+'px';
  cv.style.top=((vh-CH*s)/2)+'px';
  cv.style.width=CW+'px';
  cv.style.height=CH+'px';
}
fitCenter(); window.addEventListener('resize', fitCenter);

function emptyTip(el){ el.innerHTML = '<div class="empty-tip">等待数据接入<br>('+ (el.dataset.type||'') +')</div>'; }

// 统一主题：冷色大屏调色板 + 小字号 + 紧凑网格，保证多图风格一致、不被截断
var PALETTE=['#5B8FF9','#5AD8A6','#5D7092','#F6BD16','#E8684A','#6DC8EC','#9270CA','#FF9D4D','#269A99','#FF99C3'];
function palette(st){ return (st&&st.colors&&st.colors.length)?st.colors:PALETTE; }
// 取轴标签样式（v2 customStyle.xAxis/yAxis：color/fontSize/show）
function axisLabel(st, key){
  var ax=(st&&st[key])||{};
  var show=ax.show!==false;
  return { show:show, color:ax.color||'#666', fontSize:ax.fontSize||10 };
}
function legendOpt(st){
  var lg=(st&&st.legendStyle)||{};
  return { show:lg.show!==false, textStyle:{color:lg.color||'#666',fontSize:lg.fontSize||9},
           top:0, itemWidth:8, itemHeight:8, itemGap:8 };
}
function baseOpt(st){ return { color:palette(st), textStyle:{color:'#2A2A2A',fontFamily:'inherit'},
  tooltip:{trigger:'axis',textStyle:{fontSize:11},confine:true} }; }

// 确定性伪随机（按 vid 种子，保证 mock 数据稳定）
function rng(seed){ var s=0; for(var i=0;i<seed.length;i++){s=(s*31+seed.charCodeAt(i))>>>0;} return function(){ s=(s*1103515245+12345)>>>0; return (s>>>8)/0xFFFFFF; }; }

// 为无数据图表造 mock 数据（仅用于预览视觉还原，非真实值）
function mockData(type, vid, st){
  var r=rng(String(vid||type));
  var cats=['A','B','C','D','E','F'];
  if(type.indexOf('pie')===0){
    var d=[], names=['类目1','类目2','类目3','类目4'];
    for(var i=0;i<4;i++){ d.push({name:names[i], value:Math.round(r()*100)+10}); }
    return d;
  }
  if(type==='indicator'){ return { value: Math.round(r()*1000) }; }
  var series=[], ynames=(st&&st.yaxisNames)||['数值'];
  var sn = type.indexOf('stack')>=0 ? 2 : 1;
  for(var k=0;k<sn;k++){
    var arr=[]; for(var j=0;j<cats.length;j++){ arr.push(Math.round(r()*100)+5); }
    series.push({ name: sn>1?('系列'+(k+1)):'数值', data:arr });
  }
  return { categories:cats, series:series };
}

function chartOption(type, data, vid){
  var st=getStyle(vid);
  var opt=baseOpt(st);
  // 饼图
  if(type.indexOf('pie')===0){
    opt.tooltip.trigger='item';
    opt.legend=legendOpt(st); opt.legend.bottom=0; opt.legend.top=null;
    var outer=(st&&st.radius)?(st.radius+'%'):'68%';
    var innerR=(st&&st.innerRadius)?(st.innerRadius+'%'):'40%';
    var rad = type.indexOf('donut')>=0 ? [innerR, outer] : '68%';
    opt.series=[{ type:'pie', radius:rad, center:['50%','46%'],
      data:data, label:{color:'#cfe',fontSize:9}, labelLine:{length:5,length2:6}, itemStyle:{borderColor:'#010101',borderWidth:1} }];
    return opt;
  }
  // 雷达图
  if(type==='radar'){
    opt.tooltip.trigger='item';
    opt.legend=legendOpt(st); opt.legend.top=0;
    var cats=data.categories||[];
    var maxVal=0;
    (data.series||[]).forEach(function(s){ s.data.forEach(function(v){ if(v>maxVal)maxVal=v; }); });
    var indicator=cats.map(function(c){ return {name:c, max:Math.ceil(maxVal*1.2)||100}; });
    opt.radar={ indicator:indicator, radius:'62%', center:['50%','55%'],
      axisName:{color:'#666',fontSize:10},
      splitLine:{lineStyle:{color:'#e0e0e0'}},
      splitArea:{areaStyle:{color:['rgba(91,143,249,0.06)','rgba(0,0,0,0.02)']}},
      axisLine:{lineStyle:{color:'#ccc'}} };
    opt.series=(data.series||[]).map(function(s){ return { type:'radar', name:s.name, data:[{value:s.data, name:s.name}],
      areaStyle:{opacity:0.2}, lineStyle:{width:2}, itemStyle:{color:opt.color[0]} }; });
    return opt;
  }
  // 柱/线/面积/堆叠/分组/组合
  var isBar = (type.indexOf('bar')>=0 || type==='chart-mix');
  var serType = isBar?'bar':'line';
  var xl=axisLabel(st,'xAxisStyle'), yl=axisLabel(st,'yAxisStyle');
  var series = (data.series||[]).map(function(s){ return {
     type:serType, name:s.name, data:s.data,
     barMaxWidth:(st&&st.barWidth)||18,
     areaStyle:(type.indexOf('area')>=0)?{opacity:0.25}:undefined,
     stack:(type.indexOf('stack')>=0||type.indexOf('group')>=0)?'g':undefined,
     smooth:(st&&st.lineSmooth!=null)?st.lineSmooth:(type.indexOf('line')>=0),
     lineStyle:{width:(st&&st.lineWidth)||2}, symbol:'circle', symbolSize:(st&&st.lineSymbolSize)||4,
     itemStyle:(isBar&&st&&st.gradient)?{color:{type:'linear',x:0,y:0,x2:0,y2:1,colorStops:[{offset:0,color:s.color||opt.color[0]},{offset:1,color:'rgba(91,143,249,0.15)'}]}}:undefined }; });
  opt.legend=legendOpt(st);
  opt.grid={left:32,right:14,top:24,bottom:22,containLabel:true};
  opt.xAxis={type:'category',data:data.categories,axisLabel:xl,axisLine:{lineStyle:{color:'#ccc'}},axisTick:{show:false}};
  opt.yAxis={type:'value',axisLabel:yl,splitLine:{lineStyle:{color:'#e0e0e0'}}};
  opt.series=series;
  // 横向柱：交换轴
  if(type.indexOf('horizontal')>=0){
    opt.xAxis={type:'value',axisLabel:yl,splitLine:{lineStyle:{color:'#e0e0e0'}}};
    opt.yAxis={type:'category',data:data.categories,axisLabel:xl,axisTick:{show:false}};
  }
  return opt;
}

function renderTable(el,data){
  if(!data||!data.columns){ emptyTip(el); return; }
  var h='<table class="de-data"><tr>'+data.columns.map(function(c){return '<th>'+c+'</th>';}).join('')+'</tr>';
  (data.rows||[]).forEach(function(r){ h+='<tr>'+r.map(function(v){return '<td>'+v+'</td>';}).join('')+'</tr>'; });
  el.innerHTML = h+'</table>';
}
function renderKpi(el,data,vid){
  var st=getStyle(vid), ind=st.indicator||{}, nm=st.indicatorName||{};
  var labels=(el.dataset.labels||'').split('|').filter(function(s){return !!s;});
  var v=(data&&data.value!=null)?data.value:null;
  var vStyle='font-size:'+(ind.fontSize||28)+'px;color:'+(ind.color||'#7fffd4')+';font-weight:'+(ind.isBolder?'800':'400')+';line-height:1;text-shadow:0 0 8px rgba(127,255,212,.5);';
  var nStyle='font-size:'+(nm.fontSize||14)+'px;color:'+(nm.color||'#cfe')+';font-weight:'+(nm.isBolder?'600':'400')+';margin:6px 0;';
  var valHtml = (v!=null)?'<div class="kpi-val" style="'+vStyle+'">'+v+'</div>':'';
  var nameHtml = (nm.show!==false && labels.length)?'<div class="kpi-name" style="'+nStyle+'">'+labels.join(' · ')+'</div>':'';
  var h = (nm.namePosition==='top') ? (nameHtml+valHtml) : (valHtml+nameHtml);
  if(!h){ h='<div class="kpi-name">-</div>'; }
  el.innerHTML=h;
}

window.addEventListener('load', function(){
  var hasEmpty=false;
  var charts = document.querySelectorAll('.de-chart');
  charts.forEach(function(el){
    var type=el.dataset.type, vid=el.dataset.view, data=getData(vid);
    var st=getStyle(vid);
    if(el.classList.contains('de-table')){ renderTable(el,data); if(!data)hasEmpty=true; return; }
    if(el.classList.contains('de-kpi')){
      // 指标卡：无数据时用 mock 值还原视觉
      var dd = (data&&data.value!=null)?data:mockData('indicator',vid,st);
      renderKpi(el,dd,vid);
      if(!data||data.value==null)hasEmpty=true;
      return;
    }
    // ECharts 类
    // word-cloud: 用饼图/表格降级展示（有数据则展示前N条）
    if(type==='word-cloud'){
      if(data && data.length){
        // 降级为柱状图展示热词排行
        var sorted=data.slice().sort(function(a,b){return b.value-a.value;}).slice(0,12);
        var opt2=baseOpt(st);
        opt2.tooltip.trigger='axis';
        opt2.legend=legendOpt(st); opt2.legend.show=false;
        opt2.grid={left:32,right:14,top:10,bottom:22,containLabel:true};
        opt2.xAxis={type:'category',data:sorted.map(function(d){return d.name;}),axisLabel:axisLabel(st,'xAxisStyle'),axisLine:{lineStyle:{color:'#ccc'}},axisTick:{show:false}};
        opt2.yAxis={type:'value',axisLabel:axisLabel(st,'yAxisStyle'),splitLine:{lineStyle:{color:'#e0e0e0'}}};
        opt2.series=[{type:'bar',data:sorted.map(function(d){return d.value;}),barMaxWidth:16,itemStyle:{color:{type:'linear',x:0,y:0,x2:0,y2:1,colorStops:[{offset:0,color:'#5B8FF9'},{offset:1,color:'rgba(91,143,249,0.15)'}]}}}];
        var c=echarts.init(el); c.setOption(opt2); window.addEventListener('resize',function(){c.resize();});
      } else {
        emptyTip(el); hasEmpty=true;
      }
      return;
    }
    // map: 需额外地理资源，降级提示
    if(type==='map'){
      el.innerHTML='<div class="empty-tip">map 需额外地理资源，已降级<br>(数据已就绪:'+ (data?'是':'否') +')</div>';
      if(!data)hasEmpty=true; return;
    }
    // 无数据时造 mock 数据，保证图表按真实类型+配色渲染（视觉还原）
    if(!data){ data=mockData(type,vid,st); hasEmpty=true; }
    var opt = chartOption(type,data,vid);
    if(!opt){ emptyTip(el); return; }
    var c=echarts.init(el); c.setOption(opt); window.addEventListener('resize',function(){c.resize();});
  });
  // 日期
  document.querySelectorAll('[data-date]').forEach(function(el){
    function upd(){ var d=new Date(); el.innerHTML='<span style="color:#9ff;font-size:16px">'+d.toLocaleDateString('zh-CN')+' '+d.toLocaleTimeString('zh-CN')+'</span>'; }
    upd(); setInterval(upd,1000);
    el.style.display='flex'; el.style.alignItems='center'; el.style.justifyContent='center';
  });
  if(hasEmpty){ document.getElementById('banner').style.display='block'; }
});
