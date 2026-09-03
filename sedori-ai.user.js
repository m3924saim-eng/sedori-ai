// ==UserScript==
// @name         せどりAI 5サイト連携
// @namespace    https://m3924saim-eng.github.io/
// @version      4.5.0
// @description  iPhone/iPad Safari Userscripts向け。DOMブリッジ＋GM保存で5サイト検索とログイン確認を安定化し、旧版の競合ジョブを無効化。
// @match        https://m3924saim-eng.github.io/*
// @match        https://jp.mercari.com/*
// @match        https://fril.jp/*
// @match        https://paypayfleamarket.yahoo.co.jp/*
// @match        https://auctions.yahoo.co.jp/*
// @match        https://jmty.jp/*
// @match        https://www.jmty.jp/*
// @grant        GM.getValue
// @grant        GM.setValue
// @grant        GM.deleteValue
// @inject-into  content
// @run-at       document-idle
// @weight       999
// @noframes
// @updateURL    https://m3924saim-eng.github.io/sedori-ai/sedori-ai.meta.js
// @downloadURL  https://m3924saim-eng.github.io/sedori-ai/sedori-ai.user.js
// ==/UserScript==

(async()=>{'use strict';
const VERSION='4.5.0';
const APP='m3924saim-eng.github.io';
const SEARCH_JOB='sedori_search_job_v45';
const SEARCH_RESULT='sedori_search_result_v45';
const LOGIN='sedori_login_v45';
const LOGIN_TIME='sedori_login_time_v45';
const LOGIN_JOB='sedori_login_job_v45';
const LOGIN_REPORT='sedori_login_report_v45';
const LEGACY_KEYS=['sedori_job_v4','sedori_result_v4','sedori_login_check_v42','sedori_login_job_v42','sedori_login_job_v43','sedori_login_report_v43','sedori_search_job_v44','sedori_search_result_v44','sedori_login_job_v44','sedori_login_report_v44'];
const enc=encodeURIComponent;
const SITE_IDS=['mercari','rakuma','yahoo_fleamarket','yahoo_auction','jmty'];
const N={mercari:'メルカリ',rakuma:'楽天ラクマ',yahoo_fleamarket:'Yahoo!フリマ',yahoo_auction:'Yahoo!オークション',jmty:'ジモティー'};
const H={'jp.mercari.com':'mercari','fril.jp':'rakuma','paypayfleamarket.yahoo.co.jp':'yahoo_fleamarket','auctions.yahoo.co.jp':'yahoo_auction','jmty.jp':'jmty','www.jmty.jp':'jmty'};
const LOGIN_URLS={mercari:'https://jp.mercari.com/',rakuma:'https://fril.jp/',yahoo_fleamarket:'https://paypayfleamarket.yahoo.co.jp/',yahoo_auction:'https://auctions.yahoo.co.jp/',jmty:'https://jmty.jp/'};
const get=async(k,d)=>{try{return await GM.getValue(k,d)}catch(e){console.error('[せどりAI] get',k,e);return d}};
const set=async(k,v)=>{try{await GM.setValue(k,v);return true}catch(e){console.error('[せどりAI] set',k,e);return false}};
const del=async k=>{try{await GM.deleteValue(k);return true}catch(e){console.error('[せどりAI] del',k,e);return false}};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

async function clearLegacyJobs(){for(const k of LEGACY_KEYS)await del(k)}
function lockLegacyHandlers(){const b=document.getElementById('checkLoginBtn');if(b){b.dataset.sedoriLogin420='1';b.dataset.sedoriLogin430='1'}}
function markConnected(){document.documentElement.dataset.sedoriUserscript=VERSION;document.documentElement.dataset.sedoriBridge='dom-gm-v45';lockLegacyHandlers()}
function bridge(id,payload){document.getElementById(id)?.remove();const n=document.createElement('div');n.id=id;n.hidden=true;n.textContent=JSON.stringify(payload);document.documentElement.appendChild(n)}

function queue(f){const q=enc(f.query),a=f.min||0,b=f.max||0,mercariOrder=f.sort==='price_desc'?'desc':'asc',mercariSort=f.sort==='newest'?'created_time':'price';return[
 ['mercari',`https://jp.mercari.com/search?keyword=${q}&price_min=${a}&price_max=${b}&status=${f.onSale?'on_sale':'all'}&sort=${mercariSort}&order=${mercariOrder}`],
 ['rakuma',`https://fril.jp/s?query=${q}&min=${a}&max=${b}&transaction=${f.onSale?'selling':'all'}`],
 ['yahoo_fleamarket',`https://paypayfleamarket.yahoo.co.jp/search/${q}?minPrice=${a}&maxPrice=${b}`],
 ['yahoo_auction',`https://auctions.yahoo.co.jp/search/search?p=${q}&min=${a}&max=${b}`],
 ['jmty',`https://jmty.jp/hyogo/sale?keyword=${q}`]
]}
function price(t){const xs=[...String(t).replace(/[,，]/g,'').matchAll(/[¥￥]\s*(\d{1,9})|(\d{1,9})\s*円/g)].map(m=>+(m[1]||m[2])).filter(n=>n>0);return xs[0]||0}
const SEL={mercari:'a[href*="/item/"]',rakuma:'a[href*="/products/"],a[href*="/item/"]',yahoo_fleamarket:'a[href*="/item/"]',yahoo_auction:'a[href*="/jp/auction/"]',jmty:'a[href*="/sale-"]'};
function rootFor(a){return a.closest('article,li,[data-testid*="item"],[data-testid*="product"],[class*="item"],[class*="Item"],[class*="card"],[class*="Card"],section')||a.parentElement||a}
function conditionText(t){if(/新品|未使用|新品同様/i.test(t))return'new';if(/ジャンク|要修理|全体的に状態が悪い|傷や汚れあり/i.test(t))return'used';return'good'}
function collect(site,f){const map=new Map(),max=Math.max(10,Math.min(80,+f.maxPerSite||50));document.querySelectorAll(SEL[site]||'a').forEach(a=>{const r=rootFor(a),txt=(r.innerText||a.innerText||'').replace(/\s+/g,' ').trim();if(!txt||txt.length>2500)return;const p=price(txt),img=r.querySelector('img');const title=(img?.alt||a.getAttribute('aria-label')||a.getAttribute('title')||a.innerText||txt.replace(/[¥￥]\s*[\d,]+.*$/,'')).replace(/\s+/g,' ').trim().slice(0,180);const url=(a.href||'').split('?')[0];if(!p||!title||!url)return;if((f.min&&p<f.min)||(f.max&&p>f.max))return;if(f.onSale&&/売り切れ|SOLD|取引終了|受付終了|終了しました|落札済/i.test(txt))return;if(f.excludeAds&&(/広告|スポンサー|おすすめショップ|プロモーション|\bPR\b/i.test(txt)||r.closest('[data-testid*="ad"],[class*="advert"],[class*="sponsor"]')))return;const cond=conditionText(txt);if(f.condition==='new'&&cond!=='new')return;if(f.condition==='good'&&cond==='used')return;if(!map.has(url))map.set(url,{source:site,title,price:p,url,image:img?.currentSrc||img?.src||'',condition:cond,rawText:txt.slice(0,600)})});return[...map.values()].slice(0,max)}
async function stableCollect(site,f){let best=[],same=0,last=-1;for(let i=0;i<10;i++){await sleep(i?650:1000);const now=collect(site,f);if(now.length>best.length)best=now;if(now.length===last&&now.length>0)same++;else same=0;last=now.length;if(same>=2||best.length>=Math.min(45,+f.maxPerSite||50))break}return best}

function loginState(site){const body=(document.body?.innerText||'').replace(/\s+/g,' ').slice(0,200000),path=(location.pathname||'').toLowerCase(),hrefs=[...document.querySelectorAll('a[href]')].slice(0,3500).map(a=>a.getAttribute('href')||'').join(' ');if(/\/(login|signin|sign_in|auth)(?:\/|$)/.test(path)||/ログインしてください|ログインが必要|ログインして続行/.test(body))return'out';const rules={
 mercari:{inText:/やることリスト|購入履歴|出品した商品|残高|ポイント/,inHref:/\/mypage|\/notifications|\/sell|\/user\/profile/,outText:/ログイン\s*会員登録|会員登録\s*ログイン/,outHref:/\/login|\/signup/},
 rakuma:{inText:/購入した商品|出品した商品|売上金|ログアウト/,inHref:/\/users\/sign_out|\/mypage|\/notifications/,outText:/ログイン|新規登録/,outHref:/\/users\/sign_in|\/users\/sign_up/},
 yahoo_fleamarket:{inText:/購入した商品|出品した商品|取引中|売上金|ログアウト/,inHref:/\/mypage|\/notifications|logout/,outText:/Yahoo! JAPAN IDでログイン|ログインして/,outHref:/login\.yahoo\.co\.jp/},
 yahoo_auction:{inText:/マイ・オークション|落札分|出品終了分|評価一覧|ログアウト/,inHref:/myauc|watchlist|logout/,outText:/Yahoo! JAPAN IDでログイン|ログインして/,outHref:/login\.yahoo\.co\.jp/},
 jmty:{inText:/お問い合わせ履歴|投稿履歴|お気に入り|ログアウト/,inHref:/\/users\/[^/]+\/(?:profile|posts)|\/posts\/new|sign_out/,outText:/ログイン|新規会員登録/,outHref:/\/users\/sign_in|\/users\/sign_up/}
}[site];if(rules){if(rules.inHref.test(hrefs)||rules.inText.test(body))return'in';if(rules.outHref.test(hrefs)||rules.outText.test(body))return'out'}return'unknown'}
async function sampleLoginState(site){const samples=[];for(const ms of[300,650,1100,1800]){await sleep(ms);const s=loginState(site);samples.push(s);if(samples.filter(x=>x==='in').length>=2)return'in';if(samples.filter(x=>x==='out').length>=3)return'out'}if(samples.includes('in'))return'in';if(samples.filter(x=>x==='out').length>=2)return'out';return'unknown'}
async function saveLogin(site,state){if(!['in','out'].includes(state))return;const x=await get(LOGIN,{}),t=await get(LOGIN_TIME,{});x[site]=state;t[site]=Date.now();await set(LOGIN,x);await set(LOGIN_TIME,t)}

function filtersFromDom(){const $=id=>document.getElementById(id);return{query:$('searchQ')?.value.trim()||'',min:+($('searchMin')?.value||0),max:+($('searchMax')?.value||0),condition:$('searchCondition')?.value||'all',sort:$('searchSort')?.value||'newest',onSale:$('searchOnSale')?.checked!==false,excludeAds:$('searchExcludeAds')?.checked!==false,maxPerSite:50}}
async function beginSearch(f){if(!f.query)return;await clearLegacyJobs();const q=queue(f),job={version:45,filters:f,queue:q,index:0,items:[],siteCounts:{},errors:{},returnUrl:location.href.split('#')[0],started:Date.now()};if(!(await set(SEARCH_JOB,job)))throw new Error('検索ジョブを保存できません');location.assign(q[0][1])}
async function beginLogin(){await clearLegacyJobs();const checkId=`${Date.now()}-${Math.random().toString(36).slice(2,8)}`,job={version:45,index:0,sites:SITE_IDS,returnUrl:location.href.split('#')[0],started:Date.now(),checkId},report={checkId,started:job.started,statuses:{},times:{},done:false,userscriptVersion:VERSION};if(!(await set(LOGIN_JOB,job)))throw new Error('ログイン確認を保存できません');if(!(await set(LOGIN_REPORT,report)))throw new Error('ログイン結果を初期化できません');location.assign(LOGIN_URLS[SITE_IDS[0]])}
async function processCommand(){const el=document.getElementById('sedoriBridgeCommand');if(!el||el.dataset.processing)return;el.dataset.processing='1';let c;try{c=JSON.parse(el.textContent||'{}')}catch{el.remove();return}el.remove();try{if(c.type==='search')await beginSearch(c.filters||filtersFromDom());else if(c.type==='login')await beginLogin()}catch(e){console.error(e);bridge('sedoriBridgeError',{message:String(e?.message||e),at:Date.now()})}}

function loginHtml(id,state,time){const label=state==='in'?'ログイン済み':state==='out'?'要ログイン':state==='unknown'?'判定できず':'未確認',cls=state==='in'?'status-ok':state==='out'?'status-ng':'',when=time?`<small style="display:block;color:#667085;font-size:10px;margin-top:2px">確認 ${new Date(time).toLocaleString('ja-JP')}</small>`:'';return`<div class="login-row"><span><b>${N[id]}</b>${when}</span><span class="${cls}">${label}</span></div>`}
async function renderLogin(){const report=await get(LOGIN_REPORT,null),raw=await get(LOGIN,{}),times=await get(LOGIN_TIME,{}),status={},viewTimes={};for(const id of SITE_IDS){if(report?.statuses&&Object.prototype.hasOwnProperty.call(report.statuses,id)){status[id]=report.statuses[id];viewTimes[id]=report.times?.[id]||report.finished||report.started||0}else{status[id]=raw[id]||'unknown';viewTimes[id]=times[id]||0}}const box=document.getElementById('loginResults');if(box)box.innerHTML=SITE_IDS.map(id=>loginHtml(id,status[id],viewTimes[id])).join('');bridge('sedoriBridgeLogin',{status,times:viewTimes,userscriptVersion:VERSION,at:Date.now()})}

async function appMode(){markConnected();await clearLegacyJobs();const a=document.querySelector('a[href^="sedori-ai.user.js"]');if(a){a.href='sedori-ai.user.js';a.textContent=`v${VERSION} を開く`}const result=await get(SEARCH_RESULT,null);if(result){await del(SEARCH_RESULT);bridge('sedoriBridgeResult',result)}await renderLogin();await processCommand();new MutationObserver(()=>{markConnected();processCommand()}).observe(document.documentElement,{childList:true,subtree:true});setInterval(()=>{markConnected();processCommand()},700);setInterval(renderLogin,2500)}
async function processLoginJob(site){const job=await get(LOGIN_JOB,null);if(!job)return false;if(Date.now()-job.started>5*60*1000){await del(LOGIN_JOB);return false}if(job.sites?.[job.index]!==site)return false;const report=await get(LOGIN_REPORT,{checkId:job.checkId,started:job.started,statuses:{},times:{},done:false}),state=await sampleLoginState(site);await saveLogin(site,state);report.statuses={...(report.statuses||{}),[site]:state};report.times={...(report.times||{}),[site]:Date.now()};job.index++;if(job.index<job.sites.length){await set(LOGIN_REPORT,report);await set(LOGIN_JOB,job);location.assign(LOGIN_URLS[job.sites[job.index]]);return true}report.done=true;report.finished=Date.now();await set(LOGIN_REPORT,report);await del(LOGIN_JOB);location.assign((job.returnUrl||'https://m3924saim-eng.github.io/sedori-ai/')+'#search');return true}
async function processSearchJob(site){const job=await get(SEARCH_JOB,null);if(!job)return false;if(Date.now()-job.started>10*60*1000){await del(SEARCH_JOB);return false}const expected=job.queue?.[job.index];if(!expected||expected[0]!==site)return false;let items=[],err='';try{const state=await sampleLoginState(site);await saveLogin(site,state);items=await stableCollect(site,job.filters);if(!items.length)err=state==='out'?'要ログイン':state==='unknown'?'ログイン状態不明／商品取得0件':'商品取得0件'}catch(e){err='取得エラー';console.error(e)}job.items.push(...items);job.siteCounts[site]=items.length;job.errors[site]=err;job.index++;if(job.index<job.queue.length){await set(SEARCH_JOB,job);location.assign(job.queue[job.index][1]);return true}const dedup=[...new Map(job.items.map(x=>[x.url,x])).values()];await set(SEARCH_RESULT,{items:dedup,siteCounts:job.siteCounts,errors:job.errors,started:job.started,finished:Date.now(),userscriptVersion:VERSION});await del(SEARCH_JOB);location.assign((job.returnUrl||'https://m3924saim-eng.github.io/sedori-ai/')+'#search');return true}

if(location.hostname===APP){await appMode();return}
const site=H[location.hostname];if(!site)return;
if(await processLoginJob(site))return;
if(await processSearchJob(site))return;
for(const ms of[500,1500,3500,7000])setTimeout(()=>saveLogin(site,loginState(site)),ms);
})();