// ==UserScript==
// @name         せどりAI 7サイト一括検索
// @namespace    https://m3924saim-eng.github.io/
// @version      1.0.0
// @description  iPad Safariで7サイトを順番に検索し、実商品をせどりAIへ返します。
// @match        https://m3924saim-eng.github.io/*
// @match        https://jp.mercari.com/*
// @match        https://fril.jp/*
// @match        https://paypayfleamarket.yahoo.co.jp/*
// @match        https://auctions.yahoo.co.jp/*
// @match        https://jmty.jp/*
// @match        https://www.mbok.jp/*
// @match        https://aucfan.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==
(function(){
  'use strict';
  const APP_HOST='m3924saim-eng.github.io',KEY='sedori-ai-search-v1';
  const priceOf=text=>{const m=String(text).replace(/[,，]/g,'').match(/[¥￥]\s*(\d{3,9})|(\d{3,9})\s*円/);return m?Number(m[1]||m[2]):0};
  const selectors={'jp.mercari.com':'a[href*="/item/"]','fril.jp':'a[href*="/item/"]','paypayfleamarket.yahoo.co.jp':'a[href*="/item/"]','auctions.yahoo.co.jp':'a[href*="/jp/auction/"]','jmty.jp':'a[href*="/sale-"]','www.mbok.jp':'a[href*="item"]','aucfan.com':'a[href*="/bid/"]'};
  const sites=q=>[
    ['mercari','https://jp.mercari.com/search?keyword='+q],['rakuma','https://fril.jp/s?query='+q],
    ['yahoo_fleamarket','https://paypayfleamarket.yahoo.co.jp/search/'+q],['yahoo_auction','https://auctions.yahoo.co.jp/search/search?p='+q],
    ['jmty','https://jmty.jp/all/sale?keyword='+q],['mobaoku','https://www.mbok.jp/_l?word='+q],['aucfan','https://aucfan.com/search1/q-'+q+'/s-mix/']
  ];
  function state(){try{const x=JSON.parse(window.name||'{}');return x.key===KEY?x:null}catch{return null}}
  function collect(source){const out=[],sel=selectors[location.hostname]||'a';document.querySelectorAll(sel).forEach(a=>{const root=a.closest('article,li,[class*="item"],[class*="card"]')||a,text=(root.innerText||a.innerText||'').trim(),price=priceOf(text),img=root.querySelector('img'),title=(img?.alt||a.getAttribute('aria-label')||text.split('\n')[0]||'').trim();if(price&&title&&a.href)out.push({source,title:title.slice(0,180),price,url:a.href,image:img?.currentSrc||img?.src||''})});return [...new Map(out.map(x=>[x.url,x])).values()].slice(0,20)}
  if(location.hostname===APP_HOST){
    window.__SEDORI_USERSCRIPT__=true;
    const current=state();
    if(current&&current.index>=current.queue.length){
      const items=current.items||[];window.name='';setTimeout(()=>window.postMessage({type:'SEDORI_SEARCH_RESULTS',items},location.origin),300);
    }
    window.addEventListener('message',e=>{if(e.source!==window||e.data?.type!=='SEDORI_START_SEARCH')return;const q=encodeURIComponent(String(e.data.query||'')),queue=sites(q);window.name=JSON.stringify({key:KEY,query:e.data.query,returnUrl:location.href.split('#')[0],queue,index:0,items:[]});location.href=queue[0][1]});
    window.postMessage({type:'SEDORI_EXTENSION_READY'},location.origin);
    return;
  }
  const current=state();if(!current)return;
  setTimeout(()=>{const [source]=current.queue[current.index]||[];current.items=(current.items||[]).concat(collect(source));current.index++;window.name=JSON.stringify(current);location.href=current.index<current.queue.length?current.queue[current.index][1]:current.returnUrl+'#search'},4000);
})(); 
