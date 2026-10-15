---
title: "Vue 분기 처리: computed와 watch를 언제 나눌까"
description: "한 번 실행한 조건문이 입력 변경을 따라가지 않는 이유부터, 파생 값과 부수 효과를 구분하는 기준까지 Vue 3 예제로 정리합니다."
date: "2025-01-03"
tags: ["Vue","TypeScript","반응성"]
category: "Vue"
origin: "hexo"
legacyUrl: "/2025/01/03/vue_component/"
updated: "2026-10-15"
---

<span id="Vue-3-TypeScript-분기처리-정리" aria-hidden="true"></span>
<span id="목차" aria-hidden="true"></span>
<span id="1-템플릿-단에서의-분기-처리" aria-hidden="true"></span>
<span id="2-스크립트-단에서의-분기-처리" aria-hidden="true"></span>
<span id="2-1-lt-script-setup-gt-과-if-else-x2F-switch-문" aria-hidden="true"></span>
<span id="2-1-script-setup과-if-else--switch-문" aria-hidden="true"></span>
<span id="2-2-defineComponent-사용-시" aria-hidden="true"></span>
<span id="2-2-definecomponent-사용-시" aria-hidden="true"></span>
<span id="3-컴포넌트-구조-x2F-상태-x2F-Props-등을-통한-분기-처리" aria-hidden="true"></span>
<span id="3-컴포넌트-구조상태props-등을-통한-분기-처리" aria-hidden="true"></span>
<span id="3-1-Props-타입에-따른-분기" aria-hidden="true"></span>
<span id="3-1-props-타입에-따른-분기" aria-hidden="true"></span>
<span id="3-2-Computed-x2F-Watch를-통한-분기-처리" aria-hidden="true"></span>
<span id="3-2-computed--watch를-통한-분기-처리" aria-hidden="true"></span>
<span id="4-TypeScript와-함께-사용할-때의-팁-유니언-타입-enum-인터페이스-등" aria-hidden="true"></span>
<span id="4-typescript와-함께-사용할-때의-팁-유니언-타입-enum-인터페이스-등" aria-hidden="true"></span>
<span id="4-1-유니언-타입-x2F-enum-적극-활용" aria-hidden="true"></span>
<span id="4-1-유니언-타입--enum-적극-활용" aria-hidden="true"></span>
<span id="4-2-인터페이스로-분기-처리" aria-hidden="true"></span>
<span id="4-3-안전한-옵셔널-체이닝-및-null-병합" aria-hidden="true"></span>
<span id="5-정리" aria-hidden="true"></span>

입력값에 따라 문구를 바꾸려고 즉시실행함수를 만들었는데, 처음 문구만 그대로 남는 경우가 있다. 함수 안에서 `ref.value`를 읽었다는 사실만으로 계산 결과가 반응형이 되지는 않는다.

## 한 번 계산한 값과 파생 값의 차이

```ts
import { computed, ref } from 'vue';

const amount = ref(10);

// setup 실행 시 한 번 계산한 문자열
const initialLabel = (() => amount.value > 10 ? '초과' : '이하')();

// amount의 변경을 따라가는 파생 값
const label = computed(() => amount.value > 10 ? '초과' : '이하');
```

`amount.value = 20`으로 바꾸면 `initialLabel`은 그대로이고 `label.value`는 바뀐다. 템플릿에서는 computed ref를 자동으로 풀어 사용한다. 이전 글의 IIFE 예제는 이 차이를 설명하지 않아 반응형 계산처럼 읽힐 수 있었다.

## 값이 필요하면 computed부터 검토하기

표시 문구, 필터링한 목록, 버튼 비활성 여부처럼 기존 상태에서 계산하는 값은 computed에 두기 좋다. 반응형 의존성이 바뀌지 않았다면 계산 결과를 캐시한다. 현재 시간처럼 반응형 의존성이 없는 값은 시간이 흘렀다는 이유만으로 다시 계산되지 않는다.

computed getter 안에서 API를 호출하거나 다른 상태를 바꾸는 것은 피한다. 값을 읽는 일과 외부 작업의 시작을 분리해야 변경 흐름을 따라가기 쉽다.

## 상태 변화에 따라 일을 해야 한다면 watch

```ts
import { ref, watch } from 'vue';

const search = ref('');
const status = ref('검색어를 입력하세요.');

watch(search, value => {
    status.value = value.trim() ? '검색할 수 있습니다.' : '검색어를 입력하세요.';
});
```

이 예제도 사실 표시 문구만 필요하므로 computed가 더 단순하다. watch는 저장소에 값을 기록하거나 외부 요청을 시작하는 등 부수 효과가 필요한 경우에 검토한다. API 호출을 붙인다면 요청 취소·응답 순서·로딩 상태도 함께 설계해야 한다. watch를 쓴다는 사실이 경쟁 상태를 해결해 주지는 않는다.

## boolean 여러 개보다 가능한 상태를 먼저 정하기

```ts
type LoadState<T> =
    | { status: 'idle' }
    | { status: 'loading' }
    | { status: 'success'; data: T }
    | { status: 'error'; message: string };

function describe(state: LoadState<string[]>): string {
    switch (state.status) {
        case 'idle': return '조회 전';
        case 'loading': return '조회 중';
        case 'success': return state.data.length + '건';
        case 'error': return state.message;
    }
}
```

`isLoading`, `hasError`, `hasData`를 따로 두면 동시에 참인 조합도 만들 수 있다. 위 타입은 성공 상태에만 data가 있다는 관계를 표현한다. 외부 JSON을 이 타입으로 단언하는 것만으로 런타임 검증이 되지는 않는다.

## 화면을 나눌 때의 기준

짧은 표시 조건은 템플릿의 `v-if`로 충분하다. 같은 조건이 여러 곳에서 반복되면 이름 있는 파생 값으로 옮긴다. 상태별 화면이 서로 다른 입력·행동을 가지면 하위 컴포넌트로 나누는 편이 읽기 쉬워질 수 있다. 분기의 개수만으로 컴포넌트 수를 정하지 않는다.

참고: [Vue computed](https://vuejs.org/guide/essentials/computed.html), [Vue watchers](https://vuejs.org/guide/essentials/watchers.html), [TypeScript narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html).

