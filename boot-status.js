(()=>{'use strict';
const UI_VERSION='8.2.8';
let done=false,tries=0;
function status(){return document.getElementById('searchStatus')}
function header(text){const p=document.querySelector('header p');if(p)p.textContent=text;document.title='せどりAI v8.2.8'}
function check(){
  if(done)return true;
  const test=window.__SEDORI_SELFTEST__;
  if(test){
    done=true;
    if(test.ok){
      window.__SEDORI_UI_VERSION__=UI_VERSION;
      header('v8.2.8 実用版｜厳密一致・カテゴリ相場・自己診断合格');
      const s=status();
      if(s&&(/読み込み中|起動中|準備中/.test(s.textContent)||!s.textContent.trim()))s.textContent='判定エンジン準備完了。商品名・ブランド・型番を入力して5サイト一括検索できます。';
    }else{
      header('v8.2.8 起動エラー｜検索停止');
      const s=status();if(s&&!/失敗|停止/.test(s.textContent))s.textContent='判定エンジンの自己診断に失敗しました。検索は停止しています。';
    }
    return true;
  }
  if(++tries>=120){
    done=true;
    header('v8.2.8 起動確認エラー｜検索停止');
    const s=status();if(s)s.textContent='判定エンジンの起動を確認できませんでした。ページを再読み込みしてください。';
    const b=document.getElementById('bulkSearchBtn');if(b){b.disabled=true;b.textContent='判定エンジンを起動できません';}
    return true;
  }
  return false;
}
const timer=setInterval(()=>{if(check())clearInterval(timer)},100);
window.addEventListener('load',check,{once:true});
})();