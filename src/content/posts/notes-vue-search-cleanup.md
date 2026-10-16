---
title: 'Vue 검색에서 이전 응답이 최신 목록을 덮지 않게 하기'
description: '실제 watch와 제어 가능한 응답으로 역전 상황을 재현했습니다. 취소 신호, 응답 무효화, 오래된 catch·finally, 빈 검색과 화면 종료를 함께 다룹니다.'
date: '2026-10-16T06:25:54.5165002Z'
category: 'Vue'
tags: ['Vue', 'TypeScript', '비동기 상태', '실험']
origin: 'original'
---

검색창에서 A를 조회하고 곧바로 B로 바꿨다. B의 응답이 먼저 도착해 목록이 바뀌었는데, 뒤늦게 A가 도착하면서 화면은 다시 A 목록이 된다. 검색 조건은 B인데 결과는 A다.

문제는 Vue가 반응성을 놓친 것이 아니다. 두 비동기 작업이 완료되는 순서와 현재 검색의 의미가 다르기 때문이다. 이 글은 Vue 3.5.24에서 별도로 만든 실습이며, 실제 회사의 Vue 프로젝트를 구현한 사례로 소개하지 않는다.

위 예제에서 A 검색, B 검색을 차례로 누른 뒤 B 응답과 A 응답을 반대 순서로 도착시켜 볼 수 있다. 왼쪽은 응답을 그대로 반영한 결과, 오른쪽은 현재 요청만 반영한 결과다.

## watch를 async로 만들면 순서도 관리될까

다음 형태는 검색 조건이 바뀔 때 조회를 시작하지만, 이전 조회가 끝날 때까지 기다린 뒤 다음 조회를 실행하는 큐는 아니다.

```ts
watch(query, async value => {
  results.value = await search(value);
});
```

A의 callback이 await에서 대기하는 동안 B의 callback도 실행될 수 있다. 각 callback이 정상적으로 값을 대입해도 마지막에 완료된 A가 화면을 덮는다. 단순한 loading 플래그 하나를 추가해도 어느 요청의 결과인지 판별하지 못한다.

## 정리 함수는 첫 await 전에 등록하기

이 실습의 composable은 watch callback의 세 번째 인자인 onCleanup을 사용한다. 다음 검색이 시작되거나 watcher가 정리될 때 기존 실행을 비활성화하고 취소 신호를 보낸다.

```ts
watch(query, async (raw, _previous, onCleanup) => {
  const requestVersion = ++version;
  const controller = new AbortController();
  let active = true;
  onCleanup(() => {
    active = false;
    controller.abort();
  });
  const isCurrent = () => active && requestVersion === version;

  // 입력 초기화 후 조회·오류 처리·loading 처리를 수행한다.
});
```

실습은 등록 시점이 분명하도록 첫 await 이전에 정리를 설정한다. Vue 3.5의 onWatcherCleanup은 동기 실행 중 등록해야 한다는 제약도 있으므로, 두 API의 이름만 바꿔 적용하지 않아야 한다. [Vue 공식 watcher 정리 문서](https://vuejs.org/guide/essentials/watchers.html#side-effect-cleanup)에서 등록 방식과 시점을 확인할 수 있다.

watcher는 setup 안에서 동기적으로 만들어 컴포넌트 수명과 연결한다. 지연 callback 안에서 나중에 생성하는 watcher까지 자동으로 같은 수명을 가진다고 가정하지 않는다. Node 검증에서는 effectScope를 사용해 같은 정리 경계를 명시적으로 만든다.

## 취소 신호와 반영 금지는 역할이 다르다

AbortController는 협력하는 전송 계층에 취소를 요청한다. 이미 완료한 작업이나 signal을 무시하는 함수가 응답하는 것까지 자동으로 막지는 않는다. 그래서 이 예제의 모의 조회는 의도적으로 취소 신호를 무시하고 응답을 반환한다.

응답을 받은 뒤에도 isCurrent를 확인하여 현재 검색에만 반영한다. active는 해당 callback의 수명이 끝났는지, version은 최신 실행인지 나타낸다. 여기서는 두 조건으로 경계를 드러냈으며, 반드시 두 변수를 써야만 가능한 해법이라는 뜻은 아니다.

실제 fetch라면 signal을 전달해 불필요한 처리를 줄이고, 응답 반영 여부는 별도로 확인할 수 있다. 브라우저 요청 취소가 서버에서 이미 시작한 작업까지 되돌린다고 이해하면 안 된다.

## 결과뿐 아니라 catch와 finally도 오래될 수 있다

성공 결과만 보호하면 다음 두 문제가 남는다.

| 도착 순서 | 보호하지 않았을 때 생기는 일 | 필요한 경계 |
| --- | --- | --- |
| B 조회 중 A 실패 | 현재 B 화면에 A 오류 표시 | catch에서도 현재 요청 확인 |
| B 조회 중 A 종료 | A의 finally가 loading을 false로 변경 | finally에서도 현재 요청 확인 |
| B 성공 뒤 A 성공 | B 결과를 A 결과로 교체 | 성공 경로의 현재 요청 확인 |

전체 composable은 다음처럼 같은 조건을 세 경로에 적용한다. 실제 코드는 [저장소의 useLatestSearch.ts](https://github.com/letsplay2ya/letsplay2ya.github.io/blob/master/src/lib/useLatestSearch.ts)에 있다.

```ts
try {
  const response = await search(term, controller.signal);
  if (isCurrent()) results.value = response;
} catch (failure) {
  if (isCurrent()) {
    error.value = failure instanceof Error ? failure.message : '조회 실패';
  }
} finally {
  if (isCurrent()) loading.value = false;
}
```

오래된 요청의 실패를 감춘다는 것은 모든 실패를 무시하겠다는 뜻이 아니다. 현재 B의 실패는 오류로 표시하고 loading을 종료한다. 취소된 A의 실패가 B의 표시 상태를 바꾸지 않도록 소유자를 구분하는 것이다.

## 빈 검색도 이전 실행을 무효화해야 한다

공백 입력이면 조회를 생략할 수 있다. 하지만 이전 요청을 정리하지 않고 return하면, 검색창을 비운 다음 도착한 A 결과가 다시 나타날 수 있다.

실습은 새 실행의 버전과 cleanup을 먼저 준비하고, 기존 결과·오류를 비운 뒤 입력을 trim한다. 빈 값이면 loading을 false로 만들고 조회하지 않는다. 이전 callback은 cleanup에서 비활성화되어 늦은 응답이 목록을 채우지 못한다.

같은 원리로 화면이 해제되어 watcher의 scope가 끝났을 때도 뒤늦은 성공을 반영하지 않는다. 종료 후의 finally로 화면 상태를 마무리하려 하기보다, 종료한 실행이 이후 상태를 수정할 권한을 잃는다고 보는 편이 명확하다.

## 문자열이 같아지는 경우와 요청 순번

A → B → A로 바뀌면 현재 검색 문자열만 비교해서는 처음 A의 응답과 마지막 A의 응답을 구분하지 못한다. 버전은 값이 아니라 실행마다 증가하므로 두 요청을 구분한다.

다만 watch는 동일 값 대입마다 새로운 실행을 보장하는 요청 버튼이 아니다. 같은 query를 다시 대입하면 callback이 실행되지 않을 수 있고, 같은 tick의 여러 변경도 묶일 수 있다. 같은 조건의 새로고침이 필요하면 별도 refresh 키나 명시적인 조회 함수를 설계해야 한다. 예제는 이 혼동을 줄이려고 이미 선택한 검색 버튼을 비활성화한다.

## debounce와 이 구현을 함께 쓸 때

debounce는 요청 수를 줄이는 정책이고, 현재 요청 판별은 결과 적용의 정확성에 관한 정책이다. 기다리는 동안 이미 진행 중인 요청이 끝날 수 있으므로 debounce만으로 응답 역전을 해결하지는 못한다.

버전을 원시 입력이 바뀔 때 증가시킬지, 실제 요청을 보낼 때 증가시킬지도 정해야 한다. 사용자가 B를 입력했지만 아직 B 요청은 보내지 않은 동안 A 결과를 보여 줘도 되는지에 따라 표시 정책이 달라진다. 이 실습은 query 변경을 곧바로 새 실행으로 보고 목록을 비우는 방식이다.

## 실행해서 확인한 것

저장소에서 `npm run test:vue-search`를 실행하면 Vue의 실제 ref·watch·effectScope로 다음을 검증한다. 가짜 watcher나 고정 결과표를 사용하는 테스트는 아니다.

- A와 B의 완료 순서를 뒤집어도 B 결과 유지
- A의 취소 신호 발생과, 취소를 무시한 응답의 반영 차단
- 오래된 오류·finally가 B의 오류·loading을 변경하지 않음
- 현재 요청의 실패는 표시하고 loading 종료
- 빈 검색과 scope 종료 후 이전 결과 반영 차단

브라우저에서는 같은 composable을 쓰는 Vue 컴포넌트의 응답 도착 버튼으로 이 순서를 확인한다. 네트워크·캐시·인증 오류·서버 취소 동작까지 재현하는 예제는 아니다.

검색 조건과 결과의 관계를 유지하려면 요청을 보내는 순간뿐 아니라 성공·실패·종료에서 누가 화면을 수정할 수 있는지 결정해야 한다. framework가 달라도 필요한 판단이며, watcher의 cleanup은 그 판단을 화면 수명에 연결하는 도구다.

[React 계산 응답의 적용 조건](/writing/notes-async-calculation/) · [응답 순서와 취소를 구분하기](/writing/notes-response-ordering/) · [Vue 반응성의 파생 값](/writing/legacy-vue-component/)
