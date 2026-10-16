---
title: "CSV 적재 성공과 데이터 정합성은 다른 문제다"
description: "날짜·금액·중복이 섞인 9건을 검증해 정상 3건과 거절 6건으로 나눕니다. 원본 보존, 실패 사유, 재실행과 롤백까지 확인하는 실행 가능한 실습입니다."
date: "2025-01-03"
tags: ["Python","CSV","데이터 정합성"]
category: "Data Engineering"
origin: "hexo"
legacyUrl: "/2025/01/03/oracle_ch3/"
archive: false
featured: true
featuredOrder: 1
updated: "2026-10-16"
---

<span id="SQL-Developer" aria-hidden="true"></span>
<span id="sql-developer" aria-hidden="true"></span>
<span id="명령-프롬트프" aria-hidden="true"></span>

예전 글에서는 CSV 날짜·숫자 형식이 테이블과 맞지 않아 적재에 실패했다. 모든 컬럼을 VARCHAR2로 바꾸니 업로드는 됐지만, 잘못된 날짜와 숫자를 어떻게 다룰지는 남았다. 적재 도구가 성공했다는 사실과 데이터가 업무 규칙에 맞는다는 사실은 다르다.

이번에는 그 빈 부분을 작은 실습으로 만들었다. 실제 고객 데이터나 운영 장애 수치는 사용하지 않았다. **Python 3.12 표준 라이브러리와 SQLite**로 실행했으며 Oracle SQL*Loader의 성능·트랜잭션을 검증한 결과는 아니다.

## 일부러 잘못된 값을 넣은 9건

[샘플 CSV](/examples/csv-quality/input.csv)에는 잘못된 날짜, 쉼표가 포함된 금액, 중복 ID, 빈 금액, 음수, 날짜 형식 오류를 넣었다. 회사명 안의 쉼표는 정상 CSV 따옴표로 감싼 값이다. 줄을 단순히 쉼표로 split하면 이 값부터 잘못 읽는다.

```csv
record_id,occurred_on,amount,company
A-001,2026-01-01,1000,예시기업
A-002,2026-02-30,200,날짜 오류
A-007,2026-01-07,25.50,"예시, 서비스"
```

## 먼저 규칙을 정했다

날짜는 YYYY-MM-DD이며 존재하는 날이어야 한다. 금액은 0 이상, 소수점 둘째 자리까지이고 천 단위 쉼표는 허용하지 않는다. 동일 ID는 **먼저 정상 처리한 행을 유지**한다. 뒤의 행으로 덮는 정책이 아니다.

이 정책은 파일 순서에 영향을 받는다. 더 엄격하게 하려면 중복 그룹 전체를 거절하는 방법도 있다. 어느 쪽이든 적재 코드 안에 우연히 숨겨 두지 말고 명세로 정해야 한다.

## 원본, 정상 데이터, 거절 사유를 따로 남기기

```text
CSV 파싱 → 원본 staging 보존 → 형식·값·중복 검사
                                  ├─ 정상: records
                                  └─ 실패: rejected.csv + 오류 코드
```

원본을 곧바로 수정하지 않는다. 문자열 검사 후 날짜를 해석하고, 금액은 Decimal에서 최소 단위 정수로 바꿔 이진 부동소수점 반올림 문제를 피했다. 단, 통화마다 소수 자릿수가 다른 일반적인 통화 모델은 아니다.

## 실행해 본 결과

[실행 코드](/examples/csv-quality/pipeline.py), [테스트](/examples/csv-quality/test_pipeline.py), [사용법](/examples/csv-quality/README.md)을 같은 폴더에 받고 다음처럼 실행한다. 외부 패키지와 DB 서버는 필요 없다.

```sh
python pipeline.py input.csv --out result
python -m unittest discover -s . -p "test_*.py"
```

최초 실행 결과는 다음과 같다.

```json
{"input": 9, "accepted": 3, "rejected": 6}
```

| 실패 사유 | 건수 |
| --- | --- |
| 존재하지 않는 날짜 | 1 |
| 금액 표기 오류·빈 값·음수 | 3 |
| 이미 처리한 ID | 1 |
| 날짜 형식 오류 | 1 |

정상 ID는 A-001, A-006, A-007이다. 25.50은 2550으로 저장되고 0원도 정상이다. CSV의 레코드 번호는 따옴표 안에 개행이 있을 때 실제 파일 줄 번호와 다를 수 있다.

## 재실행은 어떻게 되나

같은 result 폴더로 다시 실행하면 저장된 ID와 비교하므로 추가 정상 적재는 0건이다. 기존 DB를 지우고 성공을 다시 만드는 방식이 아니다. 다른 데이터셋으로 실험하려면 다른 출력 폴더를 사용한다.

CSV 열 개수가 잘못됐을 때 부분 저장하지 않는 경우와, DB 제약 위반으로 삽입이 실패하면 앞선 삽입도 롤백되는 경우를 테스트했다. 입력 9 = 정상 3 + 거절 6이라는 건수 대사도 확인한다.

## Oracle로 가져갈 때 남는 일

대량 파일을 전부 메모리에 올리는 이 예제는 큰 데이터 적재용 구현이 아니다. 배치 크기, 재시작 지점, SQL*Loader의 reject·discard 처리, Oracle의 날짜·수치 변환 정책을 별도로 검증해야 한다. 여기서 가져갈 것은 특정 도구보다 **원본을 남기고, 변환 실패를 분리하고, 저장 결과를 대사하는 흐름**이다.

참고: [Python csv](https://docs.python.org/3/library/csv.html), [SQL*Loader 개념](https://docs.oracle.com/en/database/oracle/oracle-database/19/sutil/oracle-sql-loader-concepts.html).
