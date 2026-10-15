# 코리안리 프로젝트 — 콘텐츠 근거와 네 개 탭 추적

확인일: 2026-10-08. 이 문서는 개인 사이트의 프로젝트 상세 글과 기술 노트 편집을 위한 내부 근거표다. 아래 모든 `src/` 경로는 **원본 업무 프로젝트 `koreanre_frt`의 루트 기준 상대경로**다. 개인 사이트 `dev-site/src`의 구현 경로가 아니다. 행 번호는 정적 확인 시점의 위치이며 이후 원본 변경 시 달라질 수 있다.

## 확인된 작성 조건

- 이름: 전성민.
- 프로젝트명: 코리안리 특종보험 요율산정 AI Assistant 시스템.
- 사용자가 확인한 이 프로젝트의 담당 범위: 프론트엔드 전체.
- 미확인 항목: 개발 기간, 팀 규모, 정량 성과, 운영 사용자 수. 콘텐츠에 임의로 넣지 않았다.
- Java 백엔드, Vue, WebSquare/eXBuilder 전환 분석과 향후 AI Agent에 관한 경력·방향을 이 프로젝트의 수행 기술로 섞지 않았다.
- 프로젝트 글과 세 기술 노트는 소스 및 기존 테스트의 정적 검토를 근거로 한다. 원본 앱의 전체 테스트나 실제 백엔드를 연결한 통합 테스트를 이번 문서 작업에서 실행하지 않았다.

## 기본 화면 구조와 Assistant 표시 관계

| 설명 | 원본 파일과 위치 | 확인한 동작 |
| --- | --- | --- |
| 네 개 메인 탭 | `src/pages/uw-main/index.tsx:2366` | 계약 기본정보, 계약 상세정보, Terms&Conditions, 요율산정 |
| 종목별 화면 선택 | `src/pages/uw-main/index.tsx:1484` | 상품 코드에 따라 상세정보·요율산정 컴포넌트 분기 |
| 초기 Assistant 상태 | `src/pages/uw-main/index.tsx:299` | 스냅샷이 없으면 `showAssistant`는 true |
| 추천 계약 선택 | `src/pages/uw-main/index.tsx:717` | `cbClickedUW`가 Assistant를 닫고 Reference UW를 설정한 뒤 관련 데이터 조회 |
| 참고 계약 다시 선택 | `src/pages/uw-main/index.tsx:1023` | `cbChangeUW`가 Assistant 표시 상태로 전환 |
| Assistant 렌더 | `src/pages/uw-main/index.tsx:2403` | 네 개 메인 탭에서 `showAssistant`일 때 표시 |
| 기본정보 Reference | `src/pages/uw-main/tabs/DefaultContract/index.tsx:286` | `!showAssistant`일 때 표시 |
| 상세정보 Reference 예 | `src/pages/uw-main/tabs/DetailContract/DetailDNO/index.tsx:86` | `!showAssistant`일 때 비교 영역 표시 |
| 약관 Reference | `src/pages/uw-main/tabs/TermnCondition/index.tsx:1970` | `!showAssistant`일 때 표시 |
| 요율산정 Reference 예 | `src/pages/uw-main/tabs/RateCalculation/RateDNO/index.tsx:84` | `!showAssistant`일 때 표시 |
| AI 요약정보 | `src/pages/uw-main/component/AiSummaryBox.tsx:17` | 각 탭이 주입한 내용을 상단 공통 박스에 표시 |
| Assistant 기본 내용 | `src/pages/uw-main/assistant/AssistantView.tsx:19` | 기본적으로 `RecommendUW`를 표시. 추론과정 전환 버튼은 `hidden` 클래스 적용 |
| 추천 조회와 선택 | `src/pages/uw-main/assistant/RecommendUW.tsx:83` | 현재 UW의 유사·동일 추론 결과 조회와 참고 UW 선택 콜백 |

편집 시 **Current + Assistant / Current + Reference 전환**으로 표현한다. Current·Reference·Assistant를 상시 동시에 펼친 3패널 화면이나 일반 대화형 챗봇으로 설명하지 않는다. Assistant의 접기(`isCollapsed`)는 좁은 레일을 남기는 동작이며, 닫기(`onClose`)와 구분한다. 닫기 버튼은 Reference UW 번호가 있을 때 표시된다. 각 탭 상단의 AI 요약 박스는 우측 Assistant와 별개다.

## 탭 1 — 계약 기본정보

| 내용 | 원본 근거 | 해석 범위 |
| --- | --- | --- |
| 필드별 Reference 적용 | `src/pages/uw-main/tabs/DefaultContract/index.tsx:70` | 선택된 코드·값을 필드별 setter로 적용. 모든 필드의 무조건 복제로 설명하지 않음 |
| 기본정보 입력 | `src/pages/uw-main/tabs/DefaultContract/ContractCurrent.tsx` | 계약자·피보험자·기간 등 입력 및 조회 컴포넌트 |
| 기간 검증 | `src/components/ui/DatePicker/dateRangeValidation.ts:25` | 시작·종료일의 유효한 값이 모두 있을 때 선후 관계 검사 |
| 상태 수집 | `src/pages/uw-main/useUwSnapshot.ts:92` | 여러 store와 메인·하위 탭, Assistant 상태를 업무 스냅샷으로 수집 |
| 원본 분리 | `src/pages/uw-main/useUwSnapshot.ts:133` | 서버와 동기화된 원본 스냅샷 깊은 복사 |
| 복원 | `src/pages/uw-main/useUwSnapshot.ts:152` | 각 store 복원 및 종목별 보정 |
| 복원 후 렌더·이탈 저장 | `src/pages/uw-main/index.tsx:332`, `:352` | store 복원 후 탭 마운트, ref를 통한 최신 캡처 |
| 영속 저장 범위 | `src/stores/sidebarStore.ts:216` | localStorage에는 메뉴 접힘·펼침만 저장. 작업 스냅샷 새로고침 복원은 아님 |

검증 시나리오: 일부 필드 선택 복사, 기간 선후 관계, A→B→A 전환, 중첩 원본과 편집값의 분리. 기존 통합 테스트 결과로 기재하지 않는다.

## 탭 2 — 계약 상세정보

| 내용 | 원본 근거 | 해석 범위 |
| --- | --- | --- |
| 저장·이탈 전 입력 반영 | `src/pages/uw-main/tabs/DetailContract/DetailDNO/index.tsx:33` | 현재 입력 반영 함수 등록 및 저장 상태 전환. D&O의 구체 사례 |
| 종목별 저장 정규화 | `src/pages/uw-main/tabs/DetailContract/DetailDNO/dnoPayload.ts` | 신규 값 보정, UI 전용 필드 제거 |
| 기존 테스트 | `src/pages/uw-main/tabs/DetailContract/DetailDNO/dnoPayload.test.ts:9` | 신규/복제 payload, 기본값, 통화 초기화, UI 필드 제거 사례 |
| 키로 비교 구역 연결 | `src/hooks/useSyncedSectionScroll.ts:24` | 활성 그리드의 가장 가까운 `data-scroll-sync-key`로 연결 |
| 비율 동기화 | `src/hooks/useSyncedSectionScroll.ts:46` | 각 영역의 스크롤 가능 너비에 대한 비율 계산 |
| 동적 요소 처리 | `src/hooks/useSyncedSectionScroll.ts:130`, `:206` | 이벤트 시 상대 요소 재조회, MutationObserver로 새 요소 감지 |
| 기존 스크롤 테스트 | `src/hooks/syncedScroll.test.tsx:86`, `:115`, `:129` | 다른 DOM 순서·너비·일반 스크롤 영역의 양방향 동기화 |

종목별 구조를 모두 동일한 단일 컴포넌트로 처리했다고 표현하지 않는다. 문서는 D&O를 구체적인 저장 사례로 사용하며 다른 종목도 별도 컴포넌트로 분기함을 명시한다.

## 탭 3 — Terms&Conditions

| 내용 | 원본 근거 | 해석 범위 |
| --- | --- | --- |
| 정렬 | `src/pages/uw-main/tabs/TermnCondition/termConditionSort.ts:11` | 증권 코드, 조회 순서와 약관 코드 등으로 정렬 |
| 파생 항목 대상 판정 | `src/pages/uw-main/tabs/TermnCondition/termClauseEligibility.ts:11` | 약관 적용 여부와 할인·할증 대상 여부를 조합 |
| 변경 전후 반영 | `src/pages/uw-main/tabs/TermnCondition/index.tsx:201`, `:1277` | 약관 변경 전후를 비교하고 관련 파생 데이터에 반영 |
| 참고 순서 적용 | `src/pages/uw-main/tabs/TermnCondition/index.tsx:1290` | 참고 약관 순서 적용과 이전 순서 복원 |
| 국내·해외 구분 | `src/pages/uw-main/index.tsx:2391`, `src/pages/uw-main/tabs/TermnCondition/index.tsx:1320` | 계약 구분에 따른 지역 탭 노출과 지역별 선택 상태 |
| 선택 복사 | `src/pages/uw-main/tabs/TermnCondition/index.tsx:1769` | 중복을 발견하면 안내하고 복사 중단. 정상 선택 항목을 추가 |
| 일괄 교체 | `src/pages/uw-main/tabs/TermnCondition/index.tsx:1841` | 사용자의 확인 후 Reference 증권·약관으로 교체 |

검증 시나리오: 중복 선택 복사, 교체 취소, 적용 상태 변경과 파생 항목 갱신, 국내·해외 표시 및 약관 순서. 이 탭의 시나리오를 이번 문서 작업에서 실행한 테스트 결과로 쓰지 않는다.

## 탭 4 — 요율산정

| 내용 | 원본 근거 | 해석 범위 |
| --- | --- | --- |
| 응답 적용 조건 | `src/pages/uw-main/tabs/RateCalculation/utils/useAutoCalculationGuard.ts:18` | 화면 수명, 계약, 대상, 입력 서명 비교 |
| 화면 해제 무효화 | `src/pages/uw-main/tabs/RateCalculation/utils/useAutoCalculationGuard.ts:32` | cleanup 시 수명 값 증가. 요청마다 증가하는 순번은 아님 |
| 실제 적용 예 | `src/pages/uw-main/tabs/RateCalculation/RateCSA/ContractCurrent.tsx:1517` | 최신 store를 읽고 현재 입력 서명과 대조 |
| 입력 확정·저장 병합 | `src/pages/uw-main/tabs/RateCalculation/RateDNO/index.tsx:31`, `:44` | 그리드·지연 입력 반영 후 요율 상태를 상세 저장 데이터로 병합 |
| 저장 형식 변환 | `src/pages/uw-main/tabs/RateCalculation/RateDNO/dnoRateSave.ts` | 목적물과 서버 식별자에 맞춘 병합, 오류 반환 |
| 저장 테스트 | `src/pages/uw-main/tabs/RateCalculation/RateDNO/dnoRateSave.test.ts:21` | 목적물 재정렬 후 병합과 기존 서버 식별자 보존 |
| 탭 상태 테스트 | `src/pages/uw-main/tabs/RateCalculation/RateDNO/useRateDnoStore.test.ts:8` | 목적물 식별자로 편집 상태 이동, 신규 목적물에 기존 값 전파 방지 |
| 서명 테스트 | `src/pages/uw-main/tabs/RateCalculation/RatePLMed/component/medicalAutoCalculation.test.ts:14` | 숫자 표기 정규화, 결과값 변경 시 서명 유지, 요청 입력 변경 시 서명 변화 |
| 최종 저장 연결 | `src/pages/uw-main/index.tsx:1659`, `:1984` | 저장 데이터 구성과 통합 저장 API 호출 |

보장 범위는 응답의 상태 반영 판단이다. 네트워크 요청 취소, 동일 입력 중복 요청의 응답 순서 보장, 보험료 산식 전체를 프론트엔드에서 개발했다는 주장으로 확대하지 않는다.

## 별도 OCR 기술 노트

| 설명 | 원본 근거 |
| --- | --- |
| 좌표 백분율 변환 | `src/components/modal/ModalRawDataConfirm.tsx:64` |
| 문서별 근거 필터 | `src/components/modal/ModalRawDataConfirm.tsx:88` |
| PDF 하이라이트 | `src/components/modal/ModalRawDataConfirm.tsx:261` |
| 페이지 이동 예약 | `src/components/modal/ModalRawDataConfirm.tsx:335` |
| 항목과 여러 근거 선택 | `src/components/modal/ModalRawDataConfirm.tsx:382`, `:395` |
| 조회 버전·현재 계약 검사 | `src/stores/uwOcrStore.ts:33`, `:45`, `:50` |

OCR 모델 개발이나 인식률 개선은 이 프론트엔드 사례에 포함하지 않는다.

## 디자인 구조 출처

- `src/assets/styles/_color.css` — 색상과 그라데이션 토큰.
- `src/assets/styles/_font.css`, `src/assets/fonts/PretendardVariable.woff2` — 글꼴 정의와 폰트 파일.
- `src/components/ui/Tabs/Tabs.module.css` — 탭 크기, 활성 표시와 하단 경계.
- `src/pages/uw-main/component/AiSummaryBox.tsx`, `src/assets/styles/_layout.css:88` — AI 요약 박스 구조와 `gradient-outline` 스타일.

개인 사이트의 설명용 화면은 별도로 작성한 구현이다. 스타일·구조를 참고하는 것과 원본 React 컴포넌트를 그대로 실행하는 것은 구분한다.

## 콘텐츠 경로

- 프로젝트: `/projects/koreanre-ai-assistant/`
- 상태 복원: `/writing/notes-workspace-state/`
- 원문 근거: `/writing/notes-document-evidence/`
- 계산 응답 보호: `/writing/notes-async-calculation/`

세 노트는 이전 포트폴리오의 `content.mjs`에 있던 사례를 독립 Markdown으로 옮기고, 이번에 재확인한 소스 흐름과 구현 범위를 보강했다. 글의 날짜는 개인 사이트 원고 작성일이며 프로젝트 수행 기간을 뜻하지 않는다.
