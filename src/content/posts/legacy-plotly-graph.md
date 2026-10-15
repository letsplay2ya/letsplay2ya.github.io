---
title: "(Python-Plotly) Plotly 그래프 깃헙블로그에 올리기"
description: "깃헙 블로그에 동적 시각화를 올리는 방법을 익힌다."
date: "2025-01-03"
tags: []
category: "Database / polotly"
origin: "hexo"
legacyUrl: "/2025/01/03/plotly%20graph/"
---
<!-- hexo-import:v1 sha256=d33123e29d269f7f28d460dc721d413c7cb02956daee7ca451297b34e38d762f -->

![](/legacy-assets/images/thumbnail/plotly.png)

## 개요

> 깃헙 블로그에 동적 시각화를 올리는 방법을 익힌다.

  

## 필수 라이브러리 설치

> 라이브러리 설치  
> Getting Started with Plotly in Python,  
> [https://plotly.com/python/getting-started/](https://plotly.com/python/getting-started/)  
> Getting Started with Chart Studio in Python,  
> [https://plotly.com/python/getting-started-with-chart-studio/](https://plotly.com/python/getting-started-with-chart-studio/)

```plaintext
pip install plotly
pip install chart_studio
```

> **plotly의 역할**: 그래프를 작성하는 기본 도구이며, chart\_studio의 역할은 그래프를 plotly 홈페이지 업로드 할 수 있도록 도와주고, 또한 iframe output으로 변환하는 데 도움을 주는 코드이다.

  

## 그래프 작성

```python
import plotly.express as px
import chart_studio

gapminder = px.data.gapminder()
fig = px.scatter(gapminder.query("year==2007"), x="gdpPercap", y="lifeExp", size="pop", color="continent",
           hover_name="country", log_x=True, size_max=60)
fig.show()
```

  

## plotly 회원가입

> 회원가입: [https://chart-studio.plotly.com/Auth/login/#/](https://chart-studio.plotly.com/Auth/login/#/)

> 그 후에 우측 상단에 \[프로필\]-\[Settings\]-\[API Keys\]를 클릭한 후,API Key를 발급받습니다.

> Regenerate Key를 발급

> 아래 코드로 연동

```plaintext
username = 'your_name' # your username  
api_key = 'your_key' # your api key - go to profile > settings > regenerate key  
chart_studio.tools.set_credentials_file(username=username, api_key=api_key)
```

  

## 그래프 업로드

```python
import chart_studio.plotly as py
py.plot(fig, filename = 'gdp_per_cap', auto_open=True)
```

‘[https://plotly.com/~jhjung/1/](https://plotly.com/~jhjung/1/)‘

> 위 주소로 연결 가능

  

## iframe 변환

```python
import chart_studio.tools as tls
tls.get_embed('https://plotly.com/~jhjung/1/') #change to your url

'<iframe id="igraph" scrolling="no" style="border:none;" seamless="seamless" src="https://plotly.com/~jhjung/1.embed" height="525" width="100%"></iframe>'
```

  

<span id="github-블로그-적용-Hexo-블로그"></span>

## github 블로그 적용(Hexo 블로그)

> Tag Plugins 방식으로 추가

> …(본문 내용)

```python
import plotly.express as px
import chart_studio
gapminder = px.data.gapminder()
fig = px.scatter(gapminder.query("year==2007"), x="gdpPercap", y="lifeExp", size="pop", color="continent",
           hover_name="country", log_x=True, size_max=60)
fig.show()
```

> ```html
> <iframe src="your_url" width="100%" height="300" frameborder="0" loading="lazy" allowfullscreen=""></iframe>
> ```

> …(본문 내용)
