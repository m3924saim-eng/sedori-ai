(()=>{'use strict';
const CORE='./app-v8-core.js?v=824';
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
  if(start<0)throw new Error(`v8.2.4 修正失敗: ${name} が見つかりません`);
  const end=src.indexOf(`function ${nextName}(`,start+1);
  if(end<0)throw new Error(`v8.2.4 修正失敗: ${nextName} の境界が見つかりません`);
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
    a.textContent=status[id]==='out'?'ログインへ':'サイトを開く';
    a.style.marginLeft='8px';
    a.style.padding='6px 10px';
    a.style.fontSize='12px';
    a.style.whiteSpace='nowrap';
    row.appendChild(a);
  });
}

async function boot(){
  try{
    let s=await fetch(CORE,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('基本処理の取得失敗 '+r.status);return r.text()});

    s=s.replace("const VERSION='8.0.0';","const VERSION='8.2.4';");
    if(!s.includes("const VERSION='8.2.4';"))throw new Error('v8.2.4 の版番号反映に失敗しました');

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
  if(a.stones.length&&!b.stones.length)return{ok:false,reason:'宝石確認不能'};
  if(a.stones.length&&b.stones.length&&!a.stones.some(v=>b.stones.includes(v)))return{ok:false,reason:'宝石不一致'};
  const sm=specMatch(a.specs,b.specs);
  if(a.specs.length&&!b.specs.length)return{ok:false,reason:'仕様確認不能'};
  if(sm.hard)return{ok:false,reason:'主要仕様不一致'};
  return{ok:true};
}`);

    s=replaceFn(s,'similarity','dedupe',`
function similarity(target,peer,query=''){
  const a=identity(target.title),b=identity(peer.title),q=queryIdentity(query);
  const category=q.cat.id!=='other'?q.cat:a.cat;
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

  let score=.24,reasons=[];
  if(category.id!=='other'&&b.cat.id===category.id){score+=.18;reasons.push('カテゴリ');}
  const brandMatched=!!brand&&b.brand===brand;
  if(brand){if(brandMatched){score+=.21;reasons.push('ブランド');}else if(!b.brand)score-=.08;}
  const modelMatched=models.length&&b.models.length&&models.some(x=>b.models.includes(x));
  if(models.length){if(modelMatched){score+=.27;reasons.push('型番');}else score-=.10;}
  const materialMatched=mats.length&&b.materials.length&&mats.some(x=>b.materials.includes(x));
  if(mats.length){if(materialMatched){score+=.11;reasons.push('素材');}else if(!b.materials)score-=.05;}
  const stoneMatched=stones.length&&b.stones.length&&stones.some(x=>b.stones.includes(x));
  if(stoneMatched){score+=.06;reasons.push('宝石');}
  if(sm.known){score+=.10*sm.score;if(sm.score>.5)reasons.push('仕様');}
  const terms=uniq([...q.terms,...a.terms]),hits=terms.filter(x=>b.terms.includes(x)).length;
  if(terms.length){score+=.15*Math.min(1,hits/Math.max(2,Math.min(8,terms.length)));if(hits>=2)reasons.push('特徴語');}
  if(!brand&&!models.length&&!mats.length&&!wantedSpecs.length&&hits<2)score-=.14;
  if(b.risk.level===2)score-=.20;else if(b.risk.level===1)score-=.07;
  score=clamp(score,0,1);

  const strongIdentity=modelMatched || (brandMatched&&(materialMatched||stoneMatched||(sm.known&&sm.score>=.75)||hits>=2)) || (!brand&&!models.length&&sm.known&&sm.score>=.85&&hits>=2);
  const grade=score>=.82&&strongIdentity?'A':score>=.65?'B':score>=.52?'C':'D';
  return{score,grade,reason:reasons.join('・')||'弱い一致'};
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
  const target=identity(item.title),wanted=queryIdentity(query),scored=[];
  for(const x of all){
    if(x.url===item.url||!(+x.price>0))continue;
    const sim=similarity(item,x,query);
    if(sim.score>=.52)scored.push({x,sim,id:identity(x.title)});
  }
  scored.sort((a,b)=>b.sim.score-a.sim.score);

  const evidence=robustRows(scored.filter(z=>['A','B','C'].includes(z.sim.grade)));
  const strictPricing=robustRows(scored.filter(z=>z.sim.grade==='A'));
  const aCount=evidence.rows.filter(z=>z.sim.grade==='A').length;
  const bCount=evidence.rows.filter(z=>z.sim.grade==='B').length;
  const cCount=evidence.rows.filter(z=>z.sim.grade==='C').length;
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
  const genericPricing=robustRows(genericPool);
  const genericStrong=genericPricing.rows.filter(z=>z.sim.grade==='A'||z.sim.grade==='B').length;

  const strictReady=strictPricing.rows.length>=2;
  const categoryReady=genericPricing.rows.length>=5&&genericStrong>=2;
  const priceReady=strictIdentity?strictReady:categoryReady;
  const priceRows=strictIdentity?strictPricing.rows:genericPricing.rows;
  const priceSpread=strictIdentity?strictPricing.spread:genericPricing.spread;
  const priceSourceCount=new Set(priceRows.map(z=>z.x.source)).size;
  const priceCompCount=priceRows.length;
  const mode=strictIdentity?(priceReady?'strict':'strict-insufficient'):(priceReady?'category':'category-insufficient');

  const weights={A:1,B:.72,C:.36};
  const weighted=priceRows.map(z=>({value:+z.x.price,weight:weights[z.sim.grade]||.2}));
  const lowQ=strictIdentity?.22:.20,stdQ=strictIdentity?.35:.35,highQ=strictIdentity?.58:.58;
  const lowFactor=strictIdentity?.90:.80,stdFactor=strictIdentity?.94:.88,highFactor=strictIdentity?.97:.94;
  const rawLow=priceReady?weightedQuantile(weighted,lowQ):0;
  const rawStd=priceReady?weightedQuantile(weighted,stdQ):0;
  const rawHigh=priceReady?weightedQuantile(weighted,highQ):0;
  const rawMed=priceReady?weightedQuantile(weighted,.50):0;
  const low=priceReady?Math.max(0,Math.floor(rawLow*lowFactor/100)*100):0;
  const globalStd=priceReady?Math.max(0,Math.floor(rawStd*stdFactor/100)*100):0;
  const high=priceReady?Math.max(0,Math.floor(rawHigh*highFactor/100)*100):0;
  const med=priceReady?Math.max(0,Math.round(rawMed)):0;

  let conf=0;
  if(strictIdentity){
    conf=Math.min(26,evidence.rows.length*4)+Math.min(42,strictPricing.rows.length*12)+Math.min(10,priceSourceCount*5)+Math.min(10,target.strength);
    if(priceSpread>.65)conf-=18;else if(priceSpread>.45)conf-=10;
    if(strictPricing.rows.length===0)conf=Math.min(conf,35);else if(strictPricing.rows.length===1)conf=Math.min(conf,49);
    if(target.strength<4)conf=Math.min(conf,58);
  }else{
    conf=Math.min(32,genericPricing.rows.length*5)+Math.min(24,genericStrong*6)+Math.min(10,priceSourceCount*5)+Math.min(10,target.strength);
    if(priceSpread>.70)conf-=18;else if(priceSpread>.50)conf-=10;
    if(!categoryReady)conf=Math.min(conf,49);else conf=Math.min(conf,69);
  }
  conf=clamp(Math.round(conf),0,100);
  const confidence=conf>=80?'高':conf>=65?'中':conf>=45?'低':'不足';

  const ship=shippingFor(target.cat.id,settings),candidates=[];
  if(priceReady){
    for(const site of SELL_SITES){
      const sr=priceRows.filter(z=>z.x.source===site);
      if(!sr.length)continue;
      const siteWeighted=sr.map(z=>({value:+z.x.price,weight:weights[z.sim.grade]||.2}));
      const needed=strictIdentity?2:3;
      const base=sr.length>=needed?weightedQuantile(siteWeighted,.35):globalStd;
      const factor=strictIdentity?.94:.88;
      const est=sr.length>=needed?Math.max(0,Math.floor(base*factor/100)*100):globalStd;
      const fee=feeRate(site,settings),m=moneyMath({buy:item.price,sell:est,fee,ship,other:0},settings);
      candidates.push({site,price:est,fee,ship,net:m.net,sourceComps:sr.length});
    }
  }
  candidates.sort((a,b)=>b.net-a.net||b.sourceComps-a.sourceComps);
  const fallbackSite=SELL_SITES.includes(item.source)?item.source:'yahoo_fleamarket';
  const sell=candidates[0]||{site:fallbackSite,price:priceReady?globalStd:0,fee:feeRate(fallbackSite,settings),ship,net:0,sourceComps:0};

  let priceReason='';
  if(strictIdentity)priceReason=priceReady?'厳密一致した同等品2件以上を使って売価を算定':'厳密一致した同等品が2件未満のため売価を算定できません';
  else priceReason=priceReady?'高一致2件以上を含むカテゴリ相場5件以上を使って参考売価を算定':'高一致2件以上を含むカテゴリ相場の比較件数が不足しているため売価を算定できません';

  return{
    rows:evidence.rows,compCount:evidence.rows.length,aCount,bCount,cCount,sourceCount,priceSourceCount,priceCompCount,
    removed:evidence.removed+(strictIdentity?strictPricing.removed:genericPricing.removed),spread:priceSpread,
    confidence,confidenceScore:conf,conservative:low,standard:priceReady?(sell.price||globalStd):0,
    aggressive:high,median:med,sell,id:target,mode,priceReady,priceReason,strictIdentity,genericStrong
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
  else if(!priceUsable){verdict='HOLD';reason.push(m.priceReason||'相場根拠不足のため売価を算定できません');}
  else if(std.profit<=0){verdict='PASS';reason.push('安全補正後の売価では赤字');}
  else if(m.strictIdentity){
    const strong=m.priceCompCount>=2&&m.confidenceScore>=70&&(m.priceSourceCount>=2||m.priceCompCount>=3)&&m.spread<=.55;
    if(strong&&std.profit>=settings.minProfit&&std.roi>=settings.minRoi&&low.profit>=Math.max(500,settings.minProfit*.20)){
      verdict='BUY';reason.push('厳密一致相場・利益・投資利益率・下振れ耐性が基準到達');
    }else if(std.profit>=settings.watchProfit&&std.roi>=settings.watchRoi&&m.confidenceScore>=55){
      verdict='WATCH';reason.push('厳密一致相場で利益余地あり。ただし仕入候補の安全条件には未到達');
    }else if(std.profit>0&&m.confidenceScore<55){
      verdict='HOLD';reason.push('利益余地はあるが比較信頼度が不足');
    }else{
      verdict='PASS';reason.push('利益・投資利益率・安全余裕の基準未達');
    }
  }else{
    if(m.confidenceScore<50){
      verdict='HOLD';reason.push('カテゴリ相場は取得できたが比較信頼度が不足');
    }else if(std.profit>=settings.watchProfit&&std.roi>=settings.watchRoi&&low.profit>0){
      verdict='WATCH';reason.push('カテゴリ相場では利益候補。ただし厳密一致ではないため要確認');
    }else{
      verdict='PASS';reason.push('カテゴリ相場では利益・投資利益率の基準未達');
    }
  }

  if(anomaly&&verdict==='BUY'){verdict='WATCH';reason.push('ブランド品または貴金属として相場より極端に安く、真贋・状態確認が必要');}
  else if(anomaly)reason.push('相場から大きく外れているため要確認');
  if(itemRisk.level===1&&verdict==='BUY'){verdict='WATCH';reason.push(itemRisk.reasons.join('・')+'のため仕入候補を抑制');}
  else if(itemRisk.level===1)reason.push(itemRisk.reasons.join('・'));
  if(m.spread>.70)reason.push('価格のばらつきが大きい');

  const targetProfit=m.strictIdentity?settings.minProfit:settings.watchProfit;
  const targetRoi=m.strictIdentity?settings.minRoi:settings.watchRoi;
  const safeMaxBuy=priceUsable?Math.max(0,Math.floor(Math.min(low.net-targetProfit,targetRoi>0?low.net/(1+targetRoi/100):low.net)/100)*100):0;
  const pScore=priceUsable?clamp((std.profit/Math.max(1,targetProfit))*32,0,36):0;
  const rScore=priceUsable?clamp((std.roi/Math.max(1,targetRoi))*24,0,28):0;
  const cScore=m.confidenceScore*.36-(anomaly?9:0)-(itemRisk.level*10);
  let score=Math.round(clamp(pScore+rScore+cScore,0,100));
  if(!m.strictIdentity)score=Math.min(score,79);
  return{...std,maxBuy:safeMaxBuy,lowProfit:priceUsable?low.profit:0,lowRoi:priceUsable?low.roi:0,verdict,score,reason:uniq(reason).join(' / '),anomaly,priceRatio,priceUsable};
}`);

    s=replaceFn(s,'renderSummary','identityText',`
function verdictLabel(v){return({BUY:'仕入候補',WATCH:'要確認',HOLD:'保留',PASS:'見送り'})[v]||v||'不明';}
function gradeLabel(v){return({A:'厳密一致',B:'高一致',C:'参考一致',D:'弱一致',X:'対象外'})[v]||v||'不明';}
function modeLabel(v){return({strict:'厳密一致相場',category:'カテゴリ相場','strict-insufficient':'厳密一致不足','category-insufficient':'カテゴリ相場不足'})[v]||'不明';}
function brandLabel(v){return({cartier:'カルティエ',tiffany:'ティファニー',bvlgari:'ブルガリ',gucci:'グッチ',louis_vuitton:'ルイ・ヴィトン',chanel:'シャネル',hermes:'エルメス',dior:'ディオール',prada:'プラダ',celine:'セリーヌ',loewe:'ロエベ',bottega:'ボッテガ',coach:'コーチ',rolex:'ロレックス',omega:'オメガ',seiko:'セイコー',casio:'カシオ',apple:'アップル',sony:'ソニー',canon:'キヤノン',nikon:'ニコン',panasonic:'パナソニック',fujifilm:'富士フイルム',nintendo:'任天堂',makita:'マキタ',hikoki:'ハイコーキ',bosch:'ボッシュ',dewalt:'デウォルト'})[v]||v||'';}
function materialLabel(v){return({k24:'K24',k22:'K22',k18:'K18',k14:'K14',k10:'K10',pt950:'プラチナ950',pt900:'プラチナ900',platinum:'プラチナ',sv925:'シルバー925',silver:'銀',stainless:'ステンレス',gold_plated:'金メッキ',silver_plated:'銀メッキ',leather:'本革'})[v]||v||'';}
function renderSummary(allRows){
  const el=$('summary');if(!el)return;
  const counts={BUY:0,WATCH:0,HOLD:0,PASS:0};allRows.forEach(x=>counts[x.calc.verdict]++);
  const totalProfit=allRows.filter(x=>x.calc.verdict==='BUY').reduce((sum,x)=>sum+Math.max(0,x.calc.profit),0);
  el.innerHTML=`<div class="box buy"><span>仕入候補</span><b>${counts.BUY}</b></div><div class="box watch"><span>要確認</span><b>${counts.WATCH}</b></div><div class="box hold"><span>保留</span><b>${counts.HOLD}</b></div><div class="box pass"><span>見送り</span><b>${counts.PASS}</b></div><div class="box"><span>仕入候補の想定利益合計</span><b>${yen(totalProfit)}</b></div>`;
  el.classList.remove('hide');
}`);

    s=replaceFn(s,'identityText','saveCandidate',`
function identityText(m){
  const a=[m.id.cat.label];
  if(m.id.brand)a.push('ブランド '+brandLabel(m.id.brand));
  if(m.id.models.length)a.push('型番 '+m.id.models.slice(0,2).join('／'));
  if(m.id.materials.length)a.push('素材 '+m.id.materials.map(materialLabel).join('／'));
  if(m.id.specs.length)a.push('仕様 '+m.id.specs.slice(0,3).map(x=>x.label).join('／'));
  return a.join('・');
}`);

    s=replaceFn(s,'renderCandidates','prefillJudge',`
function renderCandidates(items,siteCounts={},errors={}){
  const saved=restoreSearch(),q=($('searchQ')?.value||saved?.query||'').trim(),result=analyzeItems(items,q,settings);
  const allRows=result.analyzed,rows=allRows.slice(0,settings.maxCandidates);
  renderSummary(allRows);
  const box=$('candidateResults');box.innerHTML='';
  for(const row of rows){
    const {item:x,market:m,calc:c}=row,card=document.createElement('div');
    card.className='candidate';
    const img=document.createElement('img');img.src=x.image||'icons/icon-192.png';img.alt='';img.loading='lazy';
    const body=document.createElement('div'),spreadPct=Math.round((m.spread||0)*100),riskText=[];
    if(m.confidenceScore<55)riskText.push('信頼度が低い');
    if(!m.priceReady)riskText.push(m.priceReason||'相場根拠が不足');
    if(m.spread>.70)riskText.push('価格のばらつきが大きい');
    if(c.anomaly)riskText.push('相場より極端に安い');
    const saleLabel=m.strictIdentity?'標準売価':'参考売価';
    const destination=m.priceReady?esc(siteName(m.sell.site)):'—';
    body.innerHTML=`<div class="source-line">検索元：${esc(siteName(x.source))}｜${esc(m.id.cat.label)}｜信頼度 ${m.confidenceScore}/100（${m.confidence}）</div><h3 class="candidate-title">${esc(x.title)}</h3><div class="moneyline">仕入価格 ${yen(x.price)} → 販売候補 ${destination}｜${saleLabel} ${m.standard?yen(m.standard):'算定不可'}</div><div class="profitline"><b>想定利益 ${m.standard?yen(c.profit):'—'}</b>｜投資利益率 ${m.standard?pct(c.roi):'—'}｜最大仕入目安 ${m.standard?yen(c.maxBuy):'—'}</div><div class="candidate-data">相場：安全側 ${m.conservative?yen(m.conservative):'—'} ／ 標準 ${m.standard?yen(m.standard):'—'} ／ 上限側 ${m.aggressive?yen(m.aggressive):'—'}<br>販売コスト：手数料仮定 ${m.sell.fee}%・送料仮定 ${yen(m.sell.ship)}｜販売先の比較品 ${m.sell.sourceComps}件<br>比較：厳密一致 ${m.aCount}件・高一致 ${m.bCount}件・参考一致 ${m.cCount}件｜比較合計 ${m.compCount}件｜${m.sourceCount}サイト｜価格根拠 ${m.priceCompCount}件／${m.priceSourceCount||0}サイト｜除外 ${m.removed}件｜ばらつき ${spreadPct}%｜判定方式 ${modeLabel(m.mode)}<br>商品識別：${esc(identityText(m))}<br>判定理由：${esc(c.reason)}${riskText.length?`<br><span class="risk">注意：${esc(riskText.join(' ／ '))}</span>`:''}<br><span style="font-size:11px">※販売中の表示価格を使った推定で、成約価格ではありません。厳密一致は2件以上、一般商品は高一致2件以上を含むカテゴリ相場5件以上を最低条件とし、カテゴリ相場だけでは「仕入候補」にしません。</span></div><div class="verdict ${c.verdict.toLowerCase()}">${verdictLabel(c.verdict)}<span class="badge">評価 ${c.score}点</span></div>`;
    const details=document.createElement('details'),sum=document.createElement('summary');
    sum.textContent=`根拠を見る（比較 ${m.compCount}件／価格根拠 ${m.priceCompCount}件）`;details.appendChild(sum);
    m.rows.slice(0,10).forEach(z=>{const d=document.createElement('div');d.className='peer';d.innerHTML=`<b>${gradeLabel(z.sim.grade)} ${Math.round(z.sim.score*100)}%</b>｜${esc(siteName(z.x.source))} ${yen(z.x.price)}｜${esc(z.sim.reason)}<br><a href="${esc(z.x.url)}" target="_blank" rel="noopener">${esc(z.x.title)}</a>`;details.appendChild(d)});
    body.appendChild(details);
    const act=document.createElement('div');act.className='candidate-actions';
    const open=document.createElement('a');open.className='btn';open.href=x.url;open.target='_blank';open.rel='noopener';open.textContent=`${siteName(x.source)}で見る`;
    const save=document.createElement('button');save.className='btn';save.textContent='候補に保存';save.onclick=()=>{saveCandidate({source:x.source,title:x.title,url:x.url,buy:x.price,sell:m.standard,sell_channel:m.sell.site,expected_profit_yen:c.profit,margin_pct:Math.round(c.roi*10)/10,score:c.score,verdict:c.verdict,confidence:m.confidenceScore,max_buy:c.maxBuy,image:x.image});save.textContent='保存済み'};
    const judge=document.createElement('button');judge.className='btn primary';judge.textContent='詳しく判定';judge.onclick=()=>prefillJudge(row);
    act.append(open,save,judge);body.appendChild(act);card.append(img,body);box.appendChild(card);
  }
  box.classList.toggle('hide',!rows.length);
  const countText=SITE_IDS.map(id=>`${siteName(id)} ${Number(siteCounts[id]||0)}件`).join('｜');
  const errText=Object.entries(errors||{}).filter(([,v])=>v).map(([k,v])=>`${siteName(k)}：${v}`).join(' ／ ');
  const omitted=Math.max(0,allRows.length-rows.length),counts={BUY:0,WATCH:0,HOLD:0,PASS:0};
  allRows.forEach(x=>counts[x.calc.verdict]++);
  $('searchStatus').textContent=result.clean.length?`${result.clean.length}件取得。 ${countText}。検索条件不一致 ${result.rejected.length}件を除外。判定対象 ${allRows.length}件、表示 ${rows.length}件${omitted?`（下位 ${omitted}件省略）`:''}。仕入候補 ${counts.BUY} ／ 要確認 ${counts.WATCH} ／ 保留 ${counts.HOLD} ／ 見送り ${counts.PASS}。${errText?' 取得注意：'+errText+'。':''}`:`実商品を取得できませんでした。${errText||'利用スクリプトの許可と各サイトのログイン状態を確認してください。'}`;
}`);

    s=replaceFn(s,'startSearch','manualAnalyze',`
function startSearch(){
  const f=searchFilters();
  if(!f.query){$('searchStatus').textContent='商品名・ブランド・型番を入力してください。';return}
  persistSearch(f);$('candidateResults').classList.add('hide');$('summary').classList.add('hide');
  $('searchStatus').textContent='5サイトを順番に検索しています。このタブを閉じないでください…';
  root.postMessage({type:'SEDORI_START_SEARCH',filters:f},root.location.origin);
  setTimeout(()=>{if(!root.__SEDORI_USERSCRIPT__)$('searchStatus').textContent='利用スクリプトが動作していません。v4.1.0を上書き保存し、各サイトへのアクセスを許可してください。'},1800);
}`);

    s=replaceFn(s,'manualAnalyze','sellerQuestions',`
function manualAnalyze(){
  const buy=+$('buy').value||0,sell=+$('sell').value||0,fee=+$('feeRate').value||0,ship=+$('shipping').value||0,other=+$('other').value||0,comps=+$('comps').value||0,auth=$('auth').value,cond=$('cond').value,m=moneyMath({buy,sell,fee,ship,other},settings);
  let score=45+clamp(m.profit/Math.max(1,settings.minProfit)*22,-20,28)+clamp(m.roi/Math.max(1,settings.minRoi)*18,-15,24)+Math.min(12,comps*2);
  if(auth==='high')score-=25;else if(auth==='medium')score-=8;
  if(cond==='high')score-=18;else if(cond==='medium')score-=6;
  score=clamp(Math.round(score),0,100);
  let verdict='PASS',reason=[];
  if(!buy||!sell){verdict='HOLD';reason.push('仕入価格または想定売価が不足');}
  else if(comps<2){verdict='HOLD';reason.push('相場比較が2件未満');}
  else if(m.profit<=0){verdict='PASS';reason.push('想定売価では赤字');}
  else if(m.profit>=settings.minProfit&&m.roi>=settings.minRoi&&score>=70&&auth!=='high'&&cond!=='high'){verdict='BUY';reason.push('利益・投資利益率・リスクが仕入候補基準に到達');}
  else if(m.profit>=settings.watchProfit&&m.roi>=settings.watchRoi&&score>=50){verdict='WATCH';reason.push('利益候補だが仕入候補の安全条件には未到達');}
  else{verdict='PASS';reason.push('利益または投資利益率が基準未達');}
  if(auth==='high')reason.push('真贋リスクが高い');
  if(cond==='high')reason.push('状態リスクが高い');
  return{source:$('source').value,sell_channel:$('sellChannel').value,fee_rate:fee,category:$('category').value,title:$('title').value.trim(),url:$('url').value.trim(),buy,sell,shipping:ship,other,auth,cond,comps,expected_profit_yen:m.profit,margin_pct:Math.round(m.roi*10)/10,max_buy:m.maxBuy,score,verdict,reason:reason.join(' ／ '),saved_at:new Date().toISOString()};
}`);

    s=replaceFn(s,'renderManual','syncConditional',`
function renderManual(){
  lastManual=manualAnalyze();lastManual.seller_questions=sellerQuestions(lastManual);
  $('resultCard').style.display='block';
  $('verdict').textContent=verdictLabel(lastManual.verdict);
  $('verdict').className='result-verdict '+lastManual.verdict.toLowerCase();
  $('profit').textContent=yen(lastManual.expected_profit_yen);
  $('margin').textContent=pct(lastManual.margin_pct);
  $('maxBuy').textContent=yen(lastManual.max_buy);
  $('score').textContent=lastManual.score+'点';
  $('reason').textContent=lastManual.reason;
  $('openItem').href=lastManual.url||'#';$('openItem').style.opacity=lastManual.url?'1':'.45';
  $('questionBox').classList.toggle('hide',!lastManual.seller_questions);$('questionText').value=lastManual.seller_questions||'';
  $('resultCard').scrollIntoView({behavior:'smooth',block:'center'});
}`);

    s=replaceFn(s,'renderHistory','csvEscape',`
function renderHistory(){
  const h=getHistory(),box=$('history');$('historyCount').textContent=h.length+'件';
  box.innerHTML=h.length?'':'<p class="small">まだ候補はありません。</p>';
  for(const x of h){
    const d=document.createElement('div');d.className='history-item';
    d.innerHTML=`<div class="history-head"><b>${esc(x.title||'名称未入力')}</b><span class="pill">${esc(verdictLabel(x.verdict||''))}</span></div><div class="small">${esc(siteName(x.source))} → ${esc(siteName(x.sell_channel||x.source))}｜${yen(x.buy)} → ${yen(x.sell)}｜利益 ${yen(x.expected_profit_yen)}｜投資利益率 ${pct(x.margin_pct)}｜評価 ${x.score??''}点</div>${x.url?`<a class="small" href="${esc(x.url)}" target="_blank" rel="noopener">商品ページを開く</a>`:''}`;
    box.appendChild(d);
  }
}`);

    s=s.replace("v8.0 実用版｜検索条件保持・同等品階層化・下振れ耐性・相場乖離検知","v8.2.4 実用改良版｜厳密一致とカテゴリ相場の二段階判定・日本語表示");

    (0,eval)(s);

    window.addEventListener('message',e=>{
      if(e.source!==window||e.data?.type!=='SEDORI_LOGIN_STATUS')return;
      queueMicrotask(()=>enhanceLoginRows(e.data.status||{}));
    });

    const A=window.__SEDORI_V8__;
    const mk=(source,title,price,id)=>({source,title,price,url:`https://selftest.invalid/${id}`,rawText:title});

    const strictTarget=mk('mercari','Cartier ラブリング K18 11号',7000,'strict-target');
    const strict1=mk('rakuma','Cartier ラブリング K18 11号',12000,'strict-1');
    const strict2=mk('yahoo_fleamarket','カルティエ ラブリング K18 11号',12300,'strict-2');
    const strictOne=A.buildMarket(strictTarget,[strictTarget,strict1],'Cartier ラブリング K18 11号',A.DEFAULTS);
    const strictTwo=A.buildMarket(strictTarget,[strictTarget,strict1,strict2],'Cartier ラブリング K18 11号',A.DEFAULTS);

    const genericTarget=mk('yahoo_fleamarket','メンズ ステンレス リング 喜平チェーン 回転 スピナー',1200,'generic-target');
    const genericPeers=[
      mk('yahoo_fleamarket','メンズ ステンレス リング 喜平チェーン 回転 スピナー',3800,'g1'),
      mk('yahoo_auction','ステンレス メンズ リング 喜平チェーン 回転 スピナー',4000,'g2'),
      mk('rakuma','メンズ リング ステンレス 喜平チェーン 回転',4200,'g3'),
      mk('mercari','ステンレス リング メンズ 喜平チェーン スピナー 回転',4500,'g4'),
      mk('yahoo_fleamarket','メンズ ステンレス 指輪 喜平チェーン 回転 スピナー',4800,'g5'),
      mk('yahoo_auction','ステンレス メンズ 指輪 喜平チェーン 回転 スピナー',5000,'g6')
    ];
    const generic=A.buildMarket(genericTarget,[genericTarget,...genericPeers],'メンズリング',A.DEFAULTS);
    const genericVerdict=A.opportunity(genericTarget,generic,A.DEFAULTS).verdict;

    const checks=[
      String(A?.VERSION)==='8.2.4',
      !A.identity('Cartier リング K18 11号').models.includes('K18'),
      A.queryFit({title:'Tiffany リング SV925'},'Cartier リング').ok===false,
      A.queryFit({title:'Cartier ラブリング 11号'},'Cartier ラブリング K18 11号').ok===false,
      strictOne.priceReady===false&&strictOne.standard===0,
      A.opportunity(strictTarget,strictOne,A.DEFAULTS).verdict==='HOLD',
      strictTwo.priceReady===true&&strictTwo.strictIdentity===true&&strictTwo.standard>0,
      generic.strictIdentity===false&&generic.priceReady===true&&generic.priceCompCount>=5&&generic.genericStrong>=2,
      genericVerdict==='WATCH'||genericVerdict==='PASS'
    ];
    window.__SEDORI_SELFTEST__={passed:checks.filter(Boolean).length,total:checks.length,ok:checks.every(Boolean),checks};
    if(!window.__SEDORI_SELFTEST__.ok){
      const e=document.getElementById('searchStatus');
      if(e)e.textContent='v8.2.4の自己テストに失敗しました。検索せず再読み込みしてください。';
      console.error('せどりAI v8.2.4 自己テスト失敗',checks,{strictOne,strictTwo,generic,genericVerdict});
    }
  }catch(e){
    console.error(e);
    const st=document.getElementById('searchStatus');
    if(st)st.textContent='v8.2.4の読み込みに失敗しました。再読み込みしてください。';
  }
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();