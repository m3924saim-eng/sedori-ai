(()=>{'use strict';
const ENGINE_VERSION='14.0.0',UI_VERSION='14.4.0',HOTFIX='runtime-fix-v14.1.js?v=14400';
let settled=false,tries=0;
function status(){return document.getElementById('searchStatus')}
function header(text,version=UI_VERSION){const p=document.querySelector('header p');if(p)p.textContent=text;document.title='せどりAI v'+version}
function fail(message){if(settled)return true;settled=true;header('v'+UI_VERSION+' 起動エラー｜救済モード');const s=status();if(s)s.textContent=message;const b=document.getElementById('bulkSearchBtn');if(b){b.disabled=false;b.removeAttribute('disabled')}return true}
function ready(){settled=true;window.__SEDORI_UI_VERSION__=UI_VERSION;const sv=document.documentElement.dataset.sedoriUserscript||'';header('v'+UI_VERSION+' 復旧版'+(sv?'｜Userscripts v'+sv+' 接続済み':'｜Userscripts 未接続'));const x=status();if(x&&(/読み込み中|起動中|準備中|自己診断合格|自己診断エラー/.test(x.textContent)||!x.textContent.trim()))x.textContent='v'+UI_VERSION+' 起動完了。ボタン操作を確認してください。';const b=document.getElementById('bulkSearchBtn');if(b){b.disabled=false;b.removeAttribute('disabled');b.textContent='5サイトを一括検索して利益順に判定'}return true}
function loadHotfix(){if(window.__SEDORI_RUNTIME_FIX__?.version===UI_VERSION)return ready();const old=document.querySelector('script[data-sedori-hotfix="1"]');if(old)old.remove();const s=document.createElement('script');s.src=HOTFIX;s.async=false;s.dataset.sedoriHotfix='1';s.onload=()=>ready();s.onerror=()=>fail('復旧モジュールを読み込めませんでした。');document.head.appendChild(s);return true}
function check(){if(settled)return true;if(window.__SEDORI_RUNTIME_FIX__?.version===UI_VERSION)return ready();const test=window.__SEDORI_SELFTEST__;if(test)return loadHotfix();if(++tries>=30)return loadHotfix();return false}
const timer=setInterval(()=>{if(check())clearInterval(timer)},100);window.addEventListener('load',check,{once:true});
})();