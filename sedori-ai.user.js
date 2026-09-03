// ==UserScript==
// @name         せどりAI v4.3 実用版 5サイト検索＋ログイン確定同期＋販売下書き
// @namespace    https://m3924saim-eng.github.io/
// @version      4.3.0
// @description  iPhone/iPad Safari Userscripts向け。5サイト横断検索、ログイン状態の再確認と確定同期、販売下書きを安定化。
// @match        https://m3924saim-eng.github.io/*
// @match        https://jp.mercari.com/*
// @match        https://fril.jp/*
// @match        https://paypayfleamarket.yahoo.co.jp/*
// @match        https://auctions.yahoo.co.jp/*
// @match        https://jmty.jp/*
// @grant        GM.getValue
// @grant        GM.setValue
// @grant        GM.deleteValue
// @grant        GM.getTab
// @grant        GM.saveTab
// @inject-into  content
// @run-at       document-idle
// @updateURL    https://m3924saim-eng.github.io/sedori-ai/sedori-ai.user.js
// @downloadURL  https://m3924saim-eng.github.io/sedori-ai/sedori-ai.user.js
// ==/UserScript==

(async()=>{'use strict';

const VERSION='4.3.0';
const APP='m3924saim-eng.github.io';
const JOB='sedori_job_v4';
const RESULT='sedori_result_v4';
const LOGIN='sedori_login_v43';
const LOGIN_TIME='sedori_login_time_v43';
const LEGACY_LOGIN='sedori_login_v4';
const LEGACY_LOGIN_TIME='sedori_login_time_v4';
const LOGIN_JOB='sedori_login_job_v43';
const LOGIN_REPORT='sedori_login_report_v43';
const DRAFT='sedori_draft_v4';
const enc=encodeURIComponent;

const H={
  'jp.mercari.com':'mercari',
  'fril.jp':'rakuma',
  'paypayfleamarket.yahoo.co.jp':'yahoo_fleamarket',
  'auctions.yahoo.co.jp':'yahoo_auction',
  'jmty.jp':'jmty'
};
const N={
  mercari:'メルカリ',
  rakuma:'楽天ラクマ',
  yahoo_fleamarket:'Yahoo!フリマ',
  yahoo_auction:'Yahoo!オークション',
  jmty:'ジモティー'
};
const SITE_IDS=['mercari','rakuma','yahoo_fleamarket','yahoo_auction','jmty'];
const LOGIN_URLS={
  mercari:'https://jp.mercari.com/',
  rakuma:'https://fril.jp/',
  yahoo_fleamarket:'https://paypayfleamarket.yahoo.co.jp/',
  yahoo_auction:'https://auctions.yahoo.co.jp/',
  jmty:'https://jmty.jp/'
};
const SELL={
  mercari:'https://jp.mercari.com/sell',
  rakuma:'https://fril.jp/',
  yahoo_fleamarket:'https://paypayfleamarket.yahoo.co.jp/sell',
  yahoo_auction:'https://auctions.yahoo.co.jp/',
  jmty:'https://jmty.jp/'
};
const BG={
  clean_white:'白背景・自然光風',
  wood_table:'木目テーブル背景',
  concrete_gray:'ライトグレー背景',
  soft_beige:'ベージュ背景',
  dark_luxury:'ダーク背景・高級感'
};

const get=async(k,d)=>{try{return await GM.getValue(k,d)}catch(e){console.warn('[せどりAI] GM.getValue',k,e);return d}};
const set=async(k,v)=>{try{await GM.setValue(k,v);return true}catch(e){console.warn('[せどりAI] GM.setValue',k,e);return false}};
const del=async k=>{try{await GM.deleteValue(k)}catch(e){console.warn('[せどりAI] GM.deleteValue',k,e)}};
const getTab=async()=>{try{return (await GM.getTab())||{}}catch(e){console.warn('[せどりAI] GM.getTab',e);return{}}};
const saveTab=async obj=>{try{await GM.saveTab(obj);return true}catch(e){console.warn('[せどりAI] GM.saveTab',e);return false}};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const yen=n=>'¥'+Math.round(Number(n)||0).toLocaleString('ja-JP');

async function migrateLoginCache(){
  const cur=await get(LOGIN,null);
  if(cur)return;
  const old=await get(LEGACY_LOGIN,null),oldTimes=await get(LEGACY_LOGIN_TIME,null);
  if(old&&typeof old==='object')await set(LOGIN,old);
  if(oldTimes&&typeof oldTimes==='object')await set(LOGIN_TIME,oldTimes);
}

function queue(f){
  const q=enc(f.query),a=f.min||0,b=f.max||0;
  const mercariOrder=f.sort==='price_desc'?'desc':'asc';
  const mercariSort=f.sort==='newest'?'created_time':'price';
  return [
    ['mercari',`https://jp.mercari.com/search?keyword=${q}&price_min=${a}&price_max=${b}&status=${f.onSale?'on_sale':'all'}&sort=${mercariSort}&order=${mercariOrder}`],
    ['rakuma',`https://fril.jp/s?query=${q}&min=${a}&max=${b}&transaction=${f.onSale?'selling':'all'}`],
    ['yahoo_fleamarket',`https://paypayfleamarket.yahoo.co.jp/search/${q}?minPrice=${a}&maxPrice=${b}`],
    ['yahoo_auction',`https://auctions.yahoo.co.jp/search/search?p=${q}&min=${a}&max=${b}`],
    ['jmty',`https://jmty.jp/hyogo/sale?keyword=${q}`]
  ];
}
function price(t){
  const x=[...String(t).replace(/[,，]/g,'').matchAll(/[¥￥]\s*(\d{1,9})|(\d{1,9})\s*円/g)]
    .map(m=>+(m[1]||m[2])).filter(n=>n>0);
  return x[0]||0;
}
const SEL={
  mercari:'a[href*="/item/"]',
  rakuma:'a[href*="/products/"],a[href*="/item/"]',
  yahoo_fleamarket:'a[href*="/item/"]',
  yahoo_auction:'a[href*="/jp/auction/"]',
  jmty:'a[href*="/sale-"]'
};
function rootFor(a){
  return a.closest('article,li,[data-testid*="item"],[data-testid*="product"],[class*="item"],[class*="Item"],[class*="card"],[class*="Card"],section')||a.parentElement||a;
}
function conditionText(t){
  if(/新品|未使用|新品同様/i.test(t))return'new';
  if(/ジャンク|要修理|全体的に状態が悪い|傷や汚れあり/i.test(t))return'used';
  return'good';
}
function collect(site,f){
  const map=new Map(),max=Math.max(10,Math.min(80,+f.maxPerSite||50));
  document.querySelectorAll(SEL[site]||'a').forEach(a=>{
    const r=rootFor(a);
    const txt=(r.innerText||a.innerText||'').replace(/\s+/g,' ').trim();
    if(!txt||txt.length>2500)return;
    const p=price(txt),img=r.querySelector('img');
    const title=(img?.alt||a.getAttribute('aria-label')||a.getAttribute('title')||a.innerText||txt.replace(/[¥￥]\s*[\d,]+.*$/,'')).replace(/\s+/g,' ').trim().slice(0,180);
    const url=(a.href||'').split('?')[0];
    if(!p||!title||!url)return;
    if((f.min&&p<f.min)||(f.max&&p>f.max))return;
    if(f.onSale&&/売り切れ|SOLD|取引終了|受付終了|終了しました|落札済/i.test(txt))return;
    if(f.excludeAds&&(/広告|スポンサー|おすすめショップ|プロモーション|\bPR\b/i.test(txt)||r.closest('[data-testid*="ad"],[class*="advert"],[class*="sponsor"]')))return;
    const cond=conditionText(txt);
    if(f.condition==='new'&&cond!=='new')return;
    if(f.condition==='good'&&cond==='used')return;
    if(!map.has(url))map.set(url,{source:site,title,price:p,url,image:img?.currentSrc||img?.src||'',condition:cond,rawText:txt.slice(0,500)});
  });
  return [...map.values()].slice(0,max);
}

function loginState(site){
  const body=(document.body?.innerText||'').replace(/\s+/g,' ').slice(0,180000);
  const p=(location.pathname||'').toLowerCase();
  const hrefs=[...document.querySelectorAll('a[href]')].slice(0,3000).map(a=>a.getAttribute('href')||'').join(' ');

  if(/\/(login|signin|sign_in|auth)(\/|$)/.test(p)||/ログインしてください|ログインが必要|ログインして続行|ログインすると/.test(body))return'out';

  const rules={
    mercari:{
      inText:/やることリスト|購入履歴|出品した商品|残高|ポイント/,
      inHref:/\/mypage(?:[/?#]|$)|\/notifications(?:[/?#]|$)|\/sell(?:[/?#]|$)|\/user\/profile/,
      outText:/ログイン\s*会員登録|会員登録\s*ログイン/,
      outHref:/\/login(?:[/?#]|$)|\/signup(?:[/?#]|$)/
    },
    rakuma:{
      inText:/購入した商品|出品した商品|売上金|ログアウト/,
      inHref:/\/users\/sign_out|\/mypage(?:[/?#]|$)|\/notifications(?:[/?#]|$)/,
      outText:/ログイン|新規登録/,
      outHref:/\/users\/sign_in|\/users\/sign_up/
    },
    yahoo_fleamarket:{
      inText:/購入した商品|出品した商品|取引中|売上金|ログアウト/,
      inHref:/\/mypage(?:[/?#]|$)|\/notifications(?:[/?#]|$)|logout/,
      outText:/Yahoo! JAPAN IDでログイン|ログインして/,
      outHref:/login\.yahoo\.co\.jp/
    },
    yahoo_auction:{
      inText:/マイ・オークション|落札分|出品終了分|評価一覧|ログアウト/,
      inHref:/myauc|watchlist|logout/,
      outText:/Yahoo! JAPAN IDでログイン|ログインして/,
      outHref:/login\.yahoo\.co\.jp/
    },
    jmty:{
      inText:/お問い合わせ履歴|投稿履歴|お気に入り|ログアウト/,
      inHref:/\/users\/[^/]+\/(?:profile|posts)|\/posts\/new|sign_out/,
      outText:/ログイン|新規会員登録/,
      outHref:/\/users\/sign_in|\/users\/sign_up/
    }
  }[site];

  if(rules){
    if(rules.inHref.test(hrefs)||rules.inText.test(body))return'in';
    if(rules.outHref.test(hrefs)||rules.outText.test(body))return'out';
  }
  return'unknown';
}

async function sampleLoginState(site){
  const samples=[];
  for(const wait of [250,650,1200,2200]){
    await sleep(wait);
    const s=loginState(site);
    samples.push(s);
    if(samples.filter(x=>x==='in').length>=2)return'in';
    if(samples.filter(x=>x==='out').length>=3)return'out';
  }
  if(samples.includes('in'))return'in';
  if(samples.filter(x=>x==='out').length>=2)return'out';
  return'unknown';
}

async function saveLoginState(site,state){
  if(state!=='in'&&state!=='out')return state;
  const ls=await get(LOGIN,{}),tm=await get(LOGIN_TIME,{});
  ls[site]=state;tm[site]=Date.now();
  await set(LOGIN,ls);await set(LOGIN_TIME,tm);
  const tab=await getTab();
  tab.sedoriLoginStates={...(tab.sedoriLoginStates||{}),[site]:state};
  tab.sedoriLoginTimes={...(tab.sedoriLoginTimes||{}),[site]:tm[site]};
  await saveTab(tab);
  return state;
}
async function refreshLoginState(site){
  return saveLoginState(site,loginState(site));
}
function watchLoginState(site){
  let timer=0,lastHref=location.href,lastState='';
  const run=()=>{clearTimeout(timer);timer=setTimeout(async()=>{
    const s=await refreshLoginState(site);
    if(s!==lastState){lastState=s;console.debug('[せどりAI] login',site,s)}
  },350)};
  addEventListener('pageshow',run);
  addEventListener('focus',run);
  addEventListener('popstate',run);
  addEventListener('hashchange',run);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)run()});
  new MutationObserver(()=>{
    if(location.href!==lastHref){lastHref=location.href;run()}
  }).observe(document.documentElement,{childList:true,subtree:true});
  [700,1800,4000,8000].forEach(ms=>setTimeout(run,ms));
}

async function stableCollect(site,f){
  let best=[],last=-1,stable=0;
  for(let i=0;i<14;i++){
    await sleep(i===0?1200:700);
    const now=collect(site,f);
    if(now.length>best.length)best=now;
    if(now.length===last&&now.length>0)stable++;else stable=0;
    last=now.length;
    if(stable>=2||best.length>=Math.min(45,+f.maxPerSite||50))break;
  }
  return best;
}
async function finishSite(site,j){
  let items=[],err='';
  try{
    const state=await sampleLoginState(site);
    await saveLoginState(site,state);
    items=await stableCollect(site,j.filters);
    if(!items.length)err=state==='out'?'要ログイン':state==='unknown'?'ログイン状態不明／商品取得0件':'商品取得0件';
  }catch(e){err='取得エラー';console.error(e)}
  j.items.push(...items);
  j.siteCounts[site]=items.length;
  j.errors[site]=err;
  j.index++;
  if(j.index<j.queue.length){
    await set(JOB,j);
    location.href=j.queue[j.index][1];
  }else{
    const dedup=[...new Map(j.items.map(x=>[x.url,x])).values()];
    await set(RESULT,{items:dedup,siteCounts:j.siteCounts,errors:j.errors,started:j.started,finished:Date.now()});
    await del(JOB);
    location.href=j.returnUrl+'#search';
  }
}

function history(){try{return JSON.parse(localStorage.getItem('sedori_history')||'[]')}catch{return[]}}
function save(h){localStorage.setItem('sedori_history',JSON.stringify(h))}
function type(t){
  for(const[n,r]of[
    ['リング',/リング|指輪/],['ネックレス',/ネックレス|ペンダント/],['財布',/財布|ウォレット/],
    ['バッグ',/バッグ|トート|ショルダー/],['時計',/時計|ウォッチ/],
    ['工具',/マキタ|ハイコーキ|工具|インパクト|ドリル/],
    ['家電・デジタル',/iPhone|iPad|MacBook|カメラ|レンズ|ゲーム/],
    ['アパレル',/Tシャツ|シャツ|ジャケット|コート|パンツ|デニム/]
  ])if(r.test(t||''))return n;
  return'商品';
}
function draft(x){
  const title=String(x.title||type(x.title)).replace(/^【[^】]+】\s*/,'').slice(0,60);
  const st=x.cond==='low'?'目立つ傷や汚れなし':x.cond==='high'?'傷や汚れあり':'やや使用感あり';
  const bg=x.background_preset||'clean_white';
  const desc=`${type(x.title)}です。\n即購入OKです。\n中古品のため、状態は写真・説明をご確認のうえご検討ください。\n気になる点があれば購入前にコメントください。\n\n【商品情報】\n・商品名：${title}\n・状態：${st}\n・付属品：実物確認後に追記してください\n\n【発送】\n・商品に合わせて安全に梱包して発送します。\n\n※型番、サイズ、傷・汚れ、動作、付属品などは実物確認後に必ず追記してください。`;
  const photo=`構図：商品を中央。正面＋斜め45度\n背景：${BG[bg]}\n追加：型番・ロゴ・タグ・傷・付属品の寄り写真`;
  return{title,description:desc,price:Math.max(300,Math.round((+x.sell||0)/100)*100),background_preset:bg,photo_guidance:photo,linked_purchase_url:x.url||'',linked_purchase_title:x.title||''};
}
function updateItem(id,fn){
  const h=history(),i=h.findIndex(x=>x.id===id);
  if(i<0)return;
  h[i]=fn(h[i]);save(h);
}
function decorate(){
  const h=history(),cards=[...document.querySelectorAll('#history .history-item')];
  cards.forEach((c,i)=>{
    if(c.dataset.salesUi)return;
    let x=h[i];if(!x)return;
    c.dataset.salesUi='1';x.id||(x.id='h'+Date.now()+i);
    const d=x.sales_draft||draft(x),wrap=document.createElement('div');
    wrap.style.cssText='margin-top:9px;padding:9px;border:1px solid #dbeafe;border-radius:11px;background:#f8fbff';
    wrap.innerHTML=`<div style="font-weight:800;font-size:12px">販売下書き</div><details style="margin-top:5px"><summary style="cursor:pointer;font-size:12px;font-weight:700">内容を見る</summary><div class="small" style="white-space:pre-wrap;margin-top:6px"><b>タイトル</b>\n${esc(d.title)}\n\n<b>説明文</b>\n${esc(d.description)}\n\n<b>価格</b> ${yen(d.price)}\n\n<b>画像メモ</b>\n${esc(d.photo_guidance)}</div></details>`;
    const row=document.createElement('div');
    row.style.cssText='display:flex;gap:6px;flex-wrap:wrap;margin-top:7px';
    const mk=(t,fn,pri=false)=>{
      const b=document.createElement('button');
      b.textContent=t;b.className='btn'+(pri?' primary':'');
      b.style.cssText='padding:8px;font-size:11px';b.onclick=fn;return b;
    };
    row.append(mk('販売文コピー',async e=>{
      await navigator.clipboard.writeText(d.title+'\n\n'+d.description);
      e.target.textContent='コピー済み';
    }));
    ['mercari','rakuma','yahoo_fleamarket','yahoo_auction'].forEach(site=>row.append(mk(N[site]+'へ下書き',async()=>{
      const nd=draft(x);
      updateItem(x.id,y=>({...y,sales_draft:nd}));
      await set(DRAFT,{targetSite:site,draft:nd,itemId:x.id,createdAt:Date.now()});
      location.href=SELL[site];
    },true)));
    wrap.append(row);c.append(wrap);
  });
  save(h);
}
function input(el,v){
  if(!el)return false;
  const proto=Object.getPrototypeOf(el),setv=Object.getOwnPropertyDescriptor(proto,'value')?.set;
  setv?setv.call(el,v):el.value=v;
  el.dispatchEvent(new Event('input',{bubbles:true}));
  el.dispatchEvent(new Event('change',{bubbles:true}));
  return true;
}
function find(a){
  for(const s of a){
    const e=document.querySelector(s);
    if(e&&e.offsetParent!==null&&!e.disabled)return e;
  }
  return null;
}
function fields(){
  return{
    title:['input[name*="title"]','input[placeholder*="タイトル"]','input[placeholder*="商品名"]','input[placeholder*="商品の名前"]'],
    desc:['textarea[name*="description"]','textarea[placeholder*="説明"]','textarea[placeholder*="本文"]','textarea'],
    price:['input[name*="price"]','input[placeholder*="価格"]','input[placeholder*="販売価格"]','input[inputmode="numeric"]']
  };
}
async function apply(site){
  const b=await get(DRAFT,null);
  if(!b||b.targetSite!==site||!b.draft)return false;
  const f=fields();
  const ok=[
    input(find(f.title),b.draft.title),
    input(find(f.desc),b.draft.description),
    input(find(f.price),String(b.draft.price))
  ].some(Boolean);
  if(ok){
    const n=document.createElement('div');
    n.textContent='せどりAIの下書きを入力しました。写真・状態・カテゴリを確認してから保存または出品してください。';
    n.style.cssText='position:fixed;z-index:99999;left:10px;right:10px;bottom:10px;padding:11px;background:#111827;color:#fff;border-radius:10px;font-size:13px';
    document.body.append(n);setTimeout(()=>n.remove(),6500);
    await set(DRAFT,{...b,appliedAt:Date.now()});
    return true;
  }
  return false;
}

function appLoginRowHtml(id,state,time,fresh){
  const label=state==='in'?'ログイン済み':state==='out'?'要ログイン':state==='unknown'?'判定できず':'未確認';
  const statusClass=state==='in'?'status-ok':state==='out'?'status-ng':'';
  const when=time?`<small style="display:block;color:#667085;font-size:10px;margin-top:2px">${fresh?'今回確認':'前回確認'} ${new Date(time).toLocaleString('ja-JP')}</small>`:'';
  const link=`<a class="btn" href="${LOGIN_URLS[id]}" target="_blank" rel="noopener" style="margin-left:8px;padding:6px 10px;font-size:12px;white-space:nowrap">${state==='out'?'ログインへ':'開く'}</a>`;
  return `<div class="login-row"><span><b>${N[id]}</b>${when}</span><span style="display:flex;align-items:center;gap:6px"><span class="${statusClass}">${label}</span>${link}</span></div>`;
}
async function readLoginView(){
  const raw=await get(LOGIN,{}),times=await get(LOGIN_TIME,{});
  const report=await get(LOGIN_REPORT,null);
  const tab=await getTab();
  const tabStates=tab.sedoriLoginStates||{},tabTimes=tab.sedoriLoginTimes||{};
  const reportFresh=!!(report&&Date.now()-report.started<10*60*1000);
  const status={},viewTimes={},fresh={};

  SITE_IDS.forEach(id=>{
    if(reportFresh&&Object.prototype.hasOwnProperty.call(report.statuses||{},id)){
      status[id]=report.statuses[id];
      viewTimes[id]=report.times?.[id]||report.finished||report.started;
      fresh[id]=true;
    }else if(tabStates[id]){
      status[id]=tabStates[id];
      viewTimes[id]=tabTimes[id]||0;
      fresh[id]=false;
    }else{
      status[id]=raw[id]||'unknown';
      viewTimes[id]=times[id]||0;
      fresh[id]=false;
    }
  });
  return{status,times:viewTimes,fresh,report};
}
async function appLoginStatus(){
  const view=await readLoginView();
  const box=document.getElementById('loginResults');
  if(box)box.innerHTML=SITE_IDS.map(id=>appLoginRowHtml(id,view.status[id],view.times[id],view.fresh[id])).join('');
  window.postMessage({type:'SEDORI_LOGIN_STATUS',status:view.status,times:view.times,checkedAt:Date.now(),userscriptVersion:VERSION},location.origin);
  return view.status;
}
async function requestLoginRefresh(){
  const returnUrl=location.href.split('#')[0]+'#search';
  const checkId=`${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
  const job={version:43,index:0,sites:SITE_IDS,returnUrl,started:Date.now(),checkId};
  const report={checkId,started:job.started,statuses:{},times:{},done:false,userscriptVersion:VERSION};
  if(!(await set(LOGIN_JOB,job)))throw new Error('ログイン確認ジョブを保存できません');
  if(!(await set(LOGIN_REPORT,report)))throw new Error('ログイン確認結果を初期化できません');
  const tab=await getTab();
  tab.sedoriLoginJob=job;
  tab.sedoriLoginReport=report;
  await saveTab(tab);
  location.href=LOGIN_URLS[SITE_IDS[0]];
}
function installLoginButton(){
  const b=document.getElementById('checkLoginBtn');
  if(!b||b.dataset.sedoriLogin430)return;
  b.dataset.sedoriLogin430='1';
  b.addEventListener('click',async e=>{
    e.preventDefault();e.stopImmediatePropagation();
    b.disabled=true;b.textContent='5サイトを確認しています…';
    const box=document.getElementById('loginResults');
    if(box)box.innerHTML=SITE_IDS.map(id=>`<div class="login-row"><span><b>${N[id]}</b></span><span>確認待ち…</span></div>`).join('');
    try{
      await requestLoginRefresh();
    }catch(err){
      console.error(err);
      if(box)box.innerHTML=`<div class="login-row"><span>ログイン確認</span><span class="status-ng">確認開始に失敗：${esc(err?.message||err)}</span></div>`;
      b.disabled=false;b.textContent='5サイトのログイン状態を確認';
    }
  },true);
}
async function verifyStorageBridge(){
  const key='sedori_bridge_test_v43',token=`${Date.now()}-${Math.random()}`;
  if(!(await set(key,token)))return false;
  const got=await get(key,'');
  await del(key);
  return got===token;
}
function showBridgeError(){
  const box=document.getElementById('loginResults');
  if(box)box.innerHTML='<div class="login-row"><span><b>Userscripts連携</b></span><span class="status-ng">保存APIが使えません。v4.3.0を再インストールし、Userscriptsを「すべてのWebサイトで許可」にしてください。</span></div>';
}

await migrateLoginCache();

if(location.hostname===APP){
  window.__SEDORI_USERSCRIPT__=true;
  window.__SEDORI_USERSCRIPT_VERSION__=VERSION;

  const ok=await verifyStorageBridge();
  if(!ok)showBridgeError();

  const r=await get(RESULT,null);
  if(r?.items){
    await del(RESULT);
    window.postMessage({type:'SEDORI_SEARCH_RESULTS',items:r.items,siteCounts:r.siteCounts||{},errors:r.errors||{}},location.origin);
  }

  window.addEventListener('message',async e=>{
    if(e.source!==window)return;
    if(e.data?.type==='SEDORI_START_SEARCH'){
      const f=e.data.filters||{},q=queue(f);
      if(!q.length)return;
      await set(JOB,{version:4,filters:f,queue:q,index:0,items:[],siteCounts:{},errors:{},returnUrl:location.href.split('#')[0],started:Date.now()});
      location.href=q[0][1];
    }
    if(e.data?.type==='SEDORI_CHECK_LOGINS')await requestLoginRefresh();
  });

  installLoginButton();
  new MutationObserver(()=>{decorate();installLoginButton()}).observe(document.body,{childList:true,subtree:true});
  setTimeout(()=>{decorate();installLoginButton();if(ok)appLoginStatus()},450);
  addEventListener('pageshow',()=>setTimeout(()=>{if(ok)appLoginStatus()},120));
  addEventListener('focus',()=>setTimeout(()=>{if(ok)appLoginStatus()},120));
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&ok)setTimeout(appLoginStatus,120)});
  return;
}

const site=H[location.hostname];
if(!site)return;

watchLoginState(site);

let lj=await get(LOGIN_JOB,null);
let tab=await getTab();
if(!lj&&tab.sedoriLoginJob)lj=tab.sedoriLoginJob;

if(lj&&Date.now()-lj.started<5*60*1000){
  const expected=lj.sites?.[lj.index];
  if(expected===site){
    const state=await sampleLoginState(site);
    await saveLoginState(site,state);

    let report=await get(LOGIN_REPORT,null);
    if(!report||report.checkId!==lj.checkId)report=tab.sedoriLoginReport||{checkId:lj.checkId,started:lj.started,statuses:{},times:{}};
    report.statuses={...(report.statuses||{}),[site]:state};
    report.times={...(report.times||{}),[site]:Date.now()};
    report.userscriptVersion=VERSION;

    lj.index++;
    if(lj.index<(lj.sites?.length||0)){
      await set(LOGIN_REPORT,report);
      await set(LOGIN_JOB,lj);
      tab.sedoriLoginJob=lj;tab.sedoriLoginReport=report;
      await saveTab(tab);
      location.href=LOGIN_URLS[lj.sites[lj.index]];
      return;
    }

    report.done=true;report.finished=Date.now();
    await set(LOGIN_REPORT,report);
    await del(LOGIN_JOB);
    delete tab.sedoriLoginJob;
    tab.sedoriLoginReport=report;
    await saveTab(tab);
    location.href=lj.returnUrl||'https://m3924saim-eng.github.io/sedori-ai/#search';
    return;
  }
}else if(lj){
  await del(LOGIN_JOB);
  delete tab.sedoriLoginJob;
  await saveTab(tab);
}

await refreshLoginState(site);

const j=await get(JOB,null);
if(j&&Date.now()-j.started<8*60*1000){
  const ex=j.queue?.[j.index];
  if(ex&&ex[0]===site){
    await finishSite(site,j);
    return;
  }
}else if(j){
  await del(JOB);
}

let tries=0;
const timer=setInterval(async()=>{
  tries++;
  if(await apply(site)||tries>24)clearInterval(timer);
},1000);

})();