(()=>{'use strict';
if(window.__SEDORI_RUNTIME_FIX_ACTIVE__)return;
window.__SEDORI_RUNTIME_FIX_ACTIVE__='14.4.4';
const VERSION='14.4.4';
const REQUIRED_SCRIPT='4.5.0';
const $=id=>document.getElementById(id);
const filters=()=>({query:$('searchQ')?.value.trim()||'',min:+($('searchMin')?.value||0),max:+($('searchMax')?.value||0),condition:$('searchCondition')?.value||'all',sort:$('searchSort')?.value||'newest',onSale:$('searchOnSale')?.checked!==false,excludeAds:$('searchExcludeAds')?.checked!==false,maxPerSite:50});
const setText=(el,text)=>{if(el&&el.textContent!==text)el.textContent=text};
const tabKey=tab=>String(tab||'search').replace(/Panel$/,'');
function bridgeState(){
  const d=document.documentElement?.dataset||{};
  const version=String(d.sedoriUserscript||'');
  const bridge=String(d.sedoriBridge||'');
  const legacy=Boolean(window.__SEDORI_USERSCRIPT__);
  return {connected:Boolean(version)||bridge==='dom-gm-v45'||legacy,version,bridge,legacy};
}
function scriptVersion(){
  const s=bridgeState();
  if(s.version)return s.version;
  if(s.bridge==='dom-gm-v45')return REQUIRED_SCRIPT;
  if(s.legacy)return 'legacy';
  return '';
}
function command(payload){document.getElementById('sedoriBridgeCommand')?.remove();const n=document.createElement('div');n.id='sedoriBridgeCommand';n.hidden=true;n.textContent=JSON.stringify({...payload,at:Date.now(),runtimeVersion:VERSION});document.documentElement.appendChild(n)}
function noScript(where){const msg=`Userscripts連携が動いていません。利用スクリプト v${REQUIRED_SCRIPT} を開いて有効化し、SafariのUserscriptsを「すべてのWebサイトで許可」にしてください。`;if(where==='search'&&$('searchStatus'))setText($('searchStatus'),msg);if(where==='login'&&$('loginResults'))$('loginResults').innerHTML=`<div class="login-row"><span><b>Userscripts連携</b></span><span class="status-ng">未接続</span></div><div class="small" style="padding:8px 2px">${msg}</div>`}
function startSearch(e){e?.preventDefault();e?.stopImmediatePropagation();const f=filters();if(!f.query){if($('searchStatus'))setText($('searchStatus'),'商品名・型番を入力してください。');$('searchQ')?.focus();return}const state=bridgeState();if(!state.connected){noScript('search');return}$('candidateResults')?.classList.add('hide');$('summary')?.classList.add('hide');if($('searchStatus'))setText($('searchStatus'),`5サイト検索を開始します… Userscripts v${scriptVersion()} 接続済み`);command({type:'search',filters:f})}
function startLogin(e){e?.preventDefault();e?.stopImmediatePropagation();const state=bridgeState();if(!state.connected){noScript('login');return}const b=$('checkLoginBtn');if(b){b.disabled=true;setText(b,'5サイトを確認しています…')}if($('loginResults'))$('loginResults').innerHTML='<div class="login-row"><span><b>ログイン確認</b></span><span>開始中…</span></div>';command({type:'login'})}
function showTab(tab){tab=tabKey(tab);const ids=['search','judge','history','settings'];let found=false;for(const id of ids){const p=$(id+'Panel');if(p){p.classList.toggle('hide',id!==tab);if(id===tab)found=true}}document.querySelectorAll('nav button[data-tab]').forEach(b=>b.classList.toggle('active',tabKey(b.dataset.tab)===tab));if(found){try{history.replaceState(null,'','#'+tab)}catch{}}return found}
function installNav(){document.querySelectorAll('nav button[data-tab]').forEach(b=>{if(b.dataset.sedori144nav)return;b.dataset.sedori144nav='1';b.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();showTab(b.dataset.tab||'search')},true)})}
function install(){const b=$('bulkSearchBtn');if(b){b.disabled=false;b.removeAttribute('disabled');b.title='';if(!b.dataset.sedori144){b.dataset.sedori144='1';b.addEventListener('click',startSearch,true)}}const l=$('checkLoginBtn');if(l){l.disabled=false;l.removeAttribute('disabled');if(!l.dataset.sedori144){l.dataset.sedori144='1';l.addEventListener('click',startLogin,true)}}const q=$('searchQ');if(q&&!q.dataset.sedori144){q.dataset.sedori144='1';q.addEventListener('keydown',e=>{if(e.key==='Enter')startSearch(e)},true)}installNav();const a=document.querySelector('a[href^="sedori-ai.user.js"]');if(a){if(a.getAttribute?.('href')!=='sedori-ai.user.js')a.href='sedori-ai.user.js';setText(a,`v${REQUIRED_SCRIPT} を開く`)}const state=bridgeState(),sv=scriptVersion();const hp=document.querySelector('header p');setText(hp,`v${VERSION} 操作復旧版${state.connected?`｜Userscripts v${sv} 接続済み`:'｜Userscripts 未接続'}`);const title=`せどりAI v${VERSION}`;if(document.title!==title)document.title=title;window.__SEDORI_RUNTIME_FIX__={version:VERSION,installedAt:new Date().toISOString(),userscript:state.connected?(sv||null):null,bridge:state.bridge||null,legacy:state.legacy};window.__SEDORI_BRIDGE_DIAGNOSTIC__={runtimeVersion:VERSION,connected:state.connected,userscriptVersion:state.version||null,bridge:state.bridge||null,legacy:state.legacy,at:new Date().toISOString()}}
function consumeBridge(){const r=$('sedoriBridgeResult');if(r){try{const d=JSON.parse(r.textContent||'{}');window.postMessage({type:'SEDORI_SEARCH_RESULTS',items:d.items||[],siteCounts:d.siteCounts||{},errors:d.errors||{}},location.origin)}catch(e){console.error('[sedori bridge result]',e)}r.remove()}const l=$('sedoriBridgeLogin');if(l){try{const d=JSON.parse(l.textContent||'{}');window.postMessage({type:'SEDORI_LOGIN_STATUS',status:d.status||{},times:d.times||{}},location.origin);const b=$('checkLoginBtn');if(b){b.disabled=false;setText(b,'5サイトのログイン状態を確認')}}catch(e){console.error('[sedori bridge login]',e)}l.remove()}}
function boot(){install();consumeBridge();const hash=tabKey((location.hash||'#search').slice(1));if(['search','judge','history','settings'].includes(hash))showTab(hash)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
setInterval(()=>{install();consumeBridge()},500);
})();
