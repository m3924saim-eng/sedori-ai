import fs from 'node:fs';
import {JSDOM} from 'jsdom';

const html=fs.readFileSync('index.html','utf8').replace(/<script src="app\.js[^>]*><\/script>/,'');
const app=fs.readFileSync('app.js','utf8');
const dom=new JSDOM(html,{url:'https://m3924saim-eng.github.io/sedori-ai/',runScripts:'outside-only',pretendToBeVisual:true});
const {window}=dom;
window.console=console;
window.eval(app);
await new Promise(r=>setTimeout(r,20));
const d=window.document;
function ok(cond,msg){if(!cond) throw new Error(msg)}
ok(window.__SEDORI_ENGINE__,'engine did not boot');
ok(d.getElementById('searchStatus').textContent.includes('商品名・型番'),'init status not set');
// tab buttons must respond
const nav=[...d.querySelectorAll('nav button')];
ok(nav.length===4,'nav count');
nav.find(b=>b.dataset.tab==='settings').click();
ok(!d.getElementById('settingsPanel').classList.contains('hide'),'settings tab did not open');
nav.find(b=>b.dataset.tab==='search').click();
ok(!d.getElementById('searchPanel').classList.contains('hide'),'search tab did not open');
// search with disconnected userscript must respond visibly, not be dead
const q=d.getElementById('searchQ'); q.value='Nintendo Switch 有機EL';
d.getElementById('bulkSearchBtn').click();
ok(d.getElementById('searchStatus').textContent.includes('未接続'),'search button did not execute disconnected path');
// connected path must emit bridge command
Object.defineProperty(d.documentElement.dataset,'sedoriUserscript',{value:'4.5.0',writable:true,configurable:true});
d.getElementById('bulkSearchBtn').click();
const cmd=d.getElementById('sedoriBridgeCommand');
ok(cmd,'search command bridge not emitted');
const payload=JSON.parse(cmd.textContent); ok(payload.type==='search','wrong command type');
console.log('UI smoke OK');
