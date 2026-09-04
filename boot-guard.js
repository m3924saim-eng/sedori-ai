(()=>{'use strict';
const BUILD='14508';
const $=id=>document.getElementById(id);
function setStatus(text,error=false){const el=$('searchStatus');if(!el)return;el.textContent=text;el.className='status'+(error?' error':'')}
function engineReady(){return !!(window.__SEDORI_ENGINE__||document.documentElement.dataset.sedoriEngine==='ready')}
function fallbackTabs(){document.querySelectorAll('nav button').forEach(btn=>{btn.addEventListener('click',()=>{if(engineReady())return;const name=btn.dataset.tab;['search','judge','history','settings'].forEach(x=>$(x+'Panel')?.classList.toggle('hide',x!==name));document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('active',b===btn));});});}
function fallbackButtons(){const search=$('bulkSearchBtn');search?.addEventListener('click',()=>{if(engineReady())return;setStatus('起動エラーを検出しました。app.jsを再読込しています…',true);retryApp();});}
let retried=false;
function retryApp(){if(engineReady()||retried)return;retried=true;const s=document.createElement('script');s.src=`./app.js?v=${BUILD}&retry=${Date.now()}`;s.onload=()=>setTimeout(checkBoot,150);s.onerror=()=>setStatus('app.js の再読込に失敗しました。Safariを再読み込みしてください。',true);document.head.appendChild(s)}
function checkBoot(){if(engineReady()){document.documentElement.dataset.sedoriBoot='ok';return true}document.documentElement.dataset.sedoriBoot='failed';retryApp();setTimeout(()=>{if(!engineReady())setStatus('起動できませんでした。画面を再読み込みしてください。',true)},1800);return false}
async function clearOldRuntime(){try{if('serviceWorker' in navigator){const regs=await navigator.serviceWorker.getRegistrations();await Promise.all(regs.map(r=>r.unregister()))}}catch{}try{if('caches' in window){const keys=await caches.keys();await Promise.all(keys.filter(k=>k.startsWith('sedori-ai-v')).map(k=>caches.delete(k)))}}catch{}}
function init(){fallbackTabs();fallbackButtons();clearOldRuntime();setTimeout(checkBoot,1800)}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init,{once:true}):init();
})();
