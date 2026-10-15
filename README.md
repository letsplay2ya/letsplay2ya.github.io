# 전성민 · 개발과 기록

Java 백엔드, React·Vue 프론트엔드, 시스템 전환 경험과 기술 글을 담는 독립 Astro 개인 사이트입니다. AI Agent는 앞으로 추가할 관심 영역으로 표현했습니다.

## 작업 폴더 열기

VS Code에서 `C:/Users/KE050/Desktop/dev-site`를 열거나 [dev-site.code-workspace](./dev-site.code-workspace)를 엽니다. 기존 `GitHubBlog`, `portfolio-site`, 업무 프로젝트는 별도 폴더로 유지됩니다. 이 프로젝트는 업무 프로젝트의 Git과 독립되어 있으며, 개인 사이트 저장소 `letsplay2ya/letsplay2ya.github.io`의 Astro 소스를 관리합니다.

## 실행

Node.js 22.12 이상이 필요합니다. 작성 시 Node 24 환경에서 검증합니다.

PowerShell에서 `npm.ps1` 실행이 차단되는 경우 아래처럼 `npm.cmd`를 사용하면 시스템 실행 정책을 바꿀 필요가 없습니다.

```powershell
cd C:\Users\KE050\Desktop\dev-site
npm.cmd install
npm.cmd run dev
```

브라우저에서 `http://127.0.0.1:4321`을 엽니다. Astro 사이트는 `dist/index.html`을 직접 더블클릭하는 방식 대신 개발·미리보기 서버로 확인합니다.

```powershell
npm.cmd run check
npm.cmd run build
npm.cmd run preview
```

빌드 결과는 `dist/`이며 소스에서 재생성할 수 있습니다. `dist/`는 직접 수정하지 않습니다.

## 구조와 글 작성

```text
dev-site/
├─ src/content/projects/   프로젝트별 Markdown·MDX
├─ src/content/posts/      기술 글 Markdown·MDX
├─ src/content.config.ts   콘텐츠 필드와 검증 규칙
├─ src/pages/              홈·목록·상세·소개·실험실
├─ src/components/         공통 UI, Vue 화면 예시, React 실험
├─ src/styles/global.css   사이트 공통 디자인
├─ src/data/               프로필·메뉴·기존 글 URL 대응표
├─ public/                 이미지·글꼴·기존 블로그 복구 자산
├─ scripts/                Hexo 복구·사이트 검증
└─ docs/                   이전 내역·원본 프로젝트 근거
```

일반적인 글·프로젝트를 추가할 때 페이지 템플릿을 복사할 필요가 없습니다. 컬렉션 폴더에 원고를 추가하면 빌드 시 목록·상세·검색 필터에 반영됩니다. React·Vue는 실제 동작을 넣을 때만 사용하며, 일반 문서는 Markdown으로 작성합니다. 컴포넌트를 원고에 포함할 때는 MDX를 사용할 수 있습니다.

### 프로젝트 추가

`src/content/projects/프로젝트이름.md`를 작성합니다. 파일명이 `/projects/프로젝트이름/` 주소가 됩니다. 코리안리 작업공간 데모는 해당 프로젝트에만 표시됩니다. 다른 프로젝트에는 일반 미리보기를 제공하며, 전용 화면·이미지가 준비되면 해당 프로젝트용 컴포넌트로 확장합니다.

```yaml
---
title: 프로젝트 이름
description: 실제 담당 업무와 해결한 문제 요약
category: 백엔드
tags: [Java]
role: 실제 담당 범위
status: case-study
featured: true
order: 2
highlights:
  - 검증할 수 있는 구현 내용
---

## 배경과 역할

## 구현과 판단

## 검증과 결과
```

확인하지 않은 기간·팀 규모·성과를 넣지 않습니다. 분석·검토와 직접 구현을 구분합니다.

### 기술 글 추가

`src/content/posts/글이름.md`를 작성하면 `/writing/글이름/`이 생성됩니다.

```yaml
---
title: 글 제목
description: 목록에 표시할 소개
date: 2026-10-15
category: Java
tags: [Java, Backend]
origin: original
---

## 다룰 문제
```

`draft: true`를 넣으면 공개 목록과 빌드 경로에서 제외됩니다. `project: koreanre-ai-assistant`처럼 연결하면 해당 프로젝트와 기술 글을 서로 연결합니다. 직접 작성한 글에는 `legacy-` 접두어를 사용하지 않습니다.

## 기존 자료 이전

- 기존 Hexo 글 16편을 HTML에서 Markdown으로 복구했습니다. 자세한 내용은 [HEXO-MIGRATION.md](./docs/HEXO-MIGRATION.md)에 있습니다.
- 이전 글 주소 16개는 새 글 주소로 이동하는 정적 페이지가 생성됩니다. 기존 블로그와 같은 도메인에 새 사이트를 배포한 후부터 외부의 기존 링크도 이 경로를 사용할 수 있습니다. 현재 운영 블로그를 변경한 것은 아닙니다.
- 기존 프로젝트 사례 3편은 `notes-*.md`로 이전했습니다. 프로젝트별 코드 근거는 [PROJECT-EVIDENCE.md](./docs/PROJECT-EVIDENCE.md)에 있습니다.
- 기존 `portfolio.pdf`는 이전 디자인의 단일 프로젝트 문서라 새 개인 사이트의 대표 PDF로 연결하지 않았습니다. 원본 `portfolio-site`에 보관됩니다.
- Plotly 글 1편은 원래 외부 그래프 서비스에 의존합니다. 사이트 원고·이미지·다른 데모는 외부 AI 서비스 없이 동작합니다.

`npm.cmd run import:hexo`는 기본적으로 `../GitHubBlog`를 읽습니다. 이전한 글을 수정한 경우 덮어쓰지 않도록 생성 체크섬을 검사합니다. 매번 빌드할 때 원본 폴더를 읽지는 않습니다. 처음 복구한 원고와 이미지가 이 프로젝트 안에 있으므로 이후 독립적으로 사용할 수 있습니다.

## 검증

```powershell
npm.cmd run check
npm.cmd run build
npm.cmd run test:site
```

`test:site`는 빌드된 모든 HTML의 내부 링크·자산·앵커, 기존 글 이전 경로와 React·Vue 동작을 검증합니다. 브라우저 검사에는 로컬 Microsoft Edge 또는 Chrome이 필요합니다. 화면 캡처와 결과는 `.qa/`에 저장됩니다. 별도 외부 계정이나 브라우저 다운로드를 요구하지 않습니다.

## 배포와 Git

GitHub Pages 게시용 수동 실행 workflow가 `.github/workflows/pages.yml`에 있습니다. 기존 블로그 주소를 유지하며 공개 저장소 `letsplay2ya/letsplay2ya.github.io`의 `master` 브랜치로 소스를 관리합니다. 게시·복구 방법은 [GITHUB-PAGES.md](./docs/GITHUB-PAGES.md)에 있습니다.

게시 주소는 `https://letsplay2ya.github.io/`입니다. Actions 빌드에서 `SITE_URL`을 지정해 canonical URL을 생성합니다. 로컬 변경을 `master`에 push한 다음 Actions의 **Publish Astro to GitHub Pages**를 수동 실행하면 게시됩니다. push만으로 운영 사이트가 바뀌지는 않습니다. 다른 하위 경로에 게시하려면 Astro `base`와 링크 경로를 함께 조정해야 합니다.

집 PC에서는 저장소를 clone하고 `npm.cmd ci`, `npm.cmd run dev`로 실행할 수 있습니다. 작업을 시작할 때 `git pull --ff-only`, 끝낼 때 커밋과 push로 두 PC의 소스를 맞춥니다. 기존 `GitHubBlog`는 이전 버전 보관용으로 두고 새 소스 수정은 `dev-site`에서 진행합니다.

공통 글꼴 Pretendard와 프로젝트 로고는 이전 포트폴리오 및 원본 프로젝트에서 가져왔습니다. 원본 업무 코드나 API 인증 정보는 포함하지 않습니다.
