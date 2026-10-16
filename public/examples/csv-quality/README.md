# CSV 적재 실습
Python 3.11 이상, 외부 라이브러리·Oracle 서버 불필요.
```sh
python pipeline.py input.csv --out result
python -m unittest discover -s . -p "test_*.py"
```
최초 실행: 입력 9 / 정상 3 / 거절 6.
같은 result 폴더로 재실행하면 이미 저장한 ID를 중복으로 거절합니다.
새 실험은 다른 --out 경로를 사용하세요. 기존 DB를 자동 삭제하지 않습니다.

정책: 헤더 정확히 일치, YYYY-MM-DD, 금액은 소수점 둘째 자리까지 양수 또는 0.
동일 ID는 먼저 정상 처리된 행을 유지하고 이후 행을 거절합니다.
금액은 최소 단위 정수로 저장합니다. 이 예제는 통화별 소수 자릿수 규칙을 다루지 않습니다.
CSV 레코드 번호는 물리적 파일 줄 번호와 다를 수 있습니다.
실습용 SQLite이며 Oracle 적재 성능·문법 검증 결과가 아닙니다.
