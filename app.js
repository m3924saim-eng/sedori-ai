(()=>{'use strict';
const VERSION='8.2.8';
const CORE='./app-v8-core.js?v=8280';
const SITE_NAMES={mercari:'メルカリ',rakuma:'楽天ラクマ',yahoo_fleamarket:'Yahoo!フリマ',yahoo_auction:'Yahoo!オークション',jmty:'ジモティー'};
const SITE_IDS=['mercari','rakuma','yahoo_fleamarket','yahoo_auction','jmty'];
const SELL_SITES=['mercari','rakuma','yahoo_fleamarket','yahoo_auction'];
const LOGIN_URLS={mercari:'https://jp.mercari.com/',rakuma:'https://fril.jp/',yahoo_fleamarket:'https://paypayfleamarket.yahoo.co.jp/',yahoo_auction:'https://auctions.yahoo.co.jp/',jmty:'https://jmty.jp/users/sign_in'};
const PRECIOUS=new Set(['k24','k22','k18','k14','k10','pt950','pt900','platinum','sv925','silver']);
const MATERIAL_CODE=/^(?:K(?:10|14|18|22|24)|PT(?:900|950)|SV925|SILVER925|750|585)$/i;
const $=id=>document.getElementById(id);
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
const uniq=a=>[...new Set((a||[]).filter(Boolean))];
const yen=n=>'¥'+Math.round(Number(n)||0).toLocaleString('ja-JP');
const pct=n=>(Math.round((Number(n)||0)*10)/10)+'%';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let API=null,READY=false;

function siteName(id){return SITE_NAMES[id]||id||'不明'}
function setHeader(text){const p=document.querySelector('header p');if(p)p.textContent=text;document.title='せどりAI v'+VERSION;}
function setStatus(text){const e=$('searchStatus');if(e)e.textContent=text;}
function loadSettings(){
  const d=API?.DEFAULTS||{minProfit:3000,minRoi:30,watchProfit:1500,watchRoi:15,maxCandidates:40,fees:{mercari:10,rakuma:10,yahoo_fleamarket:5,yahoo_auction:10,jmty:5},shipping:{tiny:230,small:450,medium:750,large:1000,xlarge:1600}};
  try{const x=JSON.parse(localStorage.getItem('sedori_settings_v8')||'null')||{};return{...d,...x,fees:{...d.fees,...(x.fees||{})},shipping:{...d.shipping,...(x.shipping||{})}}}catch{return JSON.parse(JSON.stringify(d))}
}
function loadCore(){
  return new Promise((resolve,reject)=>{
    if(window.__SEDORI_V8__)return resolve(window.__SEDORI_V8__);
    const s=document.createElement('script');s.src=CORE;s.async=false;s.dataset.sedoriCore='1';
    s.onload=()=>window.__SEDORI_V8__?resolve(window.__SEDORI_V8__):reject(new Error('core api missing'));
    s.onerror=()=>reject(new Error('core load failed'));
    document.head.appendChild(s);
  });
}
function selfTest(api){
  const checks=[];
  try{
    checks.push(!!api&&typeof api==='object');
    ['install','identity','queryFit','analyzeItems','moneyMath'].forEach(k=>checks.push(typeof api[k]==='function'));
    checks.push(typeof api?._util?.weightedQuantile==='function');
    checks.push(api.identity('iPhone 15 Pro 256GB')?.cat?.id==='phone');
    const m=api.moneyMath({buy:10000,sell:20000,fee:10,ship:750,other:0},api.DEFAULTS);
    checks.push(m?.profit===7250&&Math.round((m?.roi||0)*10)/10===72.5);
    checks.push(idOf('カルティエ ラブリング K18 11号').models.every(v=>!MATERIAL_CODE.test(v)));
  }catch(e){console.error('selftest exception',e);checks.push(false)}
  return{passed:checks.filter(Boolean).length,total:checks.length,ok:checks.every(Boolean),checks,version:VERSION,coreVersion:api?.VERSION||'unknown'};
}
function extraModels(text){
  const s=String(text||'').normalize('NFKC').toUpperCase().replace(/[‐‑‒–—―]/g,'-');
  const out=[];
  const add=v=>{if(v)out.push(v.replace(/[^A-Z0-9+]/g,''))};
  let m;
  m=s.match(/\bIPHONE\s*(\d{1,2})\s*(PRO\s*MAX|PRO|PLUS|MINI)?\b/);if(m)add('IPHONE'+m[1]+(m[2]||''));
  m=s.match(/\bPIXEL\s*(\d{1,2})(A|\s*PRO)?\b/);if(m)add('PIXEL'+m[1]+(m[2]||''));
  m=s.match(/\bGALAXY\s*(S|A|Z\s*FLIP|Z\s*FOLD)\s*(\d{1,2})(\s*ULTRA|\s*PLUS|\+)?\b/);if(m)add('GALAXY'+m[1]+m[2]+(m[3]||''));
  m=s.match(/\bIPAD\s*(PRO|AIR|MINI)?\s*(\d{1,2}(?:\.\d)?)?\b/);if(m&&(m[1]||m[2]))add('IPAD'+(m[1]||'')+(m[2]||''));
  m=s.match(/\bMACBOOK\s*(PRO|AIR)?[^A-Z0-9]{0,4}(M[1-9])\b/);if(m)add('MACBOOK'+(m[1]||'')+m[2]);
  for(const z of s.matchAll(/\bM[1-9](?:\s*(PRO|MAX|ULTRA))?\b/g))add(z[0]);
  return uniq(out);
}
function idOf(text){
  const x=API.identity(text||'');
  const models=uniq([...(x.models||[]).filter(v=>!MATERIAL_CODE.test(String(v))),...extraModels(text)]);
  return{...x,models,materials:x.materials||[],stones:x.stones||[],specs:x.specs||[],terms:x.terms||[],risk:x.risk||{level:0,reasons:[],bundle:false}};
}
function materialsConflict(a,b){return API._util.materialsConflict(a||[],b||[])}
function specMatch(a,b){return API._util.specMatch(a||[],b||[])}
function weightedQuantile(rows,q){return API._util.weightedQuantile(rows||[],q)}
function median(a){return API._util.median(a||[])}
function quantile(a,q){return API._util.quantile(a||[],q)}
function queryFitStrict(x,q){
  if(!q)return{ok:true};
  const a=idOf(q),b=idOf(x.title);
  if(a.cat.id!=='other'&&b.cat.id!=='other'&&a.cat.id!==b.cat.id)return{ok:false,reason:'カテゴリ不一致'};
  if(a.brand&&b.brand!==a.brand)return{ok:false,reason:b.brand?'ブランド不一致':'ブランド確認不能'};
  if(a.models.length&&!b.models.length)return{ok:false,reason:'型番確認不能'};
  if(a.models.length&&b.models.length&&!a.models.some(v=>b.models.includes(v)))return{ok:false,reason:'型番不一致'};
  if(a.materials.length&&!b.materials.length)return{ok:false,reason:'素材確認不能'};
  if(a.materials.length&&b.materials.length&&materialsConflict(a.materials,b.materials))return{ok:false,reason:'素材不一致'};
  if(a.stones.length&&!b.stones.length)return{ok:false,reason:'宝石確認不能'};
  if(a.stones.length&&b.stones.length&&!a.stones.some(v=>b.stones.includes(v)))return{ok:false,reason:'宝石不一致'};
  const sm=specMatch(a.specs,b.specs);
  if(a.specs.length&&!b.specs.length)return{ok:false,reason:'仕様確認不能'};
  if(sm.hard)return{ok:false,reason:'主要仕様不一致'};
  return{ok:true};
}
function similarity(target,peer,query=''){
  const a=idOf(target.title),b=idOf(peer.title),q=idOf(query),category=q.cat.id!=='other'?q.cat:a.cat;
  if(category.id!=='other'&&b.cat.id!=='other'&&category.id!==b.cat.id)return{score:-1,grade:'X',reason:'カテゴリ不一致'};
  const brand=q.brand||a.brand;
  if(brand&&b.brand&&b.brand!==brand)return{score:-1,grade:'X',reason:'ブランド不一致'};
  if(a.brand&&b.brand&&a.brand!==b.brand)return{score:-1,grade:'X',reason:'ブランド不一致'};
  const models=uniq([...q.models,...a.models]);
  if(models.length&&b.models.length&&!models.some(x=>b.models.includes(x)))return{score:-1,grade:'X',reason:'型番不一致'};
  const mats=uniq([...q.materials,...a.materials]);
  if(materialsConflict(mats,b.materials))return{score:-1,grade:'X',reason:'素材不一致'};
  const stones=uniq([...q.stones,...a.stones]);
  if(stones.length&&b.stones.length&&!stones.some(x=>b.stones.includes(x)))return{score:-1,grade:'X',reason:'宝石不一致'};
  if(a.risk.bundle!==b.risk.bundle)return{score:-1,grade:'X',reason:'単品とセットの不一致'};
  const wantedSpecs=uniq([...q.specs,...a.specs]),sm=specMatch(wantedSpecs,b.specs);
  if(sm.hard)return{score:-1,grade:'X',reason:'主要仕様不一致'};
  let score=.24;const reasons=[];
  if(category.id!=='other'&&b.cat.id===category.id){score+=.18;reasons.push('カテゴリ')}
  const brandMatched=!!brand&&b.brand===brand;if(brand){if(brandMatched){score+=.21;reasons.push('ブランド')}else if(!b.brand)score-=.08}
  const modelMatched=!!(models.length&&b.models.length&&models.some(x=>b.models.includes(x)));if(models.length){if(modelMatched){score+=.27;reasons.push('型番')}else score-=.10}
  const materialMatched=!!(mats.length&&b.materials.length&&mats.some(x=>b.materials.includes(x)));if(mats.length){if(materialMatched){score+=.11;reasons.push('素材')}else if(!b.materials)score-=.05}
  const stoneMatched=!!(stones.length&&b.stones.length&&stones.some(x=>b.stones.includes(x)));if(stoneMatched){score+=.06;reasons.push('宝石')}
  if(sm.known){score+=.10*sm.score;if(sm.score>.5)reasons.push('仕様')}
  const terms=uniq([...q.terms,...a.terms]),hits=terms.filter(x=>b.terms.includes(x)).length;
  if(terms.length){score+=.15*Math.min(1,hits/Math.max(2,Math.min(8,terms.length)));if(hits>=2)reasons.push('特徴語')}
  if(!brand&&!models.length&&!mats.length&&!wantedSpecs.length&&hits<2)score-=.14;
  if(b.risk.level===2)score-=.20;else if(b.risk.level===1)score-=.07;
  score=clamp(score,0,1);
  const strongIdentity=modelMatched||(brandMatched&&(materialMatched||stoneMatched||(sm.known&&sm.score>=.75)||hits>=2))||(!brand&&!models.length&&sm.known&&sm.score>=.85&&hits>=2);
  const grade=score>=.82&&strongIdentity?'A':score>=.65?'B':score>=.52?'C':'D';
  return{score,grade,reason:reasons.join('・')||'弱い一致'};
}
function robustRows(scored){
  const seen=new Set(),dedup=[];
  for(const z of scored||[]){const x=z.x,k=[String(x.title||'').normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim().slice(0,110),Math.round((+x.price||0)/100)*100].join('|');if(!seen.has(k)){seen.add(k);dedup.push(z)}}
  const rows=dedup.filter(z=>+z.x.price>0);
  if(rows.length<4){const ps=rows.map(z=>+z.x.price),m=median(ps),spread=ps.length>1&&m?((quantile(ps,.75)-quantile(ps,.25))/m):(ps.length?0:1);return{rows,removed:(scored||[]).length-rows.length,spread}}
  const prices=rows.map(z=>+z.x.price),q1=quantile(prices,.25),q3=quantile(prices,.75),iqr=q3-q1,med=median(prices);
  let lo=Math.max(1,q1-1.5*iqr,med*.42),hi=Math.min(q3+1.5*iqr,med*2.4);if(!Number.isFinite(lo)||!Number.isFinite(hi)||lo>=hi){lo=med*.42;hi=med*2.4}
  const keep=rows.filter(z=>z.x.price>=lo&&z.x.price<=hi),use=keep.length>=3?keep:rows,ps=use.map(z=>+z.x.price),m2=median(ps),spread=m2?((quantile(ps,.75)-quantile(ps,.25))/m2):1;
  return{rows:use,removed:(scored||[]).length-use.length,spread};
}
function shippingFor(cat,s){if(['ring','necklace','bracelet','earring','wallet'].includes(cat))return s.shipping.tiny;if(cat==='watch')return s.shipping.small;if(['phone','tablet','camera','game','toy','outer','top','bottom'].includes(cat))return s.shipping.medium;if(['bag','shoes','pc','tool'].includes(cat))return s.shipping.large;if(cat==='auto')return s.shipping.xlarge;return s.shipping.medium}
function feeRate(site,s){return Number(s.fees[site]??10)}
function buildMarket(item,all,query,settings){
  const target=idOf(item.title),wanted=idOf(query),scored=[];
  for(const x of all){if(x.url===item.url||!(+x.price>0))continue;const sim=similarity(item,x,query);if(sim.score>=.52)scored.push({x,sim,id:idOf(x.title)})}
  scored.sort((a,b)=>b.sim.score-a.sim.score);
  const evidence=robustRows(scored.filter(z=>['A','B','C'].includes(z.sim.grade)));
  const strictPricing=robustRows(scored.filter(z=>z.sim.grade==='A'));
  const aCount=evidence.rows.filter(z=>z.sim.grade==='A').length,bCount=evidence.rows.filter(z=>z.sim.grade==='B').length,cCount=evidence.rows.filter(z=>z.sim.grade==='C').length;
  const sourceCount=new Set(evidence.rows.map(z=>z.x.source)).size;
  const preciousWanted=uniq([...wanted.materials,...target.materials]).some(x=>PRECIOUS.has(x));
  const strictIdentity=!!(wanted.brand||wanted.models.length||wanted.specs.length||preciousWanted||target.brand||target.models.length||target.specs.length>=2);
  const genericPool=scored.filter(z=>{
    if(!['A','B','C'].includes(z.sim.grade))return false;
    if(target.cat.id!=='other'&&z.id.cat.id!=='other'&&target.cat.id!==z.id.cat.id)return false;
    if(target.materials.length&&z.id.materials.length&&!target.materials.some(v=>z.id.materials.includes(v)))return false;
    const materialKnown=!target.materials.length||target.materials.some(v=>z.id.materials.includes(v));
    return z.sim.grade==='A'||z.sim.grade==='B'||(z.sim.grade==='C'&&(materialKnown||z.sim.score>=.58));
  });
  const genericPricing=robustRows(genericPool),genericStrong=genericPricing.rows.filter(z=>z.sim.grade==='A'||z.sim.grade==='B').length;
  const strictReady=strictPricing.rows.length>=2,categoryReady=genericPricing.rows.length>=5&&genericStrong>=2,priceReady=strictIdentity?strictReady:categoryReady;
  const priceRows=strictIdentity?strictPricing.rows:genericPricing.rows,priceSpread=strictIdentity?strictPricing.spread:genericPricing.spread;
  const priceSourceCount=new Set(priceRows.map(z=>z.x.source)).size,priceCompCount=priceRows.length,mode=strictIdentity?(priceReady?'strict':'strict-insufficient'):(priceReady?'category':'category-insufficient');
  const weights={A:1,B:.72,C:.36},weighted=priceRows.map(z=>({value:+z.x.price,weight:weights[z.sim.grade]||.2}));
  const lowQ=strictIdentity?.22:.20,stdQ=.35,highQ=.58,lowFactor=strictIdentity?.90:.80,stdFactor=strictIdentity?.94:.88,highFactor=strictIdentity?.97:.94;
  const rawLow=priceReady?weightedQuantile(weighted,lowQ):0,rawStd=priceReady?weightedQuantile(weighted,stdQ):0,rawHigh=priceReady?weightedQuantile(weighted,highQ):0,rawMed=priceReady?weightedQuantile(weighted,.50):0;
  const low=priceReady?Math.max(0,Math.floor(rawLow*lowFactor/100)*100):0,globalStd=priceReady?Math.max(0,Math.floor(rawStd*stdFactor/100)*100):0,high=priceReady?Math.max(0,Math.floor(rawHigh*highFactor/100)*100):0,med=priceReady?Math.round(rawMed):0;
  let conf=0;
  if(strictIdentity){conf=Math.min(26,evidence.rows.length*4)+Math.min(42,strictPricing.rows.length*12)+Math.min(10,priceSourceCount*5)+Math.min(10,target.strength);if(priceSpread>.65)conf-=18;else if(priceSpread>.45)conf-=10;if(strictPricing.rows.length===0)conf=Math.min(conf,35);else if(strictPricing.rows.length===1)conf=Math.min(conf,49);if(target.strength<4)conf=Math.min(conf,58)}
  else{conf=Math.min(32,genericPricing.rows.length*5)+Math.min(24,genericStrong*6)+Math.min(10,priceSourceCount*5)+Math.min(10,target.strength);if(priceSpread>.70)conf-=18;else if(priceSpread>.50)conf-=10;if(!categoryReady)conf=Math.min(conf,49);else conf=Math.min(conf,69)}
  conf=clamp(Math.round(conf),0,100);const confidence=conf>=80?'高':conf>=65?'中':conf>=45?'低':'不足';
  const ship=shippingFor(target.cat.id,settings),candidates=[];
  if(priceReady)for(const site of SELL_SITES){const sr=priceRows.filter(z=>z.x.source===site);if(!sr.length)continue;const siteWeighted=sr.map(z=>({value:+z.x.price,weight:weights[z.sim.grade]||.2})),needed=strictIdentity?2:3,base=sr.length>=needed?weightedQuantile(siteWeighted,.35):globalStd,factor=strictIdentity?.94:.88,est=sr.length>=needed?Math.max(0,Math.floor(base*factor/100)*100):globalStd,fee=feeRate(site,settings),m=API.moneyMath({buy:item.price,sell:est,fee,ship,other:0},settings);candidates.push({site,price:est,fee,ship,net:m.net,sourceComps:sr.length})}
  candidates.sort((a,b)=>b.net-a.net||b.sourceComps-a.sourceComps);
  const fallbackSite=SELL_SITES.includes(item.source)?item.source:'yahoo_fleamarket',sell=candidates[0]||{site:fallbackSite,price:priceReady?globalStd:0,fee:feeRate(fallbackSite,settings),ship,net:0,sourceComps:0};
  const priceReason=strictIdentity?(priceReady?'厳密一致した同等品2件以上を使って売価を算定':'厳密一致した同等品が2件未満のため売価を算定できません'):(priceReady?'高一致2件以上を含むカテゴリ相場5件以上を使って参考売価を算定':'高一致2件以上を含むカテゴリ相場の比較件数が不足しているため売価を算定できません');
  return{rows:evidence.rows,compCount:evidence.rows.length,aCount,bCount,cCount,sourceCount,removed:evidence.removed,spread:evidence.spread,confidence,confidenceScore:conf,conservative:low,standard:sell.price||globalStd,aggressive:high,median:med,sell,id:target,mode,strictIdentity,priceReady,priceCompCount,priceSourceCount,genericStrong,priceReason};
}
function opportunity(item,m,settings){
  const risk=idOf((item.title||'')+' '+(item.rawText||'')).risk,std=API.moneyMath({buy:item.price,sell:m.standard,fee:m.sell.fee,ship:m.sell.ship,other:0},settings),low=API.moneyMath({buy:item.price,sell:m.conservative,fee:m.sell.fee,ship:m.sell.ship,other:0},settings);
  const medianPrice=m.median||m.standard||0,ratio=medianPrice>0?item.price/medianPrice:1,anomaly=(!!m.id.brand||m.id.materials.some(x=>PRECIOUS.has(x)))&&medianPrice>0&&ratio<.42;
  let verdict='PASS';const reason=[];
  if(risk.level===2){verdict='PASS';reason.push((risk.reasons||[]).join('・')||'故障・欠品等の強い注意')}
  else if(!m.priceReady){verdict='HOLD';reason.push(m.priceReason)}
  else if(std.profit<=0){verdict='PASS';reason.push('安全側の想定売価では赤字')}
  else if(m.strictIdentity){
    const buyReady=m.aCount>=2&&m.confidenceScore>=65&&std.profit>=settings.minProfit&&std.roi>=settings.minRoi&&low.profit>=Math.max(500,settings.minProfit*.20);
    if(buyReady){verdict='BUY';reason.push('厳密一致2件以上・利益・投資利益率・下振れ耐性が基準到達')}
    else if(std.profit>=settings.watchProfit&&std.roi>=settings.watchRoi&&m.confidenceScore>=50){verdict='WATCH';reason.push('利益余地あり。ただし仕入候補の安全条件には未到達')}
    else if(std.profit>0&&m.confidenceScore<50){verdict='HOLD';reason.push('利益余地はあるが厳密一致の根拠が弱い')}
    else{verdict='PASS';reason.push('利益・投資利益率または安全余裕が基準未達')}
  }else{
    if(std.profit>=settings.watchProfit&&std.roi>=settings.watchRoi&&m.confidenceScore>=50){verdict='WATCH';reason.push('カテゴリ相場では利益余地あり。ただし厳密一致でないため要確認まで')}
    else if(std.profit>0&&m.confidenceScore<50){verdict='HOLD';reason.push('カテゴリ相場の比較根拠が不足')}
    else{verdict='PASS';reason.push('カテゴリ相場では利益・投資利益率が基準未達')}
  }
  if(anomaly&&verdict==='BUY'){verdict='WATCH';reason.push('ブランド・貴金属として相場より極端に安く真贋・状態確認が必要')}else if(anomaly)reason.push('相場乖離が大きく要確認');
  if(risk.level===1&&verdict==='BUY'){verdict='WATCH';reason.push((risk.reasons||[]).join('・')+'のため仕入候補を抑制')}else if(risk.level===1)reason.push((risk.reasons||[]).join('・'));
  if(m.spread>.65)reason.push('価格ばらつき大');
  const pScore=clamp((std.profit/Math.max(1,settings.minProfit))*32,0,36),rScore=clamp((std.roi/Math.max(1,settings.minRoi))*24,0,28),cScore=m.confidenceScore*.36-(anomaly?9:0)-(risk.level*10),score=Math.round(clamp(pScore+rScore+cScore,0,100));
  return{...std,lowProfit:low.profit,lowRoi:low.roi,verdict,score,reason:uniq(reason).filter(Boolean).join(' ／ '),anomaly,priceRatio:ratio};
}
function analyzeItems(items,query,settings){
  const clean=(items||[]).filter(x=>x&&x.title&&+x.price>0&&x.url).map(x=>({...x,price:+x.price})),fitted=[],rejected=[];
  for(const x of clean){const fit=queryFitStrict(x,query);if(fit.ok)fitted.push(x);else rejected.push({...x,_reject:fit.reason})}
  const analyzed=fitted.map(item=>{const market=buildMarket(item,fitted,query,settings),calc=opportunity(item,market,settings);return{item,market,calc}}),rank={BUY:4,WATCH:3,HOLD:2,PASS:1};
  analyzed.sort((a,b)=>rank[b.calc.verdict]-rank[a.calc.verdict]||b.calc.score-a.calc.score||b.calc.profit-a.calc.profit);
  return{clean,fitted,rejected,analyzed};
}
function verdictLabel(v){return({BUY:'仕入候補',WATCH:'要確認',HOLD:'保留',PASS:'見送り'})[v]||v}
function gradeLabel(g){return({A:'厳密一致',B:'高一致',C:'参考一致',D:'低一致',X:'除外'})[g]||g}
function modeLabel(m){return({strict:'厳密一致','strict-insufficient':'厳密一致不足',category:'カテゴリ参考相場','category-insufficient':'カテゴリ相場不足'})[m]||m}
function materialLabel(x){return({k24:'K24',k22:'K22',k18:'K18',k14:'K14',k10:'K10',pt950:'Pt950',pt900:'Pt900',platinum:'プラチナ',sv925:'SV925',silver:'銀',stainless:'ステンレス',gold_plated:'金メッキ',silver_plated:'銀メッキ',leather:'レザー'})[x]||x}
function identityText(m){const a=[m.id.cat.label];if(m.id.brand)a.push('ブランド '+m.id.brand);if(m.id.models.length)a.push('型番 '+m.id.models.slice(0,2).join('/'));if(m.id.materials.length)a.push('素材 '+m.id.materials.map(materialLabel).join('／'));if(m.id.specs.length)a.push('仕様 '+m.id.specs.slice(0,3).map(x=>x.label).join('／'));return a.join('・')}
function renderSummary(rows){const el=$('summary');if(!el)return;const c={BUY:0,WATCH:0,HOLD:0,PASS:0};rows.forEach(x=>c[x.calc.verdict]++);const p=rows.filter(x=>x.calc.verdict==='BUY').reduce((s,x)=>s+Math.max(0,x.calc.profit),0);el.innerHTML='<div class="box buy"><span>仕入候補</span><b>'+c.BUY+'</b></div><div class="box watch"><span>要確認</span><b>'+c.WATCH+'</b></div><div class="box hold"><span>保留</span><b>'+c.HOLD+'</b></div><div class="box pass"><span>見送り</span><b>'+c.PASS+'</b></div><div class="box"><span>仕入候補 利益合計</span><b>'+yen(p)+'</b></div>';el.classList.remove('hide')}
function saveCandidate(x){let h=[];try{h=JSON.parse(localStorage.getItem('sedori_history')||'[]')}catch{}const id=crypto?.randomUUID?crypto.randomUUID():String(Date.now()+Math.random());h.unshift({...x,id,saved_at:new Date().toISOString()});localStorage.setItem('sedori_history',JSON.stringify(h))}
function broadCategory(cat,mats=[]){if(cat==='wallet')return'wallet';if(['ring','necklace','bracelet','earring'].includes(cat)&&mats.some(x=>PRECIOUS.has(x)))return'precious_metals';if(['ring','necklace','bracelet','earring','watch'].includes(cat))return'accessory';if(['outer','top','bottom','shoes','bag'].includes(cat))return'apparel';if(['phone','tablet','pc','camera','game','toy'].includes(cat))return'electronics';if(cat==='tool')return'tool';if(cat==='auto')return'auto';return'other'}
function prefillJudge(row){const {item:x,market:m}=row,set=(id,v)=>{const e=$(id);if(e)e.value=v};set('source',x.source);set('sellChannel',m.sell.site);set('feeRate',m.sell.fee);set('category',broadCategory(m.id.cat.id,m.id.materials));set('title',x.title);set('url',x.url);set('buy',x.price);set('sell',m.standard||0);set('shipping',m.sell.ship);set('other',0);set('comps',m.priceCompCount||m.compCount);set('auth',m.id.brand?'medium':'low');set('cond','medium');document.querySelector('nav button[data-tab="judgePanel"]')?.click()}
function renderCandidates(items,siteCounts={},errors={}){
  const settings=loadSettings(),q=($('searchQ')?.value||'').trim(),result=analyzeItems(items,q,settings),allRows=result.analyzed,rows=allRows.slice(0,settings.maxCandidates||40);renderSummary(allRows);
  const box=$('candidateResults');if(!box)return;box.innerHTML='';
  for(const row of rows){const {item:x,market:m,calc:c}=row,card=document.createElement('div');card.className='candidate';const img=document.createElement('img');img.src=x.image||'icons/icon-192.png';img.alt='';img.loading='lazy';const body=document.createElement('div'),spreadPct=Math.round((m.spread||0)*100),risk=[];if(m.confidenceScore<55)risk.push('信頼度低');if(m.strictIdentity&&m.aCount<2)risk.push('厳密一致不足');if(m.spread>.65)risk.push('相場ばらつき大');if(c.anomaly)risk.push('相場より極端に安い');const saleLabel=m.strictIdentity?'標準売価':'参考売価',destination=m.priceReady?esc(siteName(m.sell.site)):'—';
    body.innerHTML='<div class="source-line">検索元：'+esc(siteName(x.source))+'｜'+esc(m.id.cat.label)+'｜信頼度 '+m.confidenceScore+'/100（'+m.confidence+'）</div><h3 class="candidate-title">'+esc(x.title)+'</h3><div class="moneyline">仕入価格 '+yen(x.price)+' → 販売候補 '+destination+'｜'+saleLabel+' '+(m.standard?yen(m.standard):'算定不可')+'</div><div class="profitline"><b>想定利益 '+(m.standard?yen(c.profit):'—')+'</b>｜投資利益率 '+(m.standard?pct(c.roi):'—')+'｜最大仕入目安 '+(m.standard?yen(c.maxBuy):'—')+'</div><div class="candidate-data">相場：安全側 '+(m.conservative?yen(m.conservative):'—')+' ／ 標準 '+(m.standard?yen(m.standard):'—')+' ／ 上限側 '+(m.aggressive?yen(m.aggressive):'—')+'<br>販売コスト：手数料仮定 '+m.sell.fee+'%・送料仮定 '+yen(m.sell.ship)+'｜販売先の比較品 '+m.sell.sourceComps+'件<br>比較：厳密一致 '+m.aCount+'件・高一致 '+m.bCount+'件・参考一致 '+m.cCount+'件｜比較合計 '+m.compCount+'件｜'+m.sourceCount+'サイト｜価格根拠 '+m.priceCompCount+'件／'+(m.priceSourceCount||0)+'サイト｜除外 '+m.removed+'件｜ばらつき '+spreadPct+'%｜判定方式 '+modeLabel(m.mode)+'<br>商品識別：'+esc(identityText(m))+'<br>判定理由：'+esc(c.reason)+(risk.length?'<br><span class="risk">注意：'+esc(risk.join(' ／ '))+'</span>':'')+'<br><span style="font-size:11px">※販売中の表示価格を使った推定で、成約価格ではありません。厳密一致は2件以上、一般商品は高一致2件以上を含むカテゴリ相場5件以上を最低条件とし、カテゴリ相場だけでは「仕入候補」にしません。</span></div><div class="verdict '+c.verdict.toLowerCase()+'">'+verdictLabel(c.verdict)+'<span class="badge">評価 '+c.score+'点</span></div>';
    const details=document.createElement('details'),sum=document.createElement('summary');sum.textContent='根拠を見る（比較 '+m.compCount+'件／価格根拠 '+m.priceCompCount+'件）';details.appendChild(sum);m.rows.slice(0,10).forEach(z=>{const d=document.createElement('div');d.className='peer';d.innerHTML='<b>'+gradeLabel(z.sim.grade)+' '+Math.round(z.sim.score*100)+'%</b>｜'+esc(siteName(z.x.source))+' '+yen(z.x.price)+'｜'+esc(z.sim.reason)+'<br><a href="'+esc(z.x.url)+'" target="_blank" rel="noopener">'+esc(z.x.title)+'</a>';details.appendChild(d)});body.appendChild(details);
    const act=document.createElement('div');act.className='candidate-actions';const open=document.createElement('a');open.className='btn';open.href=x.url;open.target='_blank';open.rel='noopener';open.textContent=siteName(x.source)+'で見る';const save=document.createElement('button');save.className='btn';save.textContent='候補に保存';save.onclick=()=>{saveCandidate({source:x.source,title:x.title,url:x.url,buy:x.price,sell:m.standard,sell_channel:m.sell.site,expected_profit_yen:c.profit,margin_pct:Math.round(c.roi*10)/10,score:c.score,verdict:c.verdict,confidence:m.confidenceScore,max_buy:c.maxBuy,image:x.image});save.textContent='保存済み'};const judge=document.createElement('button');judge.className='btn primary';judge.textContent='詳しく判定';judge.onclick=()=>prefillJudge(row);act.append(open,save,judge);body.appendChild(act);card.append(img,body);box.appendChild(card)}
  box.classList.toggle('hide',!rows.length);const countText=SITE_IDS.map(id=>siteName(id)+' '+Number(siteCounts[id]||0)+'件').join('｜'),errText=Object.entries(errors||{}).filter(([,v])=>v).map(([k,v])=>siteName(k)+'：'+v).join(' ／ '),omitted=Math.max(0,allRows.length-rows.length),counts={BUY:0,WATCH:0,HOLD:0,PASS:0};allRows.forEach(x=>counts[x.calc.verdict]++);
  setStatus(result.clean.length?result.clean.length+'件取得。'+countText+'。検索条件不一致 '+result.rejected.length+'件除外。判定対象 '+allRows.length+'件、表示 '+rows.length+'件'+(omitted?'（下位 '+omitted+'件省略）':'')+'。仕入候補 '+counts.BUY+' / 要確認 '+counts.WATCH+' / 保留 '+counts.HOLD+' / 見送り '+counts.PASS+'。'+(errText?'取得注意 '+errText+'。':''):'実商品を取得できませんでした。'+(errText||'Userscriptsの許可と各サイトのログイン状態を確認してください。'));
}
function enhanceLoginRows(status={}){const rows=[...document.querySelectorAll('#loginResults .login-row')];rows.forEach((row,i)=>{const id=SITE_IDS[i];if(!id)return;row.querySelector('[data-login-link]')?.remove();const state=status[id]||'';if(state==='in')return;const a=document.createElement('a');a.className='btn';a.dataset.loginLink='1';a.href=LOGIN_URLS[id];a.target='_blank';a.rel='noopener';a.textContent=state==='out'?'ログインへ':'サイトを開く';a.style.marginLeft='8px';a.style.padding='6px 10px';a.style.fontSize='12px';a.style.whiteSpace='nowrap';row.appendChild(a)})}
function hardFail(message,error){READY=false;window.__SEDORI_SELFTEST__={passed:0,total:1,ok:false,checks:[false],version:VERSION,error:String(error?.message||error||message)};setHeader('v'+VERSION+' 起動エラー｜検索停止');setStatus(message);const b=$('bulkSearchBtn');if(b){b.disabled=true;b.textContent='判定エンジンを起動できません'}}
window.addEventListener('message',e=>{if(e.source!==window)return;if(e.data?.type==='SEDORI_SEARCH_RESULTS'&&READY){e.stopImmediatePropagation();try{renderCandidates(e.data.items||[],e.data.siteCounts||{},e.data.errors||{})}catch(err){console.error('検索結果判定エラー',err);setStatus('検索結果の判定処理でエラーが発生しました。再検索してください。')}return}if(e.data?.type==='SEDORI_LOGIN_STATUS')requestAnimationFrame(()=>enhanceLoginRows(e.data.status||{}))},true);
async function boot(){setHeader('v'+VERSION+' 実用版｜判定エンジン起動中');setStatus('v'+VERSION+'判定エンジンを起動中です…');try{API=await loadCore();const test=selfTest(API);window.__SEDORI_SELFTEST__=test;if(!test.ok){hardFail('判定エンジンの自己診断に失敗しました。検索は停止しています。',new Error('selftest failed'));return}READY=true;window.__SEDORI_APP_STABLE_VERSION__=VERSION;setHeader('v'+VERSION+' 実用版｜厳密一致・カテゴリ相場・自己診断合格');setStatus('判定エンジン準備完了。商品名・ブランド・型番を入力して5サイト一括検索できます。');enhanceLoginRows()}catch(e){console.error('せどりAI v'+VERSION+' 起動失敗',e);hardFail('判定エンジン本体の読み込みに失敗しました。ページを再読み込みしてください。',e)}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();