/* BASAIR P135 — read-only per-ayah source catalog from ORIGINAL v170/v171
 * Tilawa Follow reciter selector. Tafsir module only; never edits Tilawa.
 * This adds no reciter, edits no protected Tilawa code or user preferences.
 * One MP3 per ayah, using the same EveryAyah folders as the native Follow.
 * Audio hosted by EveryAyah: this module links, does NOT redistribute files.
 */
(function(w,d){
'use strict';
var KEY='__BASAIR_TAFSIR_EXACT_AYAH_AUDIO_CATALOG__';
if(w[KEY]&&w[KEY].version==='P136-RECITER-CATALOG-V1')return;
var RECITERS={
 alafasy:{name:'مشاري راشد العفاسي',folders:['Alafasy_64kbps','Alafasy_128kbps']},
 husary:{name:'محمود خليل الحصري',folders:['Husary_64kbps','Husary_128kbps']},
 minshawy:{name:'محمد صديق المنشاوي',folders:['Minshawy_Murattal_128kbps','Menshawi_32kbps']},
 abdulbasit:{name:'عبدالباسط عبدالصمد',folders:['Abdul_Basit_Murattal_64kbps','Abdul_Basit_Murattal_192kbps']},
 sudais:{name:'عبدالرحمن السديس',folders:['Abdurrahmaan_As-Sudais_64kbps','Abdurrahmaan_As-Sudais_192kbps']},
 maher:{name:'ماهر المعيقلي',folders:['Maher_AlMuaiqly_64kbps','MaherAlMuaiqly128kbps']},
 shuraym:{name:'سعود الشريم',folders:['Saood_ash-Shuraym_64kbps','Saood_ash-Shuraym_128kbps']}
};
var WHO='v170Reciter';
function currentKey(){
 var input=d.getElementById('sequenceReciterV17'),raw='';
 try{raw=String(input&&input.value||w.localStorage&&w.localStorage.getItem('v170Reciter')||'alafasy')}catch(_){raw='alafasy'}
 // Unknown user selection must never be silently changed to Alafasy.
 return Object.prototype.hasOwnProperty.call(RECITERS,raw)?raw:'';
}
function selected(){
 var id=currentKey(),reciter=id&&RECITERS[id];
 return reciter?{id:id,name:reciter.name,source:WHO}:null;
}
function list(){
 // Show the exact same seven verified per-ayah Follow entries, never the R109
 // whole-surah catalog. Do not write to the Follow selector or preferences.
 return Object.keys(RECITERS).map(function(id){
  return {id:id,name:RECITERS[id].name,source:WHO,exactAyah:true};
 });
}
function choose(id){
 // 'follow' tracks the visible read-only Tilawa Follow selection.
 if(!id||id==='follow')return selected();
 if(!Object.prototype.hasOwnProperty.call(RECITERS,id))return null;
 return {id:id,name:RECITERS[id].name,source:WHO};
}
function valid(req){
 var s=Number(req&&req.surah),a=Number(req&&req.ayah);
 return Number.isInteger(s)&&s>=1&&s<=114&&
  Number.isInteger(a)&&a>=1&&a<=286;
}
function pad(n){return String(n).padStart(3,'0')}
function makeURL(folder,s,a){
 return 'https://everyayah.com/data/'+folder+'/'+pad(s)+pad(a)+'.mp3';
}
function getExact(req){
 var chosen=choose(String(req&&req.reciterId||''));
 if(!chosen||!valid(req)||chosen.id!==String(req.reciterId||''))return null;
 var names=RECITERS[chosen.id].folders,urls=names.map(function(folder){
  return makeURL(folder,Number(req.surah),Number(req.ayah));
 });
 // This is a validated FILE-NAMING SCHEME also present in the protected
 // Follow code, not a claim that the remote file already loaded on Android.
 return {
  kind:'single-ayah',verified:true,verification:'v170-v171-original-ayah-source-structure',
  reciterId:chosen.id,surah:Number(req.surah),ayah:Number(req.ayah),
  durationScope:'single-ayah',url:urls[0],alternates:urls.slice(1)
 };
}
function diagnostics(){
 return {version:'P135-EXACT-V170-AYAH-CATALOG-QA',
  choice:selected(),source:WHO,readOnly:true,reciters:Object.keys(RECITERS).length,reciterChoices:list(),
  remoteStream:true,localAudioCache:false};
}
w[KEY]={selected:selected,list:list,choose:choose,getExact:getExact,diagnostics:diagnostics,version:'P136-RECITER-CATALOG-V1'};
})(window,document);
