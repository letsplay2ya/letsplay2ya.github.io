---
title: '문서 검사 Agent를 만들기 전에 정답과 오탐부터 정했다'
description: 'README와 코드의 불일치를 찾는 도구 호출 루프를 만들었습니다. 기준 검사에서 나온 오탐과 모델 연동 검증의 범위를 함께 공개합니다.'
date: '2026-10-16'
category: 'Agent Experiment'
tags: ['Node.js', 'AI Agent', '평가']
origin: 'original'
project: 'doc-check-agent'
featured: true
featuredOrder: 3
---

README에는 npm run serve라고 적혀 있는데 package.json에는 dev만 있다. 이런 불일치를 찾는 도구를 만들면 모델이 실제 파일을 읽고 근거를 남기는 과정을 작게 실험할 수 있다. 처음부터 임의의 저장소 전체를 고치는 도구보다, 읽기와 보고로 범위를 제한했다.

이번에 만든 것은 **읽기 전용 검사 도구, 모델을 교체할 수 있는 실행 루프, 고정 평가 샘플**이다. OpenAI API 경로는 구현했지만 API 키가 없어 실제 모델을 호출하지 않았다. 아래 수치는 모델 성능이 아니라 규칙 기반 검사 결과다.

## 도구 네 개와 종료 조건

list_files로 읽을 수 있는 파일을 확인하고, read_file로 줄 번호가 있는 본문을 읽는다. inspect_readme는 없는 파일 링크와 정의되지 않은 npm 스크립트의 후보를 찾는다. finish_report는 실제 후보와 줄 번호가 맞는 보고만 받아들인다.

```text
요청 → 다음 도구 선택 → 호스트에서 실행 → 결과 전달 → 반복
                                                 └→ 근거 확인 후 보고
```

도구가 알아서 실행되는 것이 아니다. 모델은 호출할 이름과 인자를 내고, 호스트가 허용된 함수를 실행한다. 이 역할 구분은 [OpenAI 함수 호출 가이드](https://developers.openai.com/api/docs/guides/function-calling)의 흐름을 참고했다.

## 모델이 없어도 먼저 확인할 수 있는 것

기준 검사는 고정 순서로 도구를 호출하고 후보를 그대로 보고한다. 이 순서 자체에는 LLM의 판단이 없다. 경로가 허용 목록 밖이면 읽지 않고, 잘못된 인자는 오류 결과로 남기며, 근거가 없는 줄 번호로 보고하면 거절한다.

8턴·12회 도구 호출이라는 종료 예산도 둔다. 같은 호출을 반복하는 경우 무한 루프가 되지 않는지 확인했다. 이 코드는 일반 저장소를 위한 완전한 보안 샌드박스가 아니며, 수정되지 않는 공개 예제 폴더를 대상으로 한다.

## 오탐을 숨기면 평가가 되지 않는다

6개 고정 샘플에는 실제 파일 누락, 실제 명령 누락, 정상 문서, 설명용 잘못된 명령, 외부 링크, 지시처럼 보이는 문장을 넣었다. 기준 검사를 실행한 결과는 다음과 같다.

| 항목 | 결과 |
| --- | --- |
| 참양성 | 2 |
| 거짓양성 | 1 |
| 거짓음성 | 0 |
| 정밀도 | 2/3, 약 66.7% |
| 재현율 | 2/2, 100% |
| 사례 전체 기대 결과 일치 | 5/6 |

오탐은 “실행하지 않는 예시: npm run imaginary”였다. 문자열만 검사하는 규칙은 문맥을 이해하지 못해 없는 명령이라고 보고했다. 모델을 붙인다면 이 문맥을 더 잘 구분하는지 **같은 정답 집합**으로 비교해야 한다. 현재 표로 모델이 더 낫다고 말할 수 없다.

[실험실](/lab/)에서 사례별 도구 호출 기록을 볼 수 있다. [전체 결과 JSON](/examples/doc-agent/results.json)도 제공한다. 실행 시간은 그때의 로컬 기록이며 다른 환경의 지연 시간이나 실제 모델 비용을 뜻하지 않는다.

## 실행하고 확인하기

[예제 안내](/examples/doc-agent/README.md), [실행 루프](/examples/doc-agent/agent.mjs), [CLI](/examples/doc-agent/cli.mjs), [평가 코드](/examples/doc-agent/evaluate.mjs), [테스트](/examples/doc-agent/test.mjs)를 저장소의 public/examples/doc-agent 구조로 받는다. 전체 예제는 [저장소](https://github.com/letsplay2ya/letsplay2ya.github.io/tree/master/public/examples/doc-agent)에도 있다.

```sh
node cli.mjs baseline
node evaluate.mjs
node test.mjs
```

모델 경로는 환경에 OPENAI_API_KEY와 명시적인 OPENAI_MODEL을 준비한 뒤 node cli.mjs openai로 선택한다. 사이트 자체에는 API 키나 모델 호출 서버가 없다. 선택한 공개 예제 텍스트를 API로 보내는 CLI 경로만 구현했다.

## 다음 검증은 무엇인가

API 어댑터는 가짜 응답을 주입해 함수 호출·결과 전달·429 실패 경로를 확인했다. 실제 모델의 오탐 개선, 응답 지연, 토큰 비용은 아직 측정하지 않았다. 나중에 모델을 연결해도 같은 6개만 반복 최적화하면 일반화 성능을 알 수 없으므로 별도 평가 샘플을 늘려야 한다.

모델 호출이 성공한 것, 형식이 맞는 보고를 만든 것, 근거와 결론이 정확한 것은 각각 다른 확인 항목이다.
