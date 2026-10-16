---
title: '계약 A에서 B로 이동하면 Zustand의 상태는 누구의 것인가'
description: 'React의 재마운트와 전역 store의 수명은 다릅니다. 계약별 스냅샷, 최신 캡처 함수, 복원 순서와 원본 복사의 경계를 실제 코드로 짚습니다.'
category: 'Frontend'
tags: ['React', 'Zustand', '상태 관리']
date: '2026-10-08'
updated: '2026-10-16'
origin: 'project'
project: 'koreanre-ai-assistant'
featured: true
featuredOrder: 1
---

계약 A에서 담보를 편집하고 요율 탭을 열었다. B를 확인한 뒤 A로 돌아오면 무엇이 남아 있어야 할까? 입력값뿐 아니라 현재 탭, 참고 계약과 종목별 산정 상태도 A의 작업에 속한다. 반대로 B를 처음 열었을 때 A의 값이 보이면 안 된다.

[코리안리 업무 화면](/projects/koreanre-ai-assistant/)은 계약을 바꿀 때 React 화면을 다시 마운트하면서, 여러 Zustand store의 값을 계약별로 보관한다. 이 구조를 이해하려면 **컴포넌트 수명, 전역 저장소 수명, 업무 데이터의 소유 계약**을 구분해야 한다.

## 화면의 경계와 업무의 경계

React에서 key가 바뀌면 해당 컴포넌트의 로컬 상태는 다시 만들어진다. 하지만 모듈에서 생성한 Zustand store는 컴포넌트 밖에 있다. 화면에 key를 주는 것만으로 전역 store가 B의 데이터로 초기화되지는 않는다. [React 문서의 상태 보존·초기화 설명](https://react.dev/learn/preserving-and-resetting-state)과 전역 store의 수명을 함께 봐야 하는 이유다.

| 상태 | 보관 위치 | 계약 전환 시 필요한 일 |
| --- | --- | --- |
| 메인 탭·Assistant 표시 | 화면의 React 상태 | 캡처 함수에 최신 값을 전달 |
| 기본·상세·약관·요율 데이터 | 여러 Zustand store | 현재 계약의 묶음으로 수집하고 다음 계약 값으로 복원 |
| 계약별 작업 묶음 | sidebarStore의 workingUwArr | UW 번호로 찾아 저장·조회 |
| 서버와 동기화한 초기화 기준 | 각 작업의 originalData | 편집 데이터와 참조를 분리 |
| 메뉴 접힘·펼침 | localStorage | 업무 데이터와 별도로 유지 |

마지막 행 때문에 “persist를 쓰니 작업도 새로고침 후 살아남는다”고 읽으면 틀린 설명이 된다. 실제 partialize 대상은 isCollapsed와 expandedMenus뿐이다. 작업 스냅샷은 실행 중인 앱 안에서 사용하는 메모리 상태다.

## 이탈할 때 저장하고, 복원한 뒤 표시하기

단순히 “A 저장 → B 복원”이라고 쓰면 중간 문제가 보이지 않는다. A의 마지막 탭은 로컬 상태에 있고, 기본정보는 전역 store에 있으며, 입력기 내부에는 아직 확정하지 않은 값이 있을 수 있다. 다음은 코드에서 구분해 다루는 시점이다.

1. 메인 탭 변경·저장 버튼에서는 등록된 beforeLeave 핸들러로 현재 입력 반영을 요청한다.
2. 화면 이탈 cleanup에서는 ref에 유지한 최신 캡처 함수를 실행한다.
3. 캡처 함수는 getState()로 여러 store의 현재 값을 수집하고, 로컬 탭·Assistant 상태를 함께 담는다.
4. 다음 계약의 스냅샷이 있으면 각 store에 복원한다. 종목별 정규화와 누락된 상태의 기본 처리도 이 단계에서 한다.
5. 복원 또는 최초 기본·상세 조회가 준비된 뒤 하위 탭 콘텐츠를 마운트한다.

1번이 모든 브라우저 종료·비정상 이탈에서 자동 실행된다는 보장은 없다. 확인한 호출 지점은 메인 탭 변경과 저장 등 명시적인 동작이다. 입력 반영과 스냅샷 캡처를 하나의 작업으로 뭉뚱그리면 이 차이를 놓친다. [마지막 입력과 저장 순서](/writing/notes-commit-before-save/)에서 이 부분을 따로 다룬다.

### cleanup에서 getState만 쓰면 충분할까

전역 store는 getState()로 최신 값을 읽을 수 있다. 하지만 activeTab과 showAssistant는 함수가 만들어진 렌더 시점의 값이다. 마운트 시 한 번 등록한 cleanup이 그 함수를 계속 참조하면 데이터는 최신인데 탭은 예전 값인 스냅샷이 될 수 있다.

다음은 원본의 두 effect와 같은 구조를 보여주는 발췌다. 생략한 주변 코드는 초기 조회와 계약 전환을 처리한다.

~~~tsx
const captureSnapshotRef = useRef(() => {});

useEffect(() => {
  captureSnapshotRef.current = () => captureSnapshot(activeTab, showAssistant);
}, [activeTab, showAssistant, captureSnapshot]);

useEffect(() => () => {
  if (skipSnapshotCaptureRef.current) return;
  captureSnapshotRef.current();
}, []);
~~~

ref가 해결하는 것은 **cleanup이 호출할 함수의 최신성**이다. 아직 입력기 안에만 있는 값을 store에 반영하는 문제까지 해결하지 않는다. 작업을 목록에서 제거하는 경로에는 skipSnapshotCaptureRef를 두어, 삭제한 작업이 cleanup에 의해 다시 저장되지 않게 한다.

### 왜 복원 전에 자식을 그리지 않을까

B의 store가 남은 상태에서 A의 자식을 먼저 마운트하면, A 화면의 초기 계산·선택·그리드 구성이 B 값을 읽고 시작할 수 있다. 나중에 A를 복원하면 자식 입장에서는 초기 데이터가 다시 교체된다. 화면이 잠깐 잘못 보이는 문제를 넘어 초기화 effect가 두 번 다른 전제를 읽는 셈이다.

원본의 렌더 조건은 isRestored뿐 아니라 기존 스냅샷 유무, 최초 기본·상세 조회 완료 상태도 확인한다. 복원한 작업은 그 상태로 진입하고, 처음 여는 작업은 필요한 초기 조회를 기다리는 경로다. 이 조건을 단순한 로딩 표시로만 설명하면 실제 역할을 놓친다.

## 원본과 편집 상태 구분하기

captureOriginalSnapshot은 수집한 데이터를 cloneSnapshot으로 복사한 뒤 originalData에 보관한다. restoreSnapshot도 전달받은 스냅샷을 먼저 복사한다. 원본을 편집 데이터와 분리하고, 보관 중인 값이 복원 후 편집에 끌려 바뀌지 않도록 하는 경계다.

다만 **작업 캡처 전체가 항상 깊은 복사되는 것은 아니다.** captureSnapshot은 buildSnapshot의 결과를 바로 보관한다. buildSnapshot의 omitSetters는 store 최상위 함수 속성을 거르는 작업이며, 중첩 배열·객체를 모두 복제하거나 중첩 함수까지 제거하지 않는다. 중첩 데이터를 직접 변경하는 코드가 추가되면 작업 스냅샷과 참조를 공유할 위험이 남는다.

cloneValue 역시 배열과 일반 객체를 순회하는 구현이다. Date, Map, 순환 참조까지 처리하는 범용 복제 함수로 소개하면 안 된다. 상태 모델에 날짜 문자열 대신 Date를 넣기로 바꾼다면 복제 정책도 함께 바꿔야 한다. structuredClone으로 이름만 교체하는 것도 함수가 남아 있는지, 복사 가능한 타입인지 확인한 뒤 선택할 일이다.

## 소유 계약을 확인하고 지우기

정리 함수가 무조건 전역 store를 비우면 늦게 실행된 A의 정리가 이미 열린 B의 값을 지울 수 있다. clearGlobalUwStoresIfMatch는 store의 uwNo 또는 ownerUwNo가 정리 대상과 같은지 확인한다. 복원과 초기화는 모두 “이 값이 어느 계약 것인가”를 묻는다.

요율 store의 restoreForUw와 누락 스냅샷 처리도 같은 경계에 있다. 저장돼 있지 않은 종목 상태를 이전 계약의 값으로 대신 사용하는 것은 올바른 기본값이 아니다.

## 다른 구조라면 무엇이 달라질까

아래는 현재 구조를 읽고 비교한 대안이다. 프로젝트 당시 이 대안을 모두 실험했다는 기록은 아니다.

| 구조 | 이점 | 감수할 비용 |
| --- | --- | --- |
| 현재처럼 전역 store + 계약별 스냅샷 | 기존 종목 store를 유지하면서 작업 전환 가능 | 수집 목록·복원 순서·누락 필드 정책을 함께 관리 |
| 처음부터 계약 ID별 store 데이터 | 여러 계약을 동시에 참조하기 쉬움 | 모든 읽기·쓰기에서 계약 키 누락을 방지하고 삭제 정책 필요 |
| 화면마다 독립 store 인스턴스 | 수명과 소유자가 가까워짐 | 여러 업무 탭의 공유·원본 초기화·서버 동기화를 다시 설계 |
| 서버에 임시 저장 | 재접속·기기 이동까지 확장 가능 | 버전 충돌·만료·권한·저장 실패 처리가 추가됨 |

현재 요구를 메모리 안의 업무 전환으로 보면 스냅샷은 설명 가능한 선택이다. 새로고침 복구나 동시 편집까지 요구가 넓어지면 같은 설계로 해결됐다고 말할 수 없다.

## 확인할 동작

| 시나리오 | 관찰할 결과 | 놓치기 쉬운 경계 |
| --- | --- | --- |
| A의 탭·값 수정 후 B→A | A의 탭과 값 복원 | 로컬 상태와 전역 상태의 수집 시점 |
| 처음 여는 B | A의 종목 데이터가 없음 | 복원할 스냅샷이 없는 분기 |
| A 제거 후 cleanup | 제거한 A가 다시 생기지 않음 | 자동 캡처 건너뛰기 |
| B 진입 후 A 정리 호출 | B 데이터 유지 | 소유 계약 확인 |
| 원본 캡처 후 중첩 값 편집 | 초기화 기준 유지 | 복사 깊이와 데이터 타입 |
| 새로고침 | 메모리 작업은 초기화 | persist의 실제 저장 대상 |

이 표는 원본 코드로부터 정리한 회귀 검증 항목이다. 포트폴리오의 선택 복사 예제는 작은 React 상태를 사용하므로 이 store 생명주기 전체를 검증하지 않는다.

## 구현 범위

근거는 아래 파일의 캡처·복원·렌더 조건과 저장 설정이다. 운영 환경에서 특정 장애가 발생했다거나 처리 시간이 줄었다는 수치는 이 코드만으로 확인할 수 없어 기재하지 않았다.

## 관련 원본 파일

- src/pages/uw-main/useUwSnapshot.ts — 수집, 복제, 소유 계약 확인과 종목별 복원
- src/pages/uw-main/index.tsx — 최신 캡처 ref, 입력 반영 호출, 하위 탭 렌더 조건
- src/stores/sidebarStore.ts — workingUwArr와 persist의 partialize 범위
- src/pages/uw-main/tabs/RateCalculation/RateDNO/useRateDnoStore.ts — 요율 상태의 소유 계약

[프로젝트의 네 개 업무 탭 보기](/projects/koreanre-ai-assistant/) · [비동기 계산 결과의 적용 조건](/writing/notes-async-calculation/)
