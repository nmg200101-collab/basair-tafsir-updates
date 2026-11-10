#!/usr/bin/env node
/**
 * BASAIR P118 STAGING: run the EXACT P118 JavaScript from the repository
 * against an isolated synthetic DOM (no network, no APK change).
 *
 * Usage (run at repository root):
 *   node tafsir-ui/staging/p118/test_p118_full_js_dom.mjs
 *
 * A PASS is NOT Chromium layout, Android WebView, user-data, or OTA acceptance.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const HERE = dirname(fileURLToPath(import.meta.url));
const fullSource = readFileSync(join(HERE, 'p118-tafsir-visual-match.js'), 'utf8');
const separateCSS = readFileSync(join(HERE, 'p118-tafsir-visual-match.css'), 'utf8');

class Element {
  constructor(id = '', tag = 'div', classes = []) {
    this.id = id;
    this.tag = tag;
    this.classes = new Set(classes);
    this.children = [];
    this.parentElement = null;
    this.textContent = '';
    this.attrs = {};
    this.handlers = {};
    this.style = {};
    this.classList = {
      contains: name => this.classes.has(name),
      add: name => this.classes.add(name),
      remove: name => this.classes.delete(name),
    };
  }
  appendChild(child) {
    if (child.parentElement) {
      child.parentElement.children = child.parentElement.children.filter(x => x !== child);
    }
    this.children.push(child);
    child.parentElement = this;
    return child;
  }
  insertBefore(child, before) {
    if (child.parentElement) {
      child.parentElement.children = child.parentElement.children.filter(x => x !== child);
    }
    const i = this.children.indexOf(before);
    this.children.splice(i < 0 ? this.children.length : i, 0, child);
    child.parentElement = this;
    return child;
  }
  querySelector(selector) {
    const matches = node => selector.startsWith('.') ? node.classes.has(selector.slice(1))
      : selector.startsWith('#') ? node.id === selector.slice(1)
      : node.tag === selector.toLowerCase();
    const walk = node => {
      for (const child of node.children) {
        if (matches(child)) return child;
        const found = walk(child);
        if (found) return found;
      }
      return null;
    };
    return walk(this);
  }
  addEventListener(type, fn) { this.handlers[type] = fn; }
  setAttribute(name, value) { this.attrs[name] = value; }
  focus() { this.focused = true; }
  scrollIntoView(config) { this.scrollConfig = config; }
}

const body = new Element('body', 'body');
const head = new Element('head', 'head');
const tafsirIndex = body.appendChild(new Element('tafsirIndex', 'section', ['active']));
const dashboard = tafsirIndex.appendChild(new Element('bqTf117Dashboard'));
const type = dashboard.appendChild(new Element('type', 'div', ['bq-tf117-type']));
const searchPanel = dashboard.appendChild(new Element('panel', 'div', ['bq-tf117-search-panel']));
const actions = dashboard.appendChild(new Element('actions', 'div', ['bq-tf117-actions']));
const favorites = actions.appendChild(new Element('bqTf117Favorites', 'button'));
const resume = actions.appendChild(new Element('bqTf117Resume', 'button'));
const search = searchPanel.appendChild(new Element('bqTf117Search', 'input'));
const browser = tafsirIndex.appendChild(new Element('v194T104SurahBrowser'));
const headingGroup = browser.appendChild(new Element('headGroup', 'div', ['v194T104SurahHead']));
const title = headingGroup.appendChild(new Element('heading', 'b'));
title.textContent = 'السور';
const subtitle = headingGroup.appendChild(new Element('subheading', 'small'));
subtitle.textContent = 'old';
const frozenTilawa = body.appendChild(new Element('protectedTilawa', 'section'));
frozenTilawa.textContent = 'QA050-IMMUTABLE';

const findById = (node, id) => {
  if (node.id === id) return node;
  for (const child of node.children) {
    const found = findById(child, id);
    if (found) return found;
  }
  return null;
};
const documentMock = {
  body, head, readyState: 'complete',
  getElementById: id => findById(body, id) || findById(head, id),
  createElement: tag => new Element('', tag),
};
const events = [];
const windowMock = {
  setTimeout: fn => { fn(); return 0; },
  setInterval: () => 0,
  __BASAIR_TAFSIR_INDEX_P117__: { enabled: true },
  __BASAIR_TAFSIR_STEP2__: {
    state: () => ({ s: 2, a: 9, type: 'basair' }),
    open: (s, a, type) => events.push({ s, a, type }),
  },
};

vm.runInNewContext(fullSource, { window: windowMock, document: documentMock },
  { filename: 'p118-tafsir-visual-match.js', timeout: 1500 });

const api = windowMock.__BASAIR_P118_TAFSIR_INDEX_MATCH__;
const style = documentMock.getElementById('bqTf118Style');
const bar = documentMock.getElementById('bqTf118Topbar');
const searchAction = documentMock.getElementById('bqTf118SearchAction');
const last = documentMock.getElementById('bqTf118Last');

assert.ok(api && style && bar && searchAction && last, 'all expected controls install');
assert.equal(style.textContent.trimEnd(), separateCSS.trimEnd(), 'full embedded CSS matches source');
assert.equal(
  (style.textContent.match(/font\s*:\s*\d+\s+[\d.]+px\/[\d.]+\s+inherit\s*!important/g) || []).length,
  0, 'invalid font shorthands removed');
assert.equal(
  (style.textContent.match(/font-weight:\d+!important;\s*font-size:[\d.]+px!important;\s*line-height:[\d.]+!important;\s*font-family:inherit!important;/g) || []).length,
  9, 'nine valid font longhands present');
assert.equal(type.parentElement, bar, 'existing tafsir selector moved to toolbar');
assert.equal(actions.parentElement, bar, 'native action handlers remain on original nodes');
assert.equal(favorites.attrs['aria-label'], 'عرض الآيات المفضلة');
assert.equal(resume.attrs['aria-label'], 'متابعة التفسير من آخر موضع');
assert.equal(title.textContent, 'فهرس السور');
assert.equal(subtitle.textContent, 'اختر السورة للبدء');

searchAction.handlers.click();
assert.equal(search.focused, true, 'search button focuses native search');
last.handlers.click();
assert.deepEqual(events, [{ s: 2, a: 9, type: 'basair' }], 'last location calls native Tafsir API');

const countId = (root, id) => {
  let total = root.id === id ? 1 : 0;
  for (const child of root.children) total += countId(child, id);
  return total;
};
api.refresh();
api.refresh();
assert.equal(countId(body, 'bqTf118Topbar'), 1, 'no duplicate toolbar');
assert.equal(countId(body, 'bqTf118Last'), 1, 'no duplicate last location');

tafsirIndex.classList.remove('active');
assert.equal(api.diagnostics().active, false, 'not active in Tilawa');
tafsirIndex.classList.add('active');
api.refresh();
assert.equal(api.diagnostics().active, true, 'works again on Tafsir re-entry');
assert.equal(api.diagnostics().errors, 0, 'no runtime exceptions');
assert.equal(frozenTilawa.textContent, 'QA050-IMMUTABLE', 'unrelated Tilawa node unchanged');

console.log('PASS: full P118 JS + embedded CSS synthetic-DOM checks (NOT WebView/OTA acceptance)');
