(()=>{'use strict';
const ENGINE_VERSION='14.0.0',UI_VERSION='14.1.0',HOTFIX='runtime-fix-v14.1.js?v=14100';
let settled=false,tries=0;
function status(){return document.getElementById('searchStatus')}
function header(text,version=UI_VERSION){const p=document.querySelector('header p');if(p)p.textContent=text;document.title='せどりAI v'+version}
function fail(message){if(settled)return true;settled=true;header('v'+UI_VERSION+' 起動エラー｜検索停止');const s=status();if(s)s.textContent=message;const b=document.getElementById('bulkSearchBtn');if(b){b.disabled=true;b.textContent='判定エンジン自己診断エラー'}return true}
function loadHotfix(test){
  settled=true;
  const s=document.createElement('script');s.src=HOTFIX;s.async=false;
  s.onload=()=>{window.__SEDORI_UI_VERSION__=UI_VERSION;header('v'+UI_VERSION+' 同一商品ゲート版｜自己診断合格｜検索・ログイン修正');const x=status();if(x&&(/読み込み中|起動中|準備中|自己診断合格/.test(x.textContent)||!x.textContent.trim()))x.textContent='v'+UI_VERSION+' 自己診断合格。5サイト検索できます。';const b=document.getElementById('bulkSearchBtn');if(b){b.disabled=false;b.textContent='5サイトを一括検索して利益順に判定'}};
  s.onerror=()=>{settled=false;fail('修正モジュールを読み込めませんでした。ページを再読み込みしてください。')};
  document.head.appendChild(s);return true;
}
function check(){if(settled)return true;const test=window.__SEDORI_SELFTEST__;if(test)return test.ok===true?loadHotfix(test):fail('判定エンジンの自己診断に失敗しました。診断結果を確認してください。');if(++tries>=80)return fail('判定エンジンの起動を確認できませんでした。最新版へ再読み込みしてください。');return false}
const timer=setInterval(()=>{if(check())clearInterval(timer)},100);window.addEventListener('load',check,{once:true});
})();
