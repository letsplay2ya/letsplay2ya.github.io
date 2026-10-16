import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const cache = '.qa/java-tx-libs';
const classes = '.qa/java-tx-classes';
mkdirSync(cache, { recursive: true });
mkdirSync(classes, { recursive: true });
const dependencies = JSON.parse(readFileSync('public/examples/transaction-boundary/dependencies.json', 'utf8'));
const jars = [];
for (const dependency of dependencies) {
  const file = path.join(cache, dependency.file);
  if (!existsSync(file)) {
    const response = await fetch(dependency.url, { signal: AbortSignal.timeout(30000) });
    assert.equal(response.status, 200, dependency.file);
    writeFileSync(file, Buffer.from(await response.arrayBuffer()));
  }
  assert.equal(createHash('sha256').update(readFileSync(file)).digest('hex'), dependency.sha256, dependency.file + ' SHA-256');
  jars.push(file);
}
execFileSync('javac', ['-encoding', 'UTF-8', '--release', '17', '-cp', jars.join(path.delimiter), '-d', classes, 'public/examples/transaction-boundary/TransactionBoundary.java'], { stdio: 'pipe', windowsHide: true });
const output = execFileSync('java', ['-cp', [classes, ...jars].join(path.delimiter), 'TransactionBoundary'], { encoding: 'utf8', windowsHide: true });
const results = JSON.parse(output.trim());
assert.equal(results.length, 8);
const saved = 'public/examples/transaction-boundary/results.json';
if (process.argv.includes('--record')) writeFileSync(saved, JSON.stringify(results, null, 2) + '\n');
else assert.deepEqual(results, JSON.parse(readFileSync(saved, 'utf8')));
console.log('Spring/H2 experiment: 8 real transaction scenarios passed; row count and active transaction checked after each call.');
