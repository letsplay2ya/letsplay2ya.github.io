---
title: "Hexo Blog 생성으로 Git Hub 기초 배우기"
description: "Hexo 블로그를 만들면서 Git Hub 기초를 습득한다.(Window 환경)"
date: "2025-01-03"
tags: []
category: "git"
origin: "hexo"
legacyUrl: "/2025/01/03/Git&Git%20Hub/"
---
<!-- hexo-import:v1 sha256=b16361712e95768f0c24c6b9b24b1f3cfd50cf1fda050b23c7fd89bf833245bb -->

![](/legacy-assets/images/thumbnail/git.png)

## 개요

> Hexo 블로그를 만들면서 Git Hub 기초를 습득한다.(Window 환경)

  

## 기본 파일 설치

-   [https://nodejs.org](https://nodejs.org/) 다운로드  
    node.js command prompt 사용(높은 처리 성능!)
    
    ```bash
    C:\Users\1>node -v 로 설치 확인
    ```
    
-   [https://git-scm.com](https://git-scm.com/) 다운로드  
    소스코드를 효과적으로 관리할 수 있다.(Git Hub 활용)
    
    ```bash
    C:\Users\1>git --version 으로 설치 확인
    ```
    
-   hexo 설치
    
    ```plaintext
    C:\Users\1>npm install -g hexo-cli
    ```
    

  

<span id="Git-Hub-설정"></span>

## Git Hub 설정

> Git Hub 계정 생성 후 두 개의 Repository 생성(포스트 버전 관리 - myblog, 포스트 배포용 관리 - username.github.io)

  

## 블로그 만들기

```bash
C:\Users\1\Desktop>hexo init myblog
C:\Users\1\Desktop>cd myblog
C:\Users\1\Desktop\myblog>npm install
C:\Users\1\Desktop\myblog>npm install hexo-server --save
C:\Users\1\Desktop\myblog>npm install hexo-deployer-git --save
```

> \_config.yml 파일 수정

```plaintext
url: https://username.github.io

deploy:
  type: git
  repo: https://github.com/username/username.github.io.git
  branch: main
```

  

<span id="Git-Hub-배포"></span>

## Git Hub 배포

```bash
C:\Users\1\Desktop\myblog>hexo generate
C:\Users\1\Desktop\myblog>hexo server
```

> localhost:4000로 접속해 확인

```bash
C:\Users\1\Desktop\myblog>hexo deploy
```

> 배포 후 username.github.io로 접속 확인

  

## 테마 변경

> icarus 버전 설치

```bash
C:\Users\1\Desktop\myblog>npm install -S hexo-theme-icarus
```

> \_config.yml 수정

```plaintext
theme: icarus
```

  

## 소스 업데이트

```bash
C:\Users\1\Desktop\myblog>git config user.name "username"
C:\Users\1\Desktop\myblog>git config user.email "emailaddress"

C:\Users\1\Desktop\myblog>git add .
C:\Users\1\Desktop\myblog>git commit -m "add: new post updated"
C:\Users\1\Desktop\myblog>git push origin master
```

## 백업

> 각자의 github에 접속하여 2개의 repository를 생성한다.

-   theme를 저장할 repository
-   .md파일을 저장할 repository

### theme 백업

> themes/테마명 내에서 다음의 명령어들을 실행한다.

```bash
# 원격 저장소 변경(theme url로 된 세팅을 자신의 repository url로 재세팅)
git remote set-url origin "theme를 저장할 repository 주소"

# 테마 내용 백업
git commit -m "theme backup"
git push origin
```

### md파일 백업

> hexo blog 디렉토리에서 .md파일을 저장할 repository를 세팅해준다.

```bash
# git 초기화
git init

# 원격 저장소 등록
git remote add origin ".md파일을 저장할 repository 주소"

# 현재 내용 백업
git add .
git commit -m "blog backup"
git push origin
```

### (선택) theme폴더 submodule 추가

```bash
# 기존의 <themes/테마명>를 삭제
rm -rf themes/테마명

# 백업해둔 theme repository를 submodule로 추가
git submodule add "theme를 저장한 repository 주소"

# 현재 내용 백업
git add .
git commit -m "blog theme submodule"
git push origin
```

### 백업 가져오기

```bash
# 기존의 <themes/테마명>를 삭제
rm -rf themes/테마명

# 백업해둔 theme repository를 submodule로 추가
git submodule add "theme를 저장한 repository 주소"

# 현재 내용 백업
git add .
git commit -m "blog theme submodule"
git push origin
```
