---
title: "NumPy 기초 연습"
description: "또는"
date: "2025-01-03"
tags: []
category: "Database / numpy"
origin: "hexo"
legacyUrl: "/2025/01/03/NumPy/"
---
<!-- hexo-import:v1 sha256=d205f9fe3b14a70ae55019f93961e50260bb7ffd25eb34bedcd9b0ec3f12fbea -->

<span id="NumPy-기초-연습"></span>

![](/legacy-assets/images/thumbnail/numpy.png)

<span id="NumPy-설치"></span>

## NumPy 설치

```bash
conda install numpy
```

또는

```bash
pip install numpy
```

  

<span id="NumPy-가져오기"></span>

## NumPy 가져오기

```python
import numpy as np
```

  

## 어레이란?

```python
a = np.array([[1,2,3,4],[5,6,7,8],[9,10,11,12]])
print(a[0])
```

```plaintext
[1 2 3 4]
```

  

## 기본 배열

### zeros 0으로 채워진 배열

```python
np.zeros(2)
```

```text
array([0., 0.])
```

  

### ones 1로 채워진 배열

```python
np.ones(2)
```

```text
array([1., 1.])
```

  

### empty 무작위로 채워진 배열

```python
np.empty(2)
```

```text
array([0., 0.])
```

  

<span id="균일한-간격의-범위를-포함하는-배열-첫번째-숫자-마지막-숫자-단계-크기"></span>

### 균일한 간격의 범위를 포함하는 배열(첫번째 숫자, 마지막 숫자, 단계 크기)

```python
np.arange(2,9,2) 
```

```text
array([2, 4, 6, 8])
```

  

### 지정된 간격으로 선형 간격을 갖는 배열

```python
np.linspace(0,10,num=5) 
```

```text
array([ 0. ,  2.5,  5. ,  7.5, 10. ])
```

  

### 원하는 데이터 유형 명시적 지정

```python
x = np.ones(2, dtype=np.int64) 
x
```

```text
array([1, 1], dtype=int64)
```

  

## 요소 추가, 제거 및 정렬

### 오름차순 정렬

```python
arr = np.array([2,1,5,3,7,4,6,8]) 
np.sort(arr) 
```

```text
array([1, 2, 3, 4, 5, 6, 7, 8])
```

  

```python
a = np.array([1,2,3,4])
b = np.array([5,6,7,8])
np.concatenate((a,b))
```

```text
array([1, 2, 3, 4, 5, 6, 7, 8])
```

  

```python
x = np.array([[1,2],[3,4]])
y = np.array([[5,6]])
np.concatenate((x,y),axis=0)
```

```text
array([[1, 2],
       [3, 4],
       [5, 6]])
```

  

```python
np.concatenate(())
```
