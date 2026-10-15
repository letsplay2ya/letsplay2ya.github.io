---
title: "오라클 SQL-파이썬 연동"
description: "필수 정보를 확인한다."
date: "2025-01-03"
tags: []
category: "Database / oracle"
origin: "hexo"
legacyUrl: "/2025/01/03/oracle_ch4/"
---
<!-- hexo-import:v1 sha256=ad404624b4b9061bff3ea32e0a365c268f75fa412d1bccbf6a6e81617e8353b0 -->

![](/legacy-assets/images/thumbnail/oracle.jpg)

-   파이참에서 가상환경을 만들어 오라클 연동 예제를 작성한다.
-   아나콘다, 파이참, 그리고 오라클 설치는 생략한다.

  

## 가상환경 활성화

-   cmd 창에서 가상 환경을 세팅 하도록 한다. (권장: 관리자 실행)
-   바탕화면에 필자는 `python_oracle` 폴더를 생성했다.
-   현재 경로는 아래와 같다.

```powershell
C:\Users\1\Desktop\python_oracle> 
```

-   먼저 가상환경을 만든다.

```powershell
conda create --name your_env_name python=3.8
.
.
done
#
# To activate this environment, use
#
#     $ conda activate python_oracle
#
# To deactivate an active environment, use
#
#     $ conda deactivate
```

-   your\_env\_name 대신 다른 이름으로 설정해도 된다.
-   가상 환경에 접속한다.

```powershell

C:\Users\1\Desktop\python_oracle>conda activate python_oracle
(python_oracle) C:\Users\1\Desktop\python_oracle>
```

  

## 필수 라이브러리 설치

-   ML을 위한 필수 라이브러리를 설치한다.
-   pycaret & oracle

```powershell
(python_oracle) C:\Users\1\Desktop\python_oracle>pip install pycaret
.
.
.
... wordcloud-1.8.1 yellowbrick-1.3.post1
(python_oracle) C:\Users\1\Desktop\python_oracle>pip install cx_Oracle
Collecting cx_Oracle
  Downloading cx_Oracle-8.2.1-cp38-cp38-win_amd64.whl (219 kB)
     |████████████████████████████████| 219 kB 2.2 MB/s
Installing collected packages: cx-Oracle
Successfully installed cx-Oracle-8.2.1
(python_oracle) C:\Users\1\Desktop\python_oracle> deactivate
```

-   `deactivate` 한 뒤, `lsnrctl status` 명령어를 통해 확인한다.

```powershell
C:\Users\1\Desktop\python_oracle>lsnrctl status
LSNRCTL for 64-bit Windows: Version 19.0.0.0.0 - Production on 16-7월 -2021 10:28:24

Copyright (c) 1991, 2019, Oracle.  All rights reserved.

(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=localhost)(PORT=1521)))에 연결되었습니다
리스너의 상태
------------------------
별칭                     LISTENER
버전                     TNSLSNR for 64-bit Windows: Version 19.0.0.0.0 - Production
시작 날짜                 13-7월 -2021 17:21:03
업타임                   2 일 17 시간. 7 분. 25 초
트레이스 수준            off
보안                     ON: Local OS Authentication
SNMP                     OFF리스너 매개변수 파일   C:\ORACLE\WINDOWS.X64_193000_db_home\network\admin\listener.ora
리스너 로그 파일         C:\ORACLE\diag\tnslsnr\DESKTOP-F7LRGM5\listener\alert\log.xml
끝점 요약 청취 중...
  (DESCRIPTION=(ADDRESS=(PROTOCOL=tcp)(HOST=127.0.0.1)(PORT=1521)))
  (DESCRIPTION=(ADDRESS=(PROTOCOL=ipc)(PIPENAME=\\.\pipe\EXTPROC1521ipc)))
  (DESCRIPTION=(ADDRESS=(PROTOCOL=tcps)(HOST=DESKTOP-F7LRGM5)(PORT=5500))(Security=(my_wallet_directory=C:\ORACLE\admin\orcl\xdb_wallet))(Presentation=HTTP)(Session=RAW))
서비스 요약...
"CLRExtProc" 서비스는 1개의 인스턴스를 가집니다.
  "CLRExtProc" 인스턴스(UNKNOWN 상태)는 이 서비스에 대해 1 처리기를 가집니다.
"orcl" 서비스는 1개의 인스턴스를 가집니다.
  "orcl" 인스턴스(READY 상태)는 이 서비스에 대해 1 처리기를 가집니다.
"orclXDB" 서비스는 1개의 인스턴스를 가집니다.
  "orcl" 인스턴스(READY 상태)는 이 서비스에 대해 1 처리기를 가집니다.
명령이 성공적으로 수행되었습니다

`(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=localhost)(PORT=1521)))`에 연결되었습니다
```

  

## 연동코드 작성

-   필수 정보를 확인한다.
    
    -   IP주소: localhost
    -   Port번호: 1521
    -   서비스이름: orcl
-   JupyterLab을 연 후 코드를 작성한다. (관리자 살행)
    
    -   가상환경 `python_oracle` 으로 연결이 되어 있는지 확인한다.
-   먼저 Oracle에서 가져오는 코드이다.
    

```python
import cx_Oracle
import pandas as pd

dsn = cx_Oracle.makedsn('localhost', 1521, 'orcl')
db = cx_Oracle.connect('scott', 'tiger')

cursor = db.cursor()
cursor.execute("""select * from AIR_POLLUTION_TRAIN""")

row = cursor.fetchall()
colname = cursor.description
col = []

for i in colname:
    col.append(i[0])
    

train_oracle = pd.DataFrame(row, columns = col)
print(train_oracle.shape)
# (7111, 12)
```

-   이번에는 임시 테이블을 만들어서 Python에서 직접 테이블을 가져오는 쿼리를 작성한다.

```python
import pandas as pd
import cx_Oracle
from sqlalchemy import types, create_engine

#######################################################
### DB connection strings config
#######################################################
tns = """
  (DESCRIPTION =
    (ADDRESS = (PROTOCOL = TCP)(HOST = localhost)(PORT = 1521))
    (CONNECT_DATA =
      (SERVER = DEDICATED)
      (SERVICE_NAME = orcl)
    )
  )
"""

usr = "scott"
pwd = "tiger"

engine = create_engine('oracle+cx_oracle://%s:%s@%s' % (usr, pwd, tns))
df = pd.DataFrame({'col1': [1,2,3], 
                   'col2': ["A", "B", "C"]})
print(df)

df.to_sql('test_table', engine, index=False, if_exists='replace')
```

```text
   col1 col2
0     1    A
1     2    B
2     3    C
```
