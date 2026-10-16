import assert from 'node:assert/strict';
import { createEditor, prepareSave, prepareInWrongOrder } from './example.mjs';

const serverItem = Object.freeze({ id: 'item-a', version: 3, rate: 10 });
const broken = createEditor();
broken.type('25');
assert.equal(prepareInWrongOrder(broken, serverItem).rate, 10);
assert.equal(broken.read(), '25'); // Flush worked, but the payload was already stale.

const fixed = createEditor();
fixed.type('25');
assert.deepEqual(prepareSave(fixed, serverItem), {
  errors: [], payload: { id: 'item-a', version: 3, rate: 25 },
});
assert.equal(serverItem.rate, 10);

for (const invalid of ['', '-1', '1,000', 'NaN', 'Infinity']) {
  const editor = createEditor();
  editor.type(invalid);
  assert.deepEqual(prepareSave(editor, serverItem), { errors: ['RATE_INVALID'], payload: null });
}
const zero = createEditor();
zero.type('0');
assert.equal(prepareSave(zero, serverItem).payload.rate, 0);
console.log('Save order: stale capture reproduced; latest edit, validation, zero, identity and source preservation passed.');
