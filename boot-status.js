(()=>{'use strict';
const UI_VERSION='14.4.4',HOTFIX='runtime-fix-v14.1.js?v=14404',REQUIRED_SCRIPT='4.5.0';
function status(){return document.getElementById('searchStatus')}
function bridgeState(){const d=document.documentElement?.dataset||{},version=String(d.sedoriUserscript||''),bridge=String(d.sedoriBridge||''),legacy=Boolean(window.__SEDORI_USERSCRIPT__);return{connected:Boolean(version)||bridge==='dom-gm-v45'||legacy,version,bridge,legacy}}
function displayVersion(s){if(s.version)return s.version;if(s.bridge==='dom-gm-v45')return REQUIRED_SCRIPT;if(s.legacy)return'legacy';return''}
function header(text){const p=document.querySelector('header p');if(p&&p.textContent!==text)p.textContent=text;const title='せどりAI v'+UI_VERSION;if(document.title!==title)document.title=title}
function enable(){for(const id of['bulkSearchBtn','checkLoginBtn','judgeBtn','saveBtn','saveSettingsBtn','resetSettingsBtn','exportBtn','clearBtn','copyQuestionBtn']){const b=document.getElementById(id);if(b){b.disabled=false;b.removeAttribute('disabled')}}}
function ready(){window.__SEDORI_UI_VERSION__=UI_VERSION;enable();const s=bridgeState(),sv=displayVersion(s);header('v'+UI_VERSION+' 強制起動版'+(s.connected?'｜Userscripts v'+sv+' 接続済み':'｜Userscripts 未接続'));window.__SEDORI_BOOT_DIAGNOSTIC__={uiVersion:UI_VERSION,connected:s.connected,userscriptVersion:s.version||null,bridge:s.bridge||null,legacy:s.legacy,at:new Date().toISOString()};const el=status();if(el&&/起動中|判定エンジン|画面起動完了/.test(el.textContent||''))el.textContent='画面起動完了。操作できます。'}
function retryRuntime(){if(window.__SEDORI_RUNTIME_FIX_ACTIVE__)return;if(document.querySelector('script[data-sedori-hotfix="1"]'))return;const x=document.createElement('script');x.src=HOTFIX;x.async=false;x.dataset.sedoriHotfix='1';x.onload=ready;x.onerror=()=>{enable();header('v'+UI_VERSION+' 救済モード');const s=status();if(s)s.textContent='復旧モジュール読込失敗。基本操作だけ有効化しました。'};document.head.appendChild(x)}
function boot(){ready();setTimeout(retryRuntime,1200)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
