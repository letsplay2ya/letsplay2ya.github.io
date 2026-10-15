# 게시글 개정 · 2026-10-15

기존 글 16편의 구성을 점검하고 Java·Vue·Thymeleaf 6편을 우선 개정했다. 설치 기록과 Plotly 등 나머지 10편은 당시 환경의 학습 기록으로 남겨 두었으며, 이번에 모두 최신화한 것은 아니다.

## 개정한 글

- `legacy-getter-and-setter`: 단순 접근자 정의에서 객체의 변경 규칙, 생성 검증, 컬렉션 반환과 DTO 구분으로 보강.
- `legacy-javatrycatch`: checked/unchecked를 오류 원인이나 심각도로 나눈 설명 수정. 예외 전달·원인 보존·자원 정리 구분.
- `legacy-simpledateformaterror`: try-catch 필수라는 설명 수정. throws, 엄격한 파싱, 전체 문자열 검사와 LocalDate 예제 추가.
- `legacy-vue-component`: IIFE를 반응형 계산처럼 설명한 부분 수정. computed·watch·상태 모델 구분.
- `legacy-vue-data-structure`: 특정 라이브러리 이벤트 모양의 일반화 제거. 이벤트 어댑터와 버전 확인, 클릭 전파·접근성 고려 추가.
- `legacy-thymeleaf-javascript`: 인라이닝 활성화 조건, data 속성과 JSON 직렬화 혼동, DOM 출력 문맥 설명 수정.

최초 작성일과 게시글 경로는 유지하고 `updated`를 추가했다. 목록은 최근 작성·수정일 기준이며 동률이면 최초 작성일이 최신인 글을 먼저 표시한다. 이전 목차 ID는 본문 시작에 호환 앵커로 남겼다. 개정 전 원고는 Git 이력에서 확인할 수 있다. 개정 원고에서 초기 import 체크섬을 제거해 자동 복구 원고와 구분한다.

## 새 글

- `notes-full-snapshot-api`: 누락·null·빈 배열의 의미, 전체 상태 저장과 잠금·트랜잭션의 한계. 백엔드 코드 분석이며 개인 구현 성과가 아니다.
- `notes-response-ordering`: 입력 일치 검사와 요청 순서 제어, A→B→A 변경, 취소의 역할. 기존 훅에 없는 정책은 설명용 예제로 구분.
- `notes-stable-identity-save`: 정렬 후 식별자 기반 편집 병합, UI id와 서버 식별자, 복합키와 오류 처리. 원본 프론트엔드 근거에 연결.

공식 문서 링크를 각 글에 포함했다. 운영 장애·개선 수치·개인 담당 범위를 새로 만들어 넣지 않았다.

## 검증

`npm.cmd run test:articles`는 원고 코드 블록에서 완결된 예제를 추출한다. Java 17 이상 JDK의 `javac`·`java`가 PATH에 필요하며 `--release 17`로 컴파일한다. 금액 검증·윤년·잘못된 날짜·checked 예외 전달과 Vue computed·식별자 병합·응답 순서·무효화 예제를 실행한다. 생성 파일은 Git에서 제외되는 `.qa/article-examples/`에 둔다.

축약된 모든 코드 조각과 Thymeleaf 서버 렌더링을 실행한 것은 아니다. 프로젝트 전체 백엔드 테스트나 운영 데이터 저장도 실행하지 않았다. 사이트 빌드·내부 링크·검색·모바일 레이아웃은 `npm.cmd run test:site`로 별도 확인한다.
