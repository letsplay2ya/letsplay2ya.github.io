---
title: '저장 버튼을 눌렀는데 마지막 입력이 빠지는 이유'
description: '입력기의 초안, store의 값, 저장 payload는 서로 다를 수 있습니다. DNO 요율 화면의 입력 확정·병합·검증 순서와 실패 재현 예제를 정리했습니다.'
date: '2026-10-16'
category: 'Frontend'
tags: ['React', 'AG Grid', '데이터 정합성']
origin: 'project'
project: 'koreanre-ai-assistant'
---

화면에서 10을 25로 바꾼 뒤 저장했다. 그런데 저장 요청에는 10이 들어 있다. 서버가 값을 잃어버렸다고 보기 전에, **사용자가 보는 값이 언제 저장 데이터에 반영되는지**부터 확인할 필요가 있다.

입력기는 편집 중인 문자열을 잠시 보관할 수 있다. blur 때 store에 반영하는 입력이라면 화면의 25와 store의 10이 동시에 존재한다. 저장 함수가 store만 읽으면 “최신 상태를 읽었다”는 설명도 충분하지 않다. 최신인 것은 store이지 아직 확정하지 않은 입력기의 값이 아니기 때문이다.

이 글은 코리안리 DNO 상세·요율 화면의 호출 순서를 읽어 설명한다. 특정 운영 장애가 발생했다는 기록을 재구성한 글은 아니다.

## 세 개의 값과 두 개의 경계

```text
입력기 초안 '25' → 입력 확정 → 요율 store '25'
                            → 상세 데이터와 병합 → 저장 payload
```

첫 경계는 입력 반영 시점이다. 두 번째는 화면용 상태를 서버가 받는 구조로 옮기는 시점이다. 입력 확정만 해도 payload가 저절로 갱신되는 것은 아니다. 반대로 payload 병합만 먼저 해 두고 입력을 나중에 확정하면 이미 만든 payload는 이전 값을 담는다.

마우스로 저장 버튼을 누르면 우연히 포커스가 빠져 정상 동작할 수 있다. 키보드나 별도 이벤트가 저장을 시작할 때도 같은 순서를 보장해야 이 동작이 안정적이다.

## 원본은 무엇을 먼저 실행하나

RateDNO/index.tsx의 저장 처리 부분은 다음 순서다. 아래 코드는 원본의 제어 흐름을 축약한 것으로, 에러 안내와 상세 타입을 생략했다.

```ts
flushPendingRateInputs();
const latestRateState = useRateDnoStore.getState();
const detailStore = useDetailDnoStore.getState();
const result = mergeDnoRateStateForSave(detailStore.ojtList, latestRateState);

if (result.errors.length > 0) {
  setState({ state: 'NONE', stateName: '' });
  return;
}
detailStore.setOjtList(result.ojtList);
setState({ state: 'CANSAVE', stateName: '' });
```

flushPendingRateInputs는 활성 그리드 입력과 data-deferred-rate-input 표시가 있는 입력의 blur를 요청한다. 그 뒤 getState로 값을 읽고, 요율 store를 상세 목적물 데이터에 병합한다. 오류가 있으면 CANSAVE로 넘어가지 않는다. CANSAVE는 상위 저장 흐름을 진행할 준비가 됐다는 신호이며, 서버 저장이 성공했다는 뜻은 아니다.

여기서 blur를 범용 저장 API처럼 받아들이면 안 된다. 실제 helper는 document.activeElement가 그리드 루트 안에 있는지 또는 지연 입력 표시가 있는지 검사한다. 다른 입력 방식이나 비동기 편집기를 추가하면 같은 helper가 충분한지 다시 확인해야 한다. AG Grid도 편집 종료 동작과 관련 설정·API를 별도로 제공한다. [공식 편집 시작·종료 문서](https://www.ag-grid.com/react-data-grid/cell-editing-start-stop/)를 해당 프로젝트 버전에 맞춰 확인할 일이다.

## 왜 모든 편집을 상세 store에 바로 쓰지 않았을까

현재 구현은 요율 탭별 편집 상태와 상세 저장 데이터를 분리한다. 원본 주석은 상세 ojtList를 편집마다 변경하면 이를 의존하는 자동계산 effect가 다시 실행될 수 있다고 설명한다. 저장 직전 병합은 이 의존 관계 안에서 읽을 수 있는 선택이다.

장점은 편집 중 상태와 전송 형식을 구분할 수 있다는 점이다. 비용은 두 상태가 같은 시점에 항상 같지 않다는 점이다. 저장뿐 아니라 탭 이탈, 초기화, 계약 전환에서도 어느 상태를 보관할지 결정해야 한다. 탭별 상태가 생겼으니 저장 객체도 최신일 것이라는 가정이 가장 위험하다.

대안으로 모든 입력을 하나의 정규화 store에 즉시 반영할 수 있다. 그러면 저장 직전 병합이 줄어드는 대신, 자동계산 구독 범위와 입력 중 문자열·확정 숫자의 구분을 다시 설계해야 한다. 현재 구조를 유지할지 선택하려면 병합 코드의 길이보다 계산 의존성과 오류 처리를 함께 비교해야 한다.

## 순서를 바꿔서 재현하기

[실행 예제](/examples/save-order/example.mjs)와 [검증 코드](/examples/save-order/test.mjs)를 같은 폴더에 저장하고 Node.js 22.12 이상에서 실행할 수 있다.

```sh
node test.mjs
```

| 실행 경로 | 입력 초안 | 저장 payload | 확정 후 store |
| --- | --- | --- | --- |
| 읽기 → 확정 | 25 | 10 | 25 |
| 확정 → 읽기 → 검증 | 25 | 25 | 25 |
| 잘못된 값 확정 → 검증 | 빈 문자열 | 생성하지 않음 | 빈 문자열 |

첫 행은 특히 헷갈린다. 실행 후 store를 보면 25가 들어 있어 확정이 실패한 것처럼 보이지 않는다. 하지만 그 전에 만든 payload에는 10이 남는다. 테스트는 의도적으로 잘못된 경로의 10도 확인하여 실패 조건이 실제로 만들어졌는지 검증한다. 올바른 경로에서는 최신 값, 0의 허용, 잘못된 값 차단, 기존 서버 식별자와 원본 객체 보존을 확인한다.

이 예제는 동기 입력 확정의 순서만 분리한 모델이다. React의 effect 순서나 AG Grid의 실제 셀 편집 종료를 실행하지 않는다. 실제 화면 회귀 검증에는 편집 중 저장, Enter·단축키 저장, blur를 일으키지 않는 저장 이벤트, 메인 탭 변경을 각각 넣어야 한다.

## 비동기 확정이면 함수 계약도 달라져야 한다

입력 확정이 비동기 검증을 기다린다면 flush 함수를 호출한 직후 getState를 읽는 것으로 충분하지 않다. 확정 결과를 Promise로 받고 성공 뒤 병합하는 순서가 필요하다. 컴포넌트가 사라진 뒤 결과가 돌아오는 경우에는 계약과 대상 식별자를 재확인해야 한다. 이는 현재 동기 helper가 해결한 범위를 넘어서는 확장 조건이다.

또한 화면 검증을 통과해도 저장 요청이 실패할 수 있다. 저장 가능, 저장 요청 중, 서버 성공을 구분하고 실패 시 편집값을 보존해야 한다. 이 글의 준비 단계 테스트가 네트워크 중복 저장이나 서버 트랜잭션까지 검증하지는 않는다.

## 근거와 이어지는 글

- src/pages/uw-main/tabs/RateCalculation/RateDNO/index.tsx — 입력 확정 후 병합·검증·CANSAVE 전환
- src/pages/uw-main/tabs/RateCalculation/components/commitActiveGridInput.ts — 활성 그리드 입력의 blur
- src/pages/uw-main/tabs/RateCalculation/components/commitActiveDeferredRateInput.ts — 지연 입력의 blur
- src/pages/uw-main/tabs/DetailContract/DetailDNO/index.tsx — 하위 입력 확정 핸들러 등록
- src/pages/uw-main/index.tsx — 메인 탭 변경과 저장의 beforeLeave 호출

[계약 전환 시 스냅샷의 경계](/writing/notes-workspace-state/) · [배열 위치 대신 식별자로 저장하기](/writing/notes-stable-identity-save/)
