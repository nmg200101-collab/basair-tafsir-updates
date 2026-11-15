#!/usr/bin/env node
'use strict';
/*
 * P172 — local owner release delivery choice and signed policy gate.
 * No private signing keys. No GitHub writes, no deployment, no APK edits.
 *
 * prepare --mode manual|automatic --input UNSIGNED_PAYLOAD.json --out DRAFT.json
 * verify  --mode manual|automatic --signed SIGNED_ENVELOPE.json [--active ACTIVE_ENVELOPE.json]
 */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const ROOT=path.resolve(__dirname,'../..');
const DEFAULT_ACTIVE=path.join(ROOT,'p121/owner-qa/release.json');
const MODE=Object.freeze({manual:'notify',automatic:'automatic'});
const BLOCKED=new Set(['tilawa','shared','navigation','reciters']);
function error(msg){throw new Error(msg)}
function argsParse(argv){
 const [command,...rest]=argv;
 if(!['prepare','verify'].includes(command))error('Usage: prepare|verify --mode manual|automatic (see p172/README-AR.md)');
 const args={command};
 for(let i=0;i<rest.length;i++){
  const k=rest[i];
  if(!/^--(mode|input|out|signed|active)$/.test(k))error('Unsupported option: '+k);
  const v=rest[++i];if(!v||v.startsWith('--'))error('Missing value: '+k);
  args[k.slice(2)]=v;
 }
 if(!Object.hasOwn(MODE,args.mode))error('Choose --mode manual or automatic');
 if(command==='prepare'&&(!args.input||!args.out||args.signed))error('prepare requires --input and --out, no --signed');
 if(command==='verify'&&(!args.signed||args.input||args.out))error('verify requires --signed, no --input/--out');
 return args;
}
function readJSON(p){return JSON.parse(fs.readFileSync(p,'utf8'))}
function pubKey(){
 const source=fs.readFileSync(path.join(ROOT,'p146/tests/test-p146-signed-release.cjs'),'utf8');
 const match=source.match(/const pub='([^']+)'/);
 if(!match)error('Original owner public verification key unavailable');
 return {key:Buffer.from(match[1],'base64'),format:'der',type:'spki'};
}
function signedEnvelope(file){
 const env=readJSON(file);
 if(!env||typeof env.payload!=='string'||typeof env.signature!=='string')error('Signed payload and signature required');
 const bytes=Buffer.from(env.payload,'base64'),signature=Buffer.from(env.signature,'base64');
 if(signature.length!==384||!crypto.verify('RSA-SHA256',bytes,pubKey(),signature))
  error('Original owner RSA-3072 signature invalid: '+file);
 return JSON.parse(bytes.toString('utf8'));
}
function metadata(m){
 if(!m||m.schema!=='basair-universal-ota-v1')error('Unexpected OTA schema');
 if(m.channel!=='owner-qa'||m.applicationId!=='app.basair.qurv2')
  error('Wrong owner channel or application ID');
 if(!Number.isSafeInteger(m.sequence)||m.sequence<1)error('Invalid OTA sequence');
 if(!Number.isSafeInteger(m.minAppVersion)||m.minAppVersion<1)error('Invalid minimum app version');
 if(!Number.isFinite(Date.parse(m.issuedAt))||!Number.isFinite(Date.parse(m.expiresAt))||
    Date.parse(m.expiresAt)<=Date.parse(m.issuedAt))error('Invalid signed time window');
 if(!Array.isArray(m.modules)||m.modules.length===0)error('No OTA modules');
 const seen=new Set();
 for(const mod of m.modules){
  if(!mod||!/^[a-z][a-z0-9-]*$/.test(mod.id)||BLOCKED.has(mod.id))
   error('Protected or invalid module: '+(mod&&mod.id));
  if(seen.has(mod.id))error('Duplicate module '+mod.id);seen.add(mod.id);
  if(!Number.isSafeInteger(mod.version)||mod.version<1)error('Invalid module version '+mod.id);
  if(!Array.isArray(mod.assets)||!mod.assets.length)error('No assets for '+mod.id);
  const names=new Set();
  for(const a of mod.assets){
   if(typeof a.path!=='string'||!new RegExp('^modules/'+mod.id+'/[A-Za-z0-9_.\\/-]+\\.(css|js|json)$').test(a.path)||
      a.path.includes('..')||a.path.startsWith('/'))error('Unsafe asset path: '+a.path);
   if(names.has(a.path))error('Duplicate asset '+a.path);names.add(a.path);
   if(!['css','js','json'].includes(a.kind)||a.kind!==a.path.split('.').at(-1))
    error('Asset kind mismatch: '+a.path);
   if(!Number.isSafeInteger(a.size)||a.size<1||!/^[a-f0-9]{64}$/.test(a.sha256))
    error('Invalid file integrity: '+a.path);
  }
 }
 return m;
}
function assertChoice(m,mode){
 if(m.deliveryMode!==MODE[mode])error('Signed deliveryMode '+m.deliveryMode+' != selected '+mode+
    '. Select the correct mode BEFORE signing; never edit a signed payload.');
}
function verifyAssets(m){
 let count=0;
 for(const mod of m.modules)for(const a of mod.assets){
  const full=path.join(ROOT,'p121/owner-qa',a.path);
  const b=fs.readFileSync(full);
  if(b.length!==a.size||crypto.createHash('sha256').update(b).digest('hex')!==a.sha256)
   error('OTA size/SHA-256 mismatch: '+a.path);
  count++;
 }
 return count;
}
function verifyCandidate(m,mode,active){
 metadata(m);assertChoice(m,mode);
 metadata(active);
 if(Date.parse(m.issuedAt)>Date.now()+300000)error('New release issuedAt lies in the future');
 if(Date.parse(m.expiresAt)<=Date.now())error('New release is already expired');
 if(m.sequence<=active.sequence)error('OTA sequence must strictly exceed active signed sequence');
 if(m.minAppVersion<active.minAppVersion)
   error('Cannot reduce minimum app compatibility without separate owner review');
 for(const old of active.modules){
  const n=m.modules.find(x=>x.id===old.id);
  if(n&&n.version<=old.version)error('New version required for existing module '+old.id);
 }
 return verifyAssets(m);
}
function plan(args){
 const active=signedEnvelope(args.active||DEFAULT_ACTIVE);
 const input=readJSON(args.input);
 if(input.payload||input.signature)error('Do not edit signed envelopes; use an unsigned payload source');
 const next=JSON.parse(JSON.stringify(input));
 next.deliveryMode=MODE[args.mode];
 // Verify hashes, versions, expiry and signed-owner channel BEFORE requesting signing.
 // A mismatched file must not be sent to the owner signer.
 const filesChecked=verifyCandidate(next,args.mode,active);
 const out=path.resolve(args.out),live=path.resolve(args.active||DEFAULT_ACTIVE);
 if(out===live||out===path.join(ROOT,'p121/owner-qa/release.json')||
    out===path.resolve(args.input))error('Refusing to overwrite live or input manifest');
 const outParent=path.dirname(out);
 if(!fs.existsSync(outParent))error('Output directory must exist; create review folder first');
 fs.writeFileSync(out,JSON.stringify(next,null,2)+'\n',{flag:'wx',mode:0o600});
 return {action:'prepare',mode:args.mode,signedDeliveryMode:next.deliveryMode,
  sequence:next.sequence,assetsVerified:filesChecked,output:out,status:'UNSIGNED_ONLY — OWNER SIGNATURE REQUIRED, NOT PUBLISHED'};
}
function check(args){
 const active=signedEnvelope(args.active||DEFAULT_ACTIVE);
 const next=signedEnvelope(args.signed);
 const assets=verifyCandidate(next,args.mode,active);
 return {action:'verify',mode:args.mode,signedDeliveryMode:next.deliveryMode,
  sequence:next.sequence,moduleVersions:next.modules.map(x=>({id:x.id,version:x.version})),
  signedOwnerRSA3072:true,assetsVerified:assets,status:'SIGNED_VERIFIED — PUBLISHING REQUIRES OWNER APPROVAL'};
}
function main(argv){
 const args=argsParse(argv),result=args.command==='prepare'?plan(args):check(args);
 process.stdout.write(JSON.stringify(result,null,2)+'\n');
}
if(require.main===module){
 try{main(process.argv.slice(2))}catch(e){console.error('P172 BLOCKED: '+e.message);process.exitCode=1}
}
module.exports={MODE,argsParse,metadata,assertChoice,verifyCandidate,verifyAssets,signedEnvelope,plan,check};
