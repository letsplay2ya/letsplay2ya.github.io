---
title: "이전 입력의 응답을 막아도 요청 순서 문제는 남는다"
description: "요청 컨텍스트 검사, 최신 요청 번호, AbortController가 각각 해결하는 문제를 구분합니다. 같은 입력의 중복 요청과 A→B→A 변경도 함께 살펴봅니다."
category: "Frontend"
tags: ["React","비동기 상태","API 설계"]
date: "2026-10-15"
origin: "original"
---

[변경 전 계산 응답을 막는 글](/writing/notes-async-calculation/)에서는 응답을 반영할 때 계약·대상·입력값을 다시 대조했다. 이 조건을 만족하면 항상 가장 최신 결과일까? 같은 입력으로 두 번 요청했다면 그렇지 않을 수 있다.

## 입력이 같아도 요청은 서로 다르다

```text
요청 1: 입력 A ───────────────── 응답 1
요청 2: 입력 A ───── 응답 2
```

둘 다 현재 입력 A와 일치한다. 응답 2를 먼저 반영하고 나중에 도착한 응답 1도 반영하면, 마지막 요청의 결과를 유지한다는 정책은 지켜지지 않는다. 입력의 일치 여부와 요청의 선후 관계는 다른 정보다.

서버 결과가 시간이나 외부 데이터에 따라 바뀔 수 있다면 같은 입력이라고 같은 결과라는 보장도 없다.

## 정책이 최신 요청 우선이라면 순번을 추가하기

다음은 설명용 예제다. 기존 프로젝트 훅을 그대로 옮긴 코드가 아니다.

```ts
function createLatestLoader<T>(
    request: (key: string) => Promise<T>,
    apply: (value: T) => void,
) {
    let latest = 0;

    async function load(key: string) {
        const sequence = ++latest;
        const value = await request(key);
        if (sequence === latest) apply(value);
    }

    function invalidate() {
        latest += 1;
    }

    return { load, invalidate };
}
```

컴포넌트나 화면 수명 동안 loader를 하나 유지하고, 화면 해제 시 invalidate를 호출하는 사용을 가정한다. React 컴포넌트 본문에서 매 렌더마다 새로 만들면 이전 요청과 순번을 공유하지 못한다.

이 코드는 응답 적용 순서만 보여준다. 오류는 호출자에게 전파되며, 실제 화면에서는 로딩·오류 상태도 순번을 검사해야 한다. 무효화한 요청의 finally에서 새 요청의 로딩을 끄는 실수도 가능하다.

## A에서 B로 바꿨다가 A로 돌아오면

입력값 서명만 비교하면 처음 A로 보낸 응답은 현재 A와 다시 일치한다. 이것을 허용할지는 업무 정책이다. 같은 조건의 계산 결과를 재사용해도 된다면 괜찮을 수 있다. 입력을 다시 조작한 뒤에는 과거 요청을 무조건 버려야 한다면, 입력 변경 시 증가하는 revision 같은 정보가 추가로 필요하다.

화면 수명을 표시하는 값과 입력 변경 revision, 요청마다 증가하는 sequence를 같은 개념으로 취급하지 않는 것이 중요하다.

## 취소는 상태 검사와 다른 역할이다

AbortController는 지원하는 비동기 작업에 취소 신호를 보낸다. fetch를 취소할 때 사용할 수 있지만, 서버에서 이미 시작한 작업을 되돌리는 기능은 아니다. 취소와 동시에 끝난 응답, 별도 후처리 Promise까지 고려하면 화면에 적용할 조건도 유지하는 편이 안전하다.

각 요청의 실패를 모두 무시해서도 안 된다. 취소로 종료한 것인지 실제 네트워크 오류인지 구분해 사용자 경험과 로그 정책을 정한다.

## 무엇을 테스트해야 할까

핵심은 응답 순서를 직접 제어하는 것이다. 두 Promise를 만들고 두 번째를 먼저 resolve한 뒤 첫 번째를 resolve한다. 이후 적용된 결과가 정책에 맞는지 본다. 입력 A→B→A, 화면 해제, 이전 요청의 오류·finally가 최신 상태를 덮는 경우도 나눈다.

코리안리의 기존 `useAutoCalculationGuard`는 현재 계약·대상·입력과 화면 수명을 대조한다. 요청 시작 때마다 순번을 증가시키는 구조는 아니므로, 이 글의 최신 요청 우선 정책이 이미 구현되어 있다고 설명하지 않는다.

참고: [AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController). [동작을 확인하는 예제](/lab/)에서는 입력 변경에 따른 응답 제외를 볼 수 있다.
