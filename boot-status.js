(()=>{'use strict';
const UI_VERSION='14.4.1',HOTFIX='runtime-fix-v14.1.js?v=14401';
function status(){return document.getElementById('searchStatus')}
function header(text){const p=document.querySelector('header p');if(p)p.textContent=text;document.title='せどりAI v'+UI_VERSION}
function enable(){for(const id of['bulkSearchBtn','checkLoginBtn','judgeBtn','saveBtn','saveSettingsBtn','resetSettingsBtn','exportBtn','clearBtn','copyQuestionBtn']){const b=document.getElementById(id);if(b){b.disabled=false;b.removeAttribute('disabled')}}}
function ready(){window.__SEDORI_UI_VERSION__=UI_VERSION;enable();const sv=document.documentElement.dataset.sedoriUserscript||'';header('v'+UI_VERSION+' 強制起動版'+(sv?'｜Userscripts v'+sv+' 接続済み':'｜Userscripts 未接続'));const s=status();if(s)s.textContent='画面起動完了。操作できます。'}
function load(){enable();const old=document.querySelector('script[data-sedori-hotfix="1"]');if(old)old.remove();const x=document.createElement('script');x.src=HOTFIX;x.async=false;x.dataset.sedoriHotfix='1';x.onload=ready;x.onerror=()=>{enable();header('v'+UI_VERSION+' 救済モード');const s=status();if(s)s.textContent='復旧モジュール読込失敗。基本操作だけ有効化しました。'};document.head.appendChild(x)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load,{once:true});else load();
})();