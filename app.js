(()=>{'use strict';
const VERSION='8.2.7';
const CORE='./app-v8-core.js?v=8270';
const LOGIN_URLS={
  mercari:'https://jp.mercari.com/',
  rakuma:'https://fril.jp/',
  yahoo_fleamarket:'https://paypayfleamarket.yahoo.co.jp/',
  yahoo_auction:'https://auctions.yahoo.co.jp/',
  jmty:'https://jmty.jp/users/sign_in'
};
const LOGIN_IDS=['mercari','rakuma','yahoo_fleamarket','yahoo_auction','jmty'];
const $=id=>document.getElementById(id);

function setHeader(text){
  const p=document.querySelector('header p');
  if(p)p.textContent=text;
  document.title='せどりAI v'+VERSION;
}
function setStatus(text){const e=$('searchStatus');if(e)e.textContent=text;}
function loadCore(){
  return new Promise((resolve,reject)=>{
    if(window.__SEDORI_V8__)return resolve(window.__SEDORI_V8__);
    const old=document.querySelector('script[data-sedori-core]');
    if(old){
      old.addEventListener('load',()=>resolve(window.__SEDORI_V8__),{once:true});
      old.addEventListener('error',()=>reject(new Error('core load failed')),{once:true});
      return;
    }
    const s=document.createElement('script');
    s.src=CORE;
    s.async=false;
    s.dataset.sedoriCore='1';
    s.onload=()=>window.__SEDORI_V8__?resolve(window.__SEDORI_V8__):reject(new Error('core api missing'));
    s.onerror=()=>reject(new Error('core load failed'));
    document.head.appendChild(s);
  });
}
function selfTest(api){
  const checks=[];
  try{
    checks.push(!!api&&typeof api==='object');
    checks.push(typeof api.install==='function');
    checks.push(typeof api.identity==='function');
    checks.push(typeof api.queryFit==='function');
    checks.push(typeof api.analyzeItems==='function');
    checks.push(typeof api.moneyMath==='function');
    const id=api.identity('iPhone 15 Pro 256GB');
    checks.push(id?.cat?.id==='phone');
    const m=api.moneyMath({buy:10000,sell:20000,fee:10,ship:750,other:0},api.DEFAULTS);
    checks.push(m?.profit===7250);
    checks.push(Math.round((m?.roi||0)*10)/10===72.5);
    const q=api.queryFit({title:'カルティエ ラブリング K18 11号'},'カルティエ ラブリング K18 11号');
    checks.push(q?.ok===true);
  }catch(e){
    console.error('せどりAI selftest exception',e);
    checks.push(false);
  }
  return{passed:checks.filter(Boolean).length,total:checks.length,ok:checks.every(Boolean),checks,version:VERSION,coreVersion:api?.VERSION||'unknown'};
}
function enhanceLoginRows(status={}){
  const rows=[...document.querySelectorAll('#loginResults .login-row')];
  rows.forEach((row,i)=>{
    const id=LOGIN_IDS[i];
    if(!id)return;
    row.querySelector('[data-login-link]')?.remove();
    const state=status[id]||'';
    if(state==='in')return;
    const a=document.createElement('a');
    a.className='btn';
    a.dataset.loginLink='1';
    a.href=LOGIN_URLS[id];
    a.target='_blank';
    a.rel='noopener';
    a.textContent=state==='out'?'ログインへ':'サイトを開く';
    a.style.marginLeft='8px';
    a.style.padding='6px 10px';
    a.style.fontSize='12px';
    a.style.whiteSpace='nowrap';
    row.appendChild(a);
  });
}
function hardFail(message,error){
  window.__SEDORI_SELFTEST__={passed:0,total:1,ok:false,checks:[false],version:VERSION,error:String(error?.message||error||message)};
  setHeader('v'+VERSION+' 起動エラー｜検索停止');
  setStatus(message);
  const b=$('bulkSearchBtn');
  if(b){b.disabled=true;b.textContent='判定エンジンを起動できません';}
}
async function boot(){
  setHeader('v'+VERSION+' 実用安定版｜判定エンジン起動中');
  setStatus('v'+VERSION+'判定エンジンを起動中です…');
  try{
    const api=await loadCore();
    const test=selfTest(api);
    window.__SEDORI_SELFTEST__=test;
    if(!test.ok){
      hardFail('判定エンジンの自己診断に失敗しました。検索は停止しています。',new Error('selftest failed'));
      return;
    }
    window.__SEDORI_APP_STABLE_VERSION__=VERSION;
    setHeader('v'+VERSION+' 実用安定版｜直接起動・自己診断合格');
    setStatus('判定エンジン準備完了。商品名・ブランド・型番を入力して5サイト一括検索できます。');
    enhanceLoginRows();
    window.addEventListener('message',e=>{
      if(e.source!==window)return;
      if(e.data?.type==='SEDORI_LOGIN_STATUS')requestAnimationFrame(()=>enhanceLoginRows(e.data.status||{}));
    });
  }catch(e){
    console.error('せどりAI v'+VERSION+' 起動失敗',e);
    hardFail('判定エンジン本体の読み込みに失敗しました。ページを再読み込みしてください。',e);
  }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();