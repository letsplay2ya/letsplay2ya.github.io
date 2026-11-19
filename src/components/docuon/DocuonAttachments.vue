<script setup lang="ts">
import { computed, ref } from 'vue';

type Row = { id: string; name: string };
type Receipt = { removed: string; names: string[]; bodies: string[] };
type Result = { target: Row; localIndex: number; original: Receipt; stable: Receipt };

const page = ref(2);
const duplicateNames = ref(false);
const result = ref<Result>();
const pageSize = 10;
let generation = 0;

const rows = computed<Row[]>(() => Array.from({ length: 11 }, (_, index) => {
  const id = String(index + 1).padStart(2, '0');
  const name = duplicateNames.value && (id === '01' || id === '11')
    ? '점검표.txt'
    : '첨부-' + id + '.txt';
  return { id, name };
}));
const visible = computed(() => rows.value.slice((page.value - 1) * pageSize, page.value * pageSize));

function clearResult() {
  ++generation;
  result.value = undefined;
}

function changePage(value: number) {
  page.value = value;
  clearResult();
}

async function readReceipt(removed: string, files: File[]): Promise<Receipt> {
  const body = new FormData();
  for (const file of files) body.append('files', file, file.name);
  const parts = body.getAll('files') as File[];
  return {
    removed,
    names: parts.map(part => part.name),
    bodies: await Promise.all(parts.map(part => part.text())),
  };
}

async function compare(target: Row, localIndex: number) {
  clearResult();
  const currentGeneration = generation;
  const records = rows.value.map(row => ({
    row,
    file: new File([row.id], row.name, { type: 'text/plain' }),
  }));

  // The portal removes the same index from both full-length arrays.
  const displayRows = records.map(record => record.row);
  const files = records.map(record => record.file);
  const [removedRow] = displayRows.splice(localIndex, 1);
  files.splice(localIndex, 1);

  const kept = records.filter(record => record.row.id !== target.id);
  const [original, stable] = await Promise.all([
    readReceipt(removedRow.id, files),
    readReceipt(target.id, kept.map(record => record.file)),
  ]);
  if (currentGeneration === generation) {
    result.value = { target, localIndex, original, stable };
  }
}
</script>

<template>
  <section id="attachment-review" class="attachment-review" aria-labelledby="attachment-title">
    <header>
      <h2 id="attachment-title">삭제한 행과 전송할 파일 대조하기</h2>
      <p>2페이지의 첨부 11번을 삭제해 보세요. 두 방식 모두 같은 가상 파일 11개에서 시작합니다. 각 파일의 본문에는 두 자리 첨부 번호가 들어 있습니다.</p>
    </header>
    <div class="attachments-panel">
      <div class="file-controls">
        <label><input v-model="duplicateNames" type="checkbox" @change="clearResult" /> 01번과 11번의 이름을 같게 하기</label>
        <div class="pages" role="group" aria-label="첨부 목록 페이지">
          <button type="button" :aria-pressed="page === 1" @click="changePage(1)">1페이지</button>
          <button type="button" :aria-pressed="page === 2" @click="changePage(2)">2페이지</button>
        </div>
      </div>
      <table class="files">
        <caption>삭제 전 첨부 목록 · {{ page }} / 2페이지</caption>
        <thead><tr><th scope="col">첨부 번호</th><th scope="col">파일명</th><th scope="col">행 인덱스</th><th scope="col">작업</th></tr></thead>
        <tbody>
          <tr v-for="(row, index) in visible" :key="row.id">
            <td>{{ row.id }}</td><td>{{ row.name }}</td><td>{{ index }}</td>
            <td><button type="button" class="remove" :aria-label="'첨부 ' + row.id + '번 삭제 비교'" @click="compare(row, index)">삭제 비교</button></td>
          </tr>
        </tbody>
      </table>
      <div v-if="result" class="results" aria-live="polite">
        <p class="target">선택한 첨부 {{ result.target.id }}번 · 화면의 행 인덱스 {{ result.localIndex }}</p>
        <div class="receipts">
          <section v-for="method in (['original', 'stable'] as const)" :key="method" :data-receipt="method">
            <h3>{{ method === 'original' ? '페이지 행 인덱스로 삭제' : '첨부 ID로 삭제' }}</h3>
            <p><strong>빠진 첨부 {{ result[method].removed }}번</strong></p>
            <p>전송 목록 {{ result[method].names.length }}개 · 본문 표식</p>
            <output>{{ result[method].bodies.join(' · ') }}</output>
            <details><summary>전송할 파일명 보기</summary><ol>
              <li v-for="(name, i) in result[method].names" :key="result[method].bodies[i]">{{ name }} <small>본문 {{ result[method].bodies[i] }}</small></li>
            </ol></details>
          </section>
        </div>
      </div>
    </div>
    <p class="caption">브라우저에서 생성한 텍스트 파일을 FormData에 담아 다시 읽는 예제입니다. 파일을 외부로 보내지 않습니다.</p>
  </section>
</template>

<style scoped>
.attachment-review { margin: 2rem 0; scroll-margin-top: 7rem; min-width: 0; }
.attachment-review header p, .caption { color: var(--muted, #52616a); }
.attachment-review h2 { font-size: clamp(1.35rem, 3vw, 1.8rem); }
.attachment-review h2, .attachment-review h3, .attachment-review p { margin: 0 0 .65rem; }
.attachments-panel { border: 1px solid #bdcbd4; border-radius: .7rem; padding: clamp(.7rem, 2vw, 1.3rem); background: #fff; color: #213748; }
.file-controls, .pages { display: flex; flex-wrap: wrap; align-items: center; gap: .4rem; }
.file-controls { justify-content: space-between; gap: .7rem; margin-bottom: .8rem; }
.file-controls label { display: flex; align-items: center; gap: .35rem; font-size: .92rem; }
.pages button, .remove { background: white; color: #24465c; border: 1px solid #a3b8c6; border-radius: .3rem; padding: .3rem .55rem; cursor: pointer; }
.pages button[aria-pressed='true'] { color: white; background: #224968; }
.files { border-collapse: collapse; width: 100%; font-size: .9rem; }
.files caption { text-align: left; padding: .5rem 0; font-weight: 650; }
.files th, .files td { text-align: left; padding: .5rem .3rem; border-bottom: 1px solid #dbe3e8; overflow-wrap: anywhere; }
.files th { color: #4d6170; }
.receipts { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .7rem; }
.receipts section { background: #f1f5f7; border-radius: .4rem; padding: .8rem; }
.receipts h3 { font-size: 1rem; }
.results .target { margin: 1rem 0 .6rem; }
.receipts output { display: block; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
.receipts details { margin-top: .6rem; font-size: .9rem; }
.receipts summary { cursor: pointer; }
.receipts ol { padding-left: 1.4rem; }
.receipts small { color: #536978; white-space: nowrap; }
.caption { font-size: .85rem; padding-top: .5rem; }
@media (max-width: 640px) { .receipts { grid-template-columns: 1fr; } }
</style>
