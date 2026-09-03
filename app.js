(()=>{'use strict';
const CORE='./app-v8-core.js?v=82';
const LOGIN_URLS={
  mercari:'https://jp.mercari.com/',
  rakuma:'https://fril.jp/',
  yahoo_fleamarket:'https://paypayfleamarket.yahoo.co.jp/',
  yahoo_auction:'https://auctions.yahoo.co.jp/',
  jmty:'https://jmty.jp/users/sign_in'
};
const LOGIN_IDS=['mercari','rakuma','yahoo_fleamarket','yahoo_auction','jmty'];

function replaceFn(src,name,nextName,replacement){
  const start=src.indexOf(`function ${name}(`);
  if(start<0)throw new Error(`v8.2 patch: ${name} not found`);
  const end=src.indexOf(`function ${nextName}(`,start+1);
  if(end<0)throw new Error(`v8.2 patch: ${nextName} boundary not found`);
  return src.slice(0,start)+replacement.trim()+`\n  `+src.slice(end);
}

function enhanceLoginRows(status={}){
  const rows=[...document.querySelectorAll('#loginResults .login-row')];
  rows.forEach((row,i)=>{
    const id=LOGIN_IDS[i];
    if(!id)return;
    row.querySelector('[data-login-link]')?.remove();
    if(status[id]==='in')return;
    const a=document.createElement('a');
    a.className='btn';
    a.dataset.loginLink='1';
    a.href=LOGIN_URLS[id];
    a.target='_blank';
    a.rel='noopener';
    a.textContent=status[id]==='out'?'ログインへ':'サイトへ';
    a.style.marginLeft='8px';
    a.style.padding='6px 10px';
    a.style.fontSize='12px';
    a.style.whiteSpace='nowrap';
    row.appendChild(a);
  });
}

async function boot(){
  try{
    let s=await fetch(CORE,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('core '+r.status);return r.text()});

    s=s.replace("const VERSION='8.0.0';","const VERSION='8.2.2';");
    if(!s.includes("const VERSION='8.2.2';"))throw new Error('v8.2 version patch failed');

    s=s.replace(
      "return uniq(raw.map(x=>x.replace(/[ -]/g,''))).slice(0,8)",
      "const materialCode=/^(?:K(?:10|14|18|22|24)|PT(?:900|950)|SV925|SILVER925|750|585)$/;return uniq(raw.map(x=>x.replace(/[ -]/g,'')).filter(x=>!materialCode.test(x))).slice(0,8)"
    );

    s=replaceFn(s,'queryFit','similarity',`
function queryFit(x,q){
  if(!q)return{ok:true};
  const a=queryIdentity(q),b=identity(x.title);
  if(a.cat.id!=='other'&&b.cat.id!=='other'&&a.cat.id!==b.cat.id)return{ok:false,reason:'カテゴリ不一致'};
  if(a.brand&&b.brand&&b.brand!==a.brand)return{ok:false,reason:'ブランド不一致'};
  if(a.brand&&!b.brand)return{ok:false,reason:'ブランド確認不能'};
  if(a.models.length&&!b.models.length)return{ok:false,reason:'型番確認不能'};
  if(a.models.length&&b.models.length&&!a.models.some(v=>b.models.includes(v)))return{ok:false,reason:'型番不一致'};
  if(a.materials.length&&!b.materials.length)return{ok:false,reason:'素材確認不能'};
  if(a.materials.length&&b.materials.length&&materialsConflict(a.materials,b.materials))return{ok:false,reason:'素材不一致'};
  if(a.stones.length&&!b.stones.length)return{ok:false,reason:'石確認不能'};
  if(a.stones.length&&b.stones.length&&!a.stones.some(v=>b.stones.includes(v)))return{ok:false,reason:'石不一致'};
  const sm=specMatch(a.specs,b.specs);
  if(a.specs.length&&!b.specs.length)return{ok:false,reason:'仕様確認不能'};
  if(sm.hard)return{ok:false,reason:'主要仕様不一致'};
  return{ok:true};
}`);

    s=replaceFn(s,'similarity','dedupe',`
function similarity(target,peer,query=''){
  const a=identity(target.title),b=identity(peer.title),q=queryIdentity(query);
  const category=q.cat.id!=='other'?q.cat:a.cat;
  if(category.id!=='other'&&b.cat.id!=='other'&&category.id!==b.cat.id)return{score:-1,grade:'X',reason:'カテゴリ'};
  const brand=q.brand||a.brand;
  if(brand&&b.brand&&b.brand!==brand)return{score:-1,grade:'X',reason:'ブランド'};
  if(a.brand&&b.brand&&a.brand!==b.brand)return{score:-1,grade:'X',reason:'ブランド'};
  const models=uniq([...q.models,...a.models]);
  if(models.length&&b.models.length&&!models.some(x=>b.models.includes(x)))return{score:-1,grade:'X',reason:'型番'};
  const mats=uniq([...q.materials,...a.materials]);
  if(materialsConflict(mats,b.materials))return{score:-1,grade:'X',reason:'素材'};
  const stones=uniq([...q.stones,...a.stones]);
  if(stones.length&&b.stones.length&&!stones.some(x=>b.stones.includes(x)))return{score:-1,grade:'X',reason:'石'};
  if(a.risk.bundle!==b.risk.bundle)return{score:-1,grade:'X',reason:'単品/セット'};
  const wantedSpecs=uniq([...q.specs,...a.specs]),sm=specMatch(wantedSpecs,b.specs);
  if(sm.hard)return{score:-1,grade:'X',reason:'主要仕様'};

  let score=.24,reasons=[];
  if(category.id!=='other'&&b.cat.id===category.id){score+=.18;reasons.push('カテゴリ');}
  const brandMatched=!!brand&&b.brand===brand;
  if(brand){if(brandMatched){score+=.21;reasons.push('ブランド');}else if(!b.brand)score-=.08;}
  const modelMatched=models.length&&b.models.length&&models.some(x=>b.models.includes(x));
  if(models.length){if(modelMatched){score+=.27;reasons.push('型番');}else score-=.10;}
  const materialMatched=mats.length&&b.materials.length&&mats.some(x=>b.materials.includes(x));
  if(mats.length){if(materialMatched){score+=.11;reasons.push('素材');}else if(!b.materials)score-=.05;}
  const stoneMatched=stones.length&&b.stones.length&&stones.some(x=>b.stones.includes(x));
  if(stoneMatched){score+=.06;reasons.push('石');}
  if(sm.known){score+=.10*sm.score;if(sm.score>.5)reasons.push('仕様');}
  const terms=uniq([...q.terms,...a.terms]),hits=terms.filter(x=>b.terms.includes(x)).length;
  if(terms.length){score+=.15*Math.min(1,hits/Math.max(2,Math.min(8,terms.length)));if(hits>=2)reasons.push('特徴語');}
  if(!brand&&!models.length&&!mats.length&&!wantedSpecs.length&&hits<2)score-=.14;
  if(b.risk.level===2)score-=.20;else if(b.risk.level===1)score-=.07;
  score=clamp(score,0,1);

  const strongIdentity=modelMatched || (brandMatched&&(materialMatched||stoneMatched||(sm.known&&sm.score>=.75)||hits>=2)) || (!brand&&!models.length&&sm.known&&sm.score>=.85&&hits>=2);
  const grade=score>=.82&&strongIdentity?'A':score>=.65?'B':score>=.52?'C':'D';
  return{score,grade,reason:reasons.join('・')||'弱一致'};
}`);

    s=replaceFn(s,'dedupe','robustRows',`
function dedupe(scored){
  const seen=new Set();
  return scored.filter(z=>{
    const x=z.x,k=[norm(x.title).toLowerCase().slice(0,110),Math.round((+x.price||0)/100)*100].join('|');
    if(seen.has(k))return false;
    seen.add(k);
    return true;
  });
}`);

    s=replaceFn(s,'buildMarket','opportunity',`
function buildMarket(item,all,query,settings=DEFAULTS){
  const target=identity(item.title),scored=[];
  for(const x of all){
    if(x.url===item.url||!(+x.price>0))continue;
    const sim=similarity(item,x,query);
    if(sim.score>=.52)scored.push({x,sim,id:identity(x.title)});
  }
  scored.sort((a,b)=>b.sim.score-a.sim.score);

  const evidence=robustRows(scored.filter(z=>['A','B','C'].includes(z.sim.grade)));
  const pricing=robustRows(scored.filter(z=>z.sim.grade==='A'));
  const aCount=pricing.rows.length;
  const bCount=evidence.rows.filter(z=>z.sim.grade==='B').length;
  const cCount=evidence.rows.filter(z=>z.sim.grade==='C').length;
  const sourceCount=new Set(evidence.rows.map(z=>z.x.source)).size;
  const priceSourceCount=new Set(pricing.rows.map(z=>z.x.source)).size;
  const priceReady=aCount>=2;

  const weighted=pricing.rows.map(z=>({value:+z.x.price,weight:1}));
  const rawLow=priceReady?weightedQuantile(weighted,.22):0;
  const rawStd=priceReady?weightedQuantile(weighted,.35):0;
  const rawHigh=priceReady?weightedQuantile(weighted,.58):0;
  const rawMed=priceReady?weightedQuantile(weighted,.50):0;
  const low=priceReady?Math.max(0,Math.floor(rawLow*.90/100)*100):0;
  const globalStd=priceReady?Math.max(0,Math.floor(rawStd*.94/100)*100):0;
  const high=priceReady?Math.max(0,Math.floor(rawHigh*.97/100)*100):0;
  const med=priceReady?Math.max(0,Math.round(rawMed)):0;

  let conf=Math.min(26,evidence.rows.length*4)+Math.min(42,aCount*12)+Math.min(12,bCount*3)+Math.min(10,priceSourceCount*5)+Math.min(10,target.strength);
  if(evidence.spread>.65)conf-=18;else if(evidence.spread>.45)conf-=10;
  if(aCount===0)conf=Math.min(conf,35);else if(aCount===1)conf=Math.min(conf,49);
  if(target.strength<4)conf=Math.min(conf,58);
  conf=clamp(Math.round(conf),0,100);
  const confidence=conf>=80?'高':conf>=65?'中':conf>=45?'低':'不足';

  const ship=shippingFor(target.cat.id,settings),candidates=[];
  if(priceReady){
    for(const site of SELL_SITES){
      const sr=pricing.rows.filter(z=>z.x.source===site);
      if(!sr.length)continue;
      const siteWeighted=sr.map(z=>({value:+z.x.price,weight:1}));
      const base=sr.length>=2?weightedQuantile(siteWeighted,.35):globalStd;
      const est=Math.max(0,Math.floor(base*.94/100)*100);
      const fee=feeRate(site,settings),m=moneyMath({buy:item.price,sell:est,fee,ship,other:0},settings);
      candidates.push({site,price:est,fee,ship,net:m.net,sourceComps:sr.length});
    }
  }
  candidates.sort((a,b)=>b.net-a.net||b.sourceComps-a.sourceComps);
  const sell=candidates[0]||{site:'yahoo_fleamarket',price:0,fee:feeRate('yahoo_fleamarket',settings),ship,net:0,sourceComps:0};

  return{
    rows:evidence.rows,compCount:evidence.rows.length,aCount,bCount,cCount,sourceCount,priceSourceCount,
    removed:evidence.removed+pricing.removed,spread:evidence.spread,confidence,confidenceScore:conf,
    conservative:low,standard:priceReady?(sell.price||globalStd):0,aggressive:high,median:med,sell,id:target,
    mode:priceReady?'A-only':'insufficient-A',priceReady,
    priceReason:priceReady?'A一致のみで売価算定':aCount===0?'A一致なしのため売価算定不可':'A一致が1件のみのため売価算定不可'
  };
}`);

    s=replaceFn(s,'opportunity','analyzeItems',`
function opportunity(item,m,settings=DEFAULTS){
  const itemRisk=riskOf((item.title||'')+' '+(item.rawText||''));
  const priceUsable=!!m.priceReady&&m.standard>0;
  const std=moneyMath({buy:item.price,sell:priceUsable?m.standard:0,fee:m.sell.fee,ship:m.sell.ship},settings);
  const low=moneyMath({buy:item.price,sell:priceUsable?m.conservative:0,fee:m.sell.fee,ship:m.sell.ship},settings);
  const medianPrice=priceUsable?(m.median||m.standard||0):0,priceRatio=medianPrice>0?item.price/medianPrice:1;
  const branded=!!m.id.brand,precious=m.id.materials.some(x=>PRECIOUS.has(x)),anomaly=(branded||precious)&&medianPrice>0&&priceRatio<.42;
  let verdict='PASS',reason=[];

  if(itemRisk.level===2){verdict='PASS';reason.push(itemRisk.reasons.join('・'));}
  else if(!priceUsable){verdict='HOLD';reason.push(m.priceReason||'A一致不足のため売価算定不可');}
  else if(std.profit<=0){verdict='PASS';reason.push('A一致相場の標準売価で赤字');}
  else{
    const strong=m.aCount>=2&&m.confidenceScore>=70&&(m.priceSourceCount>=2||m.aCount>=3)&&m.spread<=.55;
    if(strong&&std.profit>=settings.minProfit&&std.roi>=settings.minRoi&&low.profit>=Math.max(500,settings.minProfit*.20)){
      verdict='BUY';reason.push('A一致売価・利益・ROI・下振れ耐性が基準到達');
    }else if(std.profit>=settings.watchProfit&&std.roi>=settings.watchRoi&&m.confidenceScore>=55){
      verdict='WATCH';reason.push('A一致で利益余地あり。ただしBUYの安全条件未達');
    }else if(std.profit>0){
      verdict='HOLD';reason.push('利益余地はあるが比較信頼度または安全余裕不足');
    }else{
      verdict='PASS';reason.push('利益/ROI/安全余裕が基準未達');
    }
  }

  if(anomaly&&verdict==='BUY'){verdict='WATCH';reason.push('ブランド/貴金属として相場より極端に安く真贋・状態確認が必要');}
  else if(anomaly)reason.push('相場乖離が大きく要確認');
  if(itemRisk.level===1&&verdict==='BUY'){verdict='WATCH';reason.push(itemRisk.reasons.join('・')+'のためBUY抑制');}
  else if(itemRisk.level===1)reason.push(itemRisk.reasons.join('・'));
  if(m.spread>.65)reason.push('価格ばらつき大');

  const safeMaxBuy=priceUsable?Math.max(0,Math.floor(Math.min(low.net-settings.minProfit,settings.minRoi>0?low.net/(1+settings.minRoi/100):low.net)/100)*100):0;
  const pScore=priceUsable?clamp((std.profit/Math.max(1,settings.minProfit))*32,0,36):0;
  const rScore=priceUsable?clamp((std.roi/Math.max(1,settings.minRoi))*24,0,28):0;
  const cScore=m.confidenceScore*.36-(anomaly?9:0)-(itemRisk.level*10);
  const score=Math.round(clamp(pScore+rScore+cScore,0,100));
  return{...std,maxBuy:safeMaxBuy,lowProfit:priceUsable?low.profit:0,lowRoi:priceUsable?low.roi:0,verdict,score,reason:uniq(reason).join(' / '),anomaly,priceRatio,priceUsable};
}`);

    s=s.replaceAll("'算出不可'","'売価算定不可'");
    s=s.replace("if(m.aCount===0)riskText.push('A一致なし');","if(!m.priceReady)riskText.push(m.priceReason||'A一致不足');");
    s=s.replace("esc(siteName(m.sell.site))","(m.priceReady?esc(siteName(m.sell.site)):'—')");
    s=s.replace("｜モード ${m.mode}<br>同等品：","｜売価根拠 A ${m.aCount}件/${m.priceSourceCount||0}サイト｜モード ${m.mode}<br>同等品：");
    s=s.replace("根拠を見る（同等品 ${m.compCount}件）","根拠を見る（比較 ${m.compCount}件／A一致 ${m.aCount}件）");
    s=s.replace("※販売中表示価格ベースであり成約価格ではありません。売価は下位価格帯へ安全補正しています。","※販売中表示価格ベースであり成約価格ではありません。v8.2ではA一致2件未満は売価・利益・ROIを算定しません。B/C一致は参考表示のみです。");
    s=s.replace("v8.0 実用版｜検索条件保持・同等品階層化・下振れ耐性・相場乖離検知","v8.2.2 本命版｜A一致売価のみ・誤利益遮断・未確認/未ログインサイトへワンタップ移動");

    (0,eval)(s);

    window.addEventListener('message',e=>{
      if(e.source!==window||e.data?.type!=='SEDORI_LOGIN_STATUS')return;
      queueMicrotask(()=>enhanceLoginRows(e.data.status||{}));
    });

    const A=window.__SEDORI_V8__;
    const mk=(source,title,price,id)=>({source,title,price,url:`https://selftest.invalid/${id}`,rawText:title});
    const t=mk('mercari','Cartier ラブリング K18 11号',7000,'t');
    const p1=mk('rakuma','Cartier ラブリング K18 11号',12000,'p1');
    const p2=mk('yahoo_fleamarket','カルティエ ラブリング K18 11号',12300,'p2');
    const one=A.buildMarket(t,[t,p1],'Cartier ラブリング K18 11号',A.DEFAULTS);
    const two=A.buildMarket(t,[t,p1,p2],'Cartier ラブリング K18 11号',A.DEFAULTS);
    const checks=[
      String(A?.VERSION).startsWith('8.2'),
      !A.identity('Cartier リング K18 11号').models.includes('K18'),
      A.queryFit({title:'Tiffany リング SV925'},'Cartier リング').ok===false,
      A.queryFit({title:'Cartier ラブリング 11号'},'Cartier ラブリング K18 11号').ok===false,
      one.aCount===1&&one.standard===0&&one.priceReady===false,
      A.opportunity(t,one,A.DEFAULTS).verdict==='HOLD',
      two.aCount>=2&&two.standard>0&&two.priceReady===true
    ];
    window.__SEDORI_SELFTEST__={passed:checks.filter(Boolean).length,total:checks.length,ok:checks.every(Boolean),checks};
    if(!window.__SEDORI_SELFTEST__.ok){
      const e=document.getElementById('searchStatus');
      if(e)e.textContent='v8.2自己テストに失敗しました。検索を実行せず再読み込みしてください。';
      console.error('sedori v8.2 selftest failed',checks,{one,two});
    }
  }catch(e){
    console.error(e);
    const st=document.getElementById('searchStatus');
    if(st)st.textContent='v8.2の読み込みに失敗しました。再読み込みしてください。';
  }
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();