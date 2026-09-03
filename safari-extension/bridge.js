window.addEventListener('message',event=>{
  if(event.source!==window||event.data?.type!=='SEDORI_START_SEARCH')return;
  browser.runtime.sendMessage({type:'START_SEARCH',query:String(event.data.query||'')});
});
browser.runtime.onMessage.addListener(message=>{
  if(message?.type==='SEARCH_RESULTS')window.postMessage({type:'SEDORI_SEARCH_RESULTS',items:message.items||[]},location.origin);
});
