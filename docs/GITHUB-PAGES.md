# GitHub Pages 게시와 복구

기존 `GitHubBlog`의 origin은 `https://github.com/letsplay2ya/letsplay2ya.github.io.git`입니다. 권장 게시 주소는 기존 개인 사이트 주소인 `https://letsplay2ya.github.io/`입니다. 이 문서와 workflow를 추가하는 작업은 기존 저장소 또는 운영 사이트를 변경하지 않습니다.

## 현재 준비된 것

- `.github/workflows/pages.yml`: GitHub Actions 수동 실행으로 Astro를 검사·빌드하고 Pages에 게시합니다.
- 빌드 시 `SITE_URL`을 저장소 소유자의 `https://<owner>.github.io`로 지정합니다.
- 개인 사이트 저장소(`<owner>.github.io`)인지 먼저 확인합니다. 하위 경로가 필요한 다른 저장소에서는 게시를 중단합니다.
- Node 24와 커밋된 `package-lock.json`을 사용합니다.
- 게시용 환경은 GitHub의 `github-pages`입니다.
- Actions는 수동 실행만 가능합니다. push만으로 바로 운영 사이트가 바뀌지 않습니다.
- 기존 날짜별 글 주소 16개에서 새 `/writing/` 주소로 이동하는 페이지가 빌드됩니다.

## 확정된 게시 구성

1. 기존 주소 `https://letsplay2ya.github.io/`를 유지하고 Astro 사이트로 교체합니다.
2. 기존 저장소는 공개 상태입니다. 사용자가 새 Astro 소스의 공개 업로드와 사이트 교체를 승인했습니다.
3. 기존 Hexo 커밋 `1d8932af1fe90a0613475aa2d8593b259c31d298`은 `archive/hexo-before-astro-2026-10-15` 브랜치에 보존합니다.
4. `master`에는 기존 커밋을 부모로 하는 Astro 전환 커밋을 추가합니다. 강제 push나 기존 이력 삭제는 사용하지 않습니다.
5. 저장소 Settings → Pages의 Source는 GitHub Actions를 사용합니다.
6. `master` 소스를 올린 뒤 Publish Astro to GitHub Pages workflow를 수동 실행합니다. 실제 배포 결과는 GitHub Actions 기록에서 확인합니다.

원격 주소는 `https://github.com/letsplay2ya/letsplay2ya.github.io.git`입니다. Git 저장소의 공개 상태는 기존대로 유지합니다. `node_modules`, `dist`, `.qa`와 환경 변수 파일은 소스 커밋에서 제외합니다. 이전 Sites 사이트는 이 배포와 독립적이며 변경하지 않습니다.

## 업데이트

```sh
git pull --ff-only
npm ci
npm run check
npm run build
git add .
git commit -m "Update site content"
git push origin master
```

그다음 GitHub Actions에서 **Publish Astro to GitHub Pages → Run workflow → master**를 선택합니다. Windows PowerShell에서 npm 실행 정책이 제한되면 `npm` 대신 `npm.cmd`를 사용합니다. Actions는 GitHub 토큰으로 게시하므로 소스에 개인 액세스 토큰을 넣지 않습니다.

## 기존 Hexo로 복구

`archive/hexo-before-astro-2026-10-15` 브랜치는 기존 생성 HTML과 자산을 그대로 보관합니다. 복구가 필요하면 저장소 Settings → Pages에서 Source를 **Deploy from a branch**로 바꾸고 해당 보관 브랜치의 `/`를 선택하면 됩니다. Astro 소스와 이전 배포 이력을 삭제하거나 강제로 되돌릴 필요가 없습니다.

## 회사와 집에서 이어서 작업

소스 저장소를 정한 뒤 회사·집에서 같은 소스를 clone/pull/push해 작업합니다. 설치 산출물 `node_modules`, 빌드 결과 `dist`, 검증 캡처 `.qa`, 로컬 환경 변수 파일은 `.gitignore`로 제외되어 있습니다. 업무 프로젝트의 전체 소스를 옮길 필요는 없습니다.

## 참고

- [GitHub Pages 사용 조건](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)
- [Astro의 GitHub Pages 배포](https://docs.astro.build/en/guides/deploy/github/)
