(()=>{'use strict';
const VERSION='8.2.6';
const CORE='./app-v8-core.js?v=8260';
const LOGIN_URLS={mercari:'https://jp.mercari.com/',rakuma:'https://fril.jp/',yahoo_fleamarket:'https://paypayfleamarket.yahoo.co.jp/',yahoo_auction:'https://auctions.yahoo.co.jp/',jmty:'https://jmty.jp/users/sign_in'};
const LOGIN_IDS=['mercari','rakuma','yahoo_fleamarket','yahoo_auction','jmty'];
let finished=false;

function statusEl(){return document.getElementById('searchStatus')}
function setStatus(text){const el=statusEl();if(el)el.textContent=text}
function setHeader(){const hp=document.querySelector('header p');if(hp)hp.textContent='v8.2.6 実用復旧版｜判定エンジン直読込・起動監視・日本語表示';document.title='せどりAI v8.2.6'}
function enhanceLoginRows(status={}){
  const rows=[...document.querySelectorAll('#loginResults .login-row')];
  rows.forEach((row,i)=>{
    const id=LOGIN_IDS[i];if(!id)return;
    row.querySelector('[data-login-link]')?.remove();
    if(status[id]==='in')return;
    const a=document.createElement('a');a.className='btn';a.dataset.loginLink='1';a.href=LOGIN_URLS[id];a.target='_blank';a.rel='noopener';a.textContent=status[id]==='out'?'ログインへ':'サイトを開く';a.style.marginLeft='8px';a.style.padding='6px 10px';a.style.fontSize='12px';a.style.whiteSpace='nowrap';row.appendChild(a);
  });
}
function ready(){
  if(finished)return;finished=true;
  window.__SEDORI_APP_VERSION__=VERSION;
  setHeader();
  const st=statusEl();
  if(st&&(/読み込み中|読み込みに失敗|自己テスト/.test(st.textContent)||!st.textContent.trim()))setStatus('v8.2.6 判定エンジン準備完了。商品名・ブランド・型番を入力して一括検索できます。');
  setTimeout(()=>{
    const e=statusEl();
    if(!e)return;
    if(!window.__SEDORI_USERSCRIPT__&&/準備完了/.test(e.textContent))e.textContent='v8.2.6 判定エンジン準備完了。検索実行時に利用スクリプトの接続を確認します。';
  },1200);
}
function fail(reason){
  finished=true;setHeader();
  setStatus('v8.2.6 判定エンジンを起動できませんでした。ページを再読み込みしてください。'+(reason?'（'+reason+'）':''));
}
function loadCore(){
  try{
    if(window.__SEDORI_V8__&&typeof window.__SEDORI_V8__.install==='function'){ready();return}
    const s=document.createElement('script');
    s.src=CORE;s.async=false;s.dataset.sedoriCore='826';
    s.onload=()=>{window.__SEDORI_V8__&&typeof window.__SEDORI_V8__.install==='function'?ready():fail('コア未検出')};
    s.onerror=()=>fail('コア取得失敗');
    document.head.appendChild(s);
    setTimeout(()=>{if(!finished&&!window.__SEDORI_V8__)fail('読込タイムアウト')},7000);
  }catch(e){console.error(e);fail('初期化例外')}
}

window.addEventListener('message',e=>{
  if(e.source!==window||e.data?.type!=='SEDORI_LOGIN_STATUS')return;
  queueMicrotask(()=>enhanceLoginRows(e.data.status||{}));
});
window.addEventListener('error',e=>{
  if(!finished&&String(e?.filename||'').includes('app-v8-core'))fail('JavaScriptエラー');
});
setHeader();
loadCore();
})();