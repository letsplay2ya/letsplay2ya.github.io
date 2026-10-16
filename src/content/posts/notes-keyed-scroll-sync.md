---
title: '너비와 순서가 다른 두 그리드의 스크롤을 맞추려면'
description: '같은 scrollLeft를 복사하는 방식의 한계부터, 업무 키·진행률·DOM 재생성·다음 프레임까지 유지하는 이벤트 잠금까지 실제 훅을 따라 설명합니다.'
date: '2026-10-16'
category: 'Frontend'
tags: ['React', 'AG Grid', '브라우저 API']
origin: 'project'
project: 'koreanre-ai-assistant'
---

현재 계약과 참고 계약의 보험료 표를 나란히 놓았다. 오른쪽 열을 확인할 때마다 양쪽 스크롤바를 따로 움직이면 비교하던 구역을 다시 찾아야 한다. 두 표의 가로 위치를 연결하면 편하지만, 왼쪽 scrollLeft를 오른쪽에 그대로 대입하는 것만으로는 충분하지 않다.

코리안리 비교 화면의 useSyncedSectionScroll은 세 가지를 따로 다룬다. **어느 그리드끼리 연결할지**, **너비 차이를 어떻게 변환할지**, **재생성되는 DOM과 후속 이벤트를 어떻게 처리할지**다. 이 글의 예제는 원본 훅을 그대로 가져와 단순한 스크롤 DOM에 연결한다. AG Grid 자체를 실행하는 예제와는 범위가 다르다.

## 첫 번째 문제: 첫 번째 표가 같은 업무는 아니다

Current에는 기준보험료, 약관 할인할증 순으로 표가 있다. Reference에서는 약관 할인할증이 먼저 보일 수 있다. 표시 순서가 다르면 첫 번째끼리 연결하는 코드가 기준보험료와 약관을 묶는다. 스크롤 이벤트는 정상인데 비교 대상이 틀린 상태다.

원본 훅은 기본 order 모드와 key 모드를 구분한다. 동적 구역의 순서가 달라질 수 있는 DNO 상세·요율 화면에서는 pairing: 'key'로 호출한다. 표를 감싼 구역의 data-scroll-sync-key가 연결 기준이다.

```text
Current                      Reference
premium: 기준보험료 ───────→ premium: 기준보험료 (두 번째)
clause:  약관 할인할증 ────→ clause:  약관 할인할증 (첫 번째)
```

예제의 연결 기준을 DOM 순서로 바꾼 뒤 왼쪽 기준보험료를 움직이면 오른쪽 약관 표가 따라간다. 같은 업무 키로 바꾸면 오른쪽 두 번째 표가 반응한다. 식별자는 단순한 부가 속성이 아니라 비교 관계를 표현하는 데이터다.

키 모드가 중복 키까지 해결하지는 않는다. 반대편 검색은 일치하는 첫 그리드를 찾기 때문에 한 비교 루트 안에서 동일 키를 반복하면 대상이 모호해진다. 활성 구역에서는 키를 유일하게 부여하는 규칙이 필요하다.

## 두 번째 문제: 150px는 같은 진행률이 아니다

가로 스크롤의 이동 가능 범위는 전체 내용 너비에서 보이는 너비를 뺀 값이다. scrollWidth와 clientWidth는 이 계산에 쓰이고, scrollLeft는 현재 이동량이다. [MDN의 scrollWidth 설명](https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollWidth)을 기준으로 보면, 내용 너비만 분모로 사용하는 것도 맞지 않다.

```ts
function getScrollRatio(scrollLeft: number, scrollWidth: number, clientWidth: number) {
  const range = Math.max(0, scrollWidth - clientWidth);
  if (range <= 1) return null;
  return Math.min(1, Math.max(0, scrollLeft / range));
}

function getTargetScrollLeft(ratio: number, scrollWidth: number, clientWidth: number) {
  return Math.max(0, scrollWidth - clientWidth) * ratio;
}
```

위 코드는 원본의 DOM 접근을 숫자 인자로 바꾼 설명용 계산이다. 왼쪽 이동 가능 범위가 600이고 현재 이동량이 150이면 25%다. 오른쪽 이동 가능 범위가 800이라면 200으로 이동해야 같은 진행률이 된다.

| 요소 | scrollWidth | clientWidth | 이동 가능 범위 | 25% 위치 |
| --- | --- | --- | --- | --- |
| 왼쪽 스크롤바 | 700 | 100 | 600 | 150 |
| 오른쪽 본문 | 900 | 100 | 800 | 200 |
| 오른쪽 스크롤바 | 500 | 100 | 400 | 100 |

숫자는 원본 테스트에 있는 예시와 같다. 같은 오른쪽 그리드 안에서도 본문과 별도 스크롤바의 범위가 다르므로, 각각 자신의 범위를 기준으로 위치를 계산한다.

이 방식은 “같은 열을 보여 준다”보다 **“같은 상대 위치를 보여 준다”**는 보장에 가깝다. 열의 구성이나 너비 비율이 서로 다르면 50% 지점의 열 이름도 다를 수 있다. 열 단위 비교가 요구라면 열 ID·표시 상태·너비를 포함한 별도 매핑이 필요하다.

## 본문과 눈에 보이는 스크롤바를 함께 듣기

원본은 .ag-center-cols-viewport와 .ag-body-horizontal-scroll-viewport 모두에 scroll 리스너를 붙인다. AG Grid 내부에서 본문과 별도 가로 스크롤바가 연결되므로 사용자의 조작이 어느 요소에서 시작하든 처리하려는 구성이다.

한 요소의 위치만 캐시해 모든 이벤트에 사용하지 않고, 이벤트의 currentTarget으로 실제 출발 요소를 읽는다. 위 표에서처럼 본문과 스크롤바의 범위가 다르면 출발점을 잘못 읽는 것만으로도 진행률이 달라진다.

이 선택은 AG Grid 내부 DOM 클래스에 의존한다. 라이브러리 버전이 바뀌어 DOM 구조나 클래스가 달라지면 확인이 필요하다. 공식 API의 [스크롤 관련 기능](https://www.ag-grid.com/react-data-grid/grid-api/)을 이용하는 대안도 있다. 예를 들어 ensureColumnVisible은 특정 열을 보이게 하는 목적이며, 비율 기반의 연속 동기화와 같은 기능으로 볼 수는 없다.

## 세 번째 문제: 방금 찾은 DOM이 아직 살아 있을까

데이터나 열 구성이 바뀌면 그리드 내부 스크롤 요소가 다시 만들어질 수 있다. effect가 시작될 때 오른쪽 요소를 한 번 찾아 저장하면, 왼쪽 스크롤 이벤트가 나중에 실행될 때 이미 분리된 예전 오른쪽 요소에 값을 쓸 수 있다.

원본은 두 작업을 나눈다.

1. 스크롤 이벤트가 실행되는 순간 반대편 루트에서 활성 그리드를 다시 조회한다.
2. MutationObserver로 자식 DOM 변경을 감지해 새로 생긴 출발 요소에도 리스너를 붙인다.

1번만 있으면 새 오른쪽 요소로 쓰기는 가능해도 그 요소에서 시작한 스크롤 이벤트를 듣지 못한다. 2번만 있으면 기존 리스너가 오래된 반대편 참조를 사용한다. DOM 재조회와 새 리스너 연결은 서로 다른 문제를 해결한다.

WeakSet은 같은 요소에 리스너를 반복해서 붙이는 일을 막는다. observer가 자주 호출될 때는 requestAnimationFrame으로 재탐색을 한 프레임에 한 번으로 묶는다. 관찰 대상은 자식 변경과 data-state 속성이며, 비활성 탭 아래의 그리드는 검색에서 제외한다. [MutationObserver 문서](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver)에서 설명하는 관찰 범위를 실제 옵션과 함께 읽어야 한다.

키 속성 자체의 변경이나 CSS만으로 생긴 너비 변화까지 observer가 모두 감지하는 것은 아니다. 다음 스크롤에서는 새 너비를 읽지만, 레이아웃 변경만으로 곧바로 같은 비율을 다시 맞춰 주는 기능은 없다.

## 서로 따라가다 원래 위치를 끌어당기지 않도록

왼쪽의 scroll 이벤트가 오른쪽 scrollLeft를 바꾸면 오른쪽에서도 후속 scroll 이벤트가 발생할 수 있다. 그 이벤트가 왼쪽을 다시 바꾸면 중복 처리나 반올림에 따른 위치 흔들림이 생길 수 있다.

단순한 boolean 잠금을 함수 끝에서 즉시 풀면 충분하다고 생각하기 쉽다. 하지만 후속 이벤트가 다른 task에서 전달되면 그때는 이미 잠금이 풀려 있다. 원본은 연결 쌍별 guard를 두고 다음 animation frame에서 해제한다. 잠금이 유지되는 동안 같은 쌍의 후속 이벤트는 처리하지 않는다.

전체 화면에 하나의 잠금을 걸지 않는 점도 중요하다. 보험료 표를 맞추는 동안 관계없는 약관 표의 이벤트까지 무조건 막을 이유는 없다. 반대로 같은 쌍에서 사용자가 매우 빠르게 반대 방향으로 조작하면 그 프레임의 입력이 억제될 수 있다. 이 잠금은 모든 입력을 기록하는 큐가 아니라 피드백을 줄이는 제어다.

## 재생성 직후 자동 복구까지 하지는 않는다

예제에서 오른쪽 그리드 다시 만들기를 누르면 새 DOM의 가로 위치는 처음으로 돌아간다. 왼쪽을 다시 움직이면 현재 오른쪽 DOM을 찾아 같은 진행률을 적용한다. 재생성 순간의 자동 위치 복구와 재생성 후 다음 이벤트의 정상 동작은 별개다.

팝업이나 포털 때문에 두 루트 ref가 아직 없으면 훅은 프레임마다 준비 여부를 확인한다. 동기화를 끄거나 화면이 해제되면 대기 프레임, observer, 리스너와 잠금 해제 예약을 정리한다. 한쪽 루트가 끝내 나타나지 않는다면 활성 상태가 끝날 때까지 대기하므로, 장시간 활성화하는 화면에서는 종료 조건을 따로 검토할 수 있다.

## 대안을 고를 때 비교할 것

| 방식 | 잘 맞는 요구 | 확인할 비용 |
| --- | --- | --- |
| DOM 순서 + 같은 픽셀 | 구조와 열 너비가 동일한 고정 화면 | 숨김·재정렬·폭 변경에 취약 |
| 업무 키 + 진행률 | 여러 대응 구역, 서로 다른 스크롤 범위 | 키 유일성, DOM 변화, 이벤트 잠금 관리 |
| 열 ID + Grid API | 같은 의미의 열을 정확히 따라가기 | 열 누락·숨김·이동과 양쪽 API 준비 시점 |
| 자동 연결 없이 독립 스크롤 | 비교 영역의 구조 차이가 큼 | 사용자가 두 위치를 직접 찾는 비용 |

현재 코드가 무엇을 하느냐와 새 요구에 가장 적합한 방식은 다를 수 있다. 진행률 동기화를 완성했다고 해서 열 구조까지 같은 비교 화면이 된 것은 아니다.

## 실행한 검증과 남은 범위

원본의 syncedScroll.test.tsx에는 DOM 순서가 다른 키 연결, 본문·스크롤바의 서로 다른 폭, 역방향 이동, 기본 순서 모드를 확인하는 테스트가 있다. 해당 파일을 읽어 설명의 수치와 조건을 확인했다.

이 사이트에서는 복사한 원본 훅을 실제 브라우저의 단순 스크롤 DOM에서 실행한다. 같은 키 연결과 순서 모드의 잘못된 대상, 50% 비율, 역방향 이동, DOM 교체 후 연결, 동기화 해제 후 이벤트 정리를 확인한다. 두 테스트 환경의 대상은 AG Grid 전체가 아니므로 버전별 실제 그리드의 스크롤바 조작과 렌더링 성능은 별도 확인할 항목이다.

원본 계산은 왼쪽에서 오른쪽으로 진행하는 화면을 전제로 한다. RTL에서는 scrollLeft가 음수가 될 수 있으며 [MDN의 scrollLeft 설명](https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollLeft)에도 이 차이가 있다. 현재의 0~1 제한을 그대로 다국어 RTL 화면의 일반 해법으로 적용하지 않는다.

## 근거와 이어지는 글

- src/hooks/useSyncedSectionScroll.ts — 키·진행률·리스너·observer·프레임 잠금
- src/hooks/syncedScroll.test.tsx — 기존 테스트의 수치와 연결 시나리오
- src/pages/uw-main/tabs/RateCalculation/RateDNO/index.tsx — 비교 모드에서 키 연결 사용
- src/pages/uw-main/tabs/RateCalculation/RateDNO/ContractCurrent.tsx, ContractReference.tsx — 업무 구역의 대응 키
- 이 사이트의 src/components/experiments/original/useSyncedSectionScroll.ts — 원본과 동일한 훅 사본

[계약별 상태 복원과 하위 화면 준비](/writing/notes-workspace-state/) · [위치 대신 업무 식별자를 사용하기](/writing/notes-stable-identity-save/)
