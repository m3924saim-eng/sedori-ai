(function(){
  'use strict';
  var bootStarted=Date.now();
  function el(id){return document.getElementById(id);}
  function setBanner(text,kind){
    var b=el('bootBanner');
    if(!b)return;
    b.textContent=text;
    b.className=kind||'';
  }
  function setStatus(text,isError){
    var s=el('searchStatus');
    if(!s)return;
    s.textContent=text;
    s.className='status'+(isError?' error':'');
  }
  window.__SEDORI_BOOT_LOADED__=true;
  setBanner('起動ファイル読込済み。判定エンジン確認中…','');
  setStatus('判定エンジンを起動しています…',false);

  try{
    if('serviceWorker' in navigator){
      navigator.serviceWorker.getRegistrations().then(function(regs){
        for(var i=0;i<regs.length;i++){try{regs[i].unregister();}catch(e){}}
      }).catch(function(){});
    }
    if(window.caches&&caches.keys){
      caches.keys().then(function(keys){
        for(var i=0;i<keys.length;i++){
          if(String(keys[i]).indexOf('sedori-ai-')===0){try{caches.delete(keys[i]);}catch(e){}}
        }
      }).catch(function(){});
    }
  }catch(e){}

  function bindTabs(){
    var nav=document.querySelectorAll('nav button[data-tab]');
    for(var i=0;i<nav.length;i++){
      nav[i].onclick=function(){
        var tab=this.getAttribute('data-tab');
        for(var j=0;j<nav.length;j++)nav[j].classList.toggle('active',nav[j]===this);
        var names=['search','judge','history','settings'];
        for(var k=0;k<names.length;k++){
          var p=el(names[k]+'Panel');
          if(p)p.classList.toggle('hide',names[k]!==tab);
        }
      };
    }
    var filters=document.querySelectorAll('.tabs button[data-filter]');
    for(var a=0;a<filters.length;a++){
      filters[a].onclick=function(){
        var f=this.getAttribute('data-filter');
        for(var b=0;b<filters.length;b++)filters[b].classList.toggle('primary',filters[b]===this);
        var rows=document.querySelectorAll('#candidateResults .row');
        for(var c=0;c<rows.length;c++)rows[c].style.display=(f==='all'||rows[c].getAttribute('data-v')===f)?'':'none';
      };
    }
  }
  bindTabs();

  function verify(){
    if(window.__SEDORI_ENGINE__){
      setBanner('✓ 起動正常・最新版を読み込みました','okboot');
      if(String(el('searchStatus')&&el('searchStatus').textContent||'').indexOf('起動')>=0){setStatus('準備完了。検索できます。',false);}
      setTimeout(function(){var b=el('bootBanner');if(b)b.style.display='none';},2500);
      return;
    }
    var elapsed=Date.now()-bootStarted;
    if(elapsed<5000){setTimeout(verify,250);return;}
    setBanner('判定エンジンを起動できませんでした。app.jsの読込を確認してください。','errboot');
    setStatus('起動エラー：app.jsが実行されていません。',true);
  }
  setTimeout(verify,250);

  window.addEventListener('error',function(ev){
    var src=ev&&ev.filename?String(ev.filename):'';
    if(src.indexOf('app.js')>=0){
      setBanner('app.js 実行エラー：'+(ev.message||'不明'),'errboot');
      setStatus('app.js 実行エラー：'+(ev.message||'不明'),true);
    }
  });
})();
