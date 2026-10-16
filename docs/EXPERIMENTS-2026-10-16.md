# Java·Vue·데이터 글의 실행 근거

이번 묶음: 신규 3편, 기존 계산 응답·OCR 근거 글 2편 보강.

## Java

- Spring Framework 6.2.11, H2 2.3.232, javac --release 17.
- 명시적으로 만든 JDK 프록시 + 실제 TransactionInterceptor + JDBC 트랜잭션 매니저. Boot/컴포넌트 스캔은 검증하지 않음.
- 런타임 예외, 자기 호출, 원본 객체 호출, checked 예외, rollbackFor, 내부 catch, 외부 트랜잭션, 다른 REQUIRED 프록시의 rollback-only 등 8개 시나리오.
- 각 호출 후 별도 조회로 커밋 결과 확인. 호출 전체를 감싼 테스트 트랜잭션 없음.
- 의존성 URL·SHA-256: public/examples/transaction-boundary/dependencies.json.
- jar·class는 .qa에서만 생성. 원본 Java 업무 저장소 변경 없음.
- 실행: npm run test:transaction. 결과: public/examples/transaction-boundary/results.json.

## Vue

- 설치된 Vue 3.5.43의 실제 ref/watch/effectScope.
- useLatestSearch.ts는 이번 실험용 구현. 회사 Vue 프로젝트의 코드로 소개하지 않음.
- 뒤집힌 응답, A→B→A, 취소 신호를 무시하는 응답, stale catch/finally, 현재 오류, 빈 검색, scope 종료 검증.
- VueSearchRace.vue가 같은 composable을 사용. 브라우저에서 도착 순서를 제어.
- 실행: npm run test:vue-search, npm run test:site.

## 내용 충돌

- Python 3.12 표준 라이브러리와 SQLite. 신규 예제이며 기존 csv-quality 코드는 변경하지 않음.
- 명시적 BEGIN IMMEDIATE, 레코드별 트랜잭션. 호출자 트랜잭션을 지원하지 않는 계약.
- 동일 내용 재시도, 내용 충돌, 새 ID, 잘못된 입력, INSERT 실패, 중첩 트랜잭션 거절, 동일/상이 내용의 두 연결 경쟁 등 8개 테스트.
- 실제 별도 연결과 barrier·임시 파일 DB 사용. 다른 내용의 승자를 고정하지 않음.
- 파일 전체 원자성·감사 기록·서버 HTTP 응답 재생·운영 DB 성능은 미구현.
- 실행: npm run test:idempotency. Windows에서 PYTHON 환경 변수로 Python 실행 파일 지정 가능.

## 원본 분석 글 보강

- 계산: 원본 입력 정규화와 컨텍스트 조건을 설명용 소규모 모듈로 분리. 동일 조건 반복 요청과 A→B→A의 한계도 테스트.
- OCR: toHighlightArea 본문을 타입만 제거해 분리. 문서 필터는 명시적 PDF 타입만 받도록 축소. 비정상 좌표 결과는 현재 구현의 한계로 기록.
- 실행: npm run test:context. 고객 문서, 실제 PDF 렌더러, 원본 계산 effect 전체를 실행한 결과로 소개하지 않음.

사이트 검증에는 모바일 레이아웃·기존 기능 회귀·정적 링크 검사를 포함한다. 원본 React·Java 업무 저장소는 읽기만 했다.
