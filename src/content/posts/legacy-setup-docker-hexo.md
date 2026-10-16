---
title: "블로그에 Docker를 붙이기 전에 재현할 환경부터 정하기"
description: "개발 서버 실행과 정적 사이트 배포를 구분합니다. 고정된 Node 환경과 lockfile, 개발용 마운트와 배포 산출물의 차이를 정리합니다."
date: "2025-01-03"
tags: ["Docker","Node.js","빌드"]
category: "Dev Environment"
origin: "hexo"
legacyUrl: "/2025/01/03/setup_docker_hexo/"
archive: false
updated: "2026-10-16"
---

<span id="Hexo-블로그를-Docker로-설정-및-배포하기" aria-hidden="true"></span>
<span id="hexo-블로그를-docker로-설정-및-배포하기" aria-hidden="true"></span>
<span id="1-준비사항" aria-hidden="true"></span>
<span id="2-Hexo-블로그-클론" aria-hidden="true"></span>
<span id="2-hexo-블로그-클론" aria-hidden="true"></span>
<span id="3-Dockerfile-작성" aria-hidden="true"></span>
<span id="3-dockerfile-작성" aria-hidden="true"></span>
<span id="4-build-run-sh-작성" aria-hidden="true"></span>
<span id="4-build_runsh-작성" aria-hidden="true"></span>
<span id="5-Docker-이미지-빌드-및-푸시" aria-hidden="true"></span>
<span id="5-docker-이미지-빌드-및-푸시" aria-hidden="true"></span>
<span id="6-다른-환경에서-이미지-풀-및-실행" aria-hidden="true"></span>
<span id="7-컨테이너-쉘에-접속하여-명령어-실행" aria-hidden="true"></span>
<span id="8-로컬에서-작업-및-GitHub에-푸시" aria-hidden="true"></span>
<span id="8-로컬에서-작업-및-github에-푸시" aria-hidden="true"></span>

개인 정적 블로그에 Docker가 꼭 필요할까? 한 대의 PC에서 Node 버전을 맞춰 작업하고 Actions에서 빌드한다면 추가 컨테이너 없이도 충분할 수 있다. 반면 팀이나 여러 환경에서 동일한 도구 구성을 재현해야 한다면 도움이 될 수 있다.

이전 글은 Hexo 개발 서버를 이미지로 실행하는 과정과 GitHub 게시를 한 흐름처럼 설명했다. 컨테이너를 실행했다는 것만으로 Pages에 게시되는 것은 아니다.

## 무엇을 재현할지 먼저 정한다

Node 버전, package-lock.json, 빌드 명령을 먼저 고정한다. 움직이는 lts 태그는 나중에 다시 빌드할 때 다른 런타임이 될 수 있다. 보안 업데이트를 받는 일과 동일 환경을 재현하는 일 사이에서 버전 갱신 절차가 필요하다.

## 개발용과 빌드용의 차이

개발 서버는 파일 변경과 브라우저 확인을 위한 장치다. 배포용 작업은 정적 산출물을 만드는 것으로 종료되어야 한다. 다음은 이 Astro 저장소에서 사용할 수 있는 빌드용 형태이며 이번 작업에서 Docker 엔진으로 실행한 것은 아니다.

```dockerfile
FROM node:24.21.0-bookworm-slim
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run check && npm run build
CMD ["node", "-e", "console.log('Static files are in /app/dist')"]
```

실제로 적용할 때는 .dockerignore에 node_modules, dist, .git, .env, .qa 등을 제외한다. 이미지 태그가 제공되는지와 조직의 갱신 정책도 확인한다. 이 예제는 정적 파일을 서빙하거나 Pages에 게시하는 이미지가 아니다.

## 설치 순서도 결과에 영향을 준다

의존성 파일을 먼저 복사해 설치한 뒤 소스를 복사하면 소스 변경마다 의존성을 전부 설치할 필요를 줄일 수 있다. 컨테이너 안에서 편집기를 설치해 직접 고치는 방식은 변경을 소스 저장소와 분리시키기 쉽다.

개발 마운트에서는 호스트와 컨테이너의 node_modules를 섞지 않도록 한다. 경로·권한·파일 감시 문제는 실행하는 OS에서 확인해야 한다. 문서에 Dockerfile이 있다는 것과 Windows·Linux 양쪽에서 실행 검증했다는 것은 다르다.

이 사이트는 현재 Actions 빌드와 Pages 배포를 사용한다. Docker 도입이 목적이 아니라, 다른 환경에서도 소스에서 같은 사이트를 만들 수 있는지가 목적이다.

참고: [Docker 빌드 모범 사례](https://docs.docker.com/build/building/best-practices/), [npm ci](https://docs.npmjs.com/cli/v11/commands/npm-ci/).
