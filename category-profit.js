(function(){
  const SITE_NAMES={mercari:'メルカリ',rakuma:'楽天ラクマ',yahoo_fleamarket:'Yahoo!フリマ',yahoo_auction:'Yahoo!オークション',jmty:'ジモティー',mobaoku:'モバオク'};
  const SITE_IDS=['mercari','rakuma','yahoo_fleamarket','yahoo_auction','jmty'];
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
  const STOP=new Set(['新品','未使用','美品','極美品','中古','メンズ','レディース','男女兼用','送料無料','即決','限定','希少','正規品','本物','公式','セット','サイズ','フリー','商品']);
  const yen=n=>'¥'+Math.round(Number(n)||0).toLocaleString('ja-JP');
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const sname=id=>SITE_NAMES[id]||id||'不明';
  const median=a=>{const s=a.filter(Number.isFinite).sort((x,y)=>x-y);if(!s.length)return 0;const m=Math.floor(s.length/2);return s.length%2?s[m]:(s[m-1]+s[m])/2};
  const quantile=(a,q)=>{const s=a.filter(Number.isFinite).sort((x,y)=>x-y);if(!s.length)return 0;if(s.length===1)return s[0];const p=(s.length-1)*q,b=Math.floor(p),r=p-b;return s[b]+((s[b+1]??s[b])-s[b])*r};
  function categoryOf(text){const t=String(text||'');for(const [id,label,re] of CAT_RULES){if(re.test(t))return{id,label}}return{id:'other',label:'その他'}}
  function brandOf(text){const t=String(text||'');for(const [id,re] of BRANDS){if(re.test(t))return id}return''}
  function modelTokens(text){return [...new Set((String(text||'').toUpperCase().match(/(?=[A-Z0-9-]{4,})(?:[A-Z]+[- ]?\d{2,}[A-Z0-9-]*|\d{3,}[A-Z]+[A-Z0-9-]*)/g)||[]).map(x=>x.replace(/[ -]/g,'')))]}
  function words(text){return [...new Set(String(text||'').toLowerCase().replace(/[\[\]【】()（）/・,:：;；]/g,' ').split(/\s+/).map(x=>x.trim()).filter(x=>x.length>=2&&!STOP.has(x)&&!/^\d+$/.test(x)).slice(0,18))]}
  function similarity(a,b,query){
    const ca=categoryOf(a.title),cb=categoryOf(b.title);if(ca.id!=='other'&&cb.id!=='other'&&ca.id!==cb.id)return-1;
    const qa=categoryOf(query);if(qa.id!=='other'&&cb.id!=='other'&&qa.id!==cb.id)return-1;
    const ba=brandOf(a.title)||brandOf(query),bb=brandOf(b.title);if(ba&&bb&&ba!==bb)return-1;
    let score=.55;
    if(ba&&bb&&ba===bb)score+=.18;
    const ma=modelTokens(a.title),mb=modelTokens(b.title);if(ma.length&&mb.length){if(ma.some(x=>mb.includes(x)))score+=.20;else score-=.12}
    const aw=words(a.title+' '+query),bw=new Set(words(b.title));const hit=aw.filter(w=>bw.has(w)).length;if(aw.length)score+=Math.min(.17,hit/aw.length*.17);
    return Math.max(0,Math.min(1,score));
  }
  function robustPeers(peers){
    if(peers.length<4)return{items:peers,removed:0};
    const prices=peers.map(x=>+x.price).filter(x=>x>0),q1=quantile(prices,.25),q3=quantile(prices,.75),iqr=q3-q1,med=median(prices);
    let lo=Math.max(1,q1-1.5*iqr,med*.30),hi=Math.min(q3+1.5*iqr,med*3.2);
    if(!Number.isFinite(lo)||!Number.isFinite(hi)||lo>=hi){lo=med*.30;hi=med*3.2}
    const keep=peers.filter(x=>+x.price>=lo&&+x.price<=hi);return{items:keep.length>=2?keep:peers,removed:keep.length>=2?peers.length-keep.length:0};
  }
  function broadCategory(cat){if(cat==='wallet')return'wallet';if(['ring','necklace','bracelet','earring','watch'].includes(cat))return'accessory';if(['outer','top','bottom','shoes'].includes(cat))return'apparel';return'accessory'}
  function marketFor(item,all,query){
    const ownCat=categoryOf(item.title),queryCat=categoryOf(query),cat=ownCat.id!=='other'?ownCat:queryCat;let peers=all.filter(x=>x.url!==item.url&&x.price>0).map(x=>({x,sim:similarity(item,x,query)})).filter(z=>z.sim>=.55);
    if(cat.id!=='other')peers=peers.filter(z=>categoryOf(z.x.title).id===cat.id);
    peers.sort((a,b)=>b.sim-a.sim);
    const preferred=peers.filter(z=>z.sim>=.70);if(preferred.length>=3)peers=preferred;
    const robust=robustPeers(peers.map(z=>z.x));const prices=robust.items.map(x=>+x.price).filter(x=>x>0);
    const med=Math.round(median(prices)),low=Math.round(quantile(prices,.25)),high=Math.round(quantile(prices,.75));
    const confidence=prices.length>=8?'高':prices.length>=4?'中':prices.length>=2?'低':'不足';
    return{category:cat,peers:robust.items,compCount:prices.length,median:med,low,high,removed:robust.removed,confidence};
  }
  function improvedRenderCandidates(items,siteCounts={}){
    const clean=(items||[]).filter(x=>x&&x.title&&+x.price>0&&x.url).map(x=>({...x,price:+x.price}));
    const box=document.getElementById('candidateResults'),status=document.getElementById('searchStatus'),query=document.getElementById('searchQ')?.value.trim()||'';
    if(!box||!status)return;
    box.innerHTML='';
    const analyzed=clean.map(item=>{
      const m=marketFor(item,clean,query),sell=m.compCount?m.median:0;
      let x=typeof analyze==='function'?analyze({source:item.source,sell_channel:'yahoo_fleamarket',fee_rate:5,category:broadCategory(m.category.id),title:item.title,url:item.url,buy:item.price,sell,shipping:750,other:0,auth:'medium',cond:'medium',comps:m.compCount,distance:item.distance||0,payment:'online',image:item.image}):{...item,buy:item.price,sell,expected_profit_yen:0,margin_pct:0,score:0,verdict:'PASS',platform_fee_pct:5,shipping:750};
      if(m.compCount<2){x={...x,verdict:'PASS',score:Math.min(x.score||0,35),reason:'同カテゴリ比較不足'}}
      else if(m.compCount<4&&x.verdict==='BUY'){x={...x,verdict:'WATCH',score:Math.min(x.score,74.9),reason:'比較件数が少ないため要確認'}}
      return{...x,market:m};
    }).sort((a,b)=>(b.score||0)-(a.score||0)).slice(0,30);
    analyzed.forEach(x=>{
      const m=x.market,card=document.createElement('div');card.className='candidate';
      const img=document.createElement('img');img.src=x.image||'icons/icon-192.png';img.alt='';
      const body=document.createElement('div');
      const marketText=m.compCount?`${m.category.label} ${m.compCount}件｜中心価格帯 ${yen(m.low)}〜${yen(m.high)}｜中央値 ${yen(m.median)}｜信頼度 ${m.confidence}`:`${m.category.label}｜同カテゴリ比較データ不足`;
      const excludeText=m.removed?`（外れ値 ${m.removed}件除外）`:'';
      body.innerHTML=`<div class="small" style="font-weight:800;color:#2563eb;margin-bottom:3px">検索サイト：${esc(sname(x.source))}｜カテゴリ：${esc(m.category.label)}</div><h3>${esc(x.title)}</h3><div class="candidate-data"><b>仕入：</b>${esc(sname(x.source))} ${yen(x.buy)} → <b>販売想定：</b>${esc(sname(x.sell_channel))} ${x.sell>0?yen(x.sell):'算出不可'}<br><b>同カテゴリ利益：</b>${x.sell>0?yen(x.expected_profit_yen):'算出不可'}｜利益率 ${x.sell>0?x.margin_pct+'%':'—'}｜販売手数料 ${x.platform_fee_pct}%・送料仮定 ${yen(x.shipping)}<br><b>相場根拠：</b>${esc(marketText+excludeText)}<br><span style="font-size:11px">※販売中の取得価格から算出。実売・成約価格ではありません。</span></div><div class="verdict ${String(x.verdict).toLowerCase()}">${esc(x.verdict)} <span class="small">score ${x.score}</span></div>`;
      const actions=document.createElement('div');actions.className='candidate-actions';
      const open=document.createElement('a');open.className='btn';open.href=x.url;open.target='_blank';open.rel='noopener';open.textContent=`${sname(x.source)}で見る`;
      const judge=document.createElement('button');judge.className='btn primary';judge.textContent='詳細判定';judge.onclick=()=>{const set=(id,v)=>{const e=document.getElementById(id);if(e)e.value=v};set('source',x.source);set('title',x.title);set('url',x.url);set('buy',x.buy);set('sell',x.sell||0);set('comps',m.compCount);set('category',broadCategory(m.category.id));const src=document.getElementById('source');src?.dispatchEvent(new Event('change',{bubbles:true}));document.querySelector('nav button[data-tab="judgePanel"]')?.click();document.getElementById('judgeBtn')?.click()};
      actions.append(open,judge);body.appendChild(actions);card.append(img,body);box.appendChild(card);
    });
    box.classList.toggle('hide',!clean.length);
    if(clean.length){const countText=SITE_IDS.map(id=>`${sname(id)} ${Number(siteCounts[id]||0)}件`).join('｜');status.textContent=`${clean.length}件取得。${countText}。同カテゴリ・同ブランド/型番を優先し、外れ値を除いた販売中価格の中央値で一次判定しています。`;}
    else status.textContent='実商品を取得できませんでした。各サイトのログイン状態と拡張機能の許可を確認してください。';
  }
  try{renderCandidates=improvedRenderCandidates}catch(e){window.renderCandidates=improvedRenderCandidates}
  window.__SEDORI_CATEGORY_PROFIT_V4__=true;
})();
