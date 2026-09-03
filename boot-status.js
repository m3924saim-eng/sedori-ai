(()=>{'use strict';
const VERSION='13.0.0';
let settled=false,tries=0;
function status(){return document.getElementById('searchStatus')}
function header(text,version=VERSION){const p=document.querySelector('header p');if(p)p.textContent=text;document.title='せどりAI v'+version}
function fail(message,version=VERSION){if(settled)return true;settled=true;header('v'+version+' 起動エラー｜検索停止',version);const s=status();if(s)s.textContent=message;const b=document.getElementById('bulkSearchBtn');if(b){b.disabled=true;b.textContent='判定エンジン自己診断エラー'}return true}
function pass(test){if(settled)return true;settled=true;const version=String(test.version||window.__SEDORI_APP_STABLE_VERSION__||VERSION);window.__SEDORI_UI_VERSION__=version;header('v'+version+' 実用版｜安全売価・純利益・ROI・同一性・下振れ耐性｜自己診断合格',version);const s=status();if(s&&(/読み込み中|起動中|準備中|自己診断合格/.test(s.textContent)||!s.textContent.trim()))s.textContent='v'+version+' 自己診断合格。5サイト検索できます。';const b=document.getElementById('bulkSearchBtn');if(b){b.disabled=false;if(/自己診断|起動/.test(b.textContent))b.textContent='5サイトを一括検索して利益順に判定'}return true}
function check(){if(settled)return true;const test=window.__SEDORI_SELFTEST__;if(test)return test.ok===true?pass(test):fail('判定エンジンの自己診断に失敗しました。診断結果を確認してください。',String(test.version||VERSION));if(++tries>=80)return fail('判定エンジンの起動を確認できませんでした。最新版へ再読み込みしてください。');return false}
const timer=setInterval(()=>{if(check())clearInterval(timer)},100);window.addEventListener('load',check,{once:true});
})();