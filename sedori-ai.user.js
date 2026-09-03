// ==UserScript==
// @name         せどりAI v4 実用版 5サイト検索＋販売下書き
// @namespace    https://m3924saim-eng.github.io/
// @version      4.1.0
// @description  5サイト横断検索を安定化し、ログイン状態をSPA遷移後も自動更新。仕入候補・販売下書き入力も補助します。
// @match        https://m3924saim-eng.github.io/*
// @match        https://jp.mercari.com/*
// @match        https://fril.jp/*
// @match        https://paypayfleamarket.yahoo.co.jp/*
// @match        https://auctions.yahoo.co.jp/*
// @match        https://jmty.jp/*
// @grant        GM.getValue
// @grant        GM.setValue
// @grant        GM.deleteValue
// @run-at       document-idle
// ==/UserScript==
(async()=>{'use strict';
const APP='m3924saim-eng.github.io',JOB='sedori_job_v4',RESULT='sedori_result_v4',LOGIN='sedori_login_v4',DRAFT='sedori_draft_v4',enc=encodeURIComponent;
const H={'jp.mercari.com':'mercari','fril.jp':'rakuma','paypayfleamarket.yahoo.co.jp':'yahoo_fleamarket','auctions.yahoo.co.jp':'yahoo_auction','jmty.jp':'jmty'};
const N={mercari:'メルカリ',rakuma:'楽天ラクマ',yahoo_fleamarket:'Yahoo!フリマ',yahoo_auction:'Yahoo!オークション',jmty:'ジモティー'};
const SELL={mercari:'https://jp.mercari.com/sell',rakuma:'https://fril.jp/',yahoo_fleamarket:'https://paypayfleamarket.yahoo.co.jp/sell',yahoo_auction:'https://auctions.yahoo.co.jp/',jmty:'https://jmty.jp/'};
const BG={clean_white:'白背景・自然光風',wood_table:'木目テーブル背景',concrete_gray:'ライトグレー背景',soft_beige:'ベージュ背景',dark_luxury:'ダーク背景・高級感'};
const get=async(k,d)=>{try{return await GM.getValue(k,d)}catch{return d}},set=async(k,v)=>{try{await GM.setValue(k,v)}catch(e){console.error(e)}},del=async k=>{try{await GM.deleteValue(k)}catch{}};
const sleep=ms=>new Promise(r=>setTimeout(r,ms)),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),yen=n=>'¥'+Math.round(Number(n)||0).toLocaleString('ja-JP');
function queue(f){const q=enc(f.query),a=f.min||0,b=f.max||0,mercariOrder=f.sort==='price_desc'?'desc':'asc',mercariSort=f.sort==='newest'?'created_time':'price';return[
 ['mercari',`https://jp.mercari.com/search?keyword=${q}&price_min=${a}&price_max=${b}&status=${f.onSale?'on_sale':'all'}&sort=${mercariSort}&order=${mercariOrder}`],
 ['rakuma',`https://fril.jp/s?query=${q}&min=${a}&max=${b}&transaction=${f.onSale?'selling':'all'}`],
 ['yahoo_fleamarket',`https://paypayfleamarket.yahoo.co.jp/search/${q}?minPrice=${a}&maxPrice=${b}`],
 ['yahoo_auction',`https://auctions.yahoo.co.jp/search/search?p=${q}&min=${a}&max=${b}`],
 ['jmty',`https://jmty.jp/hyogo/sale?keyword=${q}`]
]}
function price(t){const x=[...String(t).replace(/[,，]/g,'').matchAll(/[¥￥]\s*(\d{1,9})|(\d{1,9})\s*円/g)].map(m=>+(m[1]||m[2])).filter(n=>n>0);return x[0]||0}
const SEL={mercari:'a[href*="/item/"]',rakuma:'a[href*="/products/"],a[href*="/item/"]',yahoo_fleamarket:'a[href*="/item/"]',yahoo_auction:'a[href*="/jp/auction/"]',jmty:'a[href*="/sale-"]'};
function rootFor(a){return a.closest('article,li,[data-testid*="item"],[data-testid*="product"],[class*="item"],[class*="Item"],[class*="card"],[class*="Card"],section')||a.parentElement||a}
function conditionText(t){if(/新品|未使用|新品同様/i.test(t))return'new';if(/ジャンク|要修理|全体的に状態が悪い|傷や汚れあり/i.test(t))return'used';return'good'}
function collect(site,f){const map=new Map(),max=Math.max(10,Math.min(80,+f.maxPerSite||50));document.querySelectorAll(SEL[site]||'a').forEach(a=>{const r=rootFor(a),txt=(r.innerText||a.innerText||'').replace(/\s+/g,' ').trim();if(!txt||txt.length>2500)return;const p=price(txt),img=r.querySelector('img'),title=(img?.alt||a.getAttribute('aria-label')||a.getAttribute('title')||a.innerText||txt.replace(/[¥￥]\s*[\d,]+.*$/,'')).replace(/\s+/g,' ').trim().slice(0,180),url=(a.href||'').split('?')[0];if(!p||!title||!url)return;if(f.min&&p<f.min||f.max&&p>f.max)return;if(f.onSale&&/売り切れ|SOLD|取引終了|受付終了|終了しました|落札済/i.test(txt))return;if(f.excludeAds&&(/広告|スポンサー|おすすめショップ|プロモーション|\bPR\b/i.test(txt)||r.closest('[data-testid*="ad"],[class*="advert"],[class*="sponsor"]')))return;const cond=conditionText(txt);if(f.condition==='new'&&cond!=='new')return;if(f.condition==='good'&&cond==='used')return;if(!map.has(url))map.set(url,{source:site,title,price:p,url,image:img?.currentSrc||img?.src||'',condition:cond,rawText:txt.slice(0,500)})});return[...map.values()].slice(0,max)}
function login(){
 const t=(document.body?.innerText||'').slice(0,120000),p=(location.pathname||'').toLowerCase();
 if(/\/(login|signin|sign_in|auth)(\/|$)/.test(p)||/ログインしてください|ログインが必要/.test(t))return'out';
 const inText=/ログアウト|マイページ|出品する|出品\/売る|ウォッチリスト|取引中|お知らせ|購入履歴|出品した商品|アカウント/.test(t);
 const inDom=!!document.querySelector('a[href*="/mypage"],a[href*="/sell"],a[href*="/notifications"],a[href*="/users/sign_out"],a[href*="logout"]');
 if(inText||inDom)return'in';
 const outDom=!!document.querySelector('a[href*="login"],a[href*="signin"],a[href*="sign_in"],a[href*="signup"],a[href*="register"]');
 if(outDom||/ログイン|会員登録|新規登録/.test(t))return'out';
 return'unknown'
}
async function saveLoginState(site,state){
 const ls=await get(LOGIN,{}),prev=ls[site];
 if(state==='unknown'&&(prev==='in'||prev==='out'))return prev;
 ls[site]=state;
 if(site.startsWith('yahoo_')){ls.yahoo_fleamarket=state;ls.yahoo_auction=state}
 await set(LOGIN,ls);
 return state
}
async function refreshLoginState(site){return saveLoginState(site,login())}
function watchLoginState(site){
 let timer=0,lastHref=location.href;
 const run=()=>{clearTimeout(timer);timer=setTimeout(()=>refreshLoginState(site),250)};
 addEventListener('pageshow',run);addEventListener('focus',run);addEventListener('popstate',run);addEventListener('hashchange',run);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)run()});
 new MutationObserver(()=>{if(location.href!==lastHref){lastHref=location.href;run()}else run()}).observe(document.documentElement,{childList:true,subtree:true});
 let n=0;const iv=setInterval(()=>{refreshLoginState(site);if(++n>=30)clearInterval(iv)},2000);
}
async function stableCollect(site,f){let best=[],last=-1,stable=0;for(let i=0;i<14;i++){await sleep(i===0?1200:700);const now=collect(site,f);if(now.length>best.length)best=now;if(now.length===last&&now.length>0)stable++;else stable=0;last=now.length;if(stable>=2||best.length>=Math.min(45,+f.maxPerSite||50))break}return best}
async function finishSite(site,j){let items=[],err='';try{const state=await refreshLoginState(site);items=await stableCollect(site,j.filters);if(!items.length){if(state==='out')err='要ログイン';else err='商品取得0件'}}catch(e){err='取得エラー';console.error(e)}j.items.push(...items);j.siteCounts[site]=items.length;j.errors[site]=err;j.index++;if(j.index<j.queue.length){await set(JOB,j);location.href=j.queue[j.index][1]}else{const dedup=[...new Map(j.items.map(x=>[x.url,x])).values()];await set(RESULT,{items:dedup,siteCounts:j.siteCounts,errors:j.errors,started:j.started,finished:Date.now()});await del(JOB);location.href=j.returnUrl+'#search'}}

function history(){try{return JSON.parse(localStorage.getItem('sedori_history')||'[]')}catch{return[]}}function save(h){localStorage.setItem('sedori_history',JSON.stringify(h))}
function type(t){for(const [n,r] of [['リング',/リング|指輪/],['ネックレス',/ネックレス|ペンダント/],['財布',/財布|ウォレット/],['バッグ',/バッグ|トート|ショルダー/],['時計',/時計|ウォッチ/],['工具',/マキタ|ハイコーキ|工具|インパクト|ドリル/],['家電・デジタル',/iPhone|iPad|MacBook|カメラ|レンズ|ゲーム/],['アパレル',/Tシャツ|シャツ|ジャケット|コート|パンツ|デニム/]])if(r.test(t||''))return n;return'商品'}
function draft(x){const title=String(x.title||type(x.title)).replace(/^【[^】]+】\s*/,'').slice(0,60),st=x.cond==='low'?'目立つ傷や汚れなし':x.cond==='high'?'傷や汚れあり':'やや使用感あり',bg=x.background_preset||'clean_white',desc=`${type(x.title)}です。\n即購入OKです。\n中古品のため、状態は写真・説明をご確認のうえご検討ください。\n気になる点があれば購入前にコメントください。\n\n【商品情報】\n・商品名：${title}\n・状態：${st}\n・付属品：実物確認後に追記してください\n\n【発送】\n・商品に合わせて安全に梱包して発送します。\n\n※型番、サイズ、傷・汚れ、動作、付属品などは実物確認後に必ず追記してください。`,photo=`構図：商品を中央。正面＋斜め45度\n背景：${BG[bg]}\n追加：型番・ロゴ・タグ・傷・付属品の寄り写真`;return{title,description:desc,price:Math.max(300,Math.round((+x.sell||0)/100)*100),background_preset:bg,photo_guidance:photo,linked_purchase_url:x.url||'',linked_purchase_title:x.title||''}}
function updateItem(id,fn){const h=history(),i=h.findIndex(x=>x.id===id);if(i<0)return;h[i]=fn(h[i]);save(h)}
function decorate(){const h=history(),cards=[...document.querySelectorAll('#history .history-item')];cards.forEach((c,i)=>{if(c.dataset.salesUi)return;let x=h[i];if(!x)return;c.dataset.salesUi='1';x.id||(x.id='h'+Date.now()+i);const d=x.sales_draft||draft(x),wrap=document.createElement('div');wrap.style.cssText='margin-top:9px;padding:9px;border:1px solid #dbeafe;border-radius:11px;background:#f8fbff';wrap.innerHTML=`<div style="font-weight:800;font-size:12px">販売下書き</div><details style="margin-top:5px"><summary style="cursor:pointer;font-size:12px;font-weight:700">内容を見る</summary><div class="small" style="white-space:pre-wrap;margin-top:6px"><b>タイトル</b>\n${esc(d.title)}\n\n<b>説明文</b>\n${esc(d.description)}\n\n<b>価格</b> ${yen(d.price)}\n\n<b>画像メモ</b>\n${esc(d.photo_guidance)}</div></details>`;const row=document.createElement('div');row.style.cssText='display:flex;gap:6px;flex-wrap:wrap;margin-top:7px';const mk=(t,fn,pri=false)=>{const b=document.createElement('button');b.textContent=t;b.className='btn'+(pri?' primary':'');b.style.cssText='padding:8px;font-size:11px';b.onclick=fn;return b};row.append(mk('販売文コピー',async e=>{await navigator.clipboard.writeText(d.title+'\n\n'+d.description);e.target.textContent='コピー済み'}));['mercari','rakuma','yahoo_fleamarket','yahoo_auction'].forEach(site=>row.append(mk(N[site]+'へ下書き',async()=>{const nd=draft(x);updateItem(x.id,y=>({...y,sales_draft:nd}));await set(DRAFT,{targetSite:site,draft:nd,itemId:x.id,createdAt:Date.now()});location.href=SELL[site]},true)));wrap.append(row);c.append(wrap)});save(h)}
function input(el,v){if(!el)return false;const proto=Object.getPrototypeOf(el),setv=Object.getOwnPropertyDescriptor(proto,'value')?.set;setv?setv.call(el,v):el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));return true}
function find(a){for(const s of a){const e=document.querySelector(s);if(e&&e.offsetParent!==null&&!e.disabled)return e}return null}
function fields(){return{title:['input[name*="title"]','input[placeholder*="タイトル"]','input[placeholder*="商品名"]','input[placeholder*="商品の名前"]'],desc:['textarea[name*="description"]','textarea[placeholder*="説明"]','textarea[placeholder*="本文"]','textarea'],price:['input[name*="price"]','input[placeholder*="価格"]','input[placeholder*="販売価格"]','input[inputmode="numeric"]']}}
async function apply(site){const b=await get(DRAFT,null);if(!b||b.targetSite!==site||!b.draft)return false;const f=fields(),ok=[input(find(f.title),b.draft.title),input(find(f.desc),b.draft.description),input(find(f.price),String(b.draft.price))].some(Boolean);if(ok){const n=document.createElement('div');n.textContent='せどりAIの下書きを入力しました。写真・状態・カテゴリを確認してから保存/出品してください。';n.style.cssText='position:fixed;z-index:99999;left:10px;right:10px;bottom:10px;padding:11px;background:#111827;color:#fff;border-radius:10px;font-size:13px';document.body.append(n);setTimeout(()=>n.remove(),6500);await set(DRAFT,{...b,appliedAt:Date.now()});return true}return false}

if(location.hostname===APP){window.__SEDORI_USERSCRIPT__=true;window.__SEDORI_USERSCRIPT_VERSION__='4.1.0';const r=await get(RESULT,null);if(r?.items){await del(RESULT);window.postMessage({type:'SEDORI_SEARCH_RESULTS',items:r.items,siteCounts:r.siteCounts||{},errors:r.errors||{}},location.origin)}window.addEventListener('message',async e=>{if(e.source!==window)return;if(e.data?.type==='SEDORI_START_SEARCH'){const f=e.data.filters||{},q=queue(f);await set(JOB,{version:4,filters:f,queue:q,index:0,items:[],siteCounts:{},errors:{},returnUrl:location.href.split('#')[0],started:Date.now()});location.href=q[0][1]}if(e.data?.type==='SEDORI_CHECK_LOGINS')window.postMessage({type:'SEDORI_LOGIN_STATUS',status:await get(LOGIN,{})},location.origin)});new MutationObserver(()=>decorate()).observe(document.body,{childList:true,subtree:true});setTimeout(decorate,600);return}
const site=H[location.hostname];if(!site)return;await refreshLoginState(site);watchLoginState(site);const j=await get(JOB,null);if(j&&Date.now()-j.started<8*60*1000){const ex=j.queue?.[j.index];if(ex&&ex[0]===site){await finishSite(site,j);return}}else if(j){await del(JOB)}
let tries=0,timer=setInterval(async()=>{tries++;if(await apply(site)||tries>24)clearInterval(timer)},1000);
})();