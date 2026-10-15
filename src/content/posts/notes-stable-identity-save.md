---
title: "화면의 두 번째 행과 서버의 두 번째 데이터는 같은 항목일까"
description: "정렬과 탭 이동 뒤에도 편집값을 올바른 대상에 저장하려면 위치와 식별자를 구분해야 합니다. 요율 상태 병합 코드를 바탕으로 정리한 사례입니다."
category: "Frontend"
tags: ["TypeScript","상태 관리","데이터 정합성"]
date: "2026-10-15"
origin: "project"
project: "koreanre-ai-assistant"
---

처음 조회한 목록이 A, B 순서라고 하자. 사용자가 B의 값을 편집한 뒤 목록을 B, A로 정렬한다. 편집값을 배열의 두 번째 위치에 저장했다면 이제 그 값은 A로 들어갈 수 있다. 화면의 위치와 데이터의 식별자를 같은 것으로 취급한 결과다.

[코리안리 요율산정 화면](/projects/koreanre-ai-assistant/)의 DNO 저장 병합 코드에서는 현재 목적물 식별자에 대응하는 요율 탭 상태를 찾아 연결한다. 원본의 변수와 구조는 복잡하므로 아래 코드는 원리를 설명하는 별도 예제다.

## 위치가 아니라 식별자로 연결하기

```ts
type Item = { id: string; label: string };
type Edit = { rate: string };

function mergeEdits(
    items: Item[],
    edits: ReadonlyMap<string, Edit>,
) {
    const seen = new Set<string>();
    return items.map(item => {
        if (!item.id || seen.has(item.id)) {
            throw new Error('식별자가 없거나 중복되었습니다.');
        }
        seen.add(item.id);
        const edit = edits.get(item.id);
        if (!edit) throw new Error('편집 상태를 찾을 수 없습니다.');
        return { ...item, rate: edit.rate };
    });
}
```

입력 목록의 순서는 달라져도 같은 id의 편집값을 붙인다. 다만 모든 항목에 편집 상태가 있어야 한다는 정책을 선택한 예제다. 실제 서비스가 미편집 항목을 허용한다면 누락 시 기존 값을 유지할 수도 있다. 조용히 다른 행의 값을 사용하는 것과는 구분해야 한다.

## UI용 id와 서버 식별자도 다를 수 있다

그리드는 새 행을 표시하기 위해 임시 id를 만들 수 있다. 서버는 별도의 일련번호나 복합키로 행을 구분할 수 있다. UI의 id를 그대로 저장하거나 반대로 전부 제거하면 신규 행과 기존 행의 관계를 잃기 쉽다.

원본 DNO 병합에서는 목적물 일련번호로 탭을 찾고, 기존 행과 대응하는 값을 활용해 저장 데이터를 만든다. 일부 약관 변환에서는 UI id를 제거하면서 기존 서버 필드를 병합한다. 모든 테이블에 같은 단일 키 규칙을 적용한 것은 아니다.

## 복합키는 구분자보다 구조를 먼저 생각하기

`policy + "|" + clause` 같은 키를 만들 때 값 자체에 구분자가 들어갈 수 있다면 충돌할 수 있다. 입력에서 금지된 문자라는 계약이 없다면 튜플 직렬화나 중첩 Map 같은 방식을 검토한다.

```ts
const keyOf = (policy: string, clause: string) =>
    JSON.stringify([policy, clause]);
```

이 역시 문자열 두 개로 구성된 키의 예제다. 순서가 없는 객체를 임의로 직렬화하거나 숫자 표기 차이가 있는 값을 그대로 섞으면 다른 정규화 문제가 생길 수 있다.

## 화면에서 보기만 해서는 놓치는 테스트

| 상황 | 확인할 결과 |
| --- | --- |
| A, B를 B, A로 재정렬 | A와 B 각각의 편집값 유지 |
| 항목 추가 | 새 항목에 다른 항목의 값이 붙지 않음 |
| 항목 삭제 | 삭제한 항목의 편집값이 다른 행으로 이동하지 않음 |
| 중복 식별자 | 성공처럼 처리하지 않고 오류로 구분 |
| 서버 기존 행 수정 | 필요한 서버 식별 필드 유지 |

원본에는 목적물 재정렬과 서버 식별자 보존 관련 테스트가 있다. 이번 글의 예제 검증과 원본 시스템 전체 테스트의 통과 여부는 별개다.

근거 파일: `RateDNO/dnoRateSave.ts`, `dnoRateSave.test.ts`, `useRateDnoStore.test.ts`. [계약별 상태 복원 글](/writing/notes-workspace-state/)과 함께 보면, 계약·목적물·행마다 필요한 식별 범위가 다르다는 점을 연결해 볼 수 있다.

