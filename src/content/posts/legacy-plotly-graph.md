---
title: "실패 건수가 가장 많은 날이 가장 나쁜 날일까"
description: "요청량이 다른 날을 건수만으로 비교하면 놓치는 것을 작은 데이터로 살펴봅니다. 실행 코드·CSV·독립 HTML을 함께 제공하는 Plotly 실습입니다."
date: "2025-01-03"
tags: ["Python","Plotly","시각화"]
category: "Data Visualization"
origin: "hexo"
legacyUrl: "/2025/01/03/plotly%20graph/"
archive: false
updated: "2026-10-16"
---

<span id="개요" aria-hidden="true"></span>
<span id="필수-라이브러리-설치" aria-hidden="true"></span>
<span id="그래프-작성" aria-hidden="true"></span>
<span id="plotly-회원가입" aria-hidden="true"></span>
<span id="그래프-업로드" aria-hidden="true"></span>
<span id="iframe-변환" aria-hidden="true"></span>
<span id="github-블로그-적용-Hexo-블로그" aria-hidden="true"></span>
<span id="github-블로그-적용hexo-블로그" aria-hidden="true"></span>

실패가 20건 발생한 날과 8건 발생한 날을 비교하면 전자가 더 나빠 보인다. 그러나 요청 수가 각각 1,000건과 80건이면 실패율은 2%와 10%다. 무엇을 비교하려는지에 따라 그래프도 달라져야 한다.

아래 데이터는 시각화 설명을 위해 만든 7일 샘플이다. 운영 성과나 실제 서비스 장애 데이터가 아니다. Python 3.12와 Plotly 6.3.1로 HTML을 생성했다.

## 건수와 비율을 함께 보자

[샘플 CSV](/examples/plotly/traffic.csv)에는 일별 요청 수와 실패 수가 있다. 실패율은 failures / requests × 100이다. 요청 0건은 0%로 강제하지 않고 비율을 계산할 수 없는 경우로 구분해야 한다. 이번 샘플에는 요청 0건이 없다.

실패 건수 그래프에서는 10월 3일의 20건이 가장 높다. 비율 그래프에서는 10월 4일의 10%가 가장 높다. 어느 지표도 버리는 것이 아니라, 사용자에게 어떤 영향을 설명하려는지 함께 제시한다.

## 두 그래프를 분리한 이유

서로 다른 단위를 한 축에 얹지 않도록 건수와 비율을 별도 패널로 나눴다. 마우스를 올리면 날짜·요청량·실패 건수·비율을 함께 볼 수 있다.

[인터랙티브 그래프 열기](/examples/plotly/traffic.html) · [생성 코드](/examples/plotly/export_chart.py)

HTML은 Plotly 런타임을 포함하므로 크기가 크다. 외부 계정과 CDN 없이 열 수 있는 대신 파일 크기를 감수한 선택이다. 글을 열 때 자동으로 내려받지 않고 별도 링크로 제공한다.

## 재현하기

```sh
python -m pip install plotly==6.3.1
python export_chart.py
```

코드와 traffic.csv를 같은 폴더에 둔다. 생성 결과 traffic.html은 정적 호스팅에 올릴 수 있다. 샘플과 같은 데이터라면 최대 건수 날짜와 최대 비율 날짜가 다르다는 검증도 실행된다.

## 이 그래프로 알 수 없는 것

실패율만으로 실패의 심각도나 고객별 영향을 알 수 없다. 요청이 특정 사용자에게 집중됐는지, 재시도 때문에 요청 수가 늘었는지, 실패 코드의 의미가 같은지는 다른 자료가 필요하다. 표본이 작은 날의 비율도 그 자체로 불확실성을 가진다.

과거 [외부 임베드 메모](/writing/legacy-plotly-01/)는 보관함으로 옮겼다. 이제는 그래프만 삽입하기보다 데이터와 계산 방법, 해석의 범위를 함께 남긴다.

참고: [Plotly HTML 내보내기](https://plotly.com/python/interactive-html-export/).
