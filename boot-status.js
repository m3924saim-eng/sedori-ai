(()=>{'use strict';
const FALLBACK_VERSION='11.0.0';
let done=false,tries=0;
function status(){return document.getElementById('searchStatus')}
function header(text,version=FALLBACK_VERSION){const p=document.querySelector('header p');if(p)p.textContent=text;document.title='せどりAI v'+version}
function fail(message,version=FALLBACK_VERSION){done=true;header('v'+version+' 起動エラー｜検索停止',version);const s=status();if(s)s.textContent=message;const b=document.getElementById('bulkSearchBtn');if(b){b.disabled=true;b.textContent='判定エンジン自己診断エラー'}return true}
function check(){
  if(done)return true;
  const test=window.__SEDORI_SELFTEST__;
  if(test){
    const version=String(test.version||window.__SEDORI_APP_STABLE_VERSION__||FALLBACK_VERSION);
    if(test.ok===true){
      done=true;
      window.__SEDORI_UI_VERSION__=version;
      header('v'+version+' 実用版｜利益判定・カテゴリ相場・純利益・自己診断合格',version);
      const s=status();
      if(s&&(/読み込み中|起動中|準備中/.test(s.textContent)||!s.textContent.trim()))s.textContent='v'+version+'判定エンジン準備完了。複数比較から安全側参考売価と純利益を算定します。';
      const b=document.getElementById('bulkSearchBtn');if(b){b.disabled=false;if(/自己診断|起動できません/.test(b.textContent))b.textContent='5サイトを一括検索して利益順に判定'}
      return true;
    }
    return fail('判定エンジンの自己診断に失敗しました。再読み込みしても直らない場合は診断内容を確認してください。',version);
  }
  if(++tries>=150)return fail('判定エンジンの起動を確認できませんでした。ページを再読み込みしてください。');
  return false;
}
const timer=setInterval(()=>{if(check())clearInterval(timer)},100);
window.addEventListener('load',check,{once:true});
})();