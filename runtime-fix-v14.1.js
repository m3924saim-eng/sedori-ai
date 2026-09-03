(()=>{'use strict';
const VERSION='14.3.0';
const REQUIRED_SCRIPT='4.4.0';
const $=id=>document.getElementById(id);
const filters=()=>({query:$('searchQ')?.value.trim()||'',min:+($('searchMin')?.value||0),max:+($('searchMax')?.value||0),condition:$('searchCondition')?.value||'all',sort:$('searchSort')?.value||'newest',onSale:$('searchOnSale')?.checked!==false,excludeAds:$('searchExcludeAds')?.checked!==false,maxPerSite:50});
function scriptVersion(){return document.documentElement.dataset.sedoriUserscript||''}
function command(payload){
  document.getElementById('sedoriBridgeCommand')?.remove();
  const n=document.createElement('div');n.id='sedoriBridgeCommand';n.hidden=true;n.textContent=JSON.stringify({...payload,at:Date.now(),runtimeVersion:VERSION});
  document.documentElement.appendChild(n);
}
function noScript(where){
  const msg=`Userscripts連携が動いていません。利用スクリプト v${REQUIRED_SCRIPT} を開いて有効化し、SafariのUserscriptsを「すべてのWebサイトで許可」にしてください。`;
  if(where==='search'&&$('searchStatus'))$('searchStatus').textContent=msg;
  if(where==='login'&&$('loginResults'))$('loginResults').innerHTML=`<div class="login-row"><span><b>Userscripts連携</b></span><span class="status-ng">未接続</span></div><div class="small" style="padding:8px 2px">${msg}</div>`;
}
function startSearch(e){
  e?.preventDefault();e?.stopImmediatePropagation();
  const f=filters();if(!f.query){if($('searchStatus'))$('searchStatus').textContent='商品名・型番を入力してください。';$('searchQ')?.focus();return}
  if(!scriptVersion()){noScript('search');return}
  $('candidateResults')?.classList.add('hide');$('summary')?.classList.add('hide');
  if($('searchStatus'))$('searchStatus').textContent=`5サイト検索を開始します… Userscripts v${scriptVersion()} 接続済み`;
  command({type:'search',filters:f});
}
function startLogin(e){
  e?.preventDefault();e?.stopImmediatePropagation();
  if(!scriptVersion()){noScript('login');return}
  const b=$('checkLoginBtn');if(b){b.disabled=true;b.textContent='5サイトを確認しています…'}
  if($('loginResults'))$('loginResults').innerHTML='<div class="login-row"><span><b>ログイン確認</b></span><span>開始中…</span></div>';
  command({type:'login'});
}
function install(){
  const b=$('bulkSearchBtn');if(b&&!b.dataset.sedori143){b.dataset.sedori143='1';b.addEventListener('click',startSearch,true)}
  const l=$('checkLoginBtn');if(l&&!l.dataset.sedori143){l.dataset.sedori143='1';l.addEventListener('click',startLogin,true)}
  const q=$('searchQ');if(q&&!q.dataset.sedori143){q.dataset.sedori143='1';q.addEventListener('keydown',e=>{if(e.key==='Enter')startSearch(e)},true)}
  const a=document.querySelector('a[href^="sedori-ai.user.js"]');if(a){a.href='sedori-ai.user.js';a.textContent=`v${REQUIRED_SCRIPT} を開く`}
  const sv=scriptVersion();const hp=document.querySelector('header p');if(hp)hp.textContent=`v${VERSION} 安定化版｜検索・ログイン直結${sv?`｜Userscripts v${sv} 接続済み`:'｜Userscripts 未接続'}`;
  document.title=`せどりAI v${VERSION}`;
  window.__SEDORI_RUNTIME_FIX__={version:VERSION,installedAt:new Date().toISOString()};
}
function consumeBridge(){
  const r=$('sedoriBridgeResult');if(r){try{const d=JSON.parse(r.textContent||'{}');window.postMessage({type:'SEDORI_SEARCH_RESULTS',items:d.items||[],siteCounts:d.siteCounts||{},errors:d.errors||{}},location.origin)}catch(e){console.error('[sedori bridge result]',e)}r.remove()}
  const l=$('sedoriBridgeLogin');if(l){try{const d=JSON.parse(l.textContent||'{}');window.postMessage({type:'SEDORI_LOGIN_STATUS',status:d.status||{},times:d.times||{}},location.origin);const b=$('checkLoginBtn');if(b){b.disabled=false;b.textContent='5サイトのログイン状態を確認'}}catch(e){console.error('[sedori bridge login]',e)}l.remove()}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
new MutationObserver(()=>{install();consumeBridge()}).observe(document.documentElement,{childList:true,subtree:true});
setInterval(()=>{install();consumeBridge()},500);
})();