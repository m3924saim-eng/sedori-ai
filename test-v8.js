'use strict';
const A=require('./app.js');
let pass=0,fail=0;
function ok(name,cond,detail=''){if(cond){pass++;console.log('PASS',name)}else{fail++;console.error('FAIL',name,detail)}}
const item=(source,title,price,id)=>({source,title,price,url:`https://example.invalid/${id}`,rawText:title});
ok('version is v8',String(A.VERSION).startsWith('8.'),A.VERSION);
ok('Cartier detected',A.identity('カルティエ ラブリング K18 11号').brand==='cartier');
ok('K18 is material not model',!A.identity('Cartier リング K18 11号').models.includes('K18'),JSON.stringify(A.identity('Cartier リング K18 11号')));
ok('brand mismatch excluded',A.queryFit(item('mercari','Tiffany リング SV925',5000,'a'),'Cartier リング').ok===false);
ok('missing required brand is not accepted',A.queryFit(item('mercari','ラブリング K18 11号',5000,'b'),'Cartier ラブリング K18 11号').ok===false);
const a=item('mercari','Cartier ラブリング K18 11号',7000,'a1');
const b=item('rakuma','カルティエ ラブ リング K18 12号',12000,'b1');
const c=item('rakuma','Tiffany オープンハート ネックレス SV925',12000,'c1');
ok('same family similarity strong',['A','B'].includes(A.similarity(a,b,'Cartier ラブリング K18').grade),JSON.stringify(A.similarity(a,b,'Cartier ラブリング K18')));
ok('different category rejected',A.similarity(a,c,'Cartier ラブリング K18').grade==='X',JSON.stringify(A.similarity(a,c,'Cartier ラブリング K18')));
let scored=[9000,9500,10000,10500,50000].map((p,i)=>({x:item(i%2?'mercari':'rakuma','Cartier ラブリング K18 11号 '+i,p,'o'+i),sim:{grade:'A',score:.9}}));
const rb=A.robustRows(scored);ok('price outlier removed',rb.rows.every(z=>z.x.price<50000)&&rb.removed>=1,JSON.stringify(rb));
const mm=A.moneyMath({buy:5000,sell:12000,fee:5,ship:230},A.DEFAULTS),net=12000-600-230;
ok('max buy obeys profit',mm.maxBuy<=net-A.DEFAULTS.minProfit,JSON.stringify(mm));
ok('max buy obeys ROI',mm.maxBuy<=Math.floor(net/(1+A.DEFAULTS.minRoi/100)),JSON.stringify(mm));
const rows=[
 item('mercari','Cartier ラブリング K18 11号',6500,'1'),
 item('rakuma','Cartier ラブリング K18 11号',11800,'2'),
 item('yahoo_fleamarket','Cartier ラブリング K18 11号',12100,'3'),
 item('yahoo_auction','Cartier ラブリング K18 12号',11900,'4'),
 item('mercari','Cartier ラブリング K18 10号',12400,'5'),
 item('rakuma','Cartier ラブリング K18 11号',12200,'6'),
 item('yahoo_fleamarket','Cartier ラブリング K18 11号',12600,'7')
];
const market=A.buildMarket(rows[0],rows,'Cartier ラブリング K18 11号',A.DEFAULTS);
ok('market has enough comps',market.compCount>=4,JSON.stringify({comp:market.compCount,a:market.aCount,conf:market.confidenceScore,mode:market.mode}));
ok('conservative not above standard',market.conservative<=market.standard,JSON.stringify(market));
const opp=A.opportunity(rows[0],market,A.DEFAULTS);ok('grounded opportunity not blind HOLD',['BUY','WATCH','PASS'].includes(opp.verdict),JSON.stringify(opp));
const risky=item('mercari','Cartier ラブリング K18 11号 ジャンク',2500,'r1'),rm=A.buildMarket(risky,[risky,...rows.slice(1)],'Cartier ラブリング K18 11号',A.DEFAULTS),ro=A.opportunity(risky,rm,A.DEFAULTS);ok('junk never BUY',ro.verdict==='PASS',JSON.stringify(ro));
const cheap=item('mercari','Cartier ラブリング K18 11号',800,'q1'),cm=A.buildMarket(cheap,[cheap,...rows.slice(1)],'Cartier ラブリング K18 11号',A.DEFAULTS),co=A.opportunity(cheap,cm,A.DEFAULTS);ok('extreme cheap branded never BUY',co.verdict!=='BUY',JSON.stringify(co));
const mixed=[...rows,item('mercari','Tiffany ネックレス SV925',1000,'z')],an=A.analyzeItems(mixed,'Cartier ラブリング K18 11号',A.DEFAULTS);ok('mismatch filtered',an.rejected.length>=1,JSON.stringify({fitted:an.fitted.length,rejected:an.rejected.length}));
let fuzz=true;for(let n=0;n<500;n++){const buy=100+Math.floor(Math.random()*20000),sell=100+Math.floor(Math.random()*40000),fee=[5,10][Math.floor(Math.random()*2)],ship=[230,450,750,1000][Math.floor(Math.random()*4)],m=A.moneyMath({buy,sell,fee,ship},A.DEFAULTS);if(!Number.isFinite(m.profit)||!Number.isFinite(m.roi)||m.maxBuy<0){fuzz=false;break}}ok('500 money fuzz invariants',fuzz);
console.log(`RESULT ${pass} passed ${fail} failed`);if(fail)process.exit(1);
