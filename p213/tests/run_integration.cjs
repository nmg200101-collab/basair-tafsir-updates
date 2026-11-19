/* Execute P213 isolated contract suites without npm, Android or an APK:
 *   node p213/tests/run_integration.cjs
 * This is NOT an Android WebView or real-audio acceptance test.
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '../..');
const sourceFiles = {
  core: 'p213/src/unified-follow-core.js',
  bridge: 'p213/src/follow-route-adapters.js',
  smoke: 'p213/tests/follow-contract-smoke.js',
  session: 'p213/tests/isolated-core-integration.js',
  routing: 'p213/tests/adapter-routing-regression.js',
};
function runSource(context, name) {
  const relative = sourceFiles[name];
  const absolute = path.join(root, relative);
  if (!fs.existsSync(absolute)) throw Error('Missing P213 test source: ' + relative);
  const text = fs.readFileSync(absolute, 'utf8');
  vm.runInContext(text, context, {filename:relative, timeout:10000});
}
function suite(name, runner, needsBridge) {
  const sandbox = {window:{}};
  const context = vm.createContext(sandbox);
  runSource(context, 'core');
  if (needsBridge) runSource(context, 'bridge');
  runSource(context, name);
  const run = sandbox.window[runner];
  if (typeof run !== 'function') throw Error('Missing suite: ' + runner);
  const out = run();
  if (!out || !Number.isInteger(out.passed) || !Number.isInteger(out.failed))
    throw Error('Invalid suite result: ' + name);
  if (out.failed > 0 || (out.errors && out.errors.length))
    throw Error(name + ': ' + JSON.stringify(out.errors || out));
  console.log('[PASS]', name, out.passed + ' checks');
  return out.passed;
}
try {
  const total =
    suite('smoke', '__BASAIR_P213_CONTRACT_TESTS__', true) +
    suite('session', '__BASAIR_P213_TEST_RUNNER__', false) +
    suite('routing', '__BASAIR_P213_ROUTING_TESTS__', true);
  console.log('P213 local contract checks:', total, 'passed; 0 failed');
} catch (error) {
  console.error('[FAIL] P213 isolated checks:', error && error.stack || String(error));
  process.exitCode = 1;
}
