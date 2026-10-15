---
title: "오라클 SQL-CSV파일 업로드"
description: "왼쪽 상단에 ➕ 버튼 클릭 후, 테이블(필터링됨) > 오른쪽 마우스버튼 > 데이터 임포트를 클릭"
date: "2025-01-03"
tags: []
category: "Database / oracle"
origin: "hexo"
legacyUrl: "/2025/01/03/oracle_ch3/"
---
<!-- hexo-import:v1 sha256=aacd9c6dc84894a4a3417157b11a99248883978add594524693bf384947cc281 -->

![](/legacy-assets/images/thumbnail/oracle.jpg)

<span id="SQL-Developer"></span>

## SQL Developer

-   왼쪽 상단에 ➕ 버튼 클릭 후, `테이블(필터링됨) > 오른쪽 마우스버튼 > 데이터 임포트`를 클릭
    
-   아래와 같이 `[데이터 임포트 마법사]` 창이 활성화 됨.
    
-   여기에서 `[찾아보기]` 클릭 한다.
    
-   해당 파일을 찾아서 불러온다.
    
-   파일에 이상이 없는지 확인한다.
    
-   테이블 이름을 지정한다.
    
-   여기에서 불러오지 않을 컬럼은 삭제가 가능하다.
    
-   각 데이터 유형을 체크한다.
    
-   마지막 단계에서 완료 버튼을 누릅니다.
    
-   파일이 정상적으로 import 되었다면 아래와 같이 DB에 추가가 됩니다.
    
-   쿼리를 통해서 실제 조회가 되는지 확인한다.
    

```sql
select * from air_pollution_train;
```

  

## 명령 프롬트프

-   이번에는 cmd 창에서 test 데이터를 불러오도록 한다.
-   먼저 현재 경로를 확인한다.

```sql
SQL> host cd
C:\Windows\system32
```

-   해당 데이터는 `C:\Users\1\Desktop\tabular-playground-series-jul-2021` 에 있기 때문에 이동하도록 한다.
-   먼저 `exit` cmd 터미널로 변환 뒤, 경로를 수정한다.

```sql
SQL> exit
C:\Windows\system32> cd your_path
C:\your\path> sqlplus "/ as sysdba"
SQL> host cd
C:\your\path
SQL> host dir
C 드라이브의 볼륨에는 이름이 없습니다.
 볼륨 일련 번호: E657-CFA3

 C:\your\path 디렉터리

2021-07-14  오전 11:51    <DIR>          .
2021-07-14  오전 11:51    <DIR>          ..
2021-06-30  오후 11:44            78,716 sample_submission.csv
2021-06-30  오후 11:44           154,260 test.csv
2021-06-30  오후 11:44           593,980 train.csv
               3개 파일             826,956 바이트
               2개 디렉터리  96,819,806,208 바이트 남음
```

-   먼저 테이블을 생성한다.
    
-   이 때 주의해야 하는 것은 테이블 생성할 때의 데이터 유형과 파일의 데이터 유형이 일치해야 정상적으로 업로드가 되기 때문에 주의 한다.
    
    -   최초 테이블 생성 시, 아래와 같이 작성했다.
    
    ```sql
    CREATE TABLE "SCOTT"."AIR_POLLUTION_TEST" 
       (	"DATE_TIME" DATE, 
    	"DEG_C" NUMBER(38,1), 
    	"RELATIVE_HUMIDITY" NUMBER(38,1), 
    	"ABSOLUTE_HUMIDITY" NUMBER(38,4), 
    	"SENSOR_1" NUMBER(38,1), 
    	"SENSOR_2" NUMBER(38,1), 
    	"SENSOR_3" NUMBER(38,1), 
    	"SENSOR_4" NUMBER(38,1), 
    	"SENSOR_5" NUMBER(38,1)
       ) SEGMENT CREATION IMMEDIATE 
      PCTFREE 10 PCTUSED 40 INITRANS 1 MAXTRANS 255 
     NOCOMPRESS LOGGING
      STORAGE(INITIAL 65536 NEXT 1048576 MINEXTENTS 1 MAXEXTENTS 2147483645
      PCTINCREASE 0 FREELISTS 1 FREELIST GROUPS 1
      BUFFER_POOL DEFAULT FLASH_CACHE DEFAULT CELL_FLASH_CACHE DEFAULT)
      TABLESPACE "USERS" ;
    테이블이 생성되었습니다.
    ```
    
    -   위 형태로 데이터를 올렸으나 `test.csv` 파일의 데이터 형태가 달라서 에러가 생겼다. 그래서 테이블을 아래와 같이 재 생성 했다.
    -   테이블 삭제는 다음 명령어를 이용한다. `DROP TABLE YOUR_TABLE_NAME PURGE;`
    
    ```sql
    CREATE TABLE "SCOTT"."AIR_POLLUTION_TEST" 
       (	"DATE_TIME" VARCHAR2(20 BYTE), 
    	"DEG_C" VARCHAR2(20 BYTE), 
    	"RELATIVE_HUMIDITY" VARCHAR2(20 BYTE), 
    	"ABSOLUTE_HUMIDITY" VARCHAR2(20 BYTE), 
    	"SENSOR_1" VARCHAR2(20 BYTE), 
    	"SENSOR_2" VARCHAR2(20 BYTE), 
    	"SENSOR_3" VARCHAR2(20 BYTE), 
    	"SENSOR_4" VARCHAR2(20 BYTE), 
    	"SENSOR_5" VARCHAR2(20 BYTE)
       ) SEGMENT CREATION IMMEDIATE 
      PCTFREE 10 PCTUSED 40 INITRANS 1 MAXTRANS 255 
     NOCOMPRESS LOGGING
      STORAGE(INITIAL 65536 NEXT 1048576 MINEXTENTS 1 MAXEXTENTS 2147483645
      PCTINCREASE 0 FREELISTS 1 FREELIST GROUPS 1
      BUFFER_POOL DEFAULT FLASH_CACHE DEFAULT CELL_FLASH_CACHE DEFAULT)
      TABLESPACE "USERS" ;
    ```
    
-   이제 `test.csv` 파일을 업로드 하기 위해 `.ctl` 파일을 생성한다.
    
-   메모장 또는 그 외 에디터에서, `control.ctl`을 생성한다.
    

```plaintext
LOAD DATA
INFILE 'test.csv'
INTO TABLE AIR_POLLUTION_TEST
fields terminated by ','
(
    DATE_TIME,
    DEG_C,
    RELATIVE_HUMIDITY,
    ABSOLUTE_HUMIDITY,
    SENSOR_1, 
    SENSOR_2,  
    SENSOR_3, 
    SENSOR_4, 
    SENSOR_5
)
```

-   정상적으로 업데이트가 되는지 확인한다.

```plaintext
C:\Users\1\Desktop\tabular-playground-series-jul-2021>sqlldr scott/tiger control=control.ctl

SQL*Loader: Release 19.0.0.0.0 - Production on 목 7월 15 17:15:41 2021
Version 19.3.0.0.0

Copyright (c) 1982, 2019, Oracle and/or its affiliates.  All rights reserved.

사용된 경로:      규약
커밋 시점에 도달 - 논리 레코드 개수 250
커밋 시점에 도달 - 논리 레코드 개수 500
커밋 시점에 도달 - 논리 레코드 개수 750
커밋 시점에 도달 - 논리 레코드 개수 1000
커밋 시점에 도달 - 논리 레코드 개수 1250
커밋 시점에 도달 - 논리 레코드 개수 1500
커밋 시점에 도달 - 논리 레코드 개수 1750
커밋 시점에 도달 - 논리 레코드 개수 2000
커밋 시점에 도달 - 논리 레코드 개수 2248
테이블 AIR_POLLUTION_TEST:
  2248 행이(가) 성공적으로 로드되었습니다.

로드에 대한 자세한 내용은
  control.log
로그 파일을 확인하십시오.
```
