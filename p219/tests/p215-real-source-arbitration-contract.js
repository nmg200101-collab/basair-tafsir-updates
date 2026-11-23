/* P219 integration with the real, unmodified P215 JS.
 * Confirms P215 overlay clears but a hypothetical independent native B345
 * word mark stays untouched. Not real Android or word/audio synchronization.
 */
(function(root){
root.__BASAIR_P219_P215_INTEGRATION_TESTS__=function(p215,p219){
 var passed=0,fail=[];function ck(name,ok){if(ok)passed++;else fail.push(name)}
 var markers=new Set(['nativeB345WordMark']);
 var word={textContent:'الٓمٓ',
  getAttribute:k=>({'data-s':'2','data-selectayah':'1'})[k]||null,
  getBoundingClientRect:()=>({top:250,bottom:300,height:50,width:100}),
  classList:{contains:n=>markers.has(n),add:n=>markers.add(n),remove:n=>markers.delete(n)}};
 var card={querySelectorAll:q=>q.includes('quranWord')?[word]:[]};
 var host={getAttribute:k=>null,querySelector:q=>card};
 var listeners=[];
 var body={classList:{contains:n=>n==='reader-active'||n==='stableDigital'}};
 var doc={body,hidden:false,readyState:'loading',addEventListener(){},
  getElementById:k=>k==='b345NormalStack'?host:null};
 var starts=0,stops=0,events=0;
 var native={state:{running:true,page:1,scaleMode:'normal',mode:'audio',paused:false},
  startAudio(){starts++},stop(){stops++}};
 var core={status(){return{route:'digital'}},onChange(fn){listeners.push(fn);return()=>{listeners=listeners.filter(x=>x!==fn)}}};
 var win={innerHeight:800,getComputedStyle:()=>({display:'block',visibility:'visible'}),
  setTimeout(){return 1},__BASAIR_B345_SEQUENCE__:native,__BASAIR_P213_FOLLOW__:core};
 new Function('window','document',p215)(win,doc);
 var original=win.__BASAIR_P215_DIGITAL_SHADOW__;
 ck('original P215 visual is enabled before arbiter',original.status().enabled===true);
 ck('original P215 paints a separate ayah marker',original._test.tick()===true&&markers.has('p215ShadowMark'));
 ck('original native word class simultaneously present',markers.has('nativeB345WordMark'));
 new Function('window','document',p219)(win,doc);
 var arbiter=win.__BASAIR_P219_SINGLE_SHADOW_OWNER__;
 ck('P219 installed',arbiter.version===219);
 ck('P219 removed independent static P215 mark',!markers.has('p215ShadowMark'));
 ck('P219 preserved native B345 word mark',markers.has('nativeB345WordMark'));
 ck('P219 disabled P215 polling updates',original.status().enabled===false);
 ck('P215 future tick cannot restore overlay while disabled',original._test.tick()===false&&!markers.has('p215ShadowMark'));
 ck('No B345 start/stop calls',starts===0&&stops===0&&native.state.running===true);
 original.enable();
 ck('External P215 reactivation can reproduce the visual overlap',markers.has('p215ShadowMark'));
 listeners.forEach(f=>f({type:'start'}));events++;
 ck('P213 follow event removes duplicated overlay again',
    !markers.has('p215ShadowMark')&&markers.has('nativeB345WordMark'));
 ck('Owner status shows native route but not invented word-time evidence',
    arbiter.status().nativeFollowDetected&&!arbiter.status().hasAudioWordTimingProof);
 arbiter.disable();
 ck('P219 disable restores P215 source behavior for rollback',
    original.status().enabled===true);
 ck('P219 rollback keeps native word marker intact',
    markers.has('nativeB345WordMark'));
 arbiter.enable();
 ck('P219 can resume single owner after rollback',
    original.status().enabled===false&&!markers.has('p215ShadowMark'));
 return{passed,failed:fail.length,errors:fail,limit:'Simulated DOM and native marker; actual V695 word/audio alignment untested'};
}
})(typeof window!=='undefined'?window:globalThis);
