const searches=q=>[
  ['mercari','https://jp.mercari.com/search?keyword='+q],['rakuma','https://fril.jp/s?query='+q],
  ['yahoo_fleamarket','https://paypayfleamarket.yahoo.co.jp/search/'+q],['yahoo_auction','https://auctions.yahoo.co.jp/search/search?p='+q],
  ['jmty','https://jmty.jp/all/sale?keyword='+q],['mobaoku','https://www.mbok.jp/_l?word='+q],['aucfan','https://aucfan.com/search1/q-'+q+'/s-mix/']
];
let jobs=new Map();
browser.runtime.onMessage.addListener(async(message,sender)=>{
  if(message?.type==='START_SEARCH'){
    const id=String(Date.now()),q=encodeURIComponent(message.query),job={owner:sender.tab.id,items:[],pending:7};jobs.set(id,job);
    for(const [source,url] of searches(q)){const tab=await browser.tabs.create({url,active:false});await browser.storage.local.set({['job_'+tab.id]:{id,source}})}
    setTimeout(()=>finish(id),12000);
  }
  if(message?.type==='PAGE_ITEMS'&&sender.tab){const key='job_'+sender.tab.id,stored=await browser.storage.local.get(key),meta=stored[key];if(!meta)return;let job=jobs.get(meta.id);if(job){job.items.push(...(message.items||[]).map(x=>({...x,source:meta.source})));job.pending--;if(job.pending<=0)finish(meta.id)}await browser.storage.local.remove(key);browser.tabs.remove(sender.tab.id).catch(()=>{})}
});
async function finish(id){let job=jobs.get(id);if(!job)return;jobs.delete(id);let unique=[...new Map(job.items.map(x=>[x.url,x])).values()];browser.tabs.sendMessage(job.owner,{type:'SEARCH_RESULTS',items:unique}).catch(()=>{})}
