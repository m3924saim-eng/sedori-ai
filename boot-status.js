(()=>{'use strict';
const UI_VERSION='8.2.6';
let done=false,tries=0;
function status(){return document.getElementById('searchStatus')}
function header(text){const p=document.querySelector('header p');if(p)p.textContent=text;document.title='せどりAI v8.2.6'}
function check(){
  if(done)return true;
  const test=window.__SEDORI_SELFTEST__;
  if(test){
    done=true;
    if(test.ok){
      window.__SEDORI_UI_VERSION__=UI_VERSION;
      header('v8.2.6 起動安定版｜v8.2.4判定ロジック・自己診断合格');
      const s=status();
      if(s&&(/読み込み中|準備中/.test(s.textContent)||!s.textContent.trim()))s.textContent='判定エンジン準備完了。商品名・ブランド・型番を入力して一括検索できます。';
    }else{
      header('v8.2.6 起動安定版｜自己診断エラー');
      const s=status();if(s)s.textContent='判定エンジンの自己診断に失敗しました。検索せずページを再読み込みしてください。';
    }
    return true;
  }
  if(++tries>=80){
    done=true;
    header('v8.2.6 起動安定版｜起動確認エラー');
    const s=status();if(s&&/読み込み中/.test(s.textContent))s.textContent='判定エンジンの起動を確認できませんでした。ページを再読み込みしてください。';
    return true;
  }
  return false;
}
const timer=setInterval(()=>{if(check())clearInterval(timer)},100);
window.addEventListener('load',check,{once:true});
})();