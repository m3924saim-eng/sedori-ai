// ==UserScript==
// @name         せどりAI Edge 5サイト連携
// @namespace    https://m3924saim-eng.github.io/
// @version      1.0.0
// @description  Microsoft Edge + Tampermonkey向け。せどりAIと5サイトを同一タブで連携して検索結果を戻します。
// @match        https://m3924saim-eng.github.io/sedori-ai/*
// @match        https://jp.mercari.com/*
// @match        https://fril.jp/*
// @match        https://paypayfleamarket.yahoo.co.jp/*
// @match        https://auctions.yahoo.co.jp/*
// @match        https://jmty.jp/*
// @match        https://www.jmty.jp/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @run-at       document-idle
// @noframes
// ==/UserScript==

(function(){
'use strict';
var VERSION='edge-1.0.0';
var APP_HOST='m3924saim-eng.github.io';
var JOB='sedori_edge_job_v100';
var RESULT='sedori_edge_result_v100';
var SITES=['mercari','rakuma','yahoo_fleamarket','yahoo_auction','jmty'];
var HOSTS={'jp.mercari.com':'mercari','fril.jp':'rakuma','paypayfleamarket.yahoo.co.jp':'yahoo_fleamarket','auctions.yahoo.co.jp':'yahoo_auction','jmty.jp':'jmty','www.jmty.jp':'jmty'};
var SEL={mercari:'a[href*="/item/"],a[href*="/shops/product/"]',rakuma:'a[href*="/products/"],a[href*="/item/"]',yahoo_fleamarket:'a[href*="/item/"]',yahoo_auction:'a[href*="/jp/auction/"]',jmty:'a[href*="/sale-"]'};
function get(k,d){try{var v=GM_getValue(k,d);return v==null?d:v}catch(e){return d}}
function set(k,v){try{GM_setValue(k,v);return true}catch(e){return false}}
function del(k){try{GM_deleteValue(k)}catch(e){}}
function enc(s){return encodeURIComponent(String(s||''))}
function sleep(ms){return new Promise(function(r){setTimeout(r,ms)})}
function price(t){var m=String(t||'').replace(/[,，]/g,'').match(/[¥￥]\s*(\d{1,9})|(\d{1,9})\s*円/);return m?Number(m[1]||m[2]||0):0}
function siteUrl(id,f){var q=enc(f.query),a=f.min||0,b=f.max||0;if(id==='mercari')return 'https://jp.mercari.com/search?keyword='+q+'&price_min='+a+'&price_max='+b+'&status='+(f.onSale?'on_sale':'all');if(id==='rakuma')return 'https://fril.jp/s?query='+q+'&min='+a+'&max='+b+'&transaction='+(f.onSale?'selling':'all');if(id==='yahoo_fleamarket')return 'https://paypayfleamarket.yahoo.co.jp/search/'+q+'?minPrice='+a+'&maxPrice='+b;if(id==='yahoo_auction')return 'https://auctions.yahoo.co.jp/search/search?p='+q+'&min='+a+'&max='+b;return 'https://jmty.jp/hyogo/sale?keyword='+q}
function validUrl(site,h){h=String(h||'');if(site==='mercari')return /\/item\/|\/shops\/product\//.test(h);if(site==='rakuma')return /\/products\/|\/item\//.test(h);if(site==='yahoo_fleamarket')return /\/item\//.test(h);if(site==='yahoo_auction')return /\/jp\/auction\//.test(h);return /\/sale-/.test(h)}
function root(a){return a.closest('article,li,[data-testid*="item"],[data-testid*="product"],[class*="item"],[class*="Item"],[class*="product"],[class*="Product"],[class*="card"],[class*="Card"],section')||a.parentElement||a}
function collect(site,f){var arr=[].slice.call(document.querySelectorAll(SEL[site]||'a[href]')),out=[],seen={},i,a,r,txt,p,img,title,url,cond;if(arr.length<3)arr=[].slice.call(document.querySelectorAll('a[href]'));for(i=0;i<arr.length;i++){a=arr[i];if(!validUrl(site,a.href))continue;r=root(a);txt=((r&&r.innerText)||a.innerText||'').replace(/\s+/g,' ').trim();if(!txt||txt.length>3500)continue;p=price(txt);if(!p)continue;if((f.min&&p<f.min)||(f.max&&p>f.max))continue;if(f.onSale&&/売り切れ|SOLD|取引終了|受付終了|終了しました|落札済/i.test(txt))continue;if(f.excludeAds&&/広告|スポンサー|おすすめショップ|プロモーション|\bPR\b/i.test(txt))continue;cond=/新品|未使用|新品同様/i.test(txt)?'new':(/ジャンク|要修理|全体的に状態が悪い|傷や汚れあり/i.test(txt)?'used':'good');if(f.condition==='new'&&cond!=='new')continue;if(f.condition==='good'&&cond==='used')continue;img=r&&r.querySelector?r.querySelector('img'):null;title=(a.getAttribute('aria-label')||a.getAttribute('title')||(img&&img.alt)||a.innerText||txt).replace(/\s+/g,' ').trim().slice(0,180);url=(a.href||'').split('?')[0];if(!title||!url||seen[url])continue;seen[url]=1;out.push({source:site,title:title,price:p,url:url,image:(img&&(img.currentSrc||img.src))||'',condition:cond,rawText:txt.slice(0,800)});if(out.length>=Math.max(10,Math.min(50,Number(f.maxPerSite||50))))break}return out}
async function collectStable(site,f){var best=[],n,i;for(i=0;i<7;i++){await sleep(i?700:1200);n=collect(site,f);if(n.length>best.length)best=n;if(i===2||i===4){try{window.scrollTo(0,Math.min(document.documentElement.scrollHeight,(i+1)*900))}catch(e){}}if(best.length>=40)break}try{window.scrollTo(0,0)}catch(e){}return best}
function bridge(id,payload){var old=document.getElementById(id);if(old&&old.parentNode)old.parentNode.removeChild(old);var n=document.createElement('div');n.id=id;n.style.display='none';n.textContent=JSON.stringify(payload);document.documentElement.appendChild(n)}
function mark(){document.documentElement.dataset.sedoriUserscript=VERSION;document.documentElement.dataset.sedoriBridge='edge-tampermonkey-v100'}
function appLoop(){mark();var r=get(RESULT,null);if(r){del(RESULT);bridge('sedoriBridgeResult',r)}setInterval(function(){mark();var c=document.getElementById('sedoriBridgeCommand');if(!c||c.dataset.edgeProcessing)return;c.dataset.edgeProcessing='1';var x;try{x=JSON.parse(c.textContent||'{}')}catch(e){x=null}if(c.parentNode)c.parentNode.removeChild(c);if(!x)return;if(x.type==='search'){var f=x.filters||{};if(!f.query){bridge('sedoriBridgeError',{message:'検索語がありません'});return}var job={filters:f,index:0,items:[],errors:{},returnUrl:location.href.split('#')[0],started:Date.now()};set(JOB,job);location.assign(siteUrl(SITES[0],f))}},400)}
async function siteLoop(site){var job=get(JOB,null);if(!job||!job.filters||job.index==null)return;var expected=SITES[job.index];if(expected!==site)return;try{var items=await collectStable(site,job.filters);job.items=(job.items||[]).concat(items);job.siteCounts=job.siteCounts||{};job.siteCounts[site]=items.length}catch(e){job.errors=job.errors||{};job.errors[site]=String(e&&e.message?e.message:e)}job.index++;set(JOB,job);if(job.index<SITES.length){location.assign(siteUrl(SITES[job.index],job.filters));return}del(JOB);set(RESULT,{items:job.items||[],filters:job.filters,siteCounts:job.siteCounts||{},errors:job.errors||{},bridgeVersion:VERSION,finished:Date.now()});location.assign(job.returnUrl||'https://m3924saim-eng.github.io/sedori-ai/fresh-1468.html')}
if(location.hostname===APP_HOST){appLoop()}else{var s=HOSTS[location.hostname];if(s)siteLoop(s)}
})();