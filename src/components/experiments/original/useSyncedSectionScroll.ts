import { useEffect, type RefObject } from 'react';

// ag-Grid는 실제 셀이 스크롤되는 '.ag-center-cols-viewport'와, 사용자가 마우스로 직접
// 드래그하는 눈에 보이는 가로 스크롤바 '.ag-body-horizontal-scroll-viewport'를 내부적으로
// 서로 동기화한다. 드래그 상호작용은 스크롤바 쪽에서 먼저 발생하므로 둘 다 감시 대상에 넣는다.
const CENTER_VIEWPORT_SELECTOR = '.ag-center-cols-viewport';
const SCROLLBAR_VIEWPORT_SELECTOR = '.ag-body-horizontal-scroll-viewport';
const GRID_ROOT_SELECTOR = '.ag-root-wrapper';

interface GridScrollElements {
  center: HTMLElement;
  scrollbar: HTMLElement | null;
  key?: string;
}

export interface SyncedSectionScrollOptions {
  /**
   * `order`는 DOM 등장 순서대로 그리드를 연결한다.
   * `key`는 가장 가까운 `data-scroll-sync-key` 값이 같은 그리드끼리 연결한다.
   */
  pairing?: 'order' | 'key';
}

function findGridScrollElements(root: HTMLElement, pairing: 'order' | 'key'): GridScrollElements[] {
  const selector =
    pairing === 'key'
      ? `[data-scroll-sync-key] ${CENTER_VIEWPORT_SELECTOR}`
      : CENTER_VIEWPORT_SELECTOR;
  const centers = Array.from(root.querySelectorAll<HTMLElement>(selector)).filter(
    (center) => !center.closest('[data-state="inactive"]'),
  );
  return centers.map((center) => {
    const gridRoot = center.closest<HTMLElement>(GRID_ROOT_SELECTOR) ?? root;
    const key =
      pairing === 'key'
        ? center.closest<HTMLElement>('[data-scroll-sync-key]')?.dataset.scrollSyncKey
        : undefined;
    return {
      center,
      scrollbar: gridRoot.querySelector<HTMLElement>(SCROLLBAR_VIEWPORT_SELECTOR),
      key,
    };
  });
}

function getHorizontalScrollRange(element: HTMLElement) {
  return Math.max(0, element.scrollWidth - element.clientWidth);
}

function getHorizontalScrollRatio(element: HTMLElement) {
  const range = getHorizontalScrollRange(element);
  if (range <= 1) return null;

  return Math.min(1, Math.max(0, element.scrollLeft / range));
}

function setElementScrollRatio(element: HTMLElement, ratio: number) {
  const value = getHorizontalScrollRange(element) * ratio;
  if (element.scrollLeft !== value) element.scrollLeft = value;
}

function setGridScrollRatio(els: GridScrollElements, ratio: number) {
  setElementScrollRatio(els.center, ratio);
  if (els.scrollbar) setElementScrollRatio(els.scrollbar, ratio);
}

/**
 * 좌/우 컨테이너 안에 렌더링된 ag-Grid들의 가로 스크롤 진행률을 서로 동기화한다.
 * 양쪽 Grid의 스크롤 가능 폭이 달라도 각각 같은 비율의 위치를 유지한다.
 * 기본값은 DOM 등장 순서(1번째-1번째, 2번째-2번째, ...)로 연결하며, 동적 본문처럼 순서가
 * 달라질 수 있는 화면은 `pairing: 'key'`와 `data-scroll-sync-key`로 명시적으로 연결한다.
 *
 * ag-Grid는 rowData/columnDefs가 바뀌면 내부적으로 '.ag-center-cols-viewport'를 다시 만들 수
 * 있다. 리스너를 붙일 당시의 "반대쪽" 엘리먼트를 캐시해두면, 그 사이 반대쪽이 재생성됐을 때
 * 죽은 엘리먼트에 값을 써서 아무 효과가 없는 문제가 생긴다. 그래서 스크롤 이벤트가 실제로
 * 발생한 그 순간에 반대쪽 엘리먼트를 다시 조회해서 항상 "현재 살아있는" 엘리먼트에 쓴다.
 * (반대로 리스너 자체는, 붙여둔 엘리먼트가 사라지면 그냥 다시는 이벤트가 안 오는 것뿐이라
 * 안전하다 — 새로 나타난 엘리먼트는 MutationObserver가 감지해서 새로 리스너를 붙인다.)
 */
export function useSyncedSectionScroll(
  leftContainerRef: RefObject<HTMLElement | null>,
  rightContainerRef: RefObject<HTMLElement | null>,
  active: boolean,
  options: SyncedSectionScrollOptions = {},
) {
  const pairing = options.pairing ?? 'order';

  useEffect(() => {
    if (!active) return undefined;

    let cancelled = false;
    let waitRafId: number | null = null;
    let mutationRafId: number | null = null;
    let observer: MutationObserver | null = null;
    const cleanupFns: Array<() => void> = [];

    // 팝업이 막 열린 시점에는 Dialog/포털의 자식 콘텐츠가 아직 커밋되지 않아
    // ref.current가 잠깐 null일 수 있다. 즉시 포기하지 않고 두 ref가 모두 채워질
    // 때까지 프레임 단위로 재시도한다(팝업이 닫히면 cancelled로 중단).
    const waitForRoots = () => {
      if (cancelled) return;
      const leftRoot = leftContainerRef.current;
      const rightRoot = rightContainerRef.current;
      if (!leftRoot || !rightRoot) {
        waitRafId = requestAnimationFrame(waitForRoots);
        return;
      }
      setup(leftRoot, rightRoot);
    };

    const setup = (leftRoot: HTMLElement, rightRoot: HTMLElement) => {
      const attachedElements = new WeakSet<HTMLElement>();
      const guards = new Map<string | number, { syncing: boolean; releaseRafId: number | null }>();
      const getGuard = (pairId: string | number) => {
        const current = guards.get(pairId);
        if (current) return current;
        const next = { syncing: false, releaseRafId: null };
        guards.set(pairId, next);
        return next;
      };

      const attachListener = (
        grid: GridScrollElements,
        el: HTMLElement,
        pairId: string | number,
        otherRoot: HTMLElement,
      ) => {
        if (attachedElements.has(el)) return;
        attachedElements.add(el);

        const onScroll = (e: Event) => {
          const guard = getGuard(pairId);
          if (guard.syncing) return;
          guard.syncing = true;
          const sourceElement = e.currentTarget as HTMLElement;
          const ratio = getHorizontalScrollRatio(sourceElement);
          // 캐시된 참조가 아니라, 지금 이 순간 실제로 존재하는 반대쪽 엘리먼트를 다시 찾는다.
          const otherGrids = findGridScrollElements(otherRoot, pairing);
          const target =
            pairing === 'key'
              ? otherGrids.find((grid) => grid.key === pairId)
              : otherGrids[pairId as number];
          if (
            !target ||
            ratio === null ||
            getHorizontalScrollRange(grid.center) <= 1 ||
            getHorizontalScrollRange(target.center) <= 1
          ) {
            guard.syncing = false;
            return;
          }

          setGridScrollRatio(target, ratio);

          // scrollLeft 대입으로 상대 Grid가 발생시키는 후속 scroll 이벤트는 현재 이벤트와
          // 다른 task에서 전달될 수 있다. 같은 호출 스택에서 잠금을 바로 해제하면 상대의
          // 더 짧은 최대 스크롤값이 원본을 역으로 끌어당길 수 있으므로 다음 프레임까지 유지한다.
          if (guard.releaseRafId != null) cancelAnimationFrame(guard.releaseRafId);
          guard.releaseRafId = requestAnimationFrame(() => {
            guard.syncing = false;
            guard.releaseRafId = null;
          });
        };

        el.addEventListener('scroll', onScroll, { passive: true });
        cleanupFns.push(() => el.removeEventListener('scroll', onScroll));
      };

      const attachNewElements = () => {
        const leftGrids = findGridScrollElements(leftRoot, pairing);
        const rightGrids = findGridScrollElements(rightRoot, pairing);

        if (pairing === 'key') {
          const rightKeys = new Set(rightGrids.map((grid) => grid.key).filter((key): key is string => !!key));
          const leftKeys = new Set(leftGrids.map((grid) => grid.key).filter((key): key is string => !!key));

          leftGrids.forEach((grid) => {
            if (!grid.key || !rightKeys.has(grid.key)) return;
            attachListener(grid, grid.center, grid.key, rightRoot);
            if (grid.scrollbar) attachListener(grid, grid.scrollbar, grid.key, rightRoot);
          });
          rightGrids.forEach((grid) => {
            if (!grid.key || !leftKeys.has(grid.key)) return;
            attachListener(grid, grid.center, grid.key, leftRoot);
            if (grid.scrollbar) attachListener(grid, grid.scrollbar, grid.key, leftRoot);
          });
          return;
        }

        const pairCount = Math.min(leftGrids.length, rightGrids.length);

        for (let i = 0; i < pairCount; i++) {
          const a = leftGrids[i];
          const b = rightGrids[i];
          attachListener(a, a.center, i, rightRoot);
          if (a.scrollbar) attachListener(a, a.scrollbar, i, rightRoot);
          attachListener(b, b.center, i, leftRoot);
          if (b.scrollbar) attachListener(b, b.scrollbar, i, leftRoot);
        }
      };

      attachNewElements();

      // 팝업이 열려있는 동안 계속 감시한다 — 그리드가 시차를 두고 마운트되거나
      // 나중에 다시 만들어져도 놓치지 않는다. 잦은 DOM 변경은 rAF 한 프레임에 하나로 묶는다.
      observer = new MutationObserver(() => {
        if (mutationRafId != null) return;
        mutationRafId = requestAnimationFrame(() => {
          mutationRafId = null;
          attachNewElements();
        });
      });
      observer.observe(leftRoot, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-state'] });
      observer.observe(rightRoot, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-state'] });
      cleanupFns.push(() => {
        guards.forEach((guard) => {
          if (guard.releaseRafId != null) cancelAnimationFrame(guard.releaseRafId);
        });
      });
    };

    waitForRoots();

    return () => {
      cancelled = true;
      if (waitRafId != null) cancelAnimationFrame(waitRafId);
      if (mutationRafId != null) cancelAnimationFrame(mutationRafId);
      observer?.disconnect();
      cleanupFns.forEach((fn) => fn());
    };
  }, [leftContainerRef, rightContainerRef, active, pairing]);
}
