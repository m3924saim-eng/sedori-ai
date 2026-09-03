(function(){
'use strict';

const VERSION='v8';
const S={mercari:'メルカリ',rakuma:'楽天ラクマ',yahoo_fleamarket:'Yahoo!フリマ',yahoo_auction:'Yahoo!オークション',jmty:'ジモティー',mobaoku:'モバオク'};
const IDS=['mercari','rakuma','yahoo_fleamarket','yahoo_auction','jmty'];
const SELL=['mercari','rakuma','yahoo_fleamarket','yahoo_auction'];
const FEE={mercari:10,rakuma:10,yahoo_fleamarket:5,yahoo_auction:10,jmty:5,mobaoku:0};
const SEARCH_STATE_KEY='sedori_search_state_v8';
const DISPLAY_LIMIT=40;

const CATS=[
  ['ring','リング・指輪',/(リング|指輪|\bring\b)/i],
  ['necklace','ネックレス・ペンダント',/(ネックレス|ペンダント|\bnecklace\b|\bpendant\b)/i],
  ['bracelet','ブレスレット・バングル',/(ブレスレット|バングル|\bbracelet\b|\bbangle\b)/i],
  ['earring','ピアス・イヤリング',/(ピアス|イヤリング|\bearrings?\b)/i],
  ['watch','腕時計',/(腕時計|時計|ウォッチ|\bwatch\b)/i],
  ['wallet','財布・ウォレット',/(財布|ウォレット|コインケース|カードケース|\bwallet\b)/i],
  ['bag','バッグ',/(バッグ|鞄|トート|ショルダー|ボストン|ハンドバッグ|リュック|バックパック|\bbag\b|\btote\b)/i],
  ['shoes','靴・スニーカー',/(スニーカー|シューズ|パンプス|ブーツ|サンダル|靴|\bshoes?\b|\bsneakers?\b)/i],
  ['outer','アウター',/(ジャケット|コート|ブルゾン|ダウン|パーカー|\bjacket\b|\bcoat\b)/i],
  ['top','トップス',/(Tシャツ|ティーシャツ|シャツ|ブラウス|ニット|セーター|カットソー|\bshirt\b|\btee\b)/i],
  ['bottom','ボトムス',/(パンツ|デニム|ジーンズ|スカート|スラックス|\bjeans?\b|\bpants?\b)/i],
  ['camera','カメラ・レンズ',/(カメラ|レンズ|一眼|ミラーレス|デジカメ|\bcamera\b|\blens\b)/i],
  ['phone','スマホ・携帯',/(iPhone|スマホ|携帯電話|Galaxy|Pixel|Xperia|AQUOS|\bphone\b)/i],
  ['tablet','タブレット',/(iPad|タブレット|\btablet\b)/i],
  ['pc','PC・パソコン',/(MacBook|ノートPC|パソコン|ゲーミングPC|\blaptop\b|\bcomputer\b)/i],
  ['game','ゲーム機・ゲーム',/(Switch|PlayStation|PS5|PS4|Xbox|ゲーム機|ゲームソフト|\bgame\b)/i],
  ['toy','ホビー・玩具',/(フィギュア|プラモデル|ミニカー|ぬいぐるみ|トレカ|カード|おもちゃ|ホビー)/i],
  ['tool','工具',/(工具|インパクト|ドリル|グラインダー|丸ノコ|マキタ|HiKOKI|ハイコーキ)/i],
  ['auto','車・バイク用品',/(タイヤ|ホイール|カーナビ|ドラレコ|マフラー|バイク|自動車|カー用品)/i]
];

const BR=[
  ['cartier',/(cartier|カルティエ)/i],['tiffany',/(tiffany|ティファニー)/i],['bvlgari',/(bvlgari|bulgari|ブルガリ)/i],
  ['gucci',/(gucci|グッチ)/i],['louis_vuitton',/(louis\s*vuitton|ルイ\s*ヴィトン|ルイヴィトン|ヴィトン)/i],
  ['chanel',/(chanel|シャネル)/i],['hermes',/(herm[eè]s|エルメス)/i],['dior',/(christian\s*dior|dior|ディオール)/i],
  ['prada',/(prada|プラダ)/i],['celine',/(celine|セリーヌ)/i],['loewe',/(loewe|ロエベ)/i],['bottega',/(bottega|ボッテガ)/i],
  ['coach',/(coach|コーチ)/i],['rolex',/(rolex|ロレックス)/i],['omega',/(omega|オメガ)/i],['seiko',/(seiko|セイコー)/i],
  ['casio',/(casio|カシオ)/i],['apple',/(apple|アップル|iphone|ipad|macbook)/i],['sony',/(sony|ソニー)/i],
  ['canon',/(canon|キヤノン|キャノン)/i],['nikon',/(nikon|ニコン)/i],['panasonic',/(panasonic|パナソニック)/i],
  ['nintendo',/(nintendo|任天堂|switch)/i],['makita',/(makita|マキタ)/i],['hikoki',/(hikoki|hitachi|ハイコーキ|日立工機)/i]
];

const MAT=[
  ['k24',/(K24|24K|純金)/i],['k22',/(K22|22K)/i],['k18',/(K18|18K|750\b)/i],['k14',/(K14|14K|585\b)/i],
  ['k10',/(K10|10K)/i],['pt950',/(PT\s*950|プラチナ950)/i],['pt900',/(PT\s*900|プラチナ900)/i],
  ['platinum',/(プラチナ|\bPLATINUM\b|\bPT\b)/i],['sv925',/(SV\s*925|SILVER\s*925|STERLING\s*SILVER|シルバー\s*925|銀\s*925|925\s*シルバー)/i],
  ['silver',/(シルバー(?!色)|銀製|\bSILVER\b)/i],['stainless',/(ステンレス|\bSTAINLESS\b|サージカル)/i],
  ['gold_plated',/(金メッキ|ゴールドメッキ|GP\b|GOLD\s*PLATED)/i],['silver_plated',/(銀メッキ|シルバーメッキ)/i],
  ['leather',/(レザー|本革|牛革|羊革|\bLEATHER\b)/i]
];
const PREC=new Set(['k24','k22','k18','k14','k10','pt950','pt900','platinum','sv925','silver']);
const ST=[['diamond',/(ダイヤ|ダイヤモンド|\bDIAMOND\b)/i],['pearl',/(パール|真珠|\bPEARL\b)/i],['ruby',/(ルビー|\bRUBY\b)/i],['sapphire',/(サファイア|\bSAPPHIRE\b)/i],['emerald',/(エメラルド|\bEMERALD\b)/i]];
const HARD=/(ジャンク|部品取り|動作未確認|故障|不動|要修理|本体なし|箱のみ|空箱|ケースのみ|付属品のみ|片耳|片方のみ|レプリカ|コピー品|偽物|模倣品)/i;
const SOFT=/(訳あり|現状品|難あり|傷や汚れあり|全体的に状態が悪い|補修|修理歴|欠品|社外|互換|タイプ|風|ノーブランド)/i;
const BUNDLE=/(まとめ売り|大量|セット|\d+点セット|\d+個セット)/i;
const STOP=new Set(['新品','未使用','美品','極美品','中古','メンズ','レディース','男女兼用','送料無料','送料込','即決','限定','希少','正規品','本物','公式','商品','即購入','匿名配送','大人気','人気','売れ筋','シンプル','ファッション','アクセサリー','リング','指輪','ネックレス','ペンダント','ブレスレット','バングル','ピアス','イヤリング','腕時計','時計','ウォッチ','財布','ウォレット','バッグ','鞄','靴','スニーカー','silver','stainless','ring','watch','wallet','bag']);

const y=n=>'¥'+Math.round(Number(n)||0).toLocaleString('ja-JP');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sn=id=>S[id]||id||'不明';
const u=a=>[...new Set((a||[]).filter(Boolean))];
const cl=(n,a,b)=>Math.max(a,Math.min(b,n));
const r100=n=>Math.max(0,Math.floor((Number(n)||0)/100)*100);
const ov=(a,b)=>a.some(x=>b.includes(x));

function med(a){const s=(a||[]).filter(Number.isFinite).sort((a,b)=>a-b);if(!s.length)return 0;const m=Math.floor(s.length/2);return s.length%2?s[m]:(s[m-1]+s[m])/2;}
function q(a,p){const s=(a||[]).filter(Number.isFinite).sort((a,b)=>a-b);if(!s.length)return 0;if(s.length===1)return s[0];const x=(s.length-1)*p,b=Math.floor(x),f=x-b;return s[b]+((s[b+1]??s[b])-s[b])*f;}
function wq(rows,p){const a=rows.filter(z=>z.price>0&&z.weight>0).sort((a,b)=>a.price-b.price);if(!a.length)return 0;const t=a.reduce((s,z)=>s+z.weight,0)*p;let n=0;for(const z of a){n+=z.weight;if(n>=t)return z.price;}return a[a.length-1].price;}
function cat(t){for(const [id,label,re] of CATS)if(re.test(String(t||'')))return{id,label};return{id:'other',label:'その他'};}
function brand(t){for(const [id,re] of BR)if(re.test(String(t||'')))return id;return'';}
function mats(t){return u(MAT.filter(([,re])=>re.test(String(t||''))).map(([id])=>id));}
function stones(t){return u(ST.filter(([,re])=>re.test(String(t||''))).map(([id])=>id));}
function models(t){const materialCode=/^(?:K(?:10|14|18|22|24)|PT(?:900|950)|SV925|SILVER925|750|585)$/;return u((String(t||'').toUpperCase().match(/(?=[A-Z0-9-]{4,})(?:[A-Z]{1,6}[- ]?\d{2,}[A-Z0-9-]*|\d{3,}[A-Z]{1,6}[A-Z0-9-]*)/g)||[]).map(x=>x.replace(/[ -]/g,'')).filter(x=>!materialCode.test(x))).slice(0,8);}
function words(t){return u(String(t||'').toLowerCase().normalize('NFKC').replace(/[\[\]【】()（）/・,:：;；＋+!！?？._-]/g,' ').split(/\s+/).map(x=>x.trim()).filter(x=>x.length>=2&&!STOP.has(x)&&!/^\d+(?:\.\d+)?$/.test(x))).slice(0,28);}
function num(t,re){const m=String(t||'').toUpperCase().match(re);return m?Number(m[1]):null;}
function specs(t,c){t=String(t||'').toUpperCase();const o={};if(c==='ring'){o.ringJp=num(t,/(\d{1,2}(?:\.\d)?)\s*号/);o.ringEu=num(t,/#\s*(\d{2})\b/);o.width=num(t,/(?:幅|WIDTH)\s*[:：]?\s*(\d+(?:\.\d)?)\s*MM/);o.weight=num(t,/(\d+(?:\.\d)?)\s*G\b/);}if(c==='shoes')o.shoe=num(t,/\b(2[0-9](?:\.5)?)\s*CM\b/);if(['phone','tablet','pc','game','camera'].includes(c)){const m=t.match(/\b(\d{2,4})\s*(GB|TB)\b/);if(m)o.storage=Number(m[1])*(m[2]==='TB'?1024:1);}if(['outer','top','bottom'].includes(c)){const m=t.match(/(?:SIZE|サイズ)\s*[:：]?\s*(XS|S|M|L|XL|XXL|XXXL|\d{1,3})\b/);if(m)o.size=m[1];}return o;}
function specText(s){const a=[];if(s.ringJp!=null)a.push('JP'+s.ringJp);if(s.ringEu!=null)a.push('EU'+s.ringEu);if(s.width!=null)a.push('幅'+s.width+'mm');if(s.weight!=null)a.push(s.weight+'g');if(s.shoe!=null)a.push(s.shoe+'cm');if(s.storage!=null)a.push(s.storage>=1024?s.storage/1024+'TB':s.storage+'GB');if(s.size)a.push('SIZE '+s.size);return a;}
function risk(t,query){const a=[];let l=0;if(HARD.test(t)){l=2;a.push('欠品・故障・模倣等の強い注意語');}else if(SOFT.test(t)){l=1;a.push('訳あり/状態/互換等の注意語');}if(BUNDLE.test(t)&&!BUNDLE.test(query||'')){l=Math.max(l,1);a.push('セット/まとめ売りの可能性');}return{level:l,reasons:a};}
function materialConflict(a,b){if(!a.length||!b.length||ov(a,b))return false;const ap=a.some(x=>PREC.has(x)),bp=b.some(x=>PREC.has(x));if(ap&&bp)return true;if(ap!==bp&&(a.includes('stainless')||b.includes('stainless')||a.includes('gold_plated')||b.includes('gold_plated')||a.includes('silver_plated')||b.includes('silver_plated')))return true;return false;}
function close(a,b,t,s){if(a==null||b==null)return null;const d=Math.abs(a-b);return d<=t?1:d<=s?.55:0;}
function smatch(a,b){const k=[['ringJp',1,2],['ringEu',2,4],['width',.8,1.8],['weight',1,3],['shoe',.5,1],['storage',0,0]],v=[];for(const [x,t,s] of k){const z=close(a[x],b[x],t,s);if(z!==null)v.push(z);}if(a.size&&b.size)v.push(a.size===b.size?1:0);if(!v.length)return{known:false,score:.5,conflict:false};const z=v.reduce((x,y)=>x+y,0)/v.length;return{known:true,score:z,conflict:z===0};}

function identify(item,query=''){
  const own=String(item?.title||'');
  const ownCat=cat(own),qCat=cat(query),finalCat=ownCat.id!=='other'?ownCat:qCat;
  const sp=specs(own,finalCat.id);
  const out={cat:finalCat,ownCat,borrowedCategory:ownCat.id==='other'&&qCat.id!=='other',brand:brand(own),models:models(own),mats:mats(own),stones:stones(own),specs:sp,terms:words(own),risk:risk(own,query)};
  out.strength=(ownCat.id!=='other'?2:0)+(out.brand?3:0)+(out.models.length?4:0)+(out.mats.length?1:0)+(out.stones.length?1:0)+(specText(sp).length?2:0)+(out.terms.length>=2?1:0);
  out.weak=!out.brand&&!out.models.length&&!specText(sp).length&&!out.mats.length&&out.terms.length<2;
  return out;
}

function queryCheck(item,query=''){
  if(!query)return{ok:true,missing:[],reasons:[],coverage:1,hardMissing:false};
  const qi={cat:cat(query),brand:brand(query),models:models(query),mats:mats(query),stones:stones(query),terms:words(query)},ii=identify(item,''),missing=[],reasons=[];
  if(qi.cat.id!=='other'&&ii.ownCat.id!=='other'&&qi.cat.id!==ii.ownCat.id)return{ok:false,missing,reasons:['カテゴリ不一致'],coverage:0,hardMissing:false};
  if(qi.brand){if(ii.brand&&ii.brand!==qi.brand)return{ok:false,missing,reasons:['ブランド不一致'],coverage:0,hardMissing:false};if(!ii.brand)missing.push('ブランド');}
  if(qi.models.length){if(ii.models.length&&!ov(qi.models,ii.models))return{ok:false,missing,reasons:['型番不一致'],coverage:0,hardMissing:false};if(!ii.models.length)missing.push('型番');}
  if(qi.mats.length){if(ii.mats.length&&materialConflict(qi.mats,ii.mats))return{ok:false,missing,reasons:['素材不一致'],coverage:0,hardMissing:false};if(!ii.mats.length)missing.push('素材');}
  if(qi.stones.length){if(ii.stones.length&&!ov(qi.stones,ii.stones))return{ok:false,missing,reasons:['石種不一致'],coverage:0,hardMissing:false};if(!ii.stones.length)missing.push('石');}
  const qsp=specs(query,qi.cat.id!=='other'?qi.cat.id:ii.cat.id),sp=smatch(qsp,ii.specs),qSpecKnown=specText(qsp).length>0;
  if(qSpecKnown&&sp.known&&sp.conflict)return{ok:false,missing,reasons:['仕様不一致'],coverage:0,hardMissing:false};
  if(qSpecKnown&&!sp.known)missing.push('仕様');
  const shared=qi.terms.filter(x=>ii.terms.includes(x)).length,coverage=qi.terms.length?shared/qi.terms.length:1;
  if(qi.terms.length>=2&&coverage===0&&!qi.brand&&!qi.models.length&&!qi.mats.length&&!qi.stones.length)return{ok:false,missing,reasons:['検索語の主要語不一致'],coverage:0,hardMissing:false};
  if(missing.length)reasons.push('商品タイトル未確認: '+missing.join('/'));
  return{ok:true,missing,reasons,coverage,hardMissing:missing.includes('ブランド')||missing.includes('型番')};
}

function sim(target,peer,query=''){
  const a=identify(target,query),b=identify(peer,'');
  if(a.cat.id!=='other'&&b.cat.id!=='other'&&a.cat.id!==b.cat.id)return{score:-1,grade:'X'};
  if(a.brand&&b.brand&&a.brand!==b.brand)return{score:-1,grade:'X'};
  if(a.models.length&&b.models.length&&!ov(a.models,b.models))return{score:-1,grade:'X'};
  if(materialConflict(a.mats,b.mats))return{score:-1,grade:'X'};
  if(a.stones.length&&b.stones.length&&!ov(a.stones,b.stones))return{score:-1,grade:'X'};
  const sp=smatch(a.specs,b.specs);if(sp.conflict&&(a.models.length||a.brand))return{score:-1,grade:'X'};
  let s=32;
  if(a.brand)s+=b.brand===a.brand?22:-9;else if(b.brand)s-=6;
  if(a.models.length)s+=b.models.length&&ov(a.models,b.models)?25:-12;else if(b.models.length)s-=4;
  if(a.mats.length)s+=b.mats.length&&ov(a.mats,b.mats)?11:-3;else if(b.mats.some(x=>PREC.has(x)))s-=4;
  if(a.stones.length)s+=b.stones.length&&ov(a.stones,b.stones)?6:-2;
  s+=sp.known?Math.round(sp.score*10):(specText(a.specs).length?-4:3);
  const h=a.terms.filter(x=>b.terms.includes(x)).length;s+=Math.min(18,Math.round(h/Math.max(2,a.terms.length)*28));
  if(a.borrowedCategory)s-=4;
  s-=b.risk.level===2?20:b.risk.level===1?8:0;
  s=cl(s,0,100);
  return{score:s,grade:s>=82?'A':s>=68?'B':s>=54?'C':'D'};
}

function normTitle(t){return String(t||'').toLowerCase().normalize('NFKC').replace(/[\s　]+/g,' ').replace(/[【】\[\]()（）「」『』,，.。:：;；!！?？/\\_-]/g,'').trim();}
function dedupe(rows){
  const seen=new Set(),out=[];
  for(const r of rows){const x=r.item,n=normTitle(x.title),p=Math.round((+x.price||0)/100)*100,strong=n.length>=10;const key=strong?[n,p].join('|'):[x.source,n,p].join('|');if(seen.has(key))continue;seen.add(key);out.push(r);}return out;
}
function robust(rows){
  const b=dedupe(rows);
  if(b.length<4){const p=b.map(r=>+r.item.price).filter(x=>x>0),m=med(p),spread=p.length>1&&m>0?(q(p,.75)-q(p,.25))/m:(p.length?0:1);return{rows:b,removed:rows.length-b.length,spread};}
  const p=b.map(r=>+r.item.price),m=med(p),q1=q(p,.25),q3=q(p,.75),iqr=q3-q1,lo=Math.max(1,m*.45,q1-1.5*iqr),hi=Math.min(m*2.2,q3+1.5*iqr),k=b.filter(r=>r.item.price>=lo&&r.item.price<=hi),f=k.length>=3?k:b,fp=f.map(r=>+r.item.price),fm=med(fp);
  return{rows:f,removed:rows.length-f.length,spread:fm>0?(q(fp,.75)-q(fp,.25))/fm:1};
}

function ship(c){if(['ring','necklace','bracelet','earring','wallet'].includes(c))return 230;if(c==='watch')return 450;if(['phone','tablet','camera','game','toy','outer','top','bottom'].includes(c))return 750;if(['bag','shoes'].includes(c))return 850;if(c==='pc'||c==='tool')return 1200;if(c==='auto')return 1600;return 750;}
function broad(c,m=[]){if(c==='wallet')return'wallet';if(['ring','necklace','bracelet','earring'].includes(c)&&m.some(x=>PREC.has(x)))return'precious_metals';if(['ring','necklace','bracelet','earring','watch'].includes(c))return'accessory';if(['outer','top','bottom','shoes','bag'].includes(c))return'apparel';return'accessory';}
function minP(b){return b<3000?1500:b<10000?2200:b<30000?3000:4000;}
function minR(b){return b<3000?45:b<10000?35:b<30000?28:22;}
function prof(b,s,f,sh){return Math.round(s-Math.round(s*f/100)-sh-b);}

function sellSite(rows,c){
  const sh=ship(c),all=rows.map(r=>({price:+r.item.price,weight:Math.max(.30,r.sim.score/100)})),g25=wq(all,.25),g50=wq(all,.50),g60=wq(all,.60),cand=[];
  for(const site of SELL){const sr=rows.filter(r=>r.item.source===site),wr=sr.map(r=>({price:+r.item.price,weight:Math.max(.30,r.sim.score/100)}));if(wr.length<2)continue;const est=r100(wq(wr,.25)*.90),fee=FEE[site]??10,net=Math.round(est*(1-fee/100)-sh),samplePenalty=wr.length<3?400:0;cand.push({site,count:wr.length,estimate:est,fee,ship:sh,net,rankNet:net-samplePenalty});}
  let best=cand.sort((a,b)=>b.rankNet-a.rankNet||b.count-a.count)[0];
  if(!best){const z=SELL.map(site=>({site,count:rows.filter(r=>r.item.source===site).length,fee:FEE[site]??10})).sort((a,b)=>b.count-a.count||a.fee-b.fee)[0]||{site:'yahoo_fleamarket',count:0,fee:5};best={...z,estimate:r100(g25*.88),ship:sh,net:0,rankNet:0};}
  return{...best,low:r100(g25*.84),median:r100(g50),high:r100(g60*.94),basis:'販売中出品価格'};
}

function confidence(rows,rob,ident,qc){
  const a=rob.rows.filter(r=>r.sim.grade==='A').length,b=rob.rows.filter(r=>r.sim.grade==='B').length,c=rob.rows.filter(r=>r.sim.grade==='C').length,n=rob.rows.length,sources=new Set(rob.rows.map(r=>r.item.source)).size,avg=n?rob.rows.reduce((s,r)=>s+r.sim.score,0)/n:0;
  let score=n*5+a*8+b*4+sources*5+(avg-54)*.6+ident.strength*1.5;
  if(rob.spread>.65)score-=22;else if(rob.spread>.45)score-=12;
  if(ident.weak)score=Math.min(score,50);if(ident.borrowedCategory)score=Math.min(score,58);if(a===0)score=Math.min(score,68);if(n<3)score=Math.min(score,n===2?48:n===1?34:0);if(sources===1&&n<5)score=Math.min(score,64);
  if(qc?.hardMissing)score=Math.min(score,52);else if(qc?.missing?.length)score=Math.min(score,66);
  score=Math.round(cl(score,0,100));
  return{score,label:score>=80?'高':score>=65?'中':score>=45?'低':'不足',a,b,c,count:n,sources,spread:rob.spread,avg:Math.round(avg),queryMissing:qc?.missing||[]};
}

function market(item,all,query=''){
  const ident=identify(item,query),qc=queryCheck(item,query),sc=[];
  for(const p of all){if(p.url===item.url||!(+p.price>0))continue;const z=sim(item,p,query);if(z.score>=54)sc.push({item:p,sim:z});}
  sc.sort((a,b)=>b.sim.score-a.sim.score);
  let sel=sc.filter(r=>r.sim.grade==='A'||r.sim.grade==='B');
  if(sel.length<3){const floor=(ident.brand||ident.models.length)?60:54;sel=sc.filter(r=>r.sim.score>=floor);}
  const rb=robust(sel),cf=confidence(sel,rb,ident,qc);
  return{id:ident,qc,rows:rb.rows,removed:rb.removed,conf:cf,sell:sellSite(rb.rows,ident.cat.id)};
}

function verdict(base,m){
  const b=+base.buy||0,s=+m.sell.estimate||0,f=m.sell.fee,sh=m.sell.ship,mp=minP(b),mr=minR(b),p=prof(b,s,f,sh),lp=prof(b,m.sell.low,f,sh),roi=b>0?p/b*100:0;
  const standardNet=Math.max(0,Math.round(s-s*f/100-sh)),lowNet=Math.max(0,Math.round(m.sell.low-m.sell.low*f/100-sh)),breakEven=standardNet;
  const profitCap=Math.max(0,lowNet-mp),roiCap=lowNet>0?lowNet/(1+mr/100):0,maxBuy=r100(Math.min(profitCap,roiCap));
  const rs=[];let v='HOLD';
  const missingIdentity=m.qc?.hardMissing,missingDetail=(m.qc?.missing||[]).length>0;
  if(m.id.risk.level===2){v='PASS';rs.push(...m.id.risk.reasons);}
  else if(!s||m.conf.count===0){v='HOLD';rs.push('比較データ不足');}
  else if(p<=0){v='PASS';rs.push('標準想定で赤字');}
  else if(m.id.weak||m.conf.score<45||m.conf.count<2){v='HOLD';rs.push('同等品の識別・比較根拠が不足');}
  else if(p>=mp&&roi>=mr&&lp>=Math.max(500,mp*.25)&&m.conf.score>=76&&m.conf.count>=4&&(m.conf.a>=2||m.conf.sources>=2)&&m.conf.spread<=.45&&b<=maxBuy&&!missingDetail&&!m.id.borrowedCategory){v='BUY';rs.push('利益・ROI・保守売価・比較信頼度が基準到達');}
  else if(p>=Math.max(1000,mp*.55)&&roi>=Math.max(20,mr-12)&&m.conf.score>=55&&lp>=0){v='WATCH';rs.push('利益余地あり。ただし安全余裕または比較根拠がBUY未達');}
  else{v='PASS';rs.push('利益/ROI/安全余裕が基準未達');}
  if(missingIdentity&&v!=='PASS'){v='HOLD';rs.push('検索条件のブランド/型番が商品タイトルで確認できない');}
  else if(missingDetail&&v==='BUY'){v='WATCH';rs.push('検索条件の素材/石/仕様に未確認項目あり');}
  if(m.id.risk.level===1&&v==='BUY'){v='WATCH';rs.push(...m.id.risk.reasons);}else if(m.id.risk.level===1)rs.push(...m.id.risk.reasons);
  const score=Math.round(cl(cl((p/Math.max(1,mp))*32+(roi/Math.max(1,mr))*18,0,52)+m.conf.score*.38-m.id.risk.level*12-(lp<0?12:0)-(missingIdentity?10:0),0,100));
  return{verdict:v,score,reason:u(rs).join(' / '),expected_profit_yen:p,margin_pct:Math.round(roi*10)/10,floorProfit:lp,breakEven,maxBuy,minProfit:mp,minRoi:mr,lowNet};
}

function identText(m){const a=[m.id.cat.label];if(m.id.brand)a.push('ブランド '+m.id.brand);if(m.id.models.length)a.push('型番 '+m.id.models.slice(0,2).join('/'));if(m.id.mats.length)a.push('素材 '+m.id.mats.join('/'));if(m.id.stones.length)a.push('石 '+m.id.stones.join('/'));const sp=specText(m.id.specs);if(sp.length)a.push('仕様 '+sp.slice(0,3).join('/'));if(m.id.weak)a.push('識別情報弱め');return a.join('・');}
function queryText(m){if(!m.qc?.missing?.length)return'主要条件一致';return'一致。ただし '+m.qc.missing.join('/')+' はタイトル未確認';}
function color(v){return v==='BUY'?'color:#067647':v==='WATCH'?'color:#b54708':v==='HOLD'?'color:#475467':'color:#b42318';}

function readSearchState(){try{return JSON.parse(localStorage.getItem(SEARCH_STATE_KEY)||'null')}catch{return null;}}
function currentSearchState(){const g=id=>document.getElementById(id);return{query:g('searchQ')?.value?.trim()||'',min:+(g('searchMin')?.value||0),max:+(g('searchMax')?.value||0),condition:g('searchCondition')?.value||'good',sort:g('searchSort')?.value||'newest',onSale:g('searchOnSale')?.checked!==false,excludeAds:g('searchExcludeAds')?.checked!==false};}
function saveSearchState(){try{localStorage.setItem(SEARCH_STATE_KEY,JSON.stringify(currentSearchState()));}catch{}}
function restoreSearchState(){const f=readSearchState();if(!f)return null;const set=(id,v)=>{const e=document.getElementById(id);if(e&&v!=null)e.value=v;};set('searchQ',f.query);set('searchMin',f.min);set('searchMax',f.max);set('searchCondition',f.condition);set('searchSort',f.sort);const a=document.getElementById('searchOnSale'),b=document.getElementById('searchExcludeAds');if(a&&typeof f.onSale==='boolean')a.checked=f.onSale;if(b&&typeof f.excludeAds==='boolean')b.checked=f.excludeAds;return f;}

function render(items,siteCounts={},filters={}){
  const state=filters&&filters.query!=null?filters:(readSearchState()||{}),query=String(state.query??document.getElementById('searchQ')?.value??'').trim();
  const clean=(items||[]).filter(x=>x&&x.title&&+x.price>0&&x.url).map(x=>({...x,price:+x.price}));
  const checked=clean.map(item=>({item,qc:queryCheck(item,query)})),fitted=checked.filter(x=>x.qc.ok).map(x=>x.item),rejected=checked.filter(x=>!x.qc.ok);
  const box=document.getElementById('candidateResults'),status=document.getElementById('searchStatus');if(!box||!status)return;box.innerHTML='';
  const rank={BUY:4,WATCH:3,HOLD:2,PASS:1};
  const all=fitted.map(item=>{const m=market(item,fitted,query),sell=m.sell.estimate,sh=m.sell.ship;let base=typeof analyze==='function'?analyze({source:item.source,sell_channel:m.sell.site,fee_rate:m.sell.fee,category:broad(m.id.cat.id,m.id.mats),title:item.title,url:item.url,buy:item.price,sell,shipping:sh,other:0,auth:'medium',cond:'medium',comps:m.conf.count,distance:item.distance||0,payment:'online',image:item.image}):{source:item.source,sell_channel:m.sell.site,platform_fee_pct:m.sell.fee,buy:item.price,sell,shipping:sh};const v=verdict(base,m);return{...base,...v,market:m,platform_fee_pct:m.sell.fee,sell_channel:m.sell.site,sell,shipping:sh,buy:item.price,image:item.image,title:item.title,url:item.url,source:item.source};}).sort((a,b)=>(rank[b.verdict]||0)-(rank[a.verdict]||0)||(b.expected_profit_yen||0)-(a.expected_profit_yen||0)||(b.market.conf.score||0)-(a.market.conf.score||0));
  const shown=all.slice(0,DISPLAY_LIMIT);
  for(const x of shown){const m=x.market,card=document.createElement('div');card.className='candidate';const img=document.createElement('img');img.src=x.image||'icons/icon-192.png';img.alt='';const body=document.createElement('div'),sellText=x.sell>0?y(x.sell):'算出不可',profitText=x.sell>0?y(x.expected_profit_yen):'算出不可',removed=m.removed?'｜重複/外れ値 '+m.removed+'件除外':'';body.innerHTML=`<div class="small" style="font-weight:800;color:#2563eb;margin-bottom:3px">検索：${esc(sn(x.source))}｜${esc(m.id.cat.label)}</div><h3>${esc(x.title)}</h3><div style="font-size:16px;font-weight:900;margin:6px 0">仕入 ${y(x.buy)} → 販売想定 ${sellText}　<span style="${color(x.verdict)}">利益 ${profitText}</span></div><div class="candidate-data"><b>判定：</b><span style="font-weight:900;${color(x.verdict)}">${esc(x.verdict)}</span>　score ${x.score}｜信頼度 ${m.conf.score}/100（${m.conf.label}）<br><b>検索条件：</b>${esc(queryText(m))}<br><b>販売候補：</b>${esc(sn(x.sell_channel))}｜手数料 ${x.platform_fee_pct}%｜送料仮定 ${y(x.shipping)}<br><b>利益耐性：</b>保守 ${y(x.floorProfit)}｜標準 ${y(x.expected_profit_yen)}｜ROI ${x.margin_pct}%<br><b>買付上限：</b>${y(x.maxBuy)}（保守売価で最低利益 ${y(x.minProfit)}＋最低ROI ${x.minRoi}%の両方を満たす上限）<br><b>価格レンジ：</b>保守 ${y(m.sell.low)}｜標準 ${sellText}｜中央値 ${y(m.sell.median)}｜上側目安 ${y(m.sell.high)}<br><b>同等品：</b>${esc(identText(m))}<br><b>比較内訳：</b>A ${m.conf.a} / B ${m.conf.b} / C ${m.conf.c}｜計 ${m.conf.count}件｜${m.conf.sources}サイト｜ばらつき ${(m.conf.spread*100).toFixed(0)}%${removed}<br><b>判定理由：</b>${esc(x.reason)}<br><span style="font-size:11px">※価格根拠は5サイトで取得した販売中の出品価格で、成約価格ではありません。検索語のブランド・型番を商品へ自動補完せず、商品タイトルで確認できない場合はBUYにしません。</span></div><div class="verdict ${String(x.verdict).toLowerCase()}" style="font-size:17px;${color(x.verdict)}">${esc(x.verdict)} <span class="small">score ${x.score}</span></div>`;const actions=document.createElement('div');actions.className='candidate-actions';const open=document.createElement('a');open.className='btn';open.href=x.url;open.target='_blank';open.rel='noopener';open.textContent=sn(x.source)+'で見る';const judge=document.createElement('button');judge.className='btn primary';judge.textContent='詳細判定';judge.onclick=()=>{const set=(id,v)=>{const e=document.getElementById(id);if(e)e.value=v;};set('source',x.source);set('sellChannel',x.sell_channel);set('feeRate',x.platform_fee_pct);set('title',x.title);set('url',x.url);set('buy',x.buy);set('sell',x.sell||0);set('shipping',x.shipping);set('comps',m.conf.count);set('category',broad(m.id.cat.id,m.id.mats));document.getElementById('source')?.dispatchEvent(new Event('change',{bubbles:true}));document.querySelector('nav button[data-tab="judgePanel"]')?.click();document.getElementById('judgeBtn')?.click();};actions.append(open,judge);body.appendChild(actions);card.append(img,body);box.appendChild(card);}
  box.classList.toggle('hide',!shown.length);
  const countText=IDS.map(id=>sn(id)+' '+Number(siteCounts[id]||0)+'件').join('｜'),counts={BUY:0,WATCH:0,HOLD:0,PASS:0};all.forEach(x=>counts[x.verdict]=(counts[x.verdict]||0)+1);
  const rejectBy={};rejected.forEach(x=>{const k=x.qc.reasons[0]||'条件不一致';rejectBy[k]=(rejectBy[k]||0)+1;});const rejectText=Object.entries(rejectBy).map(([k,v])=>`${k} ${v}`).join('、');
  if(clean.length&&all.length){status.textContent=`${clean.length}件取得。${countText}。条件一致 ${fitted.length}件 / 除外 ${rejected.length}件${rejectText?'（'+rejectText+'）':''}。判定 BUY ${counts.BUY} / WATCH ${counts.WATCH} / HOLD ${counts.HOLD} / PASS ${counts.PASS}。上位 ${shown.length}件表示${all.length>shown.length?'（残り '+(all.length-shown.length)+'件は表示上限外）':''}。`;}
  else if(clean.length)status.textContent=`${clean.length}件取得しましたが、検索条件に合う候補がありませんでした。${countText}${rejectText?'。除外理由：'+rejectText:''}`;
  else status.textContent='実商品を取得できませんでした。各サイトのログイン状態とUserscriptsのアクセス許可を確認してください。';
}

restoreSearchState();
const bulk=document.getElementById('bulkSearchBtn');if(bulk)bulk.addEventListener('click',saveSearchState,true);
const searchQ=document.getElementById('searchQ');if(searchQ)searchQ.addEventListener('keydown',e=>{if(e.key==='Enter')saveSearchState();},true);
try{renderCandidates=render;}catch(e){window.renderCandidates=render;}
const hp=document.querySelector('header p');if(hp)hp.textContent='v8｜実用判定：検索条件保持・誤補完防止・保守売価・ROI込み買付上限';
const note=document.querySelector('.v5-note');if(note)note.innerHTML='<b>v8 実用判定：</b>検索条件をページ移動後も保持し、検索語のブランド・型番を商品タイトルへ勝手に補完しません。同等品は実際のタイトル情報で比較し、クロスサイト重複と価格外れ値を除外。販売中価格を安全側に補正し、最低利益と最低ROIの両方から買付上限を算出します。成約価格を取得できない場合はその旨を明記します。';
window.__SEDORI_CATEGORY_PROFIT_V8__=true;
window.__SEDORI_V8_TEST__={cat,brand,mats,models,identify,queryCheck,sim,dedupe,robust,sellSite,confidence,market,verdict,minP,minR,prof,render,readSearchState,currentSearchState};
})();
