const priceOf=text=>{let m=String(text).replace(/[,，]/g,'').match(/[¥￥]\s*(\d{3,9})|(\d{3,9})\s*円/);return m?Number(m[1]||m[2]):0};
const selectors={
  'jp.mercari.com':'a[href*="/item/"]','fril.jp':'a[href*="/item/"]','paypayfleamarket.yahoo.co.jp':'a[href*="/item/"]',
  'auctions.yahoo.co.jp':'a[href*="/jp/auction/"]','jmty.jp':'a[href*="/sale-"]','www.mbok.jp':'a[href*="item"]','aucfan.com':'a[href*="/bid/"]'
};
function collect(){let sel=selectors[location.hostname]||'a',out=[];document.querySelectorAll(sel).forEach(a=>{let root=a.closest('article,li,[class*="item"],[class*="card"]')||a;let text=(root.innerText||a.innerText||'').trim(),price=priceOf(text);let img=root.querySelector('img');let title=(img?.alt||a.getAttribute('aria-label')||text.split('\n')[0]||'').trim();if(price&&title&&a.href)out.push({title:title.slice(0,180),price,url:a.href,image:img?.currentSrc||img?.src||''})});return [...new Map(out.map(x=>[x.url,x])).values()].slice(0,40)}
setTimeout(()=>browser.runtime.sendMessage({type:'PAGE_ITEMS',items:collect()}),3500);
