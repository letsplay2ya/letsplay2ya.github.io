---
title: "블로그 소스와 배포된 사이트는 왜 다른가"
description: "Hexo에서 Astro로 옮기며 원고·빌드 결과·GitHub Pages의 역할을 구분합니다. 다른 PC에서 작업을 이어갈 때 무엇을 가져와야 하는지 정리합니다."
date: "2025-01-03"
tags: ["Git","Astro","GitHub Pages"]
category: "Web"
origin: "hexo"
legacyUrl: "/2025/01/03/Git&Git%20Hub/"
archive: false
updated: "2026-10-16"
---

<span id="개요" aria-hidden="true"></span>
<span id="기본-파일-설치" aria-hidden="true"></span>
<span id="Git-Hub-설정" aria-hidden="true"></span>
<span id="git-hub-설정" aria-hidden="true"></span>
<span id="블로그-만들기" aria-hidden="true"></span>
<span id="Git-Hub-배포" aria-hidden="true"></span>
<span id="git-hub-배포" aria-hidden="true"></span>
<span id="테마-변경" aria-hidden="true"></span>
<span id="소스-업데이트" aria-hidden="true"></span>
<span id="백업" aria-hidden="true"></span>
<span id="theme-백업" aria-hidden="true"></span>
<span id="md파일-백업" aria-hidden="true"></span>
<span id="선택-theme폴더-submodule-추가" aria-hidden="true"></span>
<span id="백업-가져오기" aria-hidden="true"></span>

배포된 HTML은 있는데 원고와 설정은 없는 경우가 있다. 사이트는 열리지만 글을 수정하고 다시 만드는 데 필요한 소스가 빠진 상태다. 이 블로그도 이전 Hexo 배포 HTML에서 글을 복구한 뒤 Astro 소스로 옮겼다.

## 세 가지를 구분하기

```text
원고·컴포넌트·설정 → 빌드 → dist의 HTML·CSS·JavaScript → Pages
        Git 관리                재생성 가능              공개 사이트
```

dist는 배포 결과다. 그 안의 파일을 직접 고쳐도 다음 빌드에서 덮인다. 소스를 관리하는 저장소와 호스팅되는 파일의 역할을 이해해야 집 PC에서도 같은 작업을 이어갈 수 있다.

## 다른 PC에서 가져올 것

저장소를 clone한 뒤 Node 버전을 맞추고 npm ci로 lockfile의 의존성을 설치한다. 원고·공개 이미지·설정이 소스에 있어야 한다. node_modules와 로컬 환경변수 파일을 Git으로 복사하는 방식은 쓰지 않는다.

```sh
git clone https://github.com/letsplay2ya/letsplay2ya.github.io.git
cd letsplay2ya.github.io
npm ci
npm run dev
```

저장소 이름만으로 기존 사이트가 어떤 생성기를 쓰는지 알 수 없다. README와 package.json을 먼저 확인한다.

## 이 사이트의 게시 경로

현재는 소스를 push한 뒤 GitHub Actions의 수동 배포를 실행한다. Actions가 check와 build를 통과한 산출물을 Pages에 게시한다. 소스가 push됐다는 사실과 사이트가 갱신됐다는 사실은 다르다. 실행한 커밋과 배포 결과를 함께 확인한다.

과거 Hexo 주소는 새 글로 연결되며 최초 날짜를 유지했다. 기존 생성 HTML을 단순 삭제하는 대신 URL 매핑을 남긴 이유는 검색과 외부 링크를 끊지 않기 위해서다.

## 복구할 수 있는 것과 없는 것

배포 HTML에서 본문·이미지·코드 블록을 상당 부분 복구할 수 있었다. 그러나 원래 Markdown의 정확한 서식·초안·플러그인 설정·전체 변경 이력은 같은 방식으로 되살릴 수 없다. 다음 복구보다 소스 관리가 우선이다.

이 과정의 상세 기록은 저장소 docs/HEXO-MIGRATION.md와 README에 있다. 오래된 Hexo 설치 명령을 최신 Astro 명령과 섞지 않고, 사용하는 생성기에 따라 원고와 빌드 절차를 확인한다.

참고: [GitHub Pages 커스텀 워크플로](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages), [npm ci](https://docs.npmjs.com/cli/v11/commands/npm-ci/).
