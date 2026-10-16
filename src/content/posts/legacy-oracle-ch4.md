---
title: "Python에서 Oracle을 읽을 때 연결 코드 다음에 확인할 것"
description: "DSN·커서 수명·바인드 변수·분할 조회를 한 흐름으로 정리합니다. 기존 cx_Oracle 예제의 누락과 to_sql replace 사용의 의미도 짚습니다."
date: "2025-01-03"
tags: ["Python","Oracle","트랜잭션"]
category: "Database"
origin: "hexo"
legacyUrl: "/2025/01/03/oracle_ch4/"
archive: false
updated: "2026-10-16"
---

<span id="가상환경-활성화" aria-hidden="true"></span>
<span id="필수-라이브러리-설치" aria-hidden="true"></span>
<span id="연동코드-작성" aria-hidden="true"></span>

예전 코드에서는 DSN을 만들고 실제 connect 호출에는 넘기지 않았다. 이 상태의 예제는 어떤 DB를 읽는지 설명하지 못한다. 연결 성공 뒤에도 전체 조회량과 자원 수명, 저장 책임을 정해야 한다.

아래는 python-oracledb의 동기 API를 기준으로 작성한 예제다. 기존 시스템에 적용하려면 DB·드라이버 버전과 Thin/Thick 모드 지원을 확인해야 한다. 이번 작업에서 실제 Oracle 서버 접속은 실행하지 않았다.

## 읽기 작업의 범위를 코드에 드러내기

```python
import os
import oracledb

with oracledb.connect(
    user=os.environ["DB_USER"],
    password=os.environ["DB_PASSWORD"],
    dsn=os.environ["DB_DSN"],
) as connection:
    with connection.cursor() as cursor:
        cursor.execute(
            "SELECT record_id, occurred_on FROM sample_records "
            "WHERE record_id = :record_id",
            record_id="A-001",
        )
        while batch := cursor.fetchmany(100):
            for record_id, occurred_on in batch:
                print(record_id, occurred_on)
```

sample_records와 A-001은 설명용이다. Python 버전과 설치된 드라이버를 기록한 뒤 사용하는 환경에서 확인해야 한다. 이 예제는 문법·공식 API 구조 검토이며 DB 실행 통과를 주장하지 않는다.

## 바인드 변수는 값에 사용한다

사용자 값을 SQL 문자열에 직접 붙이지 않는다. 다만 테이블·컬럼 이름은 값 바인드와 다르다. 동적으로 정할 필요가 있다면 허용한 이름 중 선택하는 식으로 별도 통제한다.

fetchmany는 한 번에 가져오는 결과를 나눌 수 있지만, 뒤에서 모든 batch를 리스트에 모으면 결국 전체 메모리를 사용한다. 네트워크 효율은 arraysize 등 드라이버 설정과 쿼리 자체를 함께 확인해야 한다.

## 연결을 닫는 것과 저장을 확정하는 것은 다르다

with 블록은 자원 정리를 표현한다. 쓰기 작업의 commit 위치와 실패 시 rollback 정책은 별도로 정해야 한다. 여러 작업을 한 트랜잭션으로 묶으려는 코드에서 각 반복마다 commit하면 원하는 원자성을 잃을 수 있다.

과거 to_sql 예제의 if_exists='replace'는 기존 테이블을 교체하는 의미를 가진다. 기존 업무 테이블에 행을 추가하는 기본값처럼 사용하지 않는다. 테이블 생성·스키마 변경·행 적재를 분리해 검토해야 한다.

DB 없이 실행해 볼 데이터 검증 과정은 [CSV 실습](/writing/legacy-oracle-ch3/)에 제공한다.

참고: [python-oracledb 연결과 자원 정리](https://python-oracledb.readthedocs.io/en/stable/user_guide/connection_handling.html), [pandas to_sql](https://pandas.pydata.org/docs/reference/api/pandas.DataFrame.to_sql.html).
