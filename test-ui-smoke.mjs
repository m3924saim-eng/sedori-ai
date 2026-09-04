import fs from 'node:fs';
import {JSDOM} from 'jsdom';

const sourceHtml=fs.readFileSync('index.html','utf8');
const html=sourceHtml.replace(/<script src="(?:boot-guard|app)\.js[^>]*><\/script>/g,'');
const app=fs.readFileSync('app.js','utf8');
const guard=fs.readFileSync('boot-guard.js','utf8');
function ok(cond,msg){if(!cond) throw new Error(msg)}

// Normal app boot and real button bindings.
{
  const dom=new JSDOM(html,{url:'https://m3924saim-eng.github.io/sedori-ai/',runScripts:'outside-only',pretendToBeVisual:true});
  const {window}=dom;
  window.console=console;
  window.eval(app);
  await new Promise(r=>setTimeout(r,30));
  const d=window.document;
  ok(window.__SEDORI_ENGINE__,'engine did not boot');
  ok(d.getElementById('searchStatus').textContent.includes('商品名・型番'),'init status not set');
  const nav=[...d.querySelectorAll('nav button')];
  ok(nav.length===4,'nav count');
  nav.find(b=>b.dataset.tab==='settings').click();
  ok(!d.getElementById('settingsPanel').classList.contains('hide'),'settings tab did not open');
  nav.find(b=>b.dataset.tab==='search').click();
  ok(!d.getElementById('searchPanel').classList.contains('hide'),'search tab did not open');
  d.getElementById('searchQ').value='Nintendo Switch 有機EL';
  d.getElementById('bulkSearchBtn').click();
  ok(d.getElementById('searchStatus').textContent.includes('未接続'),'search disconnected path dead');
  d.documentElement.dataset.sedoriUserscript='4.5.0';
  d.getElementById('bulkSearchBtn').click();
  const cmd=d.getElementById('sedoriBridgeCommand');
  ok(cmd,'search command bridge not emitted');
  ok(JSON.parse(cmd.textContent).type==='search','wrong command type');
  window.close();
}

// Fail-safe behavior when app.js never boots.
{
  const dom=new JSDOM(html,{url:'https://m3924saim-eng.github.io/sedori-ai/',runScripts:'outside-only',pretendToBeVisual:true});
  const {window}=dom;
  window.console=console;
  Object.defineProperty(window.navigator,'serviceWorker',{value:{getRegistrations:async()=>[]},configurable:true});
  window.eval(guard);
  await new Promise(r=>setTimeout(r,40));
  const d=window.document;
  const settings=[...d.querySelectorAll('nav button')].find(b=>b.dataset.tab==='settings');
  settings.click();
  ok(!d.getElementById('settingsPanel').classList.contains('hide'),'boot guard nav fallback dead');
  d.getElementById('bulkSearchBtn').click();
  ok(d.getElementById('searchStatus').textContent.includes('起動エラー'),'boot guard search fallback dead');
  window.close();
}

ok(sourceHtml.includes('boot-guard.js?v=14504'),'boot guard is not loaded by index');
ok(!sourceHtml.includes('serviceWorker.register'),'legacy service worker registration is still active');
console.log('UI smoke OK: normal UI + bridge + dead-app fallback');
process.exit(0);
