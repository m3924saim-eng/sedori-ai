// ==UserScript==
// @name         せどりAI 5サイト同条件検索
// @namespace    https://m3924saim-eng.github.io/
// @version      2.0.0
// @description  iPad Safariで5サイトを同条件検索し、商品をせどりAIへ集約します。
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
(async function(){
  'use strict';
  const APP_HOST='m3924saim-eng.github.io',JOB='sedori_job_v2',RESULT='sedori_result_v2',LOGIN='sedori_login_v2';
  const sourceByHost={'jp.mercari.com':'mercari','fril.jp':'rakuma','paypayfleamarket.yahoo.co.jp':'yahoo_fleamarket','auctions.yahoo.co.jp':'yahoo_auction','jmty.jp':'jmty'};
  const enc=encodeURIComponent;
  const get=async(k,d)=>{try{return await GM.getValue(k,d)}catch{return d}};
  const set=async(k,v)=>{try{await GM.setValue(k,v)}catch(e){console.error('せどりAI保存失敗',e)}};
  const del=async k=>{try{await GM.deleteValue(k)}catch{}};
  function buildQueue(f){
    const q=enc(f.query),min=f.min||0,max=f.max||0;
    return [
      ['mercari',`https://jp.mercari.com/search?keyword=${q}&price_min=${min}&price_max=${max}&status=${f.onSale?'on_sale':'all'}&sort=${f.sort==='newest'?'created_time':'price'}&order=${f.sort==='price_desc'?'desc':'asc'}`],
      ['rakuma',`https://fril.jp/s?query=${q}&min=${min}&max=${max}&transaction=selling`],
      ['yahoo_fleamarket',`https://paypayfleamarket.yahoo.co.jp/search/${q}?minPrice=${min}&maxPrice=${max}`],
      ['yahoo_auction',`https://auctions.yahoo.co.jp/search/search?p=${q}&min=${min}&max=${max}`],
      ['jmty',`https://jmty.jp/hyogo/sale?keyword=${q}`]
    ];
  }
  const priceOf=text=>{const nums=[...String(text).replace(/[,，]/g,'').matchAll(/[¥￥]\s*(\d{1,9})|(\d{1,9})\s*円/g)].map(m=>Number(m[1]||m[2])).filter(n=>n>0);return nums[0]||0};
  const linkSelectors={mercari:'a[href*="/item/"]',rakuma:'a[href*="/products/"],a[href*="/item/"]',yahoo_fleamarket:'a[href*="/item/"]',yahoo_auction:'a[href*="/jp/auction/"]',jmty:'a[href*="/sale-"]'};
  function isAd(root,text){return /広告|PR|スポンサー|おすすめショップ/.test(text)||!!root.closest('[data-testid*="ad"],[class*="advert"],[class*="sponsor"]')}
  function sold(text){return /売り切れ|SOLD|取引終了|受付終了|終了しました/i.test(text)}
  function collect(source,filters){
    const found=[];
    document.querySelectorAll(linkSelectors[source]||'a').forEach(a=>{
      const root=a.closest('article,li,[data-testid*="item"],[class*="item"],[class*="card"],section')||a;
      const text=(root.innerText||a.innerText||'').replace(/\s+/g,' ').trim(),price=priceOf(text),img=root.querySelector('img');
      const title=(img?.alt||a.getAttribute('aria-label')||a.getAttribute('title')||text.replace(/[¥￥]\s*[\d,]+.*$/,'')).trim().slice(0,180);
      if(!price||!title||!a.href)return;
      if(filters.min&&price<filters.min)return;if(filters.max&&price>filters.max)return;
      if(filters.onSale&&sold(text))return;if(filters.excludeAds&&isAd(root,text))return;
      if(filters.condition==='new'&&!/新品|未使用|新品同様/.test(text))return;
      if(filters.condition==='good'&&/全体的に状態が悪い|傷や汚れあり|ジャンク|要修理/.test(text))return;
      found.push({source,title,price,url:a.href.split('?')[0],image:img?.currentSrc||img?.src||'',sold:sold(text)});
    });
    return [...new Map(found.map(x=>[x.url,x])).values()].slice(0,30);
  }
  function loginState(){const text=(document.body?.innerText||'').slice(0,12000);return /ログアウト|マイページ|出品する|出品\/売る|ウォッチリスト|取引中/.test(text)?'in':/ログイン|会員登録/.test(text)?'out':'unknown'}
  if(location.hostname===APP_HOST){
    window.__SEDORI_USERSCRIPT__=true;
    const result=await get(RESULT,null);
    if(result?.items){await del(RESULT);window.postMessage({type:'SEDORI_SEARCH_RESULTS',items:result.items,siteCounts:result.siteCounts||{}},location.origin)}
    window.addEventListener('message',async e=>{
      if(e.source!==window)return;
      if(e.data?.type==='SEDORI_START_SEARCH'){const filters=e.data.filters||{},queue=buildQueue(filters);await set(JOB,{filters,queue,index:0,items:[],siteCounts:{},returnUrl:location.href.split('#')[0],started:Date.now()});location.href=queue[0][1]}
      if(e.data?.type==='SEDORI_CHECK_LOGINS')window.postMessage({type:'SEDORI_LOGIN_STATUS',status:await get(LOGIN,{})},location.origin);
    });
    return;
  }
  const source=sourceByHost[location.hostname];if(!source)return;
  const login=await get(LOGIN,{});login[source]=loginState();if(source.startsWith('yahoo_')){login.yahoo_fleamarket=login[source];login.yahoo_auction=login[source]}await set(LOGIN,login);
  const job=await get(JOB,null);if(!job||Date.now()-job.started>180000)return;
  const expected=job.queue[job.index];if(!expected||expected[0]!==source)return;
  setTimeout(async()=>{const items=collect(source,job.filters);job.items.push(...items);job.siteCounts[source]=items.length;job.index++;if(job.index<job.queue.length){await set(JOB,job);location.href=job.queue[job.index][1]}else{await set(RESULT,{items:[...new Map(job.items.map(x=>[x.url,x])).values()],siteCounts:job.siteCounts});await del(JOB);location.href=job.returnUrl+'#search'}},4500);
})();
