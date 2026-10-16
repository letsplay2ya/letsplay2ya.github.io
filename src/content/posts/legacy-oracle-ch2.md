---
title: "SQL Developer 실습 메모: 연결 이름과 서비스는 다르다"
description: "과거 설치 절차와 샘플 테이블 기록을 접속 정보·날짜 리터럴·실습 환경 확인 관점으로 정리했습니다."
date: "2025-01-03"
tags: ["Oracle","SQL"]
category: "학습 기록"
origin: "hexo"
legacyUrl: "/2025/01/03/oracle_ch2/"
archive: true
updated: "2026-10-16"
---

<span id="SQL-Developer-설치" aria-hidden="true"></span>
<span id="sql-developer-설치" aria-hidden="true"></span>
<span id="실습소스" aria-hidden="true"></span>

SQL Developer는 데이터베이스에 접속하는 클라이언트다. 설치·계정 준비의 전체 흐름은 [통합 안내](/writing/legacy-oracle-install/)로 옮겼다. 이 글은 과거 주소를 유지하면서 실습에서 놓쳤던 부분을 정리한다.

## 도구에 붙인 이름과 실제 연결 대상

연결 이름은 사용자가 구분하기 위한 표기다. 실제 대상은 호스트·포트·서비스 또는 SID와 계정으로 결정된다. 예전 글의 orcl, scott 같은 값을 그대로 입력하기보다 자신의 환경에서 확인한 값을 사용해야 한다.

## 날짜를 문자열로만 넣으면 생기는 의존성

과거 EMP 샘플은 세션 날짜 형식에 맞는 문자열을 넣었다. 날짜만 필요한 실습에서는 의미가 분명한 DATE 리터럴을 사용할 수 있다.

```sql
SELECT DATE '2026-01-03' AS example_day FROM dual;
```

임의 문자열 변환은 명시적 형식과 오류 처리를 별도로 검토한다. 이 글에서는 기존 테이블을 지우는 DROP 명령을 초기화 단계처럼 제시하지 않는다. 독립 실습 스키마·테이블 이름을 먼저 정하는 편이 실수 범위를 줄인다.

이번 개정은 문서 검토이며 Oracle 실행 검증은 하지 않았다. [CSV 데이터 품질 실습](/writing/legacy-oracle-ch3/)은 외부 DB 없이 실행할 수 있는 별도 예제로 제공한다.

참고: [Oracle 19c SQL 리터럴](https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/Literals.html).
