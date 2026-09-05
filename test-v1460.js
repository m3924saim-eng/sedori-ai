'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const nodes=new Map();
function mk(id=''){return {id,value:'',textContent:'',innerHTML:'',style:{},disabled:false,checked:true,className:'',dataset:{},hidden:false,href:'',classList:{add(){},remove(){},toggle(){},contains(){return false}},addEventListener(){},appendChild(){},append(){},after(){},remove(){},querySelector(){return null},querySelectorAll(){return[]}}}
function el(id){if(!nodes.has(id))nodes.set(id,mk(id));return nodes.get(id)}
['bulkSearchBtn','summary','candidateResults','searchStatus','bridgeChip','searchQ','searchMin','searchMax','searchCondition','searchSort','searchOnSale','searchExcludeAds','settingsPanel','saveSettingsBtn','checkLoginBtn','loginResults','auctionEstimate','strictMarket','minProfit','minRoi','watchProfit','watchRoi','maxCandidates'].forEach(el);
el('searchQ').value='カルティエ ラブリング K18 11号';el('searchMax').value='45000';el('searchCondition').value='good';el('searchSort').value='newest';el('minProfit').value='3000';el('minRoi').value='30';el('watchProfit').value='1500';el('watchRoi').value='15';el('maxCandidates').value='50';
const document={readyState:'complete',title:'',documentElement:mk('html'),getElementById:id=>el(id),querySelector(sel){if(sel==='.brand h1 small')return el('brandver');return null},querySelectorAll(){return[]},addEventListener(){},createElement(){return mk()}};
document.documentElement.dataset.sedoriUserscript='4.5.1';document.documentElement.appendChild=()=>{};
const store=new Map();
const context={window:{},document,localStorage:{getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)},console,setTimeout,clearTimeout,setInterval:()=>0,clearInterval,MutationObserver:function(){this.observe=()=>{}},Date,Math,Number,String,Object,Array,Set,Map,JSON,RegExp,URL,Blob};context.window=context;context.window.document=document;context.globalThis=context;
vm.createContext(context);vm.runInContext(fs.readFileSync('./app.js','utf8'),context,{filename:'app.js'});
const E=context.__SEDORI_ENGINE__;assert(E,'engine exposed');assert.equal(E.version,'14.6.0');
assert(E.identityScore('iPhone 15 Pro 256GB','iPhone 15 Pro 256GB 本体')>70);
assert(E.identityScore('iPhone 15 Pro 256GB','iPhone 15 Pro Max 256GB')<70);
const m=E.marketFrom([10000,10500,11000,11500,50000],'exact',66);assert(m.safe>=9000&&m.safe<=12000);assert(m.count>=4);
const s={shippingMode:'auto',shippingCost:750,saleSite:'mercari'};assert.equal(E.shippingEstimate({title:'K18 リング'},s).cost,230);
const eco=E.economics({price:10000,title:'K18 リング'},{safe:20000},s);assert.equal(eco.fee,2000);assert.equal(eco.shipping,230);assert.equal(eco.profit,7770);
const q=E.generateQuestions({title:'K18 リング',rawText:''});assert(/刻印|重量|サイズ/.test(q));
const listing=E.generateListing({title:'ブランド 財布',condition:'good'},{expectedSell:15000});assert(listing.title.includes('財布'));assert(listing.description.includes('発送'));
assert.equal(E.broaderQuery('新品 メンズ カルティエ ラブリング K18 11号'),'カルティエ ラブリング k18');
console.log('v14.6.0 smoke tests passed');
