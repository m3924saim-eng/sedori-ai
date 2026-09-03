(()=>{'use strict';
const VERSION='9.0.0';
const SITE_NAMES={mercari:'メルカリ',rakuma:'楽天ラクマ',yahoo_fleamarket:'Yahoo!フリマ',yahoo_auction:'Yahoo!オークション',jmty:'ジモティー'};
const SELL_SITES=['mercari','rakuma','yahoo_fleamarket','yahoo_auction'];
const PRECIOUS=new Set(['k24','k22','k18','k14','k10','pt950','pt900','platinum','sv925','silver']);
const $=id=>document.getElementById(id),clamp=(n,a,b)=>Math.min(b,Math.max(a,n)),uniq=a=>[...new Set((a||[]).filter(Boolean))];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const yen=n=>'¥'+Math.round(Number(n)||0).toLocaleString('ja-JP');
const pct=n=>(Math.round((Number(n)||0)*10)/10)+'%';
const siteName=id=>SITE_NAMES[id]||id||'不明';
const verdictLabel={BUY:'仕入候補',WATCH:'要確認',HOLD:'保留',PASS:'見送り'};
function api(){return window.__SEDORI_V8__||null}
function settings(){
  const A=api(),d=A?.DEFAULTS||{minProfit:3000,minRoi:30,watchProfit:1500,watchRoi:15,maxCandidates:40,fees:{mercari:10,rakuma:10,yahoo_fleamarket:5,yahoo_auction:10,jmty:5},shipping:{tiny:230,small:450,medium:750,large:1000,xlarge:1600}};
  try{const x=JSON.parse(localStorage.getItem('sedori_settings_v8')||'null')||{};return{...d,...x,fees:{...d.fees,...(x.fees||{})},shipping:{...d.shipping,...(x.shipping||{})}}}catch{return d}
}
function idOf(t){
  const A=api(); if(!A?.identity) throw new Error('判定コア未読込');
  const x=A.identity(t||'');
  return{...x,models:x.models||[],materials:x.materials||[],stones:x.stones||[],specs:x.specs||[],terms:x.terms||[],risk:x.risk||{level:0,reasons:[],bundle:false}};
}
function matConflict(a,b){return !!api()?._util?.materialsConflict?.(a||[],b||[])}
function specMatch(a,b){return api()?._util?.specMatch?.(a||[],b||[])||{known:false,score:.5,hard:false}}
function wq(rows,q){return api()?._util?.weightedQuantile?.(rows||[],q)||0}
function median(a){return api()?._util?.median?.(a||[])||0}
function quantile(a,q){return api()?._util?.quantile?.(a||[],q)||0}
function normalTitle(s){return String(s||'').normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim()}
function isImitationText(s){return /(イミテーション|メッキ|ゴールドカラー|シルバーカラー|GP\b|gold\s*plated|fake|replica|レプリカ|コピー品|模倣品|タイプ品)/i.test(String(s||''))}
function strongPrecious(ids){return (ids.materials||[]).some(v=>PRECIOUS.has(v))}
function identityConflict(a,b){
  if(a.cat.id!=='other'&&b.cat.id!=='other'&&a.cat.id!==b.cat.id)return'カテゴリ';
  if(a.brand&&b.brand&&a.brand!==b.brand)return'ブランド';
  if(a.models.length&&b.models.length&&!a.models.some(v=>b.models.includes(v)))return'型番';
  if(a.materials.length&&b.materials.length&&matConflict(a.materials,b.materials))return'素材';
  if(a.stones.length&&b.stones.length&&!a.stones.some(v=>b.stones.includes(v)))return'宝石';
  const sm=specMatch(a.specs,b.specs); if(sm.hard)return'主要仕様';
  if(a.risk.bundle!==b.risk.bundle)return'単品/セット';
  return'';
}
function queryFit(x,q){
  if(!q)return{ok:true};
  const a=idOf(q),b=idOf(x.title),conf=identityConflict(a,b);
  if(conf)return{ok:false,reason:conf+'不一致'};
  if(a.brand&&!b.brand)return{ok:false,reason:'ブランド確認不能'};
  if(a.models.length&&!b.models.length)return{ok:false,reason:'型番確認不能'};
  if(strongPrecious(a)&&isImitationText((x.title||'')+' '+(x.rawText||'')))return{ok:false,reason:'貴金属指定に対し模倣/メッキ表記'};
  return{ok:true};
}
function similarity(target,peer,query=''){
  const a=idOf(target.title),b=idOf(peer.title),q=idOf(query),cat=q.cat.id!=='other'?q.cat:a.cat;
  const cq={...q,cat}; const conflict=identityConflict({...a,cat},b)||identityConflict(cq,b);
  if(conflict)return{score:-1,grade:'X',reason:conflict};
  const brand=q.brand||a.brand,models=uniq([...q.models,...a.models]),mats=uniq([...q.materials,...a.materials]),stones=uniq([...q.stones,...a.stones]);
  const sm=specMatch(uniq([...q.specs,...a.specs]),b.specs);
  let s=.22,re=[];
  if(cat.id!=='other'&&b.cat.id===cat.id){s+=.20;re.push('カテゴリ')}
  if(brand){if(b.brand===brand){s+=.22;re.push('ブランド')}else if(!b.brand)s-=.10}
  if(models.length){if(b.models.length&&models.some(v=>b.models.includes(v))){s+=.28;re.push('型番')}else if(!b.models.length)s-=.12}
  if(mats.length){if(b.materials.length&&mats.some(v=>b.materials.includes(v))){s+=.12;re.push('素材')}else if(!b.materials.length)s-=.05}
  if(stones.length&&b.stones.length&&stones.some(v=>b.stones.includes(v))){s+=.05;re.push('宝石')}
  if(sm.known){s+=.08*sm.score;if(sm.score>.5)re.push('仕様')}
  const terms=uniq([...q.terms,...a.terms]),hits=terms.filter(v=>b.terms.includes(v)).length;
  if(terms.length){s+=.15*Math.min(1,hits/Math.max(2,Math.min(8,terms.length)));if(hits>=2)re.push('特徴語')}
  if(isImitationText(peer.title)&&strongPrecious({...q,materials:mats}))s-=.35;
  if(b.risk.level===2)s-=.24; else if(b.risk.level===1)s-=.08;
  s=clamp(s,0,1);
  return{score:s,grade:s>=.84?'A':s>=.69?'B':s>=.55?'C':'D',reason:re.join('・')||'弱一致'};
}
function robust(scored){
  const seen=new Set(),rows=[];
  for(const z of scored){
    const x=z.x,k=[x.source||'',normalTitle(x.title).slice(0,120),Math.round((+x.price||0)/100)*100].join('|');
    if(seen.has(k)||!(+x.price>0))continue; seen.add(k); rows.push(z);
  }
  if(rows.length<4){
    const ps=rows.map(z=>+z.x.price),m=median(ps),spread=ps.length>1&&m?(quantile(ps,.75)-quantile(ps,.25))/m:(ps.length?0:1);
    return{rows,spread,removed:scored.length-rows.length};
  }
  const ps=rows.map(z=>+z.x.price),q1=quantile(ps,.25),q3=quantile(ps,.75),med=median(ps),iqr=q3-q1;
  const lo=Math.max(1,q1-1.5*iqr,med*.50),hi=Math.min(q3+1.5*iqr,med*2.00);
  const keep=rows.filter(z=>z.x.price>=lo&&z.x.price<=hi),use=keep.length>=3?keep:rows,p2=use.map(z=>+z.x.price),m2=median(p2);
  return{rows:use,spread:m2?(quantile(p2,.75)-quantile(p2,.25))/m2:1,removed:scored.length-use.length};
}
function shipping(cat,s){
  if(['ring','necklace','bracelet','earring','wallet'].includes(cat))return Number(s.shipping.tiny)||230;
  if(cat==='watch')return Number(s.shipping.small)||450;
  if(['phone','tablet','camera','game','toy','outer','top','bottom'].includes(cat))return Number(s.shipping.medium)||750;
  if(['bag','shoes','pc','tool'].includes(cat))return Number(s.shipping.large)||1000;
  if(cat==='auto')return Number(s.shipping.xlarge)||1600;
  return Number(s.shipping.medium)||750;
}
function money({buy,sell,fee,ship,other=0},s){
  buy=Math.max(0,+buy||0); sell=Math.max(0,+sell||0); fee=Math.max(0,+fee||0); ship=Math.max(0,+ship||0); other=Math.max(0,+other||0);
  const feeY=Math.round(sell*fee/100),net=sell-feeY-ship-other,profit=Math.round(net-buy),roi=buy>0?profit/buy*100:0;
  const maxByProfit=Math.floor(net-Math.max(0,+s.minProfit||0));
  const r=Math.max(0,+s.minRoi||0)/100,maxByRoi=r>0?Math.floor(net/(1+r)):Math.floor(net);
  const maxBuy=Math.max(0,Math.min(maxByProfit,maxByRoi));
  return{feeY,net,profit,roi,maxBuy};
}
function buildMarket(item,all,q,s){
  const target=idOf(item.title),wanted=idOf(q),sc=[];
  for(const x of all){
    if(x.url===item.url||!(+x.price>0))continue;
    const sim=similarity(item,x,q);
    if(sim.score>=.55)sc.push({x,sim,id:idOf(x.title)});
  }
  sc.sort((a,b)=>b.sim.score-a.sim.score);
  const strict=robust(sc.filter(z=>z.sim.grade==='A'));
  const broad=robust(sc.filter(z=>['A','B','C'].includes(z.sim.grade)));
  const a=broad.rows.filter(z=>z.sim.grade==='A').length,b=broad.rows.filter(z=>z.sim.grade==='B').length,c=broad.rows.filter(z=>z.sim.grade==='C').length;
  const strictIdentity=!!(wanted.brand||wanted.models.length||strongPrecious(wanted)||target.brand||target.models.length||strongPrecious(target));
  let rows,ready,mode;
  if(strictIdentity){rows=strict.rows;ready=rows.length>=2;mode=ready?'strict':'strict-insufficient'}
  else{rows=broad.rows;ready=rows.length>=4&&(a+b)>=2;mode=ready?'category':'category-insufficient'}
  const weights={A:1,B:.70,C:.35};
  const weighted=rows.map(z=>({value:+z.x.price,weight:weights[z.sim.grade]||.2}));
  const factor=strictIdentity?{low:.90,std:.94,high:.97}:{low:.80,std:.88,high:.94};
  const low=ready?Math.floor(wq(weighted,.20)*factor.low/100)*100:0;
  const baseStd=ready?Math.floor(wq(weighted,.35)*factor.std/100)*100:0;
  const high=ready?Math.floor(wq(weighted,.58)*factor.high/100)*100:0;
  const sourceCount=new Set(rows.map(z=>z.x.source).filter(Boolean)).size,spread=(rows===strict.rows?strict.spread:broad.spread)||0;
  let conf=Math.min(36,rows.length*6)+Math.min(24,(a+b)*5)+Math.min(12,sourceCount*4)+(strictIdentity?Math.min(18,a*9):0);
  if(spread>.65)conf-=22; else if(spread>.48)conf-=12; else if(spread>.32)conf-=5;
  if(!ready)conf=Math.min(conf,44); if(!strictIdentity)conf=Math.min(conf,72); conf=clamp(Math.round(conf),0,100);
  const ship=shipping(target.cat.id,s),candidates=[];
  if(ready){
    for(const site of SELL_SITES){
      const sr=rows.filter(z=>z.x.source===site),siteWeighted=sr.map(z=>({value:+z.x.price,weight:weights[z.sim.grade]||.2}));
      const siteBase=sr.length>=2?wq(siteWeighted,.35):baseStd;
      const est=Math.floor(siteBase*(strictIdentity?.94:.90)/100)*100,fee=Number(s.fees[site]??10);
      const mm=money({buy:item.price,sell:est,fee,ship},s);
      candidates.push({site,price:est,fee,ship,net:mm.net,profit:mm.profit,sourceComps:sr.length});
    }
  }
  candidates.sort((x,y)=>y.profit-x.profit||y.sourceComps-x.sourceComps);
  const fallback=SELL_SITES.includes(item.source)?item.source:'yahoo_fleamarket';
  const sell=candidates[0]||{site:fallback,price:baseStd,fee:Number(s.fees[fallback]??10),ship,net:0,profit:0,sourceComps:0};
  return{rows:broad.rows,aCount:a,bCount:b,cCount:c,compCount:broad.rows.length,priceCompCount:rows.length,priceSourceCount:sourceCount,removed:broad.removed,spread,
    confidenceScore:conf,confidence:conf>=80?'高':conf>=65?'中':conf>=45?'低':'不足',
    conservative:low,standard:sell.price||baseStd,aggressive:high,sell,id:target,mode,strictIdentity,priceReady:ready,
    priceReason:strictIdentity?'厳密一致2件未満':'カテゴリ相場4件または高一致2件未満'};
}
function opportunity(item,m,s){
  const fullText=(item.title||'')+' '+(item.rawText||''),risk=idOf(fullText).risk,imitation=isImitationText(fullText);
  const std=money({buy:item.price,sell:m.standard,fee:m.sell.fee,ship:m.sell.ship},s);
  const low=money({buy:item.price,sell:m.conservative,fee:m.sell.fee,ship:m.sell.ship},s);
  let verdict='PASS',reason=[];
  if(risk.level===2){reason.push('故障・欠品・模倣等の強い注意語');verdict='PASS'}
  else if(m.strictIdentity&&strongPrecious(m.id)&&imitation){reason.push('貴金属表記と模倣/メッキ表記が競合');verdict='PASS'}
  else if(!m.priceReady){verdict='HOLD';reason.push(m.priceReason)}
  else if(std.profit<=0){verdict='PASS';reason.push('標準売価でも赤字')}
  else if(m.strictIdentity){
    if(m.aCount>=2&&m.confidenceScore>=68&&std.profit>=s.minProfit&&std.roi>=s.minRoi&&low.profit>=500){verdict='BUY';reason.push('厳密一致・利益・ROI・下振れ耐性が基準到達')}
    else if(std.profit>=s.watchProfit&&std.roi>=s.watchRoi){verdict='WATCH';reason.push('利益余地あり。仕入前確認が必要')}
    else if(std.profit>0){verdict='HOLD';reason.push('利益はあるが基準未達')}
  }else{
    if(std.profit>=s.watchProfit&&std.roi>=s.watchRoi&&m.confidenceScore>=50){verdict='WATCH';reason.push('カテゴリ相場で利益余地あり。一般商品なので要確認')}
    else if(std.profit>0){verdict='HOLD';reason.push('利益余地はあるが相場根拠が弱い')}
  }
  if(risk.level===1&&verdict==='BUY'){verdict='WATCH';reason.push('注意語あり')}
  const score=Math.round(clamp(clamp(std.profit/Math.max(1,s.minProfit)*32,0,36)+clamp(std.roi/Math.max(1,s.minRoi)*24,0,28)+m.confidenceScore*.36-risk.level*10,0,100));
  return{...std,lowProfit:low.profit,lowRoi:low.roi,verdict,score,reason:reason.join(' ／ ')||'基準未達'};
}
function analyze(items,q,s){
  const clean=(items||[]).filter(x=>x&&x.title&&Number.isFinite(+x.price)&&+x.price>0&&x.url).map(x=>({...x,price:+x.price}));
  const fit=[],rej=[];
  for(const x of clean){const f=queryFit(x,q);f.ok?fit.push(x):rej.push({...x,_reject:f.reason})}
  const analyzed=fit.map(item=>{const market=buildMarket(item,fit,q,s),calc=opportunity(item,market,s);return{item,market,calc}});
  const rank={BUY:4,WATCH:3,HOLD:2,PASS:1};
  analyzed.sort((a,b)=>rank[b.calc.verdict]-rank[a.calc.verdict]||b.calc.score-a.calc.score||b.calc.profit-a.calc.profit);
  return{clean,fit,rej,analyzed};
}
function render(items,siteCounts={},errors={}){
  const s=settings(),q=($('searchQ')?.value||'').trim(),r=analyze(items,q,s),all=r.analyzed,rows=all.slice(0,s.maxCandidates||40),sum=$('summary'),box=$('candidateResults');
  if(!sum||!box)return;
  const c={BUY:0,WATCH:0,HOLD:0,PASS:0}; all.forEach(z=>c[z.calc.verdict]++);
  const p=all.filter(z=>z.calc.verdict==='BUY').reduce((a,z)=>a+Math.max(0,z.calc.profit),0);
  sum.innerHTML=`<div class="box buy"><span>仕入候補</span><b>${c.BUY}</b></div><div class="box watch"><span>要確認</span><b>${c.WATCH}</b></div><div class="box hold"><span>保留</span><b>${c.HOLD}</b></div><div class="box pass"><span>見送り</span><b>${c.PASS}</b></div><div class="box"><span>仕入候補 利益合計</span><b>${yen(p)}</b></div>`;
  sum.classList.remove('hide'); box.innerHTML='';
  for(const z of rows){
    const x=z.item,m=z.market,k=z.calc,d=document.createElement('div'); d.className='candidate';
    d.innerHTML=`<img src="${esc(x.image||'icons/icon-192.png')}" alt=""><div><div class="source-line">検索元：${esc(siteName(x.source))}｜${esc(m.id.cat.label)}｜信頼度 ${m.confidenceScore}/100（${m.confidence}）</div><h3 class="candidate-title">${esc(x.title)}</h3><div class="moneyline">仕入 ${yen(x.price)} → ${m.priceReady?esc(siteName(m.sell.site)):'—'}｜${m.strictIdentity?'標準売価':'カテゴリ参考売価'} ${m.standard?yen(m.standard):'算定不可'}</div><div class="profitline"><b>想定利益 ${m.standard?yen(k.profit):'—'}</b>｜ROI ${m.standard?pct(k.roi):'—'}｜最大仕入 ${m.standard?yen(k.maxBuy):'—'}</div><div class="candidate-data">相場：安全側 ${m.conservative?yen(m.conservative):'—'} ／ 標準 ${m.standard?yen(m.standard):'—'} ／ 上限 ${m.aggressive?yen(m.aggressive):'—'}<br>比較：厳密 ${m.aCount}・高一致 ${m.bCount}・参考 ${m.cCount}｜価格根拠 ${m.priceCompCount}件｜${m.priceSourceCount}サイト｜ばらつき ${Math.round((m.spread||0)*100)}%<br>判定：${esc(k.reason)}<br><span style="font-size:11px">※販売中表示価格からの推定。手数料・推定送料を控除。一般商品のカテゴリ相場だけでは「仕入候補」にしません。</span></div><div class="verdict ${k.verdict.toLowerCase()}">${verdictLabel[k.verdict]}<span class="badge">評価 ${k.score}点</span></div><div class="candidate-actions"><a class="btn" href="${esc(x.url)}" target="_blank" rel="noopener">${esc(siteName(x.source))}で見る</a></div></div>`;
    box.appendChild(d);
  }
  box.classList.toggle('hide',!rows.length);
  const entries=Object.entries(siteCounts||{}),counted=entries.reduce((a,[,n])=>a+(Number(n)||0),0),counts=entries.map(([id,n])=>siteName(id)+' '+(Number(n)||0)+'件').join('｜');
  const err=Object.entries(errors||{}).filter(([,v])=>v).map(([id,v])=>siteName(id)+'：'+v).join(' ／ ');
  const discrepancy=counted&&counted!==r.clean.length?` 内訳合計 ${counted}件（受信件数との差 ${r.clean.length-counted>=0?'+':''}${r.clean.length-counted}）`:'';
  const st=$('searchStatus'); if(st)st.textContent=`${r.clean.length}件受信。${counts||'サイト内訳なし'}。${discrepancy} 検索条件不一致 ${r.rej.length}件除外。判定対象 ${all.length}件、表示 ${rows.length}件。仕入候補 ${c.BUY} / 要確認 ${c.WATCH} / 保留 ${c.HOLD} / 見送り ${c.PASS}。${err?`取得注意 ${err}`:''}`;
}
function brandUI(){
  document.title='せどりAI v9.0.0';
  const p=document.querySelector('header p'); if(p)p.textContent='v9.0.0 実用判定エンジン｜同一性・相場耐性・純利益を強化';
  const st=$('searchStatus'); if(st&&/v8\.3\.0|起動中/.test(st.textContent||''))st.textContent='v9.0.0判定エンジンを起動しました。';
}
window.addEventListener('message',e=>{
  if(e.source!==window||e.data?.type!=='SEDORI_SEARCH_RESULTS')return;
  if(!api())return;
  e.stopImmediatePropagation();
  try{render(e.data.items||[],e.data.siteCounts||{},e.data.errors||{})}
  catch(err){console.error('v9 logic error',err);const st=$('searchStatus');if(st)st.textContent='判定処理でエラーが発生しました。再検索してください。'}
},true);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',brandUI,{once:true});else brandUI();
window.__SEDORI_V83_PATCH__={version:VERSION,engine:'v9'};
window.__SEDORI_V9__={version:VERSION,analyze,render,money};
})();