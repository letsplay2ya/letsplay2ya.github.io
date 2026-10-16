# 발전 방향 적용 결과 · 2026-10-16

## 콘텐츠

남은 10편을 개정했다. Oracle 설치·접속·클라이언트 안내는 `legacy-oracle-install`을 중심으로 묶고 `legacy-oracle-ch1`, `legacy-oracle-ch2`는 개정 연결을 제공하는 보관 기록으로 바꿨다. Plotly도 데이터·코드·해석을 `legacy-plotly-graph`로 모으고 `legacy-plotly-01`을 보관함에 두었다. 기존 주소와 최초 날짜를 유지했다. 나머지 CSV·Python 연동·NumPy·Git/배포·Docker 글은 각각 목적과 범위를 다시 정리했다.

대표 글은 CSV 데이터 검증, 코리안리 선택 복사, 문서 검사 Agent 평가 3편이다. 전체 24편 중 기본 목록 21편, 보관함 3편이며 Java 백엔드 프로젝트 초안은 계속 사이트에서 제외한다. 실제 담당 범위를 확인하지 않았기 때문이다.

## 실행한 실습

- CSV: Python 3.12 표준 라이브러리·SQLite. 샘플 9건에서 정상 3건·거절 6건. 재실행 중복, 잘못된 CSV의 부분 저장 방지, 두 번째 삽입 실패 시 첫 번째 삽입과 staging 로그의 롤백 테스트.
- NumPy 2.3.5: 기본 슬라이스의 뷰, copy, 고급 인덱싱 결과와 직접 대입의 차이.
- Plotly 6.3.1: 합성 데이터 7일. 최대 실패 건수 날짜와 최대 실패율 날짜가 다름을 검증하고 런타임을 포함한 독립 HTML 생성. 약 4.8MB라 본문 자동 임베드 대신 링크로 제공.
- 문서 검사 도구: Node.js. 파일 읽기 경계·근거 검증·종료 예산·잘못된 인자·API 실패를 검증. 모델을 사용하지 않는 기준 검사는 6개 고정 샘플 중 5개 일치, 참양성 2·거짓양성 1·거짓음성 0. 저장 결과와 재생 UI 제공.

공개 실습 파일은 `public/examples/`에서 내려받을 수 있다. 모두 합성 데이터다. Python 패키지는 작업용 `.qa/python-libs`에 설치했으며 시스템 Python이나 업무 프로젝트의 의존성을 변경하지 않았다.

## 코리안리 화면

전체 업무 앱의 격리 실행은 공통 store·API·인증·그리드 의존성 때문에 이번 범위에 맞지 않았다. 대신 기본정보 선택 복사에 집중했다. 원본에서 세 컴포넌트를 선별했고 import 의존성만 포트폴리오용으로 바꿨다.

| 원본 상대 경로 | 포트폴리오 변경 |
| --- | --- |
| `src/pages/uw-main/component/AiSummaryBox.tsx` | 로고 URL·KeywordHighlightText import |
| `src/components/KeywordHighlightText.tsx` | Chip 의존성 어댑터 |
| `src/pages/uw-main/reference-copy/ReferenceCopyButton.tsx` | Button 의존성 어댑터 |

`src/components/koreanre/original/`에 분리했으며 업무 API·고객 데이터·전체 애플리케이션 소스를 복사하지 않았다. 단순한 색상 변경과 달리 원본 React 컴포넌트의 렌더링·선택 없음 비활성화 로직을 실행한다.

계약 데이터·상태 연결은 별도 `reviewModel.ts`, `ReferenceReview.tsx`로 구현했다. 상품 코드와 이름의 동시 적용은 원본 필드별 setter 흐름에서 확인한 개념이며, 변경 미리보기·되돌리기는 설명을 위해 추가했다. 되돌리기는 복사한 필드만 복원하고 이후 수정한 메모를 보존한다. 기존 Vue 네 탭 재구성은 접을 수 있는 보조 영역으로 남겼다.

확인한 동작: 무선택 비활성화, 선택 복사 취소·확정, 코드·이름 적용, 미선택 값 보존, A→B→A 메모·편집값 복원, 확인 대상 변경 거절, 참고 객체의 변경 방지. 데스크톱과 390px 화면을 검증했다. 원본 백엔드를 연결한 통합 검증은 아니다.

## 모델 연결과 남은 한계

OpenAI Responses API 어댑터는 공식 함수 호출 흐름에 맞춰 구현하고 모의 HTTP 응답으로 반복 호출 계약을 확인했다. 현재 환경에는 OPENAI_API_KEY가 없어 실제 모델을 호출하지 않았다. 모델 품질·지연·토큰 비용은 미측정이며 정적 사이트에는 모델 호출 서버나 API 키가 없다. CLI의 openai 모드는 명시적 API 키와 모델 설정이 있어야 실행된다.

Oracle·SQL Developer·Docker 글은 공식 문서에 근거해 개정했지만 서버 설치·컨테이너 실행 검증은 하지 않았다. Docker 예시의 Node 이미지 태그 존재 여부만 레지스트리에서 확인했다. 검증하지 않은 부분을 운영 경험·성과처럼 추가하지 않았다.

## 검증 명령

```text
npm.cmd run check
npm.cmd run build
npm.cmd run test:site
npm.cmd run test:articles
npm.cmd run test:review
npm.cmd run test:agent
npm.cmd run test:data
```

데이터 테스트에는 Python·NumPy·Plotly가, 기존 Java 예제 테스트에는 JDK가 필요하다. CI에는 Node만 필요한 review·agent 검증을 추가했다. 이미지 확인과 HTML·내부 링크·이전 주소·검색·브라우저 상호작용 검증을 분리해서 수행했다.
