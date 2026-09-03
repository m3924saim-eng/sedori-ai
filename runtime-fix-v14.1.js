(()=>{'use strict';
const VERSION='14.2.0';
const $=id=>document.getElementById(id);
function filters(){return{query:$('searchQ')?.value.trim()||'',min:+($('searchMin')?.value||0),max:+($('searchMax')?.value||0),condition:$('searchCondition')?.value||'all',sort:$('searchSort')?.value||'newest',onSale:$('searchOnSale')?.checked!==false,excludeAds:$('searchExcludeAds')?.checked!==false,maxPerSite:50}}
function start(e){
  if(e){e.preventDefault();e.stopImmediatePropagation()}
  const f=filters();
  if(!f.query){if($('searchStatus'))$('searchStatus').textContent='商品名・型番を入力してください。';$('searchQ')?.focus();return}
  $('candidateResults')?.classList.add('hide');$('summary')?.classList.add('hide');
  if($('searchStatus'))$('searchStatus').textContent='5サイトを検索中…検索語が広い場合も検索し、同一商品根拠が弱い結果は安全売価を確定せず保留にします。';
  window.postMessage({type:'SEDORI_START_SEARCH',filters:f,runtimeVersion:VERSION},location.origin);
}
function install(){
  const b=$('bulkSearchBtn');if(b&&!b.dataset.sedori142){b.dataset.sedori142='1';b.addEventListener('click',start,true)}
  const q=$('searchQ');if(q&&!q.dataset.sedori142){q.dataset.sedori142='1';q.addEventListener('keydown',e=>{if(e.key==='Enter')start(e)},true)}
  const a=document.querySelector('a[href^="sedori-ai.user.js"]');if(a){a.href='sedori-ai.user.js?v=430';a.textContent='v4.3.0 を開く'}
  const hp=document.querySelector('header p');if(hp)hp.textContent=`v${VERSION} 同一商品ゲート版｜検索・ログイン同期修正`;
  document.title=`せどりAI v${VERSION}`;
  window.__SEDORI_RUNTIME_FIX__={version:VERSION,installedAt:new Date().toISOString()};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
new MutationObserver(install).observe(document.documentElement,{childList:true,subtree:true});
})();