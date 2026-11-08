import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=dirname(fileURLToPath(import.meta.url));
const read=name=>readFileSync(join(root,name));
const hash=b=>createHash('sha256').update(b).digest('hex');
const decode=x=>{
 const v=JSON.parse(read(x).toString('utf8'));
 assert.ok(v.signature?.length===512,'signed rollback/active manifest '+x);
 return JSON.parse(Buffer.from(v.payload,'base64').toString('utf8'));
};
const live=decode('release.json');
const backups=[
 decode('release-qa-028-before-qa029-20261108.json'),
 decode('release-qa-029-before-qa030-20261108.json'),
 decode('release-qa-030-before-qa031-20261108.json')];
assert.deepEqual(backups.map(x=>x.sequence),[28,29,30]);
assert.equal(live.sequence,31,'published QA031 not modified by staging');
assert.equal(live.id,'P97-AUDIO-FOLLOW-SETTINGS-PACE-031');
const draft=JSON.parse(read('P972-QA032-UNSIGNED-PAYLOAD-DRAFT.json').toString('utf8'));
assert.equal(draft.id,'P97-STABLE-AYAH-SHADE-HANDOFF-032');
assert.equal(draft.sequence,32);
assert.equal(draft.channel,'owner-qa');
assert.equal(draft.minAppVersion,690);
assert.equal(draft.assets.length,8,'owner receiver limit');
assert.equal(new Set(draft.assets.map(x=>x.path)).size,8);
assert.equal(draft.assets.filter(x=>live.assets.some(y=>x.path===y.path&&x.sha256===y.sha256&&x.size===y.size)).length,6,
 'six prior QA031 assets retained');
let bytes=0;
for(const a of draft.assets){
 assert.match(a.path,/^[a-z0-9][a-z0-9._-]*\.(js|css)$/);
 const b=read(a.path);bytes+=b.length;
 assert.equal(b.length,a.size,'asset size '+a.path);
 assert.equal(hash(b),a.sha256,'asset SHA256 '+a.path);
 assert.ok(b.length<=524288,'receiver per asset 512KB');
}
assert.ok(bytes<=1048576,'combined 1MiB cap');
const latestJS=read('p972-ayah-shade-stability.js').toString('utf8');
const latestCSS=read('p972-ayah-shade-stability.css').toString('utf8');
assert.ok(latestJS.startsWith(read('p971-audio-pace-settings.js').toString('utf8').trimEnd()),
 'QA031 JS prefix unchanged');
assert.ok(latestCSS.startsWith(read('p968-native-gesture-preview.css').toString('utf8').trimEnd()),
 'printed Qur\'an CSS unchanged before QA032 addition');
const end=latestJS.slice(latestJS.indexOf('/* BASAIR P97.2 / QA032'));
assert.ok(!/\bscrollTop\b|scrollIntoView|scrollTo\(|playbackRate|audio\.currentTime\s*=/.test(end),
 'new shade layer must not control scroll, playback, or timing');
assert.ok(end.includes("function firstNative(shell,pg)"),'native ack precedence');
assert.ok(end.includes("function disable()"),'full rollback');
assert.ok(!/\bkeystore\b|\bpassword\b|\bprivateKey\b/.test(end),'no signing keys');
console.log('PASS QA032: live QA031 unchanged, backups 28/29/30, 6 original assets, 8 SHA256 size verified, old JS/CSS exact prefix, no scroll or audio ownership.');
