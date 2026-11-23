/* P216 P206 v2 signed-scope compatibility: isolated mock tests.
 * Regression for active {tilawa, updates} with an updates-only signed manifest.
 * NEVER handles private keys or mutates the live release.
 */
(function(w){
 w.__BASAIR_P216_SIGNED_SCOPE_TESTS__=async function(original, candidate){
  var passed=0,failed=[];
  function ck(name,condition){if(condition)passed++;else failed.push(name)}
  function evaluate(code){
   var root={setTimeout:function(){}},doc={readyState:'loading',addEventListener:function(){}};
   var crypto={subtle:{digest:async function(){return new ArrayBuffer(32)}}};
   new Function('window','document','TextEncoder','TextDecoder','crypto',code)(
     root,doc,class{encode(){return new Uint8Array()}},class{decode(){return''}},crypto);
   return root.__BASAIR_P206_SIGNED_ARCHIVE__;
  }
  var old=evaluate(original),next=evaluate(candidate);
  var bytes=new Uint8Array([1,2,3,4]).buffer;
  var asset={path:'modules/updates/signed-asset.js',kind:'js',size:4,sha256:'00'.repeat(32)};
  var updates={version:216,assets:[asset],files:{'modules/updates/signed-asset.js':bytes}};
  var tilawa={version:243,assets:[],files:{}};
  var manifest={modules:[{id:'updates',version:216,assets:[asset]}]};
  ck('old P206 mismatch is reproduced',!(await old.matches({tilawa,updates},manifest)));
  ck('original P206 accepts exact one-module snapshot',await old.matches({updates},manifest));
  ck('new archive validates signed updates with independent Tilawa',await next.matches({tilawa,updates},manifest));
  ck('new archive accepts exact signed subset',await next.matches({updates},manifest));
  ck('invalid update version rejected',!(await next.matches({tilawa,updates:{...updates,version:215}},manifest)));
  ck('missing signed module rejected',!(await next.matches({tilawa},manifest)));
  ck('mismatched asset size rejected',!(await next.matches({tilawa,updates:{...updates,assets:[{...asset,size:5}]}},manifest)));
  ck('truncated data rejected',!(await next.matches({tilawa,updates:{...updates,files:{[asset.path]:new ArrayBuffer(3)}}},manifest)));
  ck('wrong expected hash rejected',!(await next.matches({tilawa,updates:{...updates,assets:[{...asset,sha256:'11'.repeat(32)}]}},manifest)));
  ck('legacy signed runtime accepted',next.hasArchiveRuntime({assets:[{path:'modules/updates/p206-signed-six-rollback.js',kind:'js'}]}));
  ck('versioned signed runtime accepted',next.hasArchiveRuntime({assets:[{path:'modules/updates/p216-signed-six-rollback-v2.js',kind:'js'}]}));
  ck('non-archive runtime rejected',!next.hasArchiveRuntime({assets:[{path:'modules/updates/untrusted.js',kind:'js'}]}));
  ck('capture archives only signed module names',candidate.includes('active:snapshot')&&candidate.includes('snapshot[mod.id]=s.active[mod.id]'));
  ck('approved snapshots verify stored and live signed modules',candidate.includes('await matches(rec.active,m)'));
  ck('restore preserves current unrelated active modules',candidate.includes('Object.assign({},s.active)')&&candidate.includes('nextActive[mod.id]=rec.active[mod.id]'));
  ck('trusted updater must be signed in its own envelope',candidate.includes("m.modules.some(function(mod){return mod.id==='updates'})"));
  ck('new version never replaces the old path',!candidate.includes('p206 archive is not replaceable by a signed overlay'));
  return{passed:passed,failed:failed.length,errors:failed,limit:'Isolated fake crypto/hash and static invariants; no V695 Android or real RSA signature acceptance'};
 };
})(typeof window!=='undefined'?window:globalThis);
