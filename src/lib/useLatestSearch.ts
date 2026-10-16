import { ref, watch, type Ref } from 'vue';

export function useLatestSearch(query: Ref<string>, search: (query: string, signal: AbortSignal) => Promise<string[]>) {
  const results = ref<string[]>([]);
  const loading = ref(false);
  const error = ref('');
  let version = 0;
  watch(query, async (raw, _previous, onCleanup) => {
    const requestVersion = ++version;
    const controller = new AbortController();
    let active = true;
    onCleanup(() => { active = false; controller.abort(); });
    const isCurrent = () => active && requestVersion === version;
    results.value = [];
    error.value = '';
    const term = raw.trim();
    if (!term) { loading.value = false; return; }
    loading.value = true;
    try {
      const response = await search(term, controller.signal);
      if (isCurrent()) results.value = response;
    } catch (failure) {
      if (isCurrent()) error.value = failure instanceof Error ? failure.message : '조회 실패';
    } finally {
      if (isCurrent()) loading.value = false;
    }
  }, { immediate: true });
  return { results, loading, error };
}
