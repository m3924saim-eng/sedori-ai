// ==UserScript==
// @name         せどりAI v4.2 実用版 5サイト検索＋ログイン同期＋販売下書き
// @namespace    https://m3924saim-eng.github.io/
// @version      4.2.0
// @description  5サイト横断検索、ログイン状態の即時同期、販売下書きを安定化。iPhone/iPad Safari Userscripts対応。
// @match        https://m3924saim-eng.github.io/*
// @match        https://jp.mercari.com/*
// @match        https://fril.jp/*
// @match        https://paypayfleamarket.yahoo.co.jp/*
// @match        https://auctions.yahoo.co.jp/*
// @match        https://jmty.jp/*
// @grant        GM.getValue
// @grant        GM.setValue
// @grant        GM.deleteValue
// @grant        GM.addValueChangeListener
// @run-at       document-idle
// ==/UserScript==

(async()=>{'use strict';
const VERSION='4.2.0';
const APP='m3924saim-eng.github.io';
const JOB='sedori_job_v4',RESULT='sedori_result_v4',LOGIN='sedori_login_v4',LOGIN_TIME='sedori_login_time_v4',CHECK='sedori_login_check_v42',LOGIN_JOB='sedori_login_job_v42',DRAFT='sedori_draft_v4';
const enc=encodeURIComponent;
const H={'jp.mercari.com':'mercari','fril.jp':'rakuma','paypayfleamarket.yahoo.co.jp':'yahoo_fleamarket','auctions.yahoo.co.jp':'yahoo_auction','jmty.jp':'jmty'};
const N={mercari:'メルカリ',rakuma:'楽天ラクマ',yahoo_fleamarket:'Yahoo!フリマ',yahoo_auction:'Yahoo!オークション',jmty:'ジモティー'};
const SITE_IDS=['mercari','rakuma','yahoo_fleamarket','yahoo_auction','jmty'];
const LOGIN_URLS={mercari:'https://jp.mercari.com/',rakuma:'https://fril.jp/',yahoo_fleamarket:'https://paypayfleamarket.yahoo.co.jp/',yahoo_auction:'https://auctions.yahoo.co.jp/',jmty:'https://jmty.jp/'};
const SELL={mercari:'https://jp.mercari.com/sell',rakuma:'https://fril.jp/',yahoo_fleamarket:'https://paypayfleamarket.yahoo.co.jp/sell',yahoo_auction:'https://auctions.yahoo.co.jp/',jmty:'https://jmty.jp/'};
const BG={clean_white:'白背景・自然光風',wood_table:'木目テーブル背景',concrete_gray:'ライトグレー背景',soft_beige:'ベージュ背景',dark_luxury:'ダーク背景・高級感'};
const get=async(k,d)=>{try{return await GM.getValue(k,d)}catch(e){console.warn('[せどりAI] GM.getValue',e);return d}};
const set=async(k,v)=>{try{await GM.setValue(k,v);return true}catch(e){console.warn('[せどりAI] GM.setValue',e);return false}};
const del=async k=>{try{await GM.deleteValue(k)}catch{}};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const yen=n=>'¥'+Math.round(Number(n)||0).toLocaleString('ja-JP');

function queue(f){
  const q=enc(f.query),a=f.min||0,b=f.max||0,mercariOrder=f.sort==='price_desc'?'desc':'asc',mercariSort=f.sort==='newest'?'created_time':'price';
  return [
    ['mercari',`https://jp.mercari.com/search?keyword=${q}&price_min=${a}&price_max=${b}&status=${f.onSale?'on_sale':'all'}&sort=${mercariSort}&order=${mercariOrder}`],
    ['rakuma',`https://fril.jp/s?query=${q}&min=${a}&max=${b}&transaction=${f.onSale?'selling':'all'}`],
    ['yahoo_fleamarket',`https://paypayfleamarket.yahoo.co.jp/search/${q}?minPrice=${a}&maxPrice=${b}`],
    ['yahoo_auction',`https://auctions.yahoo.co.jp/search/search?p=${q}&min=${a}&max=${b}`],
    ['jmty',`https://jmty.jp/hyogo/sale?keyword=${q}`]
  ];
}
function price(t){const x=[...String(t).replace(/[,，]/g,'').matchAll(/[¥￥]\s*(\d{1,9})|(\d{1,9})\s*円/g)].map(m=>+(m[1]||m[2])).filter(n=>n>0);return x[0]||0}
const SEL={mercari:'a[href*="/item/"]',rakuma:'a[href*="/products/"],a[href*="/item/"]',yahoo_fleamarket:'a[href*="/item/"]',yahoo_auction:'a[href*="/jp/auction/"]',jmty:'a[href*="/sale-"]'};
function rootFor(a){return a.closest('article,li,[data-testid*="item"],[data-testid*="product"],[class*="item"],[class*="Item"],[class*="card"],[class*="Card"],section')||a.parentElement||a}
function conditionText(t){if(/新品|未使用|新品同様/i.test(t))return'new';if(/ジャンク|要修理|全体的に状態が悪い|傷や汚れあり/i.test(t))return'used';return'good'}
function collect(site,f){
  const map=new Map(),max=Math.max(10,Math.min(80,+f.maxPerSite||50));
  document.querySelectorAll(SEL[site]||'a').forEach(a=>{
    const r=rootFor(a),txt=(r.innerText||a.innerText||'').replace(/\s+/g,' ').trim();if(!txt||txt.length>2500)return;
    const p=price(txt),img=r.querySelector('img'),title=(img?.alt||a.getAttribute('aria-label')||a.getAttribute('title')||a.innerText||txt.replace(/[¥￥]\s*[\d,]+.*$/,'')).replace(/\s+/g,' ').trim().slice(0,180),url=(a.href||'').split('?')[0];
    if(!p||!title||!url)return;if((f.min&&p<f.min)||(f.max&&p>f.max))return;
    if(f.onSale&&/売り切れ|SOLD|取引終了|受付終了|終了しました|落札済/i.test(txt))return;
    if(f.excludeAds&&(/広告|スポンサー|おすすめショップ|プロモーション|\bPR\b/i.test(txt)||r.closest('[data-testid*="ad"],[class*="advert"],[class*="sponsor"]')))return;
    const cond=conditionText(txt);if(f.condition==='new'&&cond!=='new')return;if(f.condition==='good'&&cond==='used')return;
    if(!map.has(url))map.set(url,{source:site,title,price:p,url,image:img?.currentSrc||img?.src||'',condition:cond,rawText:txt.slice(0,500)});
  });
  return [...map.values()].slice(0,max);
}

function loginState(site){
  const body=(document.body?.innerText||'').replace(/\s+/g,' ').slice(0,160000);
  const p=(location.pathname||'').toLowerCase();
  const hrefs=[...document.querySelectorAll('a[href]')].slice(0,2500).map(a=>a.getAttribute('href')||'').join(' ');
  if(/\/(login|signin|sign_in|auth)(\/|$)/.test(p)||/ログインしてください|ログインが必要|ログインして続行/.test(body))return'out';

  const siteRules={
    mercari:{inText:/マイページ|出品する|お知らせ|やることリスト|購入履歴|出品した商品/,inHref:/\/mypage|\/sell|\/notifications|\/user\//,outText:/ログイン\s*会員登録|ログインして/,outHref:/\/login|\/signup/},
    rakuma:{inText:/マイページ|出品する|購入した商品|出品した商品|ログアウト/,inHref:/\/users\/sign_out|\/mypage|\/sell|\/notifications/,outText:/ログイン|新規登録/,outHref:/\/users\/sign_in|\/users\/sign_up/},
    yahoo_fleamarket:{inText:/マイページ|出品する|お知らせ|購入した商品|出品した商品|ログアウト/,inHref:/\/mypage|\/sell|\/notifications|logout/,outText:/ログイン|Yahoo! JAPAN IDでログイン/,outHref:/login\.yahoo\.co\.jp/},
    yahoo_auction:{inText:/マイ・オークション|出品|ウォッチリスト|落札分|出品終了分|ログアウト/,inHref:/myauc|sell|watchlist|logout/,outText:/ログイン|Yahoo! JAPAN IDでログイン/,outHref:/login\.yahoo\.co\.jp/},
    jmty:{inText:/マイページ|投稿する|お問い合わせ履歴|ログアウト/,inHref:/\/users\/|\/posts\/new|sign_out/,outText:/ログイン|新規会員登録/,outHref:/\/users\/sign_in|\/users\/sign_up/}
  }[site];
  if(siteRules){
    if(siteRules.inText.test(body)||siteRules.inHref.test(hrefs))return'in';
    if(siteRules.outHref.test(hrefs)||siteRules.outText.test(body))return'out';
  }
  if(/ログアウト|マイページ|出品する|ウォッチリスト|購入履歴|アカウント/.test(body))return'in';
  return'unknown';
}

async function saveLoginState(site,state,force=false){
  const ls=await get(LOGIN,{}),tm=await get(LOGIN_TIME,{}),prev=ls[site];
  // DOMの読み込み途中で unknown になっても、直前の確定状態を消さない。
  if(state==='unknown'&&(prev==='in'||prev==='out'))return prev;
  if(state==='unknown'&&!prev)return'unknown';
  if(state!==prev||force||!tm[site]){ls[site]=state;tm[site]=Date.now();
    if(site.startsWith('yahoo_')){ls.yahoo_fleamarket=state;ls.yahoo_auction=state;tm.yahoo_fleamarket=tm[site];tm.yahoo_auction=tm[site]}
    await set(LOGIN,ls);await set(LOGIN_TIME,tm);
  }
  return state;
}
async function refreshLoginState(site,force=false){return saveLoginState(site,loginState(site),force)}
function watchLoginState(site){
  let timer=0,lastHref=location.href,lastState='';
  const run=(force=false)=>{clearTimeout(timer);timer=setTimeout(async()=>{const s=await refreshLoginState(site,force);if(s!==lastState){lastState=s;console.debug('[せどりAI] login',site,s)}},350)};
  addEventListener('pageshow',()=>run(true));addEventListener('focus',()=>run(true));addEventListener('popstate',()=>run(true));addEventListener('hashchange',()=>run(true));
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)run(true)});
  new MutationObserver(()=>{if(location.href!==lastHref){lastHref=location.href;run(true)}}).observe(document.documentElement,{childList:true,subtree:true});
  [700,1800,4000,8000].forEach(ms=>setTimeout(()=>run(true),ms));
  try{GM.addValueChangeListener(CHECK,()=>run(true))}catch{}
}

async function stableCollect(site,f){let best=[],last=-1,stable=0;for(let i=0;i<14;i++){await sleep(i===0?1200:700);const now=collect(site,f);if(now.length>best.length)best=now;if(now.length===last&&now.length>0)stable++;else stable=0;last=now.length;if(stable>=2||best.length>=Math.min(45,+f.maxPerSite||50))break}return best}
async function finishSite(site,j){
  let items=[],err='';
  try{const state=await refreshLoginState(site,true);items=await stableCollect(site,j.filters);if(!items.length)err=state==='out'?'要ログイン':'商品取得0件'}catch(e){err='取得エラー';console.error(e)}
  j.items.push(...items);j.siteCounts[site]=items.length;j.errors[site]=err;j.index++;
  if(j.index<j.queue.length){await set(JOB,j);location.href=j.queue[j.index][1]}
  else{const dedup=[...new Map(j.items.map(x=>[x.url,x])).values()];await set(RESULT,{items:dedup,siteCounts:j.siteCounts,errors:j.errors,started:j.started,finished:Date.now()});await del(JOB);location.href=j.returnUrl+'#search'}
}

function history(){try{return JSON.parse(localStorage.getItem('sedori_history')||'[]')}catch{return[]}}
function save(h){localStorage.setItem('sedori_history',JSON.stringify(h))}
function type(t){for(const[n,r]of[['リング',/リング|指輪/],['ネックレス',/ネックレス|ペンダント/],['財布',/財布|ウォレット/],['バッグ',/バッグ|トート|ショルダー/],['時計',/時計|ウォッチ/],['工具',/マキタ|ハイコーキ|工具|インパクト|ドリル/],['家電・デジタル',/iPhone|iPad|MacBook|カメラ|レンズ|ゲーム/],['アパレル',/Tシャツ|シャツ|ジャケット|コート|パンツ|デニム/]])if(r.test(t||''))return n;return'商品'}
function draft(x){
  const title=String(x.title||type(x.title)).replace(/^【[^】]+】\s*/,'').slice(0,60),st=x.cond==='low'?'目立つ傷や汚れなし':x.cond==='high'?'傷や汚れあり':'やや使用感あり',bg=x.background_preset||'clean_white';
  const desc=`${type(x.title)}です。\n即購入OKです。\n中古品のため、状態は写真・説明をご確認のうえご検討ください。\n気になる点があれば購入前にコメントください。\n\n【商品情報】\n・商品名：${title}\n・状態：${st}\n・付属品：実物確認後に追記してください\n\n【発送】\n・商品に合わせて安全に梱包して発送します。\n\n※型番、サイズ、傷・汚れ、動作、付属品などは実物確認後に必ず追記してください。`;
  const photo=`構図：商品を中央。正面＋斜め45度\n背景：${BG[bg]}\n追加：型番・ロゴ・タグ・傷・付属品の寄り写真`;
  return{title,description:desc,price:Math.max(300,Math.round((+x.sell||0)/100)*100),background_preset:bg,photo_guidance:photo,linked_purchase_url:x.url||'',linked_purchase_title:x.title||''};
}
function updateItem(id,fn){const h=history(),i=h.findIndex(x=>x.id===id);if(i<0)return;h[i]=fn(h[i]);save(h)}
function decorate(){
  const h=history(),cards=[...document.querySelectorAll('#history .history-item')];
  cards.forEach((c,i)=>{if(c.dataset.salesUi)return;let x=h[i];if(!x)return;c.dataset.salesUi='1';x.id||(x.id='h'+Date.now()+i);const d=x.sales_draft||draft(x),wrap=document.createElement('div');wrap.style.cssText='margin-top:9px;padding:9px;border:1px solid #dbeafe;border-radius:11px;background:#f8fbff';
    wrap.innerHTML=`<div style="font-weight:800;font-size:12px">販売下書き</div><details style="margin-top:5px"><summary style="cursor:pointer;font-size:12px;font-weight:700">内容を見る</summary><div class="small" style="white-space:pre-wrap;margin-top:6px"><b>タイトル</b>\n${esc(d.title)}\n\n<b>説明文</b>\n${esc(d.description)}\n\n<b>価格</b> ${yen(d.price)}\n\n<b>画像メモ</b>\n${esc(d.photo_guidance)}</div></details>`;
    const row=document.createElement('div');row.style.cssText='display:flex;gap:6px;flex-wrap:wrap;margin-top:7px';const mk=(t,fn,pri=false)=>{const b=document.createElement('button');b.textContent=t;b.className='btn'+(pri?' primary':'');b.style.cssText='padding:8px;font-size:11px';b.onclick=fn;return b};
    row.append(mk('販売文コピー',async e=>{await navigator.clipboard.writeText(d.title+'\n\n'+d.description);e.target.textContent='コピー済み'}));
    ['mercari','rakuma','yahoo_fleamarket','yahoo_auction'].forEach(site=>row.append(mk(N[site]+'へ下書き',async()=>{const nd=draft(x);updateItem(x.id,y=>({...y,sales_draft:nd}));await set(DRAFT,{targetSite:site,draft:nd,itemId:x.id,createdAt:Date.now()});location.href=SELL[site]},true)));
    wrap.append(row);c.append(wrap);
  });save(h);
}
function input(el,v){if(!el)return false;const proto=Object.getPrototypeOf(el),setv=Object.getOwnPropertyDescriptor(proto,'value')?.set;setv?setv.call(el,v):el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));return true}
function find(a){for(const s of a){const e=document.querySelector(s);if(e&&e.offsetParent!==null&&!e.disabled)return e}return null}
function fields(){return{title:['input[name*="title"]','input[placeholder*="タイトル"]','input[placeholder*="商品名"]','input[placeholder*="商品の名前"]'],desc:['textarea[name*="description"]','textarea[placeholder*="説明"]','textarea[placeholder*="本文"]','textarea'],price:['input[name*="price"]','input[placeholder*="価格"]','input[placeholder*="販売価格"]','input[inputmode="numeric"]']}}
async function apply(site){const b=await get(DRAFT,null);if(!b||b.targetSite!==site||!b.draft)return false;const f=fields(),ok=[input(find(f.title),b.draft.title),input(find(f.desc),b.draft.description),input(find(f.price),String(b.draft.price))].some(Boolean);if(ok){const n=document.createElement('div');n.textContent='せどりAIの下書きを入力しました。写真・状態・カテゴリを確認してから保存または出品してください。';n.style.cssText='position:fixed;z-index:99999;left:10px;right:10px;bottom:10px;padding:11px;background:#111827;color:#fff;border-radius:10px;font-size:13px';document.body.append(n);setTimeout(()=>n.remove(),6500);await set(DRAFT,{...b,appliedAt:Date.now()});return true}return false}

function appLoginRowHtml(id,state,time){
  const label=state==='in'?'ログイン済み':state==='out'?'要ログイン':'未確認';
  const statusClass=state==='in'?'status-ok':state==='out'?'status-ng':'';
  const when=time?`<small style="display:block;color:#667085;font-size:10px;margin-top:2px">確認 ${new Date(time).toLocaleString('ja-JP')}</small>`:'';
  const link=`<a class="btn" href="${LOGIN_URLS[id]}" target="_blank" rel="noopener" style="margin-left:8px;padding:6px 10px;font-size:12px;white-space:nowrap">${state==='out'?'ログインへ':'開く'}</a>`;
  return `<div class="login-row"><span><b>${N[id]}</b>${when}</span><span style="display:flex;align-items:center;gap:6px"><span class="${statusClass}">${label}</span>${link}</span></div>`;
}
async function appLoginStatus(){
  const raw=await get(LOGIN,{}),times=await get(LOGIN_TIME,{}),status={};SITE_IDS.forEach(id=>status[id]=raw[id]||'unknown');
  const box=document.getElementById('loginResults');if(box)box.innerHTML=SITE_IDS.map(id=>appLoginRowHtml(id,status[id],times[id])).join('');
  window.postMessage({type:'SEDORI_LOGIN_STATUS',status,times,checkedAt:Date.now(),userscriptVersion:VERSION},location.origin);return status;
}
async function requestLoginRefresh(){
  // v4.2: ボタンを押したら5サイトを同じタブで順番に巡回し、実ページ上でログイン状態を再判定する。
  // クロスオリジンの状態をアプリ側から直接読むことはせず、各サイトでUserscriptがGM領域へ保存して戻る。
  const returnUrl=location.href.split('#')[0]+'#search';
  await set(LOGIN_JOB,{index:0,sites:SITE_IDS,returnUrl,started:Date.now()});
  await set(CHECK,{at:Date.now(),nonce:Math.random()});
  location.href=LOGIN_URLS[SITE_IDS[0]];
}
function installLoginButton(){
  const b=document.getElementById('checkLoginBtn');if(!b||b.dataset.sedoriLogin420)return;b.dataset.sedoriLogin420='1';
  b.addEventListener('click',async e=>{e.preventDefault();e.stopImmediatePropagation();b.disabled=true;b.textContent='確認しています…';const box=document.getElementById('loginResults');if(box)box.innerHTML=SITE_IDS.map(id=>`<div class="login-row"><span><b>${N[id]}</b></span><span>確認中…</span></div>`).join('');try{await requestLoginRefresh()}catch(err){console.error(err);if(box)box.innerHTML='<div class="login-row"><span>ログイン確認</span><span class="status-ng">確認に失敗しました</span></div>'}finally{b.disabled=false;b.textContent='5サイトのログイン状態を確認'}},true);
}

if(location.hostname===APP){
  window.__SEDORI_USERSCRIPT__=true;window.__SEDORI_USERSCRIPT_VERSION__=VERSION;
  const r=await get(RESULT,null);if(r?.items){await del(RESULT);window.postMessage({type:'SEDORI_SEARCH_RESULTS',items:r.items,siteCounts:r.siteCounts||{},errors:r.errors||{}},location.origin)}
  window.addEventListener('message',async e=>{if(e.source!==window)return;
    if(e.data?.type==='SEDORI_START_SEARCH'){const f=e.data.filters||{},q=queue(f);if(!q.length)return;await set(JOB,{version:4,filters:f,queue:q,index:0,items:[],siteCounts:{},errors:{},returnUrl:location.href.split('#')[0],started:Date.now()});location.href=q[0][1]}
    if(e.data?.type==='SEDORI_CHECK_LOGINS')await requestLoginRefresh();
  });
  try{GM.addValueChangeListener(LOGIN,()=>setTimeout(appLoginStatus,100));GM.addValueChangeListener(LOGIN_TIME,()=>setTimeout(appLoginStatus,100))}catch{}
  installLoginButton();new MutationObserver(()=>{decorate();installLoginButton()}).observe(document.body,{childList:true,subtree:true});setTimeout(()=>{decorate();installLoginButton();appLoginStatus()},450);
  addEventListener('pageshow',()=>setTimeout(appLoginStatus,120));addEventListener('focus',()=>setTimeout(appLoginStatus,120));document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(appLoginStatus,120)});
  return;
}

const site=H[location.hostname];if(!site)return;
await refreshLoginState(site,true);watchLoginState(site);

// ログイン確認ジョブを優先。5サイトを巡回して最後にアプリへ戻る。
const lj=await get(LOGIN_JOB,null);
if(lj&&Date.now()-lj.started<3*60*1000){
  const expected=lj.sites?.[lj.index];
  if(expected===site){
    await sleep(500);
    let state=await refreshLoginState(site,true);
    if(state==='unknown'){await sleep(900);state=await refreshLoginState(site,true)}
    lj.index++;
    if(lj.index<(lj.sites?.length||0)){await set(LOGIN_JOB,lj);location.href=LOGIN_URLS[lj.sites[lj.index]];return}
    await del(LOGIN_JOB);location.href=lj.returnUrl||'https://m3924saim-eng.github.io/sedori-ai/#search';return;
  }
}else if(lj){await del(LOGIN_JOB)}

const j=await get(JOB,null);if(j&&Date.now()-j.started<8*60*1000){const ex=j.queue?.[j.index];if(ex&&ex[0]===site){await finishSite(site,j);return}}else if(j){await del(JOB)}
let tries=0,timer=setInterval(async()=>{tries++;if(await apply(site)||tries>24)clearInterval(timer)},1000);
})();
