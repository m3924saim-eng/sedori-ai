(()=>{'use strict';
const VERSION='10.0.0';
function settings(){
  const A=window.__SEDORI_V8__;
  const d=A?.DEFAULTS||{minProfit:3000,minRoi:30};
  try{return{...d,...(JSON.parse(localStorage.getItem('sedori_settings_v8')||'null')||{})}}catch{return d}
}
function money({buy,sell,fee,ship,other=0},s=settings()){
  buy=Math.max(0,+buy||0);sell=Math.max(0,+sell||0);fee=Math.max(0,+fee||0);ship=Math.max(0,+ship||0);other=Math.max(0,+other||0);
  const feeY=Math.round(sell*fee/100),net=sell-feeY-ship-other,profit=Math.round(net-buy),roi=buy>0?profit/buy*100:0;
  const maxByProfit=Math.floor(net-Math.max(0,+s.minProfit||0));
  const r=Math.max(0,+s.minRoi||0)/100,maxByRoi=r>0?Math.floor(net/(1+r)):Math.floor(net);
  return{feeY,net,profit,roi,maxBuy:Math.max(0,Math.min(maxByProfit,maxByRoi))};
}
function analyze(items,q,s=settings()){
  const A=window.__SEDORI_V8__;
  if(A?.analyzeItems)return A.analyzeItems(items||[],q||'',s);
  return{clean:[],fit:[],rej:[],analyzed:[]};
}
window.__SEDORI_V83_PATCH__={version:VERSION,engine:'v10-compat'};
window.__SEDORI_V9__={version:VERSION,analyze,money};
})();