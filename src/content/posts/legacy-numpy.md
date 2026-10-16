---
title: "NumPy 슬라이스를 바꿨는데 원본도 바뀌는 이유"
description: "함수 목록 대신 뷰와 복사의 차이를 실행 결과로 확인합니다. 기본 슬라이싱·고급 인덱싱과 empty의 의미를 구분합니다."
date: "2025-01-03"
tags: ["Python","NumPy","데이터 처리"]
category: "Python"
origin: "hexo"
legacyUrl: "/2025/01/03/NumPy/"
archive: false
updated: "2026-10-16"
---

<span id="NumPy-기초-연습" aria-hidden="true"></span>
<span id="NumPy-설치" aria-hidden="true"></span>
<span id="numpy-설치" aria-hidden="true"></span>
<span id="NumPy-가져오기" aria-hidden="true"></span>
<span id="numpy-가져오기" aria-hidden="true"></span>
<span id="어레이란" aria-hidden="true"></span>
<span id="기본-배열" aria-hidden="true"></span>
<span id="zeros-0으로-채워진-배열" aria-hidden="true"></span>
<span id="ones-1로-채워진-배열" aria-hidden="true"></span>
<span id="empty-무작위로-채워진-배열" aria-hidden="true"></span>
<span id="균일한-간격의-범위를-포함하는-배열-첫번째-숫자-마지막-숫자-단계-크기" aria-hidden="true"></span>
<span id="균일한-간격의-범위를-포함하는-배열첫번째-숫자-마지막-숫자-단계-크기" aria-hidden="true"></span>
<span id="지정된-간격으로-선형-간격을-갖는-배열" aria-hidden="true"></span>
<span id="원하는-데이터-유형-명시적-지정" aria-hidden="true"></span>
<span id="요소-추가-제거-및-정렬" aria-hidden="true"></span>
<span id="오름차순-정렬" aria-hidden="true"></span>

배열 일부를 변수에 담아 수정했는데 원본까지 바뀐다. 반대로 인덱스 배열로 꺼낸 값은 수정해도 원본이 그대로다. 새 변수에 담았는지보다 같은 메모리를 공유하는지가 중요하다.

다음 예제는 NumPy 2.3.5에서 실행했다. 아래 [실행 코드와 검증](/examples/numpy/copies.py)을 내려받아 재현할 수 있다.

## 기본 슬라이싱은 뷰가 될 수 있다

```python
import numpy as np

original = np.array([10, 20, 30, 40])
view = original[1:3]
view[0] = 99
print(original.tolist())  # [10, 99, 30, 40]
print(np.shares_memory(original, view))  # True
```

일부를 선택했어도 별도의 데이터 버퍼를 복사하지 않았으므로 원본이 달라졌다. 원본을 보존해야 하는 전처리라면 copy 의도를 드러내는 편이 좋다.

## 복사한 배열은 원본과 독립이다

```python
copied = original[1:3].copy()
copied[0] = -1
assert original.tolist() == [10, 99, 30, 40]
assert not np.shares_memory(original, copied)
```

## 고급 인덱싱은 결과를 복사한다

```python
selected = original[[1, 2]]
selected[0] = 777
assert original[1] == 99
```

하지만 original[[1, 2]] = 0처럼 원본에 직접 대입하는 문장은 원본을 변경한다. “고급 인덱싱은 복사이므로 대입해도 안 바뀐다”로 일반화하면 안 된다. 결과를 별도 변수로 받는 것과 원본의 인덱스에 대입하는 것을 구분한다.

## empty는 난수 생성 함수가 아니다

이전 글에서는 empty를 무작위로 채운다고 설명했다. 정확히는 초기화하지 않은 배열을 만든다. 우연히 0처럼 보일 수 있지만 값을 보장하지 않는다. 0이 필요하면 zeros를, 난수가 필요하면 random.Generator를 사용한다.

reshape도 항상 복사하거나 항상 뷰를 만든다고 단정하지 않는다. 메모리 배치와 형태에 따라 달라질 수 있다. 실제 코드에서는 공유 여부와 원본 변경 의도를 확인한다.

참고: [NumPy 뷰와 복사](https://numpy.org/doc/stable/user/basics.copies.html), [numpy.empty](https://numpy.org/doc/stable/reference/generated/numpy.empty.html).
