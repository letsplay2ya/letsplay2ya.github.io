---
title: "Thymeleaf 값을 JavaScript로 넘길 때 문자열 연결을 피하는 이유"
description: "JavaScript 인라이닝과 data 속성의 차이, 객체 직렬화와 DOM 출력의 경계를 따옴표가 포함된 입력 예제로 정리합니다."
date: "2025-01-04"
tags: ["Java","Thymeleaf","JavaScript"]
category: "Java / Web"
origin: "hexo"
legacyUrl: "/2025/01/04/thymeleaf_javascript/"
updated: "2026-10-15"
---

<span id="JavaScript에서-Thymeleaf-변수-사용하기" aria-hidden="true"></span>
<span id="목차" aria-hidden="true"></span>
<span id="1-기본-변수-삽입" aria-hidden="true"></span>
<span id="예제" aria-hidden="true"></span>
<span id="2-th-inline-quot-javascript-quot-사용" aria-hidden="true"></span>
<span id="2-thinlinejavascript-사용" aria-hidden="true"></span>
<span id="예제-1" aria-hidden="true"></span>
<span id="3-JSON-객체로-데이터-전달" aria-hidden="true"></span>
<span id="3-json-객체로-데이터-전달" aria-hidden="true"></span>
<span id="예제-2" aria-hidden="true"></span>
<span id="4-데이터-속성-data-을-사용하여-전달" aria-hidden="true"></span>
<span id="4-데이터-속성data-을-사용하여-전달" aria-hidden="true"></span>
<span id="예제-3" aria-hidden="true"></span>
<span id="5-URL-파라미터를-통한-데이터-전달" aria-hidden="true"></span>
<span id="5-url-파라미터를-통한-데이터-전달" aria-hidden="true"></span>
<span id="예제-4" aria-hidden="true"></span>
<span id="6-템플릿-내-숨겨진-필드-사용" aria-hidden="true"></span>
<span id="예제-5" aria-hidden="true"></span>
<span id="7-보안-및-최적화-고려사항" aria-hidden="true"></span>
<span id="보안-고려사항" aria-hidden="true"></span>
<span id="데이터-크기-최적화" aria-hidden="true"></span>
<span id="유지보수성" aria-hidden="true"></span>
<span id="8-결론" aria-hidden="true"></span>

사용자 이름이 `O'Neil`처럼 따옴표를 포함하면 서버 값을 문자열 사이에 직접 끼워 넣은 JavaScript가 깨질 수 있다. HTML 템플릿의 값을 스크립트로 전달할 때는 데이터가 놓이는 문맥을 구분해야 한다.

아래 예제는 Thymeleaf 3.1의 표준 JavaScript 인라이닝을 기준으로 한다. 애플리케이션의 직렬화기와 브라우저 보안 정책에 따라 추가 설정이 필요할 수 있다.

## JavaScript 값은 인라이닝으로 전달하기

```html
<script th:inline="javascript">
    const user = /*[[${userView}]]*/ { name: '미리보기 사용자' };
    document.getElementById('user-name').textContent = user.name;
</script>
```

이 스크립트보다 앞에 `id="user-name"`인 요소가 있고, 모델의 `userView`에 name 속성이 있다고 가정한다. 실제 템플릿에서 `th:inline="javascript"`가 활성화되어야 표현식이 처리된다. 파일을 그냥 열면 주석 뒤의 미리보기 값이 사용된다.

표준 인라이닝은 값을 JavaScript 리터럴로 직렬화한다. 따라서 표현식 바깥에 따옴표를 덧붙이지 않는다. 서버 객체 전체보다 화면에 필요한 속성만 가진 전용 뷰 모델을 전달하는 편이 공개 범위를 관리하기 쉽다.

## HTML 속성에는 필요한 단일 값만

```html
<button id="open-user" type="button" th:data-user-id="${userId}">
    사용자 열기
</button>
```

```js
const button = document.getElementById('open-user');
const userId = button.dataset.userId; // 문자열 또는 undefined
```

객체를 `th:data-user="${user}"`로 넣으면 자동으로 JSON 문자열이 된다고 가정하면 안 된다. JSON이 필요하면 서버에서 명시적으로 직렬화하거나, JavaScript 인라이닝을 사용하는 편이 의도가 분명하다. 숫자·boolean도 dataset에서는 문자열로 읽으므로 필요한 변환과 검증을 해야 한다.

## 전달할 때와 표시할 때는 다른 경계다

전달된 문자열을 `textContent`로 표시하는 것과 `innerHTML`로 해석하는 것은 다르다. 인라이닝으로 전달했다고 해서 나중에 임의의 HTML로 삽입해도 된다는 뜻은 아니다.

숨겨진 input이나 data 속성은 브라우저에서 읽고 바꿀 수 있다. 토큰·권한·민감한 서버 정보를 숨기는 용도로 사용하지 않는다. 서버는 브라우저가 돌려보낸 식별자와 권한을 다시 검증해야 한다.

## URL에 넣는 데이터는 별도로 인코딩하기

쿼리 파라미터를 직접 문자열로 연결하기보다, 브라우저에서는 `URL`과 `URLSearchParams`, Spring MVC 리다이렉트에서는 `RedirectAttributes`처럼 해당 문맥을 다루는 도구를 사용한다. JavaScript 직렬화와 URL 인코딩은 같은 작업이 아니다.

## 확인할 문자열

일반 이름만 테스트하면 실수를 놓치기 쉽다. 따옴표, 줄바꿈, 역슬래시, 한글, 태그처럼 보이는 문자열을 넣어 보자. 렌더링 결과의 JavaScript 구문이 유효한지, 값이 원래 문자열로 전달되는지, 화면에서는 코드가 아니라 텍스트로 표시되는지 각각 확인한다. 엄격한 CSP로 인라인 스크립트를 제한한 서비스라면 nonce 등 서비스 정책에 맞는 방식도 검토해야 한다.

참고: [Thymeleaf 3.1 JavaScript 인라이닝](https://www.thymeleaf.org/doc/tutorials/3.1/usingthymeleaf.html#javascript-inlining), [HTMLElement.dataset](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/dataset).

