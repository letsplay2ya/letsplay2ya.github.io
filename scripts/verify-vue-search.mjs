import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
import { ref, effectScope, nextTick } from 'vue';
const require = createRequire(import.meta.url);
const module = { exports: {} };
new Function('require', 'module', 'exports', ts.transpileModule(readFileSync('src/lib/useLatestSearch.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText)(require, module, module.exports);
const { useLatestSearch } = module.exports;
const settle = async () => { await Promise.resolve(); await Promise.resolve(); await nextTick(); };
function fixture() {
  const query = ref('');
  const pending = [];
  const scope = effectScope();
  const state = scope.run(() => useLatestSearch(query, (term, signal) => new Promise((resolve, reject) => pending.push({ term, signal, resolve, reject }))));
  return { query, pending, scope, state, search: async term => { query.value = term; await nextTick(); } };
}

const reversed = fixture();
await reversed.search('A'); await reversed.search('B');
assert.equal(reversed.pending[0].signal.aborted, true);
reversed.pending[1].resolve(['B']); await settle();
reversed.pending[0].resolve(['A']); await settle();
assert.deepEqual(reversed.state.results.value, ['B']);
reversed.scope.stop();

const returned = fixture();
await returned.search('A'); await returned.search('B'); await returned.search('A');
returned.pending[0].resolve(['first A']); await settle();
assert.deepEqual(returned.state.results.value, []);
returned.pending[2].resolve(['last A']); await settle();
returned.pending[1].resolve(['B']); await settle();
assert.deepEqual(returned.state.results.value, ['last A']);
returned.scope.stop();

const staleFailure = fixture();
await staleFailure.search('A'); await staleFailure.search('B');
staleFailure.pending[0].reject(new Error('old error')); await settle();
assert.equal(staleFailure.state.error.value, '');
assert.equal(staleFailure.state.loading.value, true);
staleFailure.pending[1].reject(new Error('current error')); await settle();
assert.equal(staleFailure.state.error.value, 'current error');
assert.equal(staleFailure.state.loading.value, false);
staleFailure.scope.stop();

const cleared = fixture();
await cleared.search('A'); await cleared.search('   ');
assert.equal(cleared.pending[0].signal.aborted, true);
cleared.pending[0].resolve(['late A']); await settle();
assert.deepEqual(cleared.state.results.value, []);
assert.equal(cleared.state.loading.value, false);
cleared.scope.stop();

const disposed = fixture();
await disposed.search('A'); disposed.scope.stop();
assert.equal(disposed.pending[0].signal.aborted, true);
disposed.pending[0].resolve(['after disposal']); await settle();
assert.deepEqual(disposed.state.results.value, []);
console.log('Vue watcher checks passed: reversed responses, cancellation signal, stale errors/finally, current failure, empty search, scope disposal.');
