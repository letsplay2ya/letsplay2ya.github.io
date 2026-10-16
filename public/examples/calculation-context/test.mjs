import assert from 'node:assert/strict';
import { canApply, compact, inputSignature } from './example.mjs';
const request = { epoch: 0, contract: 'A', target: 'risk-1', signature: 'input-A' };
assert.equal(canApply(request, { ...request }), true);
for (const key of ['epoch', 'contract', 'target', 'signature']) {
  assert.equal(canApply(request, { ...request, [key]: 'changed' }), false, key);
}
assert.equal(canApply(request, null), false);
assert.equal(canApply(request, { ...request }), true, 'Same-input repeated requests and A-B-A remain indistinguishable');
const input = { currency: 'USD', aoc: '1,000', agg: '2,000', basePremium: '' };
assert.equal(inputSignature(input), inputSignature({ ...input, aoc: '1000', agg: '2000', basePremium: '2700' }));
assert.notEqual(inputSignature(input), inputSignature({ ...input, aoc: '1500' }));
assert.notEqual(inputSignature(input), inputSignature({ ...input, currency: 'KRW' }));
assert.equal(compact('1%'), '1');
assert.equal(compact('not-number'), 'not-number');
assert.equal(compact('   '), '0');
console.log('Calculation context: identity mismatch rejected; same-context limitation and input/result separation verified.');
