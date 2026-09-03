'use strict';
const fs=require('fs');
const vm=require('vm');
const assert=require('assert');
const core=require('./app-v8-core.js');

const document={
  readyState:'complete',
  getElementById(){return null},
  querySelector(){return null},
  addEventListener(){},
  createElement(){return {className:'',innerHTML:'',appendChild(){},classList:{remove(){},toggle(){}}}}
};
const windowObj={
  __SEDORI_V8__:core,
  addEventListener(){},
  removeEventListener(){},
  postMessage(){},
  document
};
windowObj.window=windowObj;
const context={
  window:windowObj,
  document,
  localStorage:{getItem(){return null},setItem(){},removeItem(){}},
  console,
  setTimeout,
  clearTimeout,
  setInterval,
  clearInterval,
  Number,
  Math,
  String,
  Object,
  Array,
  Set,
  Map,
  JSON,
  Date,
  RegExp
};
vm.createContext(context);
const logic=fs.readFileSync('./app-v8.3-logic.js','utf8');
vm.runInContext(logic,context,{filename:'app-v8.3-logic.js'});
const v9=windowObj.__SEDORI_V9__;
assert(v9,'v9 API not exposed');
assert.strictEqual(v9.version,'9.0.0');
assert.strictEqual(typeof v9.money,'function');
assert.strictEqual(typeof v9.analyze,'function');

const settings={
  minProfit:3000,minRoi:30,watchProfit:1500,watchRoi:15,maxCandidates:40,
  fees:{mercari:10,rakuma:10,yahoo_fleamarket:5,yahoo_auction:10,jmty:5},
  shipping:{tiny:230,small:450,medium:750,large:1000,xlarge:1600}
};

const m=v9.money({buy:10000,sell:20000,fee:10,ship:750,other:0},settings);
assert.deepStrictEqual({feeY:m.feeY,net:m.net,profit:m.profit,maxBuy:m.maxBuy},{feeY:2000,net:17250,profit:7250,maxBuy:13269});
assert.strictEqual(Math.round(m.roi*10)/10,72.5);
assert(m.maxBuy<=m.net-settings.minProfit,'maxBuy violates minimum profit');
assert(m.maxBuy<=Math.floor(m.net/(1+settings.minRoi/100)),'maxBuy violates minimum ROI');

const insufficient=v9.analyze([
  {source:'mercari',title:'メンズ リング シンプル 17号',price:3000,url:'https://example.test/1'}
],'メンズリング',settings);
assert.strictEqual(insufficient.analyzed.length,1);
assert.notStrictEqual(insufficient.analyzed[0].calc.verdict,'BUY','single-item evidence must never become BUY');

const imitation=v9.analyze([
  {source:'yahoo_auction',title:'K18刻印 イミテーション リング 17号 ゴールドカラー',price:3000,url:'https://example.test/2',rawText:'イミテーションアクセサリー'}
],'K18 リング',settings);
assert.strictEqual(imitation.analyzed.length,0,'imitation item must be excluded for K18 query');
assert.strictEqual(imitation.rej.length,1);
assert(/模倣|メッキ/.test(imitation.rej[0]._reject),'rejection reason must mention imitation/plating');

const c=core.moneyMath({buy:10000,sell:20000,fee:10,ship:750,other:0},core.DEFAULTS);
assert.strictEqual(c.maxBuy,13269,'core and v9 maxBuy must agree');
assert.strictEqual(core.identity('iPhone 15 Pro 256GB').cat.id,'phone');

console.log('v9 tests passed');
