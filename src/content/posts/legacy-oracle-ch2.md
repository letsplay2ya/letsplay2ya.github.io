---
title: "오라클 SQL-SQL Developer 설치"
description: "다음의 URL(https://www.oracle.com/tools/downloads/sqldev-downloads.html)로 접속하여 오라클 SQL Developer를 다운로드 받는다."
date: "2025-01-03"
tags: []
category: "Database / oracle"
origin: "hexo"
legacyUrl: "/2025/01/03/oracle_ch2/"
---
<!-- hexo-import:v1 sha256=2627704cbd212c3eff862af333c55808d30a91c38916297c0060240de86b760d -->

![](/legacy-assets/images/thumbnail/oracle.jpg)

<span id="SQL-Developer-설치"></span>

## SQL Developer 설치

-   다음의 URL([https://www.oracle.com/tools/downloads/sqldev-downloads.html](https://www.oracle.com/tools/downloads/sqldev-downloads.html))로 접속하여 오라클 SQL Developer를 다운로드 받는다.
    
-   이 때, 자바가 설치가 되어 있지 않다면 `Windows 64-bit with JDK 8 included` 를 클릭하여 다운로드 받는다.
    
-   다운로드 시, 압축 해제 후, `sqldeveloper.exe` 를 실행한다.
    
-   메뉴의 첫 번째 파일 모양을 클릭하여 새 갤러리를 오픈한다.
    
-   범주 영역에서 접속 > 데이터베이스 접속을 순차적으로 클릭한다.
    
-   다음 화면에서 Name은 orcl로 하고, 사용자 이름은 scott, 패스워드는 tiger로 입력한다.
    
-   호스트 이름은 localhost, 포트는 1521, SID는 orcl로 적고 \[테스트\] 버튼을 클릭한다.
    
-   왼쪽 하단에 `상태: 성공` 이라면 정상적으로 접속이 가능한 상태임을 의미한다.
    

```sql
alter session set nls_date_format='RR/MM/DD';

drop table emp;
drop table dept;

CREATE TABLE DEPT
       (DEPTNO number(10),
        DNAME VARCHAR2(14),
        LOC VARCHAR2(13) );

INSERT INTO DEPT VALUES (10, 'ACCOUNTING', 'NEW YORK');
INSERT INTO DEPT VALUES (20, 'RESEARCH',   'DALLAS');
INSERT INTO DEPT VALUES (30, 'SALES',      'CHICAGO');
INSERT INTO DEPT VALUES (40, 'OPERATIONS', 'BOSTON');

CREATE TABLE EMP (
 EMPNO               NUMBER(4) NOT NULL,
 ENAME               VARCHAR2(10),
 JOB                 VARCHAR2(9),
 MGR                 NUMBER(4) ,
 HIREDATE            DATE,
 SAL                 NUMBER(7,2),
 COMM                NUMBER(7,2),
 DEPTNO              NUMBER(2) );

INSERT INTO EMP VALUES (7839,'KING','PRESIDENT',NULL,'81-11-17',5000,NULL,10);
INSERT INTO EMP VALUES (7698,'BLAKE','MANAGER',7839,'81-05-01',2850,NULL,30);
INSERT INTO EMP VALUES (7782,'CLARK','MANAGER',7839,'81-05-09',2450,NULL,10);
INSERT INTO EMP VALUES (7566,'JONES','MANAGER',7839,'81-04-01',2975,NULL,20);
INSERT INTO EMP VALUES (7654,'MARTIN','SALESMAN',7698,'81-09-10',1250,1400,30);
INSERT INTO EMP VALUES (7499,'ALLEN','SALESMAN',7698,'81-02-11',1600,300,30);
INSERT INTO EMP VALUES (7844,'TURNER','SALESMAN',7698,'81-08-21',1500,0,30);
INSERT INTO EMP VALUES (7900,'JAMES','CLERK',7698,'81-12-11',950,NULL,30);
INSERT INTO EMP VALUES (7521,'WARD','SALESMAN',7698,'81-02-23',1250,500,30);
INSERT INTO EMP VALUES (7902,'FORD','ANALYST',7566,'81-12-11',3000,NULL,20);
INSERT INTO EMP VALUES (7369,'SMITH','CLERK',7902,'80-12-11',800,NULL,20);
INSERT INTO EMP VALUES (7788,'SCOTT','ANALYST',7566,'82-12-22',3000,NULL,20);
INSERT INTO EMP VALUES (7876,'ADAMS','CLERK',7788,'83-01-15',1100,NULL,20);
INSERT INTO EMP VALUES (7934,'MILLER','CLERK',7782,'82-01-11',1300,NULL,10);

commit;

drop  table  salgrade;

create table salgrade
( grade   number(10),
  losal   number(10),
  hisal   number(10) );

insert into salgrade  values(1,700,1200);
insert into salgrade  values(2,1201,1400);
insert into salgrade  values(3,1401,2000);
insert into salgrade  values(4,2001,3000);
insert into salgrade  values(5,3001,9999);

commit;
```

-   전체 선택 후 상단 ▶️ 을 눌러 명령문을 실행한다.
    
-   마지막으로 조회 쿼리를 작성하여 `emp` 테이블의 결과가 나오는지 출력한다.
    

```sql
SELECT * FROM emp;
```

-   이제 모두 정상적으로 나온 것을 확인할 수 있다. 실습준비는 끝이 난 것이다.

  

## 실습소스

-   실습 소스는 아래에서 다운로드 받는다.
    -   참조: [https://1drv.ms/u/s!ApbMVPF0rupskKYe0Rgwfd6NJh6mdg?e=ieUPEK](https://1drv.ms/u/s!ApbMVPF0rupskKYe0Rgwfd6NJh6mdg?e=ieUPEK)
