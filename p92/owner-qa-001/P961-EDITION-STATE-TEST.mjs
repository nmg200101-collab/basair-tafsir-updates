// BASAIR P96.1 / QA021 - non-mutating simulated regression gate (Node only).
// Reproduces stale HTML Uthmani intent, compares legacy and corrected handlers.
// Does not run in Android or sign/publish any update.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {runInNewContext} from 'node:vm';

const root=dirname(fileURLToPath(import.meta.url));
const source=readFileSync(join(root,'p932-uthmani-hold.js'),'utf8');
const fixed=readFileSync(join(root,'p961-uthmani-hold-safe.js'),'utf8');
const before="function isBlue(){return body.getAttribute('data-v144-print')==='blue'||html.getAttribute('data-v686-print-intent')==='blue';}";
const after="function isBlue(){var live=body.getAttribute('data-v144-print');return live==='blue'||(!live&&html.getAttribute('data-v686-print-intent')==='blue');}";
assert.equal(source.split(before).length-1,1,'one original guard');
assert.equal(fixed,source.replace(before,after),'only live-state precedence changed; all other bytes unchanged');
assert.equal(fixed.includes('UnicodeLine'),false,'no Quran Unicode glyph layout override');
assert.equal(fixed.includes('font-size'),false,'no font change');
function simulate(script,edition,intent,active=true) {
  const calls=[],stored=[],listeners={},attrs={edition,intent};
  const activeClasses=new Set(active?['reader-active']:[]);
  const body={
    classList:{contains:x=>activeClasses.has(x)},
    getAttribute:k=>k==='data-v144-print'?attrs.edition:null,
    setAttribute:(k,v)=>{if(k==='data-v144-print')attrs.edition=v},
    removeAttribute:()=>{}
  };
  const html={
    getAttribute:k=>k==='data-v686-print-intent'?attrs.intent:null,
    setAttribute:(k,v)=>{if(k==='data-v686-print-intent')attrs.intent=v}
  };
  class FakeMutationObserver{constructor(fn){this.fn=fn;}observe(){}disconnect(){}}
  const document={body,documentElement:html,querySelectorAll:()=>[],addEventListener:(n,cb)=>{listeners['document:'+n]=cb}};
  const window={
    MutationObserver:FakeMutationObserver,
    requestAnimationFrame:fn=>{fn()},
    addEventListener:(n,cb)=>{listeners['window:'+n]=cb},
    __BASAIR_RC18__:{setPrint:(name)=>{calls.push(name);attrs.edition=name}},
    toast:()=>{}
  };
  const context={window,document,localStorage:{setItem:(k,v)=>{stored.push({k,v})}},MutationObserver:FakeMutationObserver,Promise};
  runInNewContext(script,context,{timeout:3000});
  return {calls,attrs,stored,listeners,window};
}

// Prior failure reproduced, then corrected without changing the live edition.
assert.deepEqual(simulate(source,'tajwid','blue').calls,['original'],'legacy switch unexpectedly redirects Tajweed when HTML intent is stale blue');
assert.deepEqual(simulate(fixed,'tajwid','blue').calls,[],'Tajweed remains live despite stale HTML Uthmani intent');
assert.deepEqual(simulate(fixed,'original','blue').calls,[],'original remains live despite stale HTML Uthmani intent');
assert.deepEqual(simulate(fixed,'tajwid','original').calls,[],'Tajweed remains live with ordinary intent');
assert.deepEqual(simulate(fixed,'original','original').calls,[],'original remains live');

// Authentic blue selection must still be blocked until genuine Uthmani artwork is approved.
assert.deepEqual(simulate(fixed,'blue','original').calls,['original'],'actual Uthmani still redirects to approved original');
assert.deepEqual(simulate(fixed,'blue','blue').calls,['original'],'actual Uthmani with matching intent redirects to original');
assert.deepEqual(simulate(fixed,null,'blue').calls,['original'],'no live selection falls back from unresolved Uthmani intent');
assert.deepEqual(simulate(fixed,'blue','blue',false).calls,[],'inactive reader never redirected');

// Explicit blue control remains protected from selection.
const clicked=simulate(fixed,'original','original'),flags={prevented:false,stopped:false,immediate:false};
clicked.listeners['window:click']({
  target:{closest:()=>({getAttribute:()=> 'blue'})},
  preventDefault(){flags.prevented=true},
  stopPropagation(){flags.stopped=true},
  stopImmediatePropagation(){flags.immediate=true}
});
assert.deepEqual(flags,{prevented:true,stopped:true,immediate:true},'blue control intercepted');
assert.ok(clicked.window.__BASAIR_P932_UTHMANI_HOLD__,'original public diagnostics API preserved');
console.log('PASS P96.1 QA021 — 11 live/intent guards, no typeface/render/audio/edition mutations. Baseline QA020 unchanged.');
