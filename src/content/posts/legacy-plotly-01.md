---
title: "외부 Plotly 임베드를 독립 HTML로 옮기기"
description: "그래프만 남아 있던 과거 기록입니다. 데이터·생성 코드·해석을 제공하는 새 시각화 실습으로 연결합니다."
date: "2025-01-03"
tags: ["Plotly","시각화"]
category: "학습 기록"
origin: "hexo"
legacyUrl: "/2025/01/03/plotly_01/"
archive: true
updated: "2026-10-16"
---

<span id="igraph" aria-hidden="true"></span>

과거 이 글에는 외부 Plotly 그래프를 불러오는 iframe만 있었다. 데이터와 질문이 없어 독자가 무엇을 확인해야 할지 알기 어려웠다.

## 새 실습으로 연결하기

[실패 건수와 비율 비교 글](/writing/legacy-plotly-graph/)에 샘플 CSV, 생성 코드, 독립 HTML과 해석을 모았다. 외부 계정 상태에 기대지 않고 동일한 그래프를 만들 수 있다.

```text
데이터 → 비율 계산 → 그래프 생성 → HTML 내보내기 → 해석과 한계
```

독립 HTML은 런타임을 포함하면 파일이 커진다. CDN을 쓰면 줄일 수 있지만 네트워크와 서비스 가용성에 의존한다. 어느 방식을 선택했는지 글에 밝혀야 한다. 과거 원고와 임베드 자산은 Git 이력에서 확인할 수 있으며 이 주소는 연결을 유지한다.
