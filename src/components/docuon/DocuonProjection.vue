<script setup lang="ts">
import { computed, ref } from 'vue';

type View = 'links' | 'documents';
interface ResultRow {
  id: string;
  title: string;
  files: number;
  bytes: number;
}

const document = { id: 'doc-a', title: '11월 장비 점검 기록' };
const request = { id: 'transfer-a', document };
const attachments = [
  { linkId: 'link-a', name: '점검 기록.pdf', bytes: 1_048_576, request },
  { linkId: 'link-b', name: '점검표 별지.pdf', bytes: 262_144, request },
  { linkId: 'link-c', name: '현장 사진.jpg', bytes: 524_288, request },
];
const selectedIds = ref(attachments.slice(0, 2).map(file => file.linkId));
const view = ref<View>('links');
const selected = computed(() => attachments.filter(file => selectedIds.value.includes(file.linkId)));
const requestCount = computed(() => new Set(selected.value.map(file => file.request.id)).size);
const documentCount = computed(() => new Set(selected.value.map(file => file.request.document.id)).size);
const rows = computed(() => {
  const groups = new Map<string, ResultRow>();
  for (const file of selected.value) {
    const doc = file.request.document;
    const id = view.value === 'links' ? file.linkId : doc.id;
    const row = groups.get(id) ?? { id, title: doc.title, files: 0, bytes: 0 };
    row.files += 1;
    row.bytes += file.bytes;
    groups.set(id, row);
  }
  return [...groups.values()];
});
const format = new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 2 });
const mib = (bytes: number) => format.format(bytes / 1_048_576);
</script>

<template>
  <section id="transfer-rows" class="projection" aria-labelledby="projection-title">
    <h2 id="projection-title">첨부를 하나 더 넣으면 문서 수도 늘어날까?</h2>
    <p class="lead">같은 문서에 붙일 파일을 골라 보세요. 원본 조회는 신청에 연결된 첨부마다 행을 만들고, 문서별 재집계는 같은 문서의 첨부를 한 행에 모읍니다.</p>

    <div class="projection-panel">
      <header class="panel-head">
        <strong>이관 승인 상세</strong>
        <span>가상 문서로 재구성한 조회 화면</span>
      </header>
      <div class="workspace">
        <div class="selection">
          <h3>신청에 포함할 첨부</h3>
          <p class="doc-name">{{ document.title }}</p>
          <fieldset>
            <legend class="visually-hidden">신청에 포함할 가상 파일</legend>
            <label v-for="file in attachments" :key="file.linkId" class="file">
              <input v-model="selectedIds" type="checkbox" :value="file.linkId" :aria-label="file.name"
                :disabled="selectedIds.length === 1 && selectedIds.includes(file.linkId)" />
              <span>{{ file.name }}</span>
              <small>{{ format.format(file.bytes / 1024) }} KiB</small>
            </label>
          </fieldset>
          <p class="selection-help">이 예제에서는 첨부를 하나 이상 선택합니다.</p>
        </div>
        <div class="result">
          <div class="result-head">
            <h3>대상 문서 목록</h3>
            <div class="modes" role="group" aria-label="조회 방식">
              <button type="button" :aria-pressed="view === 'links'" @click="view = 'links'">원본 조회 구조</button>
              <button type="button" :aria-pressed="view === 'documents'" @click="view = 'documents'">문서별 재집계</button>
            </div>
          </div>
          <p class="counts" aria-live="polite" aria-atomic="true">신청 {{ requestCount }}건 · 문서 {{ documentCount }}건 · 첨부 {{ selected.length }}개 <strong>결과 {{ rows.length }}행</strong></p>
          <table>
            <caption class="visually-hidden">선택한 첨부의 {{ view === 'links' ? '원본 조회' : '문서별 재집계' }} 결과</caption>
            <thead><tr><th scope="col">문서 제목</th><th scope="col">파일 수</th><th scope="col">{{ view === 'links' ? '용량(MB)' : '용량(MiB)' }}</th></tr></thead>
            <tbody>
              <tr v-for="row in rows" :key="row.id">
                <th scope="row">{{ row.title }}</th>
                <td>{{ row.files }}</td>
                <td>{{ view === 'links' ? format.format(row.bytes) : mib(row.bytes) }}</td>
              </tr>
            </tbody>
          </table>
          <p v-if="view === 'links'" class="reading"><b>원본의 단위 표기</b> 열 제목은 MB이고 셀에는 바이트 합계가 그대로 들어갑니다.</p>
          <p v-else class="reading"><b>포트폴리오에서 재계산한 값</b> 같은 문서의 바이트를 합한 뒤 1,048,576으로 나눠 MiB로 표시합니다.</p>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.projection { margin: 2.75rem 0 3.5rem; scroll-margin-top: 7rem; }
.projection h2 { margin-bottom: .5rem; }
.lead { max-width: 57rem; color: var(--muted); margin-bottom: 1.25rem; }
.projection-panel { --navy: #243e55; --faint: #5a6a77; --rule: #d6dfe4; background: #fff; color: #203746; border: 1px solid #b7c6d1; border-radius: .65rem; overflow: hidden; }
.panel-head { min-height: 3.8rem; padding: .85rem clamp(1rem, 3vw, 1.8rem); display: flex; align-items: center; justify-content: space-between; gap: .25rem 1rem; flex-wrap: wrap; background: var(--navy); color: white; }
.panel-head strong { font-size: 1.15rem; }
.panel-head span { font-size: .85rem; color: #dce6ed; }
.workspace { display: grid; grid-template-columns: minmax(15.5rem, 31%) minmax(0, 1fr); }
.selection, .result { padding: clamp(1rem, 2.6vw, 1.8rem); min-width: 0; }
.selection { border-right: 1px solid var(--rule); background: #f2f6f8; }
.workspace h3 { font-size: 1.1rem; margin: 0; font-weight: 680; }
.doc-name { margin: .45rem 0 .8rem; color: var(--faint); font-size: .93rem; }
fieldset { margin: 0; padding: 0; border: 0; min-width: 0; }
.file { display: grid; grid-template-columns: 1.1rem minmax(0, 1fr) auto; align-items: center; gap: .6rem; min-height: 2.85rem; padding: .4rem .1rem; border-top: 1px solid var(--rule); cursor: pointer; }
.file:last-child { border-bottom: 1px solid var(--rule); }
.file input { width: 1rem; height: 1rem; margin: 0; accent-color: #225573; }
.file span { font-size: .9rem; overflow-wrap: anywhere; }
.file small { color: var(--faint); font-size: .79rem; font-variant-numeric: tabular-nums; }
.selection-help { color: var(--faint); font-size: .8rem; margin: .7rem 0 0; }
.result-head, .counts { display: flex; justify-content: space-between; align-items: center; gap: .65rem; flex-wrap: wrap; }
.modes { display: flex; gap: .15rem; border: 1px solid #bccad3; border-radius: .4rem; padding: .15rem; background: #f3f6f9; }
.modes button { background: transparent; color: var(--navy); padding: .3rem .55rem; border: 0; border-radius: .25rem; font-size: .83rem; font-weight: 650; }
.modes button[aria-pressed="true"] { background: var(--navy); color: white; }
.counts { color: var(--faint); font-size: .9rem; margin: 1rem 0 .45rem; }
.counts strong { color: #245575; }
table { width: 100%; border-collapse: collapse; font-size: .88rem; }
th, td { padding: .55rem .65rem; text-align: right; border-bottom: 1px solid var(--rule); }
thead th { background: #eef3f6; border-top: 1px solid #b7c6d1; color: #354a59; white-space: nowrap; }
th:first-child { text-align: left; }
tbody th { font-weight: 550; }
td { font-variant-numeric: tabular-nums; }
.reading { font-size: .84rem; color: var(--faint); margin: .85rem 0 0; }
.reading b { color: var(--navy); margin-right: .3rem; }
.visually-hidden { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; border: 0; }
@media (max-width: 780px) {
  .workspace { grid-template-columns: minmax(0, 1fr); }
  .selection { border-right: 0; border-bottom: 1px solid var(--rule); }
}
@media (max-width: 480px) {
  .result-head { align-items: flex-start; flex-direction: column; }
  .panel-head strong { flex-basis: 100%; }
  th, td { padding: .45rem .35rem; }
  .counts { gap: .3rem; }
}
</style>
