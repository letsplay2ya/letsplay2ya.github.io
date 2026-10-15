---
title: "오라클 SQL-오라클 접속"
description: "윈도우 시작 버튼을 누르고 검색창에 cmd를 입력"
date: "2025-01-03"
tags: []
category: "Database / oracle"
origin: "hexo"
legacyUrl: "/2025/01/03/oracle_ch1/"
---
<!-- hexo-import:v1 sha256=2a089ba3c381cebb189091b2432c22b7f18b92237acec95fd49be16b8d4f1de6 -->

![](/legacy-assets/images/thumbnail/oracle.jpg)

## 오라클 접속 명령어 확인

-   윈도우 시작 버튼을 누르고 검색창에 cmd를 입력
    
-   명령 프롬프트를 실행 (가급적 관리자 실행)
    

```sql
Microsoft Windows [Version 10.0.19042.1083]
(c) Microsoft Corporation. All rights reserved.

	C:\Windows\system32>sqlplus "/ as sysdba"


SQL*Plus: Release 19.0.0.0.0 - Production on 수 7월 14 12:06:33 2021
Version 19.3.0.0.0

Copyright (c) 1982, 2019, Oracle.  All rights reserved.


다음에 접속됨:
Oracle Database 19c Enterprise Edition Release 19.0.0.0.0 - Production
Version 19.3.0.0.0

SQL>
```

-   위와 같이 접속한 유저는 SYS이다.
    -   모든 권한을 소유한 최고 권한 유저

  

## 유저 생성

-   오라클 11버전처럼 생성하고 싶을 때, dba 권한이 있는 계정으로 아래 명령어를 실행한다.

```sql
SQL> ALTER SESSION SET "_ORACLE_SCRIPT"=true;
```

-   새로운 유저를 생성하고 Role을 부여하도록 한다.

```sql
SQL> create user scott identified by tiger;
사용자가 생성되었습니다.
```

-   `scott` 유저에 dba롤(Role)을 부여한다.

```sql
SQL> grant dba to scott;
권한이 부여되었습니다.
```

-   `scott` 유저로 접속한다.

```sql
SQL> connect scott/tiger;
연결되었습니다.
```

-   접속한 유저가 `scott` 인지 확인한다.

```sql
SQL> show user;
USER은 "SCOTT"입니다
```

-   다시 `Sys` 계정으로 연결한다.

```sql
SQL> connect sys/your_password as sysdba
```

-   모든 유저를 확인한다.

```sql
SQL> SELECT * FROM all_users ORDER BY created;
.
.
.
USERNAME
--------------------------------------------------------------------------------
   USER_ID CREATED  COMMON OR INHERI
---------- -------- ------ -- ------
DEFAULT_COLLATION
--------------------------------------------------------------------------------
IMPLIC ALL_SH
------ ------
SCOTT
       109 21/07/14 NO     N  NO
USING_NLS_COMP
NO     NO

38 행이 선택되었습니다.
```
