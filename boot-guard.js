(()=>{'use strict';
const BUILD='14504';
const $=id=>document.getElementById(id);
function setStatus(text,error=false){const el=$('searchStatus');if(!el)return;el.textContent=text;el.className='status'+(error?' error':'')}
function fallbackTabs(){document.querySelectorAll('nav button').forEach(btn=>{btn.addEventListener('click',()=>{if(window.__SEDORI_ENGINE__)return;const name=btn.dataset.tab;['search','judge','history','settings'].forEach(x=>$(x+'Panel')?.classList.toggle('hide',x!==name));document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('active',b===btn));});});}
function fallbackButtons(){const search=$('bulkSearchBtn');search?.addEventListener('click',()=>{if(window.__SEDORI_ENGINE__)return;setStatus('起動エラーを検出しました。自動再読込を試しています…',true);retryApp();});const save=$('saveSettingsBtn');save?.addEventListener('click',()=>{if(!window.__SEDORI_ENGINE__)setStatus('起動エラーのため設定処理を開始できません。再読込してください。',true)});const login=$('checkLoginBtn');login?.addEventListener('click',()=>{if(!window.__SEDORI_ENGINE__)setStatus('起動エラーのためログイン確認を開始できません。再読込してください。',true)});}
let retried=false;
function retryApp(){if(window.__SEDORI_ENGINE__||retried)return;retried=true;const s=document.createElement('script');s.src=`./app.js?v=${BUILD}&retry=${Date.now()}`;s.onload=()=>setTimeout(checkBoot,100);s.onerror=()=>setStatus('app.js の再読込に失敗しました。Safariを再読み込みしてください。',true);document.head.appendChild(s)}
function checkBoot(){if(window.__SEDORI_ENGINE__){document.documentElement.dataset.sedoriBoot='ok';return true}document.documentElement.dataset.sedoriBoot='failed';setStatus('起動異常を検出しました。app.jsを再読込します…',true);retryApp();setTimeout(()=>{if(!window.__SEDORI_ENGINE__)setStatus('起動できませんでした。画面を再読み込みしてください。',true)},1800);return false}
async function clearOldRuntime(){try{if('serviceWorker' in navigator){const regs=await navigator.serviceWorker.getRegistrations();await Promise.all(regs.map(r=>r.unregister()))}}catch{}try{if('caches' in window){const keys=await caches.keys();await Promise.all(keys.filter(k=>k.startsWith('sedori-ai-v')).map(k=>caches.delete(k)))}}catch{}}
function init(){fallbackTabs();fallbackButtons();clearOldRuntime();setTimeout(checkBoot,1200)}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init,{once:true}):init();
})();
