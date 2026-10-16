---
title: '자동계산에서 변경 전 비동기 응답 반영 막기'
description: '응답 도착 시 계약·대상·입력값을 다시 확인해 현재 상태에 유효한 계산 결과만 반영하는 공통 훅을 정리했습니다.'
category: 'Frontend'
tags: ['React', '비동기 상태', '입력값 서명']
date: '2026-10-08'
featured: true
featuredOrder: 2
origin: 'project'
project: 'koreanre-ai-assistant'
---

계산 API가 성공했더라도 그 결과를 현재 화면에 적용할 수 있는지는 다시 판단해야 합니다. 요청 이후 사용자가 계약을 바꾸거나 입력 조건을 수정했을 수 있기 때문입니다. [코리안리 특종보험 프로젝트](/projects/koreanre-ai-assistant/)의 요율산정 화면에서는 응답 적용 시점에 업무 상태를 대조하도록 구성했습니다.

## 요청할 때와 응답할 때의 조건

현재 계약의 조건 A로 계산을 시작한 후 사용자가 조건 B로 수정했다고 가정합니다. 뒤늦게 도착한 A의 결과를 현재 값에 넣으면 화면의 입력과 계산 결과가 서로 다른 조건을 가리킵니다.

이를 판단하려면 요청을 보냈다는 사실뿐 아니라 어떤 계약의 어떤 대상을 어떤 입력으로 계산했는지 기록해야 합니다. 요청 컨텍스트에 UW 번호, 계산 대상 키, 입력값 서명과 화면 수명을 나타내는 값을 담았습니다.

## 현재 상태를 다시 읽어 비교하기

공통 훅은 응답 적용 시 다음 조건을 확인합니다.

1. 요청을 시작한 화면의 수명이 유지되어 있는가.
2. 현재 계약 번호가 요청 당시와 같은가.
3. 계산 대상 키가 같은가.
4. 계산에 사용한 입력값 서명이 같은가.

실제 계산 화면은 응답을 적용하기 전에 최신 store에서 계약과 대상을 읽고 현재 입력 서명을 다시 만듭니다. 그 값이 요청 컨텍스트와 일치할 때만 결과를 반영합니다. 화면이 해제될 때는 수명 값을 변경해 기존 요청을 무효화합니다.

```ts
// 실제 훅의 판단 조건을 설명하기 위해 축약한 예시입니다.
type Context = {
  epoch: number;
  contract: string;
  target: string;
  signature: string;
};

function canApply(request: Context, current: Context | null) {
  return current !== null
    && request.epoch === current.epoch
    && request.contract === current.contract
    && request.target === current.target
    && request.signature === current.signature;
}
```

여기서 화면 수명 값은 요청마다 증가하는 요청 순번과 다릅니다. 같은 화면에서 동일 입력으로 여러 번 요청한 경우의 응답 순서까지 이 조건으로 판별하지는 않습니다.

## 입력값 서명에 무엇을 넣을 것인가

서명은 계산에 사용한 입력을 구분해야 합니다. 계산 결과처럼 요청 조건이 아닌 값까지 넣으면 결과를 저장한 일이 다음 판단의 입력 변경으로 취급될 수 있습니다. 숫자의 표기 차이도 실제 입력 변경과 구분할 필요가 있습니다.

의료배상 LOL·DED 관련 기존 테스트는 `1,000`과 `1000` 같은 표기를 정규화하고, 기본보험료 계산 결과가 갱신돼도 해당 요청 입력의 서명이 유지되는지 확인합니다. 반대로 한도나 자기부담금 등 실제 요청값을 바꾸면 서명도 달라져야 합니다.

## 확인할 동작

- 계산 요청 후 다른 계약으로 전환했을 때 기존 결과가 적용되지 않는지 확인합니다.
- 같은 계약 안에서 계산 대상을 바꾼 경우를 확인합니다.
- 요청 이후 입력값을 변경했을 때 이전 조건의 결과가 반영되지 않는지 확인합니다.
- 화면이 해제된 뒤 도착한 응답을 확인합니다.
- 숫자 표기만 달라진 경우와 실제 요청값이 달라진 경우를 구분해 확인합니다.

기존 테스트 소스에서 입력 서명 검증 사례를 확인했습니다. 위 시나리오 전체를 운영 환경에서 실행했다거나 전체 통합 테스트가 통과했다는 의미는 아닙니다.

## 구현 범위

이 구현은 **응답을 상태에 반영할지 결정하는 기능**입니다. 네트워크 요청을 취소하거나, 동일 입력의 중복 요청 중 가장 나중에 보낸 응답만 적용하도록 순서를 보장하는 기능은 포함하지 않습니다.

비동기 작업의 성공과 현재 화면에 적용 가능한 상태는 별개입니다. 요청 시점의 업무 컨텍스트를 기록하고 응답 시점의 값과 대조하는 기준을 공통화하면, 여러 계산 화면에서도 같은 조건으로 결과를 반영할 수 있습니다.

## 관련 원본 파일

- `src/pages/uw-main/tabs/RateCalculation/utils/useAutoCalculationGuard.ts` — 요청 컨텍스트와 적용 조건
- `src/pages/uw-main/tabs/RateCalculation/RateCSA/ContractCurrent.tsx` — 최신 계약·대상·입력 확인
- `src/pages/uw-main/tabs/RateCalculation/RatePLMed/component/medicalAutoCalculation.ts` — 의료배상 요청 입력의 서명 구성
- `src/pages/uw-main/tabs/RateCalculation/RatePLMed/component/medicalAutoCalculation.test.ts` — 입력 정규화와 실제 변경의 기존 테스트

[프로젝트의 요율산정 화면 보기](/projects/koreanre-ai-assistant/) · [계약별 상태 저장·복원](/writing/notes-workspace-state/)
