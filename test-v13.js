'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const elements=new Map();
function el(id){
  if(!elements.has(id))elements.set(id,{
    id,value:'',textContent:'',innerHTML:'',style:{},disabled:false,checked:true,className:'',href:'',
    classList:{add(){},remove(){},toggle(){},contains(){return false}},
    addEventListener(){},appendChild(){},append(){},querySelector(){return null},focus(){}
  });
  return elements.get(id);
}
const document={
  readyState:'complete',
  getElementById:id=>el(id),
  querySelector(sel){if(sel==='header p')return el('headerp');return null},
  querySelectorAll(){return[]},
  addEventListener(){},
  createElement(tag){return{
    tagName:tag.toUpperCase(),className:'',innerHTML:'',textContent:'',style:{},href:'',download:'',dataset:{},
    classList:{add(){},remove(){},toggle(){},contains(){return false}},
    appendChild(){},append(){},querySelector(){return null},click(){}
  }}
};
const store=new Map();
const windowObj={
  document,
  location:{origin:'https://example.test',href:'https://example.test/'},
  addEventListener(){},postMessage(){},__SEDORI_USERSCRIPT__:true
};
windowObj.window=windowObj;
const context={
  window:windowObj,document,
  localStorage:{
    getItem:k=>store.has(k)?store.get(k):null,
    setItem:(k,v)=>store.set(k,String(v)),
    removeItem:k=>store.delete(k)
  },
  navigator:{clipboard:{writeText:async()=>{}}},
  location:windowObj.location,console,setTimeout,clearTimeout,setInterval,clearInterval,
  confirm:()=>true,Blob:function(){},URL:{createObjectURL(){return'blob:x'},revokeObjectURL(){}},
  Date,Math,Number,String,Object,Array,Set,Map,JSON,RegExp
};
vm.createContext(context);
vm.runInContext(fs.readFileSync('./app.js','utf8'),context,{filename:'app.js'});

const E=windowObj.__SEDORI_ENGINE__;
assert(E,'engine not exposed');
assert.strictEqual(E.version,'14.0.0');
assert.strictEqual(windowObj.__SEDORI_SELFTEST__.ok,true,JSON.stringify(windowObj.__SEDORI_SELFTEST__));
assert.strictEqual(E.money(1000,3000,10,230).profit,1470);

const q='カルティエ ラブリング K18 11号';
assert(E.candidateGate(q,'カルティエ ラブ リング K18 11号 正規品').ok);
assert(!E.candidateGate(q,'メンズリング シルバー925 フェザー ウイング 羽根 指輪 19号').ok);
assert(!E.candidateGate(q,'カルティエ トリニティ リング K18 11号').ok);
assert(!E.candidateGate(q,'カルティエ ラブリング K18 12号').ok);
assert(!E.candidateGate(q,'カルティエ ラブリング SV925 11号').ok);
assert(!E.candidateGate(q,'ラブリング K18 11号').ok);
assert(!E.candidateGate('Apple iPhone 15 Pro 256GB','Apple iPhone 15 Pro Max 256GB').ok);
assert(!E.candidateGate('マキタ TD173D 18V インパクト','マキタ TD172D 18V インパクト').ok);
assert(!E.candidateGate('Apple iPhone 15 Pro 256GB','Apple iPhone 15 Pro 256GB ケースのみ').ok);
assert(!E.candidateGate('Nintendo Switch 有機EL ホワイト','Nintendo Switch Lite グレー').ok);

const s=JSON.parse(JSON.stringify(E.DEFAULTS));
const target={source:'mercari',title:'SV925 リング 18号',price:1000,url:'t',_identityGate:E.candidateGate('SV925 リング 18号','SV925 リング 18号')};
const peers=[
  {source:'mercari',title:'SV925 リング 18号 シンプル',price:3200,url:'1'},
  {source:'yahoo_fleamarket',title:'シルバー925 指輪 18号',price:3400,url:'2'},
  {source:'rakuma',title:'SV925 メンズ リング 18号',price:3600,url:'3'},
  {source:'yahoo_auction',title:'SV925 リング 18号',price:3300,url:'4'}
].map(x=>({...x,_identityGate:E.candidateGate('SV925 リング 18号',x.title)}));
const market=E.marketFor(target,[target,...peers],'SV925 リング 18号',s);
assert.strictEqual(market.reliable,true,'same-item market should be reliable');
assert(market.standard>0);
const poisoned={source:'yahoo_fleamarket',title:'メンズリング シルバー925 フェザー ウイング 羽根 指輪 19号',price:15000,url:'bad'};
const badSim=E.similarity({title:'カルティエ ラブリング K18 11号'},poisoned,q);
assert.strictEqual(badSim.grade,'X','unrelated ring must not enter market comps');
console.log('v14 tests passed');