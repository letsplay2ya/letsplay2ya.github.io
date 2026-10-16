# 약관 판정·스크롤 동기화 글의 소스와 검증

2026-10-16 추가. 원본 업무 저장소는 변경하지 않았다.

## 약관

- 글: src/content/posts/notes-clause-eligibility.md
- 예제: src/components/experiments/ClauseEligibilityDemo.tsx
- 판정: src/lib/clause-eligibility.ts
- 원본: koreanre_frt/src/pages/uw-main/tabs/TermnCondition/termClauseEligibility.ts
- 옮기면서 바꾼 부분: 전체 업무 API 타입을 판정에 필요한 세 필드의 타입으로 축소. 조건식·문자열 정규화는 동일.
- 검증: 판정 36개 조합과 정규화·누락 경계를 본문 코드와 예제 함수 각각에 적용.
- 변경분의 store 간 반영, 계수 병합, 상품군별 API 저장은 예제에 옮기지 않았다. 글에서 원본 분석과 실행한 검증을 구분했다.

## 스크롤

- 글: src/content/posts/notes-keyed-scroll-sync.md
- 예제: src/components/experiments/ScrollSyncDemo.tsx
- 훅 사본: src/components/experiments/original/useSyncedSectionScroll.ts
- 원본: koreanre_frt/src/hooks/useSyncedSectionScroll.ts
- 두 훅 파일의 SHA-256: 359412113A2B52D28C6A64E537317E4D78A93DE9A9878F5D1D717CD8A64811D8
- 옮기면서 바꾼 부분: 없음. 가상 표와 제어 버튼은 별도 작성.
- 예제는 원본 훅이 찾는 클래스를 가진 단순 DOM을 생성한다. AG Grid 패키지나 실제 보험 데이터·API를 사용하지 않는다.
- 검증: 본문의 숫자 계산, 브라우저의 키/순서 연결·정방향/역방향 비율·DOM 교체·동기화 해제, 모바일 가로 넘침.
- 원본 syncedScroll.test.tsx는 읽어서 기존 검증 범위를 확인했다. 해당 업무 저장소의 전체 테스트를 실행한 결과로 소개하지 않는다.

## 실행

```sh
npm run test:workflow
npm run check
npm run build
npm run test:site
```

글의 “검증했다”는 표현은 위 예제와 사이트 검증을 뜻한다. 운영 시스템 전체의 통합·성능 검증과 구분한다.
