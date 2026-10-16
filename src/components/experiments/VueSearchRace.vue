<script setup lang="ts">
import { ref } from 'vue';
import { useLatestSearch } from '../../lib/useLatestSearch';
import './workflow-examples.css';

type Pending = { id: number; query: string; signal: AbortSignal; done: boolean; resolve: (value: string[]) => void; reject: (error: Error) => void };
const query = ref('');
const pending = ref<Pending[]>([]);
const naive = ref<string[]>([]);
let sequence = 0;
const { results, loading, error } = useLatestSearch(query, (term, signal) => {
  // Deliberately ignores abort: prove that cancellation alone is insufficient.
  return new Promise<string[]>((resolve, reject) => {
    pending.value.push({ id: ++sequence, query: term, signal, done: false, resolve, reject });
  }).then(value => { naive.value = value; return value; });
});
function deliver(request: Pending, fail = false) {
  request.done = true;
  if (fail) request.reject(new Error(request.query + ' 조회 실패'));
  else request.resolve([request.query + ' 결과']);
}
</script>

<template>
  <section class="workflow-example vue-search-example" aria-labelledby="vue-search-heading">
    <h2 id="vue-search-heading">A 검색 → B 검색 → B 응답 → A 응답</h2>
    <p>Vue 3.5의 실제 watch를 실행합니다. 응답 버튼으로 도착 순서를 바꿔 보세요. 모의 조회는 취소 신호를 받아도 끝까지 응답하도록 만들었습니다.</p>
    <div class="workflow-controls">
      <button :disabled="query === 'A' || pending.length >= 10" @click="query = 'A'">계약 A 검색</button>
      <button :disabled="query === 'B' || pending.length >= 10" @click="query = 'B'">계약 B 검색</button>
      <button @click="query = ''">빈 검색으로 초기화</button>
    </div>
    <p>현재 검색: <b>{{ query || '없음' }}</b> · <span role="status">{{ loading ? '조회 중' : error || '대기' }}</span></p>
    <div class="search-race-results">
      <div><h3>도착한 응답을 그대로 적용</h3><output aria-label="보호 없는 검색 결과">{{ naive.join(', ') || '없음' }}</output></div>
      <div><h3>현재 요청일 때만 적용</h3><output aria-label="보호한 검색 결과">{{ results.join(', ') || '없음' }}</output></div>
    </div>
    <ol class="search-race-requests">
      <li v-for="request in pending" :key="request.id">
        <span>요청 {{ request.id }} · {{ request.query }} <small>{{ request.signal.aborted ? '(취소 신호 있음)' : '' }}</small></span>
        <div class="workflow-controls"><button :disabled="request.done" @click="deliver(request)">요청 {{ request.id }} {{ request.query }} 응답 도착</button><button :disabled="request.done" @click="deliver(request, true)">요청 {{ request.id }} 오류 도착</button></div>
      </li>
    </ol>
    <p class="workflow-scope">API 통신·업무 서버 없이 실행하는 별도 실습입니다. 새로고침하면 초기화되며, 한 번에 최대 10개 요청을 만들 수 있습니다.</p>
  </section>
</template>

<style scoped>
.search-race-results{display:grid;grid-template-columns:1fr 1fr;gap:16px}.search-race-results>div{border-left:3px solid #83977a;padding:12px;background:white;min-width:0}.search-race-results h3{font-size:13px;margin:0 0 10px}.search-race-requests{padding-left:22px}.search-race-requests li{font-size:13px;margin:12px 0;border-bottom:1px solid #d7dcd1}.search-race-requests .workflow-controls{margin:10px 0}.search-race-requests small{color:#765431}@media(max-width:650px){.search-race-results{grid-template-columns:1fr}}
</style>
