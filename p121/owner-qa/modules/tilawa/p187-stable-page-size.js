/* Basair P187 — stable display-only size control. QA-050 protected.
 * Baseline P180/Seq57: never invoke RC18, RC19 or any print/font renderer.
 * Reuse the original V695 reader size handler (#menuFont) unchanged.
 */
(function (w, d) {
  'use strict';
  if (w.__BASAIR_P187_SIZE_ONLY__) return;
  var BTN = 'p187DockSize';
  function el(id) { return d.getElementById(id); }
  function update(b) {
    var n = 1;
    try { n = Number(w.localStorage.getItem('readerZoom')) || 1; } catch (_) {}
    b.title = 'حجم الصفحة ' + Math.round(n * 100) + '٪';
    b.setAttribute('aria-label', 'تغيير حجم الصفحة. الحالي ' + Math.round(n * 100) + ' بالمئة');
  }
  function install() {
    var dock = el('mushafDock'), night = el('dockNight'), theme = el('bqP26Theme');
    if (!dock || !night || !theme) return false;
    var b = el(BTN);
    if (!b) {
      b = d.createElement('button');
      b.id = BTN;
      b.type = 'button';
      b.className = 'p187SizeButton';
      var glyph = d.createElement('span');
      glyph.textContent = '⤢';
      var label = d.createElement('small');
      label.textContent = 'الحجم';
      b.append(glyph, label);
      b.addEventListener('click', function (ev) {
        ev.preventDefault(); ev.stopPropagation();
        var nativeSize = el('menuFont');
        // Only the original page-size action is allowed; never change a print or font.
        if (nativeSize && typeof nativeSize.onclick === 'function') nativeSize.click();
        update(b);
      });
    }
    if (b.parentElement !== dock) dock.insertBefore(b, night);
    d.body.classList.add('p187-size-ready');
    update(b);
    return true;
  }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', install, {once:true});
  else install();
  w.__BASAIR_P187_SIZE_ONLY__ = {version:187, refresh:install};
})(window, document);
