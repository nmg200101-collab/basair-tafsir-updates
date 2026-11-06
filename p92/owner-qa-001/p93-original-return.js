/* BASAIR P93.0 — visual-state reconciliation, no Quran renderer mutation. */
(function () {
  'use strict';
  if (window.__BASAIR_P93_PRINT_FIX__) return;
  var allowed={original:true,tajwid:true,blue:true};
  var root=document.documentElement;
  var body=document.body;
  if (!body) return;
  function sync() {
    var actual=body.getAttribute('data-v144-print');
    if (!allowed[actual]) return;
    if (root.getAttribute('data-v686-print-intent')!==actual) {
      root.setAttribute('data-v686-print-intent',actual);
    }
    // Do not touch loading while Tajweed is selected.
    if (actual!=='tajwid' && body.getAttribute('data-rc18-print-loading')==='tajwid') {
      body.removeAttribute('data-rc18-print-loading');
    }
  }
  var observer=new MutationObserver(sync);
  observer.observe(body,{attributes:true,attributeFilter:['data-v144-print']});
  window.addEventListener('pageshow',sync,false);
  window.__BASAIR_P93_PRINT_FIX__={active:true,version:'P93.0',resync:sync};
  sync();
})();
