---
title: "Oracle 접속·계정 생성 메모를 다시 읽으며"
description: "기존 계정 생성 기록에서 권한과 컨테이너 구분을 보완했습니다. 현재 접속 안내는 통합 글로 연결합니다."
date: "2025-01-03"
tags: ["Oracle","접속"]
category: "학습 기록"
origin: "hexo"
legacyUrl: "/2025/01/03/oracle_ch1/"
archive: true
updated: "2026-10-16"
---

<span id="오라클-접속-명령어-확인" aria-hidden="true"></span>
<span id="유저-생성" aria-hidden="true"></span>

이 주소는 예전 Oracle 접속 실습의 연결을 유지하기 위한 기록이다. 설치·클라이언트·계정 설명은 [Oracle 접속 통합 안내](/writing/legacy-oracle-install/)로 모았다.

## 기존 기록에서 바꾼 판단

과거에는 SYS로 접속한 뒤 내부 설정을 바꾸고 실습 계정에 DBA 역할을 부여했다. 그 방식은 컨테이너와 권한 구조를 이해하지 않고 실습 계정을 만드는 습관으로 이어질 수 있다. 이제는 **대상 PDB 확인 → 필요한 권한으로 계정 준비 → 실습 계정 접속**을 구분해 설명한다.

```sql
SELECT USER FROM dual;
SELECT SYS_CONTEXT('USERENV', 'CON_NAME') AS container_name FROM dual;
```

로그인 성공이 올바른 컨테이너에 연결됐다는 증거는 아니다. 위 조회로 현재 연결을 확인한 뒤 실습한다. 이번 개정에서 실제 Oracle 서버에 실행한 결과는 아니다.

당시 터미널 출력과 원고는 저장소 이력에 남겨 두었고, 재사용하기 부적절한 명령을 여기서 반복 제공하지 않는다.

참고: [Oracle 로컬 사용자](https://docs.oracle.com/en/database/oracle/oracle-database/19/dbseg/creating-user-accounts.html).
