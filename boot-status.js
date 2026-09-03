(()=>{'use strict';
const UI_VERSION='9.0.0';
let done=false,tries=0;
function status(){return document.getElementById('searchStatus')}
function header(text){const p=document.querySelector('header p');if(p)p.textContent=text;document.title='せどりAI v'+UI_VERSION}
function check(){
  if(done)return true;
  const test=window.__SEDORI_SELFTEST__;
  const v9=window.__SEDORI_V9__;
  if(test){
    done=true;
    const v9ok=!!v9&&v9.version===UI_VERSION&&typeof v9.money==='function'&&typeof v9.analyze==='function';
    let mathOk=false;
    try{
      if(v9ok){
        const s={minProfit:3000,minRoi:30};
        const m=v9.money({buy:10000,sell:20000,fee:10,ship:750,other:0},s);
        mathOk=m.profit===7250&&Math.round(m.roi*10)/10===72.5&&m.maxBuy===13269;
      }
    }catch(e){console.error('v9 boot selftest',e)}
    if(test.ok&&v9ok&&mathOk){
      window.__SEDORI_UI_VERSION__=UI_VERSION;
      header('v9.0.0 実用版｜同一性・相場耐性・純利益・自己診断合格');
      const s=status();
      if(s&&(/読み込み中|起動中|準備中/.test(s.textContent)||!s.textContent.trim()))s.textContent='v9.0.0判定エンジン準備完了。商品名・ブランド・型番を入力して5サイト一括検索できます。';
    }else{
      header('v9.0.0 起動エラー｜検索停止');
      const s=status();if(s)s.textContent='v9.0.0判定エンジンの自己診断に失敗しました。検索は停止しています。';
      const b=document.getElementById('bulkSearchBtn');if(b){b.disabled=true;b.textContent='判定エンジン自己診断エラー';}
    }
    return true;
  }
  if(++tries>=120){
    done=true;
    header('v9.0.0 起動確認エラー｜検索停止');
    const s=status();if(s)s.textContent='判定エンジンの起動を確認できませんでした。ページを再読み込みしてください。';
    const b=document.getElementById('bulkSearchBtn');if(b){b.disabled=true;b.textContent='判定エンジンを起動できません';}
    return true;
  }
  return false;
}
const timer=setInterval(()=>{if(check())clearInterval(timer)},100);
window.addEventListener('load',check,{once:true});
})();