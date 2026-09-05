'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const nodes=new Map();let observerCb=null;
function mk(id=''){return {id,value:'',textContent:'',innerHTML:'',style:{},disabled:false,checked:true,className:'',dataset:{},hidden:false,href:'',listeners:{},classList:{add(){},remove(){},toggle(){},contains(){return false}},addEventListener(t,fn){this.listeners[t]=fn},appendChild(n){if(n.id)nodes.set(n.id,n)},append(){},after(n){if(n.id)nodes.set(n.id,n)},remove(){if(this.id)nodes.delete(this.id)},querySelector(){return null},querySelectorAll(){return[]}}}
function el(id){if(!nodes.has(id))nodes.set(id,mk(id));return nodes.get(id)}
['bulkSearchBtn','summary','candidateResults','searchStatus','bridgeChip','searchQ','searchMin','searchMax','searchCondition','searchSort','searchOnSale','searchExcludeAds','settingsPanel','saveSettingsBtn','checkLoginBtn','loginResults','auctionEstimate','strictMarket','minProfit','minRoi','watchProfit','watchRoi','maxCandidates','saleSite','shippingMode','shippingCost','autoEnrich'].forEach(el);
el('searchQ').value='カルティエ ラブリング K18 11号';el('searchMax').value='45000';el('searchCondition').value='good';el('searchSort').value='newest';el('minProfit').value='3000';el('minRoi').value='30';el('watchProfit').value='1500';el('watchRoi').value='15';el('maxCandidates').value='50';el('saleSite').value='mercari';el('shippingMode').value='auto';el('shippingCost').value='750';el('autoEnrich').checked=true;
const html=mk('html');html.dataset.sedoriUserscript='4.5.1';html.appendChild=n=>{if(n.id)nodes.set(n.id,n)};
const document={readyState:'complete',title:'',documentElement:html,getElementById:id=>nodes.get(id)||null,querySelector(sel){if(sel==='.brand h1 small')return el('brandver');return null},querySelectorAll(){return[]},addEventListener(){},createElement(){return mk()}};
const store=new Map();let timers=[];
const context={window:{},document,localStorage:{getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)},console,setTimeout:(fn)=>{timers.push(fn);return timers.length},clearTimeout:()=>{},setInterval:()=>0,clearInterval:()=>{},MutationObserver:function(cb){observerCb=cb;this.observe=()=>{}},Date,Math,Number,String,Object,Array,Set,Map,JSON,RegExp,URL,Blob};context.window=context;context.window.document=document;context.globalThis=context;
vm.createContext(context);vm.runInContext(fs.readFileSync('./app.js','utf8'),context,{filename:'app.js'});
const E=context.__SEDORI_ENGINE__;assert(E);assert.equal(E.version,'14.6.0');assert.equal(document.title,'せどりAI v14.6.0');assert(/接続済み/.test(el('bridgeChip').textContent));
assert(el('bulkSearchBtn').listeners.click,'search click binding missing');el('bulkSearchBtn').listeners.click();
const cmd=nodes.get('sedoriBridgeCommand');assert(cmd,'search command not created');const cp=JSON.parse(cmd.textContent);assert.equal(cp.type,'search');assert.equal(cp.filters.query,'カルティエ ラブリング K18 11号');assert(el('bulkSearchBtn').disabled===true);
assert(E.identityScore('iPhone 15 Pro 256GB','iPhone 15 Pro Max 256GB')<70);
const m=E.marketFrom([10000,10500,11000,11500,50000],'exact',66);assert(m.safe>=9000&&m.safe<=12000);
const s={shippingMode:'auto',shippingCost:750,saleSite:'mercari'};const eco=E.economics({price:10000,title:'K18 リング'},{safe:20000},s);assert.deepEqual([eco.fee,eco.shipping,eco.profit],[2000,230,7770]);
assert(/刻印|重量/.test(E.generateQuestions({title:'K18 リング',rawText:''})));assert(E.generateListing({title:'ブランド 財布',condition:'good'},{expectedSell:15000}).description.includes('発送'));
const result=mk('sedoriBridgeResult');result.textContent=JSON.stringify({searchSeq:cp.searchSeq,filters:cp.filters,items:[{source:'mercari',title:'カルティエ ラブリング K18 11号',price:10000,url:'u1',condition:'good'},{source:'rakuma',title:'カルティエ ラブリング K18 11号 箱付',price:19000,url:'u2',condition:'good'},{source:'yahoo_fleamarket',title:'Cartier ラブリング K18 11号',price:20000,url:'u3',condition:'good'}]});nodes.set(result.id,result);assert(observerCb,'observer not bound');observerCb();
assert(/カルティエ/.test(el('candidateResults').innerHTML),'results not rendered');assert(/検索完了/.test(el('searchStatus').textContent),'completion status missing');assert(el('bulkSearchBtn').disabled===false,'button not re-enabled');
console.log('v14.6.0 interaction smoke tests passed');
