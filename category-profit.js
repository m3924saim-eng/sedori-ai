(function(){
  const SITE_NAMES={mercari:'メルカリ',rakuma:'楽天ラクマ',yahoo_fleamarket:'Yahoo!フリマ',yahoo_auction:'Yahoo!オークション',jmty:'ジモティー',mobaoku:'モバオク'};
  const SITE_IDS=['mercari','rakuma','yahoo_fleamarket','yahoo_auction','jmty'];
  const SELL_SITES=['mercari','rakuma','yahoo_fleamarket','yahoo_auction'];
  const FEE={mercari:10,rakuma:10,yahoo_fleamarket:5,yahoo_auction:10,jmty:5,mobaoku:0};
  const CAT_RULES=[
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
  const BRANDS=[
    ['cartier',/(cartier|カルティエ)/i],['tiffany',/(tiffany|ティファニー)/i],['bvlgari',/(bvlgari|bulgari|ブルガリ)/i],
    ['gucci',/(gucci|グッチ)/i],['louis_vuitton',/(louis\s*vuitton|ルイ\s*ヴィトン|ルイヴィトン|ヴィトン)/i],['chanel',/(chanel|シャネル)/i],
    ['hermes',/(herm[eè]s|エルメス)/i],['dior',/(christian\s*dior|dior|ディオール)/i],['prada',/(prada|プラダ)/i],['celine',/(celine|セリーヌ)/i],
    ['loewe',/(loewe|ロエベ)/i],['bottega',/(bottega|ボッテガ)/i],['coach',/(coach|コーチ)/i],['rolex',/(rolex|ロレックス)/i],
    ['omega',/(omega|オメガ)/i],['seiko',/(seiko|セイコー)/i],['casio',/(casio|カシオ)/i],['apple',/(apple|アップル|iphone|ipad|macbook)/i],
    ['sony',/(sony|ソニー)/i],['canon',/(canon|キヤノン|キャノン)/i],['nikon',/(nikon|ニコン)/i],['panasonic',/(panasonic|パナソニック)/i],
    ['nintendo',/(nintendo|任天堂|switch)/i],['makita',/(makita|マキタ)/i],['hikoki',/(hikoki|hitachi|ハイコーキ|日立工機)/i]
  ];
  const MATERIAL_RULES=[
    ['k24',/(?:K24|24K|純金)/i],['k22',/(?:K22|22K)/i],['k18',/(?:K18|18K|750\b)/i],['k14',/(?:K14|14K|585\b)/i],['k10',/(?:K10|10K)/i],
    ['pt950',/(?:PT\s*950|プラチナ950)/i],['pt900',/(?:PT\s*900|プラチナ900)/i],['platinum',/(?:プラチナ|\bPLATINUM\b|\bPT\b)/i],
    ['sv925',/(?:SV\s*925|SILVER\s*925|STERLING\s*SILVER|シルバー\s*925|銀\s*925|925\s*シルバー)/i],
    ['silver',/(?:シルバー製|銀製|\bSILVER\b)/i],['stainless',/(?:ステンレス|\bSTAINLESS\b|サージカル)/i],
    ['gold_plated',/(?:金メッキ|ゴールドメッキ|GP\b|GOLD\s*PLATED)/i],['silver_plated',/(?:銀メッキ|シルバーメッキ)/i],
    ['leather',/(?:レザー|本革|牛革|羊革|\bLEATHER\b)/i]
  ];
  const STONE_RULES=[['diamond',/(?:ダイヤ|ダイヤモンド|\bDIAMOND\b)/i],['pearl',/(?:パール|真珠|\bPEARL\b)/i],['ruby',/(?:ルビー|\bRUBY\b)/i],['sapphire',/(?:サファイア|\bSAPPHIRE\b)/i],['emerald',/(?:エメラルド|\bEMERALD\b)/i]];
  const STOP=new Set(['新品','未使用','美品','極美品','中古','メンズ','レディース','男女兼用','送料無料','即決','限定','希少','正規品','本物','公式','セット','サイズ','フリー','商品','送料込','即購入','匿名配送']);
  const yen=n=>'¥'+Math.round(Number(n)||0).toLocaleString('ja-JP');
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const sname=id=>SITE_NAMES[id]||id||'不明';
  const uniq=a=>[...new Set(a.filter(Boolean))];
  const median=a=>{const s=a.filter(Number.isFinite).sort((x,y)=>x-y);if(!s.length)return 0;const m=Math.floor(s.length/2);return s.length%2?s[m]:(s[m-1]+s[m])/2};
  const quantile=(a,q)=>{const s=a.filter(Number.isFinite).sort((x,y)=>x-y);if(!s.length)return 0;if(s.length===1)return s[0];const p=(s.length-1)*q,b=Math.floor(p),r=p-b;return s[b]+((s[b+1]??s[b])-s[b])*r};
  function categoryOf(text){const t=String(text||'');for(const [id,label,re] of CAT_RULES){if(re.test(t))return{id,label}}return{id:'other',label:'その他'}}
  function brandOf(text){const t=String(text||'');for(const [id,re] of BRANDS){if(re.test(t))return id}return''}
  function materialOf(text){const t=String(text||'');return uniq(MATERIAL_RULES.filter(([,re])=>re.test(t)).map(([id])=>id))}
  function stoneOf(text){const t=String(text||'');return uniq(STONE_RULES.filter(([,re])=>re.test(t)).map(([id])=>id))}
  function modelTokens(text){return uniq((String(text||'').toUpperCase().match(/(?=[A-Z0-9-]{4,})(?:[A-Z]+[- ]?\d{2,}[A-Z0-9-]*|\d{3,}[A-Z]+[A-Z0-9-]*)/g)||[]).map(x=>x.replace(/[ -]/g,''))).slice(0,8)}
  function specTokens(text,cat){
    const t=String(text||'').toUpperCase(),out=[];
    if(cat==='ring'){
      for(const m of t.matchAll(/(\d{1,2}(?:\.\d)?)\s*号/g))out.push('JP'+m[1]);
      for(const m of t.matchAll(/#\s*(\d{2})\b/g))out.push('EU'+m[1]);
      for(const m of t.matchAll(/(?:幅|WIDTH)\s*[:：]?\s*(\d+(?:\.\d)?)\s*MM/g))out.push('W'+m[1]+'MM');
    }
    if(cat==='shoes')for(const m of t.matchAll(/\b(2[0-9](?:\.5)?)\s*CM\b/g))out.push('CM'+m[1]);
    if(['phone','tablet','pc','game','camera'].includes(cat))for(const m of t.matchAll(/\b(\d{2,4})\s*(GB|TB)\b/g))out.push(m[1]+m[2]);
    if(['outer','top','bottom'].includes(cat))for(const m of t.matchAll(/(?:SIZE|サイズ)\s*[:：]?\s*(XS|S|M|L|XL|XXL|XXXL|\d{1,3})\b/g))out.push('SIZE'+m[1]);
    return uniq(out).slice(0,8);
  }
  function words(text){return uniq(String(text||'').toLowerCase().replace(/[\[\]【】()（）/・,:：;；＋+]/g,' ').split(/\s+/).map(x=>x.trim()).filter(x=>x.length>=2&&!STOP.has(x)&&!/^\d+$/.test(x))).slice(0,24)}
  const overlap=(a,b)=>a.some(x=>b.includes(x));
  function queryFit(item,query){
    const q=String(query||'').trim();if(!q)return true;
    const qc=categoryOf(q),ic=categoryOf(item.title);if(qc.id!=='other'&&ic.id!=='other'&&qc.id!==ic.id)return false;
    const qb=brandOf(q),ib=brandOf(item.title);if(qb&&ib!==qb)return false;
    const qm=modelTokens(q),im=modelTokens(item.title);if(qm.length&&!overlap(qm,im))return false;
    const qmat=materialOf(q),imat=materialOf(item.title);if(qmat.length&&!overlap(qmat,imat))return false;
    return true;
  }
  function similarity(a,b,query){
    const ca=categoryOf(a.title),cb=categoryOf(b.title),cq=categoryOf(query);if(ca.id!=='other'&&cb.id!=='other'&&ca.id!==cb.id)return-1;if(cq.id!=='other'&&cb.id!=='other'&&cq.id!==cb.id)return-1;
    const targetBrand=brandOf(a.title)||brandOf(query),peerBrand=brandOf(b.title);if(targetBrand&&peerBrand!==targetBrand)return-1;
    const ma=modelTokens(a.title+' '+query),mb=modelTokens(b.title);if(ma.length&&mb.length&&!overlap(ma,mb))return-1;
    const mata=materialOf(a.title+' '+query),matb=materialOf(b.title);if(mata.length&&matb.length&&!overlap(mata,matb))return-1;
    const sta=stoneOf(a.title+' '+query),stb=stoneOf(b.title);if(sta.length&&stb.length&&!overlap(sta,stb))return-1;
    let score=.48;
    if(targetBrand&&peerBrand===targetBrand)score+=.18;
    if(ma.length&&mb.length&&overlap(ma,mb))score+=.18;else if(ma.length&&!mb.length)score-=.08;
    if(mata.length&&matb.length&&overlap(mata,matb))score+=.10;else if(mata.length&&!matb.length)score-=.06;
    if(sta.length&&stb.length&&overlap(sta,stb))score+=.05;
    const cat=ca.id!=='other'?ca.id:cq.id,sa=specTokens(a.title,cat),sb=specTokens(b.title,cat);if(sa.length&&sb.length)score+=overlap(sa,sb)?.08:-.05;
    const aw=words(a.title+' '+query),bw=new Set(words(b.title));const hit=aw.filter(w=>bw.has(w)).length;if(aw.length)score+=Math.min(.18,hit/aw.length*.24);
    return Math.max(0,Math.min(1,score));
  }
  function robustPeers(peers){
    if(peers.length<4)return{items:peers,removed:0};
    const prices=peers.map(x=>+x.price).filter(x=>x>0),q1=quantile(prices,.25),q3=quantile(prices,.75),iqr=q3-q1,med=median(prices);
    let lo=Math.max(1,q1-1.5*iqr,med*.35),hi=Math.min(q3+1.5*iqr,med*2.8);if(!Number.isFinite(lo)||!Number.isFinite(hi)||lo>=hi){lo=med*.35;hi=med*2.8}
    const keep=peers.filter(x=>+x.price>=lo&&+x.price<=hi);return{items:keep.length>=2?keep:peers,removed:keep.length>=2?peers.length-keep.length:0};
  }
  function broadCategory(cat){if(cat==='wallet')return'wallet';if(['ring','necklace','bracelet','earring','watch'].includes(cat))return'accessory';if(['outer','top','bottom','shoes','bag'].includes(cat))return'apparel';if(['ring','necklace','bracelet','earring'].includes(cat))return'precious_metals';return'accessory'}
  function shippingFor(cat){if(['ring','necklace','bracelet','earring','wallet'].includes(cat))return 230;if(cat==='watch')return 450;if(['phone','tablet','camera','game','toy'].includes(cat))return 750;if(['outer','top','bottom'].includes(cat))return 750;if(['bag','shoes'].includes(cat))return 850;if(cat==='pc')return 1200;if(cat==='tool')return 1200;if(cat==='auto')return 1600;return 750}
  function confidenceFor(scored,robust){
    const sims=scored.filter(z=>robust.items.includes(z.x)).map(z=>z.sim),count=robust.items.length,high=sims.filter(s=>s>=.78).length,sources=new Set(robust.items.map(x=>x.source)).size,avg=sims.length?sims.reduce((a,b)=>a+b,0)/sims.length:0;
    let n=Math.min(35,count*5)+Math.min(25,high*6)+Math.max(0,Math.min(25,(avg-.55)/.35*25))+Math.min(15,sources*5);n=Math.round(Math.max(0,Math.min(100,n)));
    const label=n>=80?'高':n>=65?'中':n>=50?'低':'不足';return{score:n,label,highCount:high,sourceCount:sources,avg};
  }
  function chooseSellSite(peers,cat){
    const ship=shippingFor(cat),candidates=[];
    for(const site of SELL_SITES){const g=peers.filter(x=>x.source===site),prices=g.map(x=>+x.price).filter(x=>x>0);if(prices.length<2)continue;const estimate=Math.round(quantile(prices,.40)),fee=FEE[site]??10,net=Math.round(estimate*(1-fee/100)-ship);candidates.push({site,count:prices.length,estimate,fee,ship,net,low:Math.round(quantile(prices,.25)),median:Math.round(median(prices)),high:Math.round(quantile(prices,.75))})}
    if(candidates.length)return candidates.sort((a,b)=>b.net-a.net||b.count-a.count)[0];
    const prices=peers.map(x=>+x.price).filter(x=>x>0);if(!prices.length)return{site:'yahoo_fleamarket',count:0,estimate:0,fee:5,ship,net:0,low:0,median:0,high:0};
    const byCount=SELL_SITES.map(site=>({site,count:peers.filter(x=>x.source===site).length})).sort((a,b)=>b.count-a.count)[0];const site=byCount?.count?byCount.site:'yahoo_fleamarket',fee=FEE[site]??10,estimate=Math.round(quantile(prices,.35));return{site,count:byCount?.count||0,estimate,fee,ship,net:Math.round(estimate*(1-fee/100)-ship),low:Math.round(quantile(prices,.25)),median:Math.round(median(prices)),high:Math.round(quantile(prices,.75))};
  }
  function marketFor(item,all,query){
    const ownCat=categoryOf(item.title),queryCat=categoryOf(query),cat=ownCat.id!=='other'?ownCat:queryCat;
    let scored=all.filter(x=>x.url!==item.url&&x.price>0).map(x=>({x,sim:similarity(item,x,query)})).filter(z=>z.sim>=.60);
    if(cat.id!=='other')scored=scored.filter(z=>categoryOf(z.x.title).id===cat.id);scored.sort((a,b)=>b.sim-a.sim);
    const strong=scored.filter(z=>z.sim>=.75);if(strong.length>=3)scored=strong;
    const robust=robustPeers(scored.map(z=>z.x)),conf=confidenceFor(scored,robust),prices=robust.items.map(x=>+x.price).filter(x=>x>0),sell=chooseSellSite(robust.items,cat.id);
    const brand=brandOf(item.title)||brandOf(query),materials=materialOf(item.title+' '+query),models=modelTokens(item.title+' '+query),specs=specTokens(item.title,cat.id);
    return{category:cat,peers:robust.items,compCount:prices.length,highCount:conf.highCount,sourceCount:conf.sourceCount,median:Math.round(median(prices)),low:Math.round(quantile(prices,.25)),high:Math.round(quantile(prices,.75)),removed:robust.removed,confidence:conf.label,confidenceScore:conf.score,brand,materials,models,specs,sell};
  }
  function matchReason(m){const r=[m.category.label];if(m.brand)r.push('ブランド一致');if(m.materials.length)r.push('素材 '+m.materials.join('/'));if(m.models.length)r.push('型番 '+m.models.slice(0,2).join('/'));if(m.specs.length)r.push('仕様 '+m.specs.slice(0,2).join('/'));return r.join('・')}
  function improvedRenderCandidates(items,siteCounts={}){
    const query=document.getElementById('searchQ')?.value.trim()||'';
    const clean=(items||[]).filter(x=>x&&x.title&&+x.price>0&&x.url).map(x=>({...x,price:+x.price}));
    const fitted=clean.filter(x=>queryFit(x,query));
    const box=document.getElementById('candidateResults'),status=document.getElementById('searchStatus');if(!box||!status)return;box.innerHTML='';
    const analyzed=fitted.map(item=>{
      const m=marketFor(item,fitted,query),sell=m.sell.estimate,ship=m.sell.ship;
      let x=typeof analyze==='function'?analyze({source:item.source,sell_channel:m.sell.site,fee_rate:m.sell.fee,category:broadCategory(m.category.id),title:item.title,url:item.url,buy:item.price,sell,shipping:ship,other:0,auth:'medium',cond:'medium',comps:m.compCount,distance:item.distance||0,payment:'online',image:item.image}):{...item,buy:item.price,sell,shipping:ship,expected_profit_yen:0,margin_pct:0,score:0,verdict:'PASS',platform_fee_pct:m.sell.fee};
      if(m.compCount<3||m.confidenceScore<50){x={...x,verdict:'PASS',score:Math.min(x.score||0,45),reason:'高一致の比較データ不足'}}
      else if((m.compCount<5||m.confidenceScore<65)&&x.verdict==='BUY'){x={...x,verdict:'WATCH',score:Math.min(x.score,74.9),reason:'比較件数または一致度が不足'}}
      else if(m.confidenceScore<80&&x.verdict==='BUY'){x={...x,verdict:'WATCH',score:Math.min(x.score,74.9),reason:'BUYには信頼度80以上が必要'}}
      if(x.expected_profit_yen<1000&&x.verdict==='BUY')x={...x,verdict:'WATCH',score:Math.min(x.score,74.9),reason:'利益額が小さいため要確認'};
      return{...x,market:m};
    }).sort((a,b)=>{const rank={BUY:3,WATCH:2,PASS:1};return(rank[b.verdict]||0)-(rank[a.verdict]||0)||(b.expected_profit_yen||0)-(a.expected_profit_yen||0)||(b.score||0)-(a.score||0)}).slice(0,30);
    analyzed.forEach(x=>{
      const m=x.market,card=document.createElement('div');card.className='candidate';const img=document.createElement('img');img.src=x.image||'icons/icon-192.png';img.alt='';const body=document.createElement('div');
      const excludeText=m.removed?`｜外れ値 ${m.removed}件除外`:'';
      const peerText=m.compCount?`比較 ${m.compCount}件・高一致 ${m.highCount}件・${m.sourceCount}サイト｜信頼度 ${m.confidenceScore}/100（${m.confidence}）${excludeText}`:'同等品データ不足';
      const priceText=m.compCount?`同等品の販売中価格 ${yen(m.low)}〜${yen(m.high)}｜中央値 ${yen(m.median)}｜売価は40%点寄りで保守推定`:'算出不可';
      body.innerHTML=`<div class="small" style="font-weight:800;color:#2563eb;margin-bottom:3px">検索サイト：${esc(sname(x.source))}｜カテゴリ：${esc(m.category.label)}</div><h3>${esc(x.title)}</h3><div class="candidate-data"><b>仕入：</b>${esc(sname(x.source))} ${yen(x.buy)} → <b>販売候補：</b>${esc(sname(x.sell_channel))} ${x.sell>0?yen(x.sell):'算出不可'}<br><b>想定利益：</b>${x.sell>0?yen(x.expected_profit_yen):'算出不可'}｜利益率 ${x.sell>0?x.margin_pct+'%':'—'}｜手数料 ${x.platform_fee_pct}%・送料仮定 ${yen(x.shipping)}<br><b>同等品判定：</b>${esc(matchReason(m))}<br><b>比較精度：</b>${esc(peerText)}<br><b>相場根拠：</b>${esc(priceText)}<br><span style="font-size:11px">※販売中価格による推定です。実売・成約価格ではありません。BUYは高一致データと利益条件を満たした場合だけ表示します。</span></div><div class="verdict ${String(x.verdict).toLowerCase()}">${esc(x.verdict)} <span class="small">score ${x.score}</span></div>`;
      const actions=document.createElement('div');actions.className='candidate-actions';const open=document.createElement('a');open.className='btn';open.href=x.url;open.target='_blank';open.rel='noopener';open.textContent=`${sname(x.source)}で見る`;
      const judge=document.createElement('button');judge.className='btn primary';judge.textContent='詳細判定';judge.onclick=()=>{const set=(id,v)=>{const e=document.getElementById(id);if(e)e.value=v};set('source',x.source);set('sellChannel',x.sell_channel);set('feeRate',x.platform_fee_pct);set('title',x.title);set('url',x.url);set('buy',x.buy);set('sell',x.sell||0);set('shipping',x.shipping);set('comps',m.compCount);set('category',broadCategory(m.category.id));document.getElementById('source')?.dispatchEvent(new Event('change',{bubbles:true}));document.querySelector('nav button[data-tab="judgePanel"]')?.click();document.getElementById('judgeBtn')?.click()};
      actions.append(open,judge);body.appendChild(actions);card.append(img,body);box.appendChild(card);
    });
    box.classList.toggle('hide',!analyzed.length);
    const countText=SITE_IDS.map(id=>`${sname(id)} ${Number(siteCounts[id]||0)}件`).join('｜');
    if(clean.length&&analyzed.length){const rejected=clean.length-fitted.length;status.textContent=`${clean.length}件取得。${countText}。検索語と合わない候補 ${rejected}件を除外し、カテゴリ→ブランド→素材→型番→仕様の順で同等品を絞り、販売先別の保守価格で判定しています。`;}
    else if(clean.length)status.textContent=`${clean.length}件取得しましたが、検索語と同等品条件に合う候補がありませんでした。${countText}`;
    else status.textContent='実商品を取得できませんでした。各サイトのログイン状態と拡張機能の許可を確認してください。';
  }
  try{renderCandidates=improvedRenderCandidates}catch(e){window.renderCandidates=improvedRenderCandidates}
  window.__SEDORI_CATEGORY_PROFIT_V5__=true;
})();
