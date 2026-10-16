import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

function run(source, expression) {
  const javascript = ts.transpileModule(source.replace(/^export /gm, ''), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText;
  return new Function(javascript + '\nreturn ' + expression)();
}
function code(id) {
  const source = readFileSync(`src/content/posts/${id}.md`, 'utf8');
  const block = source.match(/```ts\r?\n([\s\S]*?)```/);
  assert.ok(block, `${id}: TypeScript example exists`);
  return block[1];
}
const functions = [
  run(readFileSync('src/lib/clause-eligibility.ts', 'utf8'), 'isDerivedClauseDiscountTarget'),
  run(code('notes-clause-eligibility'), 'isDerivedClauseDiscountTarget'),
];
let combinations = 0;
for (const appLevlDvCd of ['03', '04', undefined]) {
  for (const appYn of ['Y', 'N', undefined]) {
    for (const clusDcExchgExsoYn of ['Y', 'N', undefined, 'UNKNOWN']) {
      const input = Object.freeze({ appLevlDvCd, appYn, clusDcExchgExsoYn });
      const expected = appLevlDvCd !== '04' && appYn === 'Y' && [undefined, 'Y'].includes(clusDcExchgExsoYn);
      for (const eligible of functions) assert.equal(eligible(input), expected, JSON.stringify(input));
      combinations++;
    }
  }
}
for (const eligible of functions) {
  assert.equal(eligible({ appYn: ' y ', appLevlDvCd: ' 03 ', clusDcExchgExsoYn: ' y ' }), true);
  assert.equal(eligible({ appYn: 'Y', appLevlDvCd: ' 04 ' }), false);
  assert.equal(eligible({ appYn: 'Y', clusDcExchgExsoYn: '   ' }), true);
  assert.equal(eligible({ appYn: 'true', clusDcExchgExsoYn: 'Y' }), false);
  assert.equal(eligible({ appYn: 'Y', clusDcExchgExsoYn: ' n ' }), false);
  assert.equal(eligible({}), false);
}
const { getScrollRatio, getTargetScrollLeft } = run(code('notes-keyed-scroll-sync'), '{ getScrollRatio, getTargetScrollLeft }');
assert.equal(getScrollRatio(150, 700, 100), 0.25);
assert.equal(getTargetScrollLeft(0.25, 900, 100), 200);
assert.equal(getTargetScrollLeft(0.25, 500, 100), 100);
assert.equal(getScrollRatio(600, 900, 100), 0.75);
assert.equal(getTargetScrollLeft(0.75, 500, 100), 300);
assert.equal(getScrollRatio(0, 100, 100), null);
assert.equal(getScrollRatio(1, 101, 100), null);
assert.equal(getScrollRatio(-10, 500, 100), 0);
assert.equal(getScrollRatio(999, 500, 100), 1);
console.log(`Workflow articles: ${combinations} eligibility combinations + normalization boundaries on article and UI code; scroll ratios and range boundaries passed.`);
