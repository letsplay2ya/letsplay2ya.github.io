---
title: "Oracle에 접속하기 전에: 서버·서비스·계정부터 구분하기"
description: "설치 화면을 따라가기보다 연결에 필요한 정보를 먼저 정리합니다. Oracle 19c의 PDB 로컬 사용자와 접속 확인을 기준으로 기존 설치·접속 글을 묶었습니다."
date: "2025-01-03"
tags: ["Oracle","접속","권한"]
category: "Database"
origin: "hexo"
legacyUrl: "/2025/01/03/oracle_install/"
archive: false
updated: "2026-10-16"
---

<span id="오라클-설치" aria-hidden="true"></span>

SQL Developer를 설치했다고 데이터베이스가 생기는 것은 아니다. 서버가 실행 중이어도 서비스 이름이 다르면 접속하지 못한다. 예전 설치·접속 글에서는 이 차이를 설명하지 않고 화면과 명령을 나열했다.

이 글은 Oracle 19c의 멀티테넌트 환경을 기준으로 연결의 구조를 정리한 안내다. 이번 개정에서 Oracle 서버를 새로 설치하거나 아래 명령을 실행하지는 않았다. 설치 파일·클라이언트의 JDK 요구 사항은 사용하는 릴리스 문서에서 확인해야 한다.

## 연결을 이루는 네 가지

| 구분 | 예시 | 확인할 것 |
| --- | --- | --- |
| 서버 | 로컬 PC 또는 별도 DB 서버 | DB 인스턴스가 실행 중인가 |
| 접속 지점 | localhost:1521 | 호스트와 포트에 도달할 수 있는가 |
| 서비스 | examplepdb | 접속하려는 PDB의 서비스인가 |
| 사용자 | study_user | 그 PDB에 존재하고 로그인 권한이 있는가 |

예시는 실제 설치값이 아니다. SID와 서비스 이름도 같은 값이라고 가정하지 않는다. SQL Developer와 Python에서 같은 대상으로 접속하려면 이 정보를 일치시켜야 한다.

## 관리 작업과 실습을 분리하기

DBA가 필요한 권한을 가진 연결로 대상 PDB에서 계정을 준비하고, 실습은 별도 계정으로 한다. 다음은 관리자가 대상 PDB와 tablespace를 확인한 뒤 조정할 SQL의 형태다.

```sql
-- 대상 PDB에서, 계정을 생성할 권한이 있는 관리자가 실행하는 예시
CREATE USER study_user IDENTIFIED BY "replace-with-a-local-password"
  DEFAULT TABLESPACE users QUOTA 20M ON users;
GRANT CREATE SESSION, CREATE TABLE TO study_user;
```

비밀번호·tablespace·quota는 환경에 맞춰 정해야 한다. 사용자의 업무가 조회뿐이라면 테이블 생성 권한조차 필요하지 않을 수 있다. 이전 글에 있던 내부 설정 우회와 일괄 DBA 권한 부여를 기본 실습 절차로 권하지 않는다.

## 성공 여부를 어떤 연결에서 확인할까

실습 계정으로 접속한 뒤 현재 사용자와 컨테이너를 확인한다.

```sql
SELECT USER FROM dual;
SELECT SYS_CONTEXT('USERENV', 'CON_NAME') AS container_name FROM dual;
```

연결 도구의 이름을 orcl로 지정한 것과 실제 연결된 서비스는 다르다. “연결 성공”에서 끝내지 않고 내가 의도한 사용자·컨테이너인지 확인해야 한다.

## 실패했을 때 확인 순서

호스트·포트, 서비스 등록, 계정·비밀번호, 접근 권한을 나누어 확인한다. SQL 문법 문제와 연결 문제를 같은 재설치 문제로 처리하지 않는다. 오류 번호·사용한 접속 방식·민감 정보를 제외한 연결 설정을 함께 기록하면 원인을 좁히기 쉽다.

설치 화면을 남긴 과거 기록은 [접속 메모](/writing/legacy-oracle-ch1/)와 [SQL Developer 메모](/writing/legacy-oracle-ch2/)에 연결해 두었다. 이 글이 통합 안내이며 두 글은 보관함에서 찾을 수 있다.

참고: [Oracle 19c 사용자와 권한](https://docs.oracle.com/en/database/oracle/oracle-database/19/dbseg/creating-user-accounts.html).
