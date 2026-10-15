---
title: "JavaScript에서 Thymeleaf 변수 사용하기"
description: "Thymeleaf는 주로 Spring MVC와 함께 사용되는 서버 사이드 템플릿 엔진으로, 동적인 웹 페이지를 렌더링하는 데 강력한 기능을 제공합니다. JavaScript에서 Thymeleaf 변수를 사용하면 서버 측 데이터를 클라이언트 측 스크립트로 원활하게 전달할 수 있습니다. 아래"
date: "2025-01-04"
tags: ["javaScript","thymeleaf"]
category: "javaScript"
origin: "hexo"
legacyUrl: "/2025/01/04/thymeleaf_javascript/"
---
<!-- hexo-import:v1 sha256=785a1142c74a4807c4447f5a93626502df9a59730408e816570857d0e8e68f5b -->

<span id="JavaScript에서-Thymeleaf-변수-사용하기"></span>

![](/legacy-assets/images/thumbnail/js.png)

Thymeleaf는 주로 Spring MVC와 함께 사용되는 서버 사이드 템플릿 엔진으로, 동적인 웹 페이지를 렌더링하는 데 강력한 기능을 제공합니다. JavaScript에서 Thymeleaf 변수를 사용하면 서버 측 데이터를 클라이언트 측 스크립트로 원활하게 전달할 수 있습니다. 아래에서는 JavaScript에서 Thymeleaf 변수를 효과적으로 사용하는 다양한 방법과 모범 사례를 소개합니다.

## 목차

1.  [기본 변수 삽입](#1-%EA%B8%B0%EB%B3%B8-%EB%B3%80%EC%88%98-%EC%82%BD%EC%9E%85)
2.  [`th:inline="javascript"` 사용](#2-thinlinejavascript-%EC%82%AC%EC%9A%A9)
3.  [JSON 객체로 데이터 전달](#3-JSON-%EA%B0%9D%EC%B2%B4%EB%A1%9C-%EB%8D%B0%EC%9D%B4%ED%84%B0-%EC%A0%84%EB%8B%AC)
4.  [데이터 속성(`data-*`)을 사용하여 전달](#4-%EB%8D%B0%EC%9D%B4%ED%84%B0-%EC%86%8D%EC%84%B1-data-%EC%9D%84-%EC%82%AC%EC%9A%A9%ED%95%98%EC%97%AC-%EC%A0%84%EB%8B%AC)
5.  [URL 파라미터를 통한 데이터 전달](#5-URL-%ED%8C%8C%EB%9D%BC%EB%AF%B8%ED%84%B0%EB%A5%BC-%ED%86%B5%ED%95%9C-%EB%8D%B0%EC%9D%B4%ED%84%B0-%EC%A0%84%EB%8B%AC)

* * *

## 1\. 기본 변수 삽입

Thymeleaf의 `${...}` 구문을 사용하여 JavaScript 코드 내에 Thymeleaf 변수를 직접 삽입할 수 있습니다. 이를 위해 `<script>` 태그 내에 JavaScript를 포함하고, Thymeleaf가 해당 코드를 처리하도록 해야 합니다.

### 예제

컨트롤러에서 `username`이라는 모델 속성을 추가한다고 가정해보겠습니다.

```java
// 컨트롤러 예제
@GetMapping("/welcome")
public String welcome(Model model) {
    model.addAttribute("username", "홍길동");
    return "welcome";
}
```

`welcome.html` Thymeleaf 템플릿에서 JavaScript 내에 변수를 사용하는 방법은 다음과 같습니다.

```html
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org">
<head>
    <title>환영 페이지</title>
</head>
<body>
    <h1>환영합니다, <span th:text="${username}">사용자</span>님!</h1>

    <script>
        // JavaScript에서 Thymeleaf 변수 직접 사용
        var userName = /*[[${username}]]*/ '기본 사용자';
        console.log("로그인한 사용자:", userName);
    </script>
</body>
</html>
```

**설명:**

-   `/*[[${username}]]*/`는 Thymeleaf의 인라인 JavaScript 문법으로, Thymeleaf가 JavaScript 코드를 처리하고 해당 부분을 실제 값으로 대체합니다.
-   `'기본 사용자'`는 Thymeleaf 처리가 활성화되지 않은 경우에 대한 기본값으로 사용됩니다.

* * *

<span id="2-th-inline-quot-javascript-quot-사용"></span>

## 2\. `th:inline="javascript"` 사용

Thymeleaf는 `th:inline="javascript"` 속성을 제공하여 JavaScript 블록을 보다 효과적으로 처리할 수 있습니다. 이를 통해 변수의 적절한 이스케이프 처리와 함께 문법 오류나 보안 취약점을 방지할 수 있습니다.

### 예제

```html
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org">
<head>
    <title>프로필 페이지</title>
</head>
<body>
    <h1>사용자 프로필</h1>

    <script th:inline="javascript">
        /*<![CDATA[*/
        var user = /*[[${user}]]*/ {};
        console.log("사용자 ID:", user.id);
        console.log("사용자 이름:", user.name);
        /*]]>*/
    </script>
</body>
</html>
```

**설명:**

-   `th:inline="javascript"`는 Thymeleaf에게 해당 `<script>` 태그 내의 내용을 JavaScript로 처리하도록 지시합니다.
-   `/*[[${user}]]*/`는 서버 측 `user` 객체를 JavaScript 객체로 안전하게 삽입합니다.
-   `/*<![CDATA[*/`와 `/*]]>*/`는 스크립트 내용이 브라우저에 의해 올바르게 해석되도록 감싸주는 역할을 합니다. 특히 Thymeleaf 표현식에 특수 문자가 포함될 경우 HTML 파싱에 문제가 생기는 것을 방지합니다.

* * *

<span id="3-JSON-객체로-데이터-전달"></span>

## 3\. JSON 객체로 데이터 전달

서버 측 데이터를 JavaScript에서 쉽게 사용할 수 있도록 JSON 형태로 전달하는 방법입니다. 이는 특히 복잡한 데이터 구조를 전달할 때 유용합니다.

### 예제

컨트롤러에서 `user` 객체를 모델에 추가합니다.

```java
// 컨트롤러 예제
@GetMapping("/profile")
public String profile(Model model) {
    User user = new User(1, "홍길동", "hong@example.com");
    model.addAttribute("user", user);
    return "profile";
}
```

`profile.html` 템플릿에서 JSON으로 데이터를 전달합니다.

```html
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org">
<head>
    <title>프로필 페이지</title>
</head>
<body>
    <h1 th:text="${user.name}">사용자 이름</h1>

    <script th:inline="javascript">
        /*<![CDATA[*/
        var user = [[${user}]];
        console.log("사용자 정보:", user);
        /*]]>*/
    </script>
</body>
</html>
```

**설명:**

-   `[[${user}]]`는 Thymeleaf가 `user` 객체를 JSON 형식으로 변환하여 JavaScript 변수에 할당합니다.
-   `th:inline="javascript"`를 사용하여 Thymeleaf가 JavaScript 컨텍스트 내에서 적절하게 데이터를 처리하도록 합니다.

* * *

<span id="4-데이터-속성-data-을-사용하여-전달"></span>

## 4\. 데이터 속성(`data-*`)을 사용하여 전달

HTML 요소의 `data-*` 속성을 사용하여 서버 측 데이터를 클라이언트 측으로 전달한 다음, JavaScript에서 이를 읽어오는 방법입니다. 이는 특히 데이터가 DOM 요소와 관련이 있을 때 유용합니다.

### 예제

```html
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org">
<head>
    <title>데이터 속성 예제</title>
</head>
<body>
    <div id="userData" th:data-user="${user}"></div>

    <script>
        // HTML의 data-user 속성에서 데이터 가져오기
        var userElement = document.getElementById('userData');
        var user = JSON.parse(userElement.getAttribute('data-user'));
        console.log("사용자 정보:", user);
    </script>
</body>
</html>
```

**설명:**

-   `th:data-user="${user}"`는 `user` 객체를 JSON 문자열로 변환하여 `data-user` 속성에 할당합니다.
-   JavaScript에서는 `getAttribute`를 사용하여 해당 데이터를 가져온 후, `JSON.parse`를 통해 객체로 변환합니다.

* * *

<span id="5-URL-파라미터를-통한-데이터-전달"></span>

## 5\. URL 파라미터를 통한 데이터 전달

서버 측 데이터를 URL의 쿼리 파라미터로 전달하고, JavaScript에서 이를 파싱하여 사용하는 방법입니다. 이 방법은 주로 페이지 간 데이터 전달 시 사용됩니다.

### 예제

컨트롤러에서 리다이렉트 시 데이터 전달:

```java
// 컨트롤러 예제
@GetMapping("/redirect")
public String redirect(Model model) {
    model.addAttribute("message", "안녕하세요!");
    return "redirect:/target?message=${message}";
}
```

`target.html` 템플릿에서 URL 파라미터 읽기:

```html
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org">
<head>
    <title>리다이렉트 대상 페이지</title>
</head>
<body>
    <h1>메시지:</h1>
    <p id="message"></p>

    <script>
        // URL 파라미터에서 'message' 값 가져오기
        function getQueryParam(param) {
            var urlParams = new URLSearchParams(window.location.search);
            return urlParams.get(param);
        }

        var message = getQueryParam('message') || '기본 메시지';
        document.getElementById('message').textContent = message;
    </script>
</body>
</html>
```

**설명:**

-   컨트롤러에서 `redirect` 메서드는 `message` 파라미터를 포함하여 `/target` 페이지로 리다이렉트합니다.
-   `target.html`에서는 JavaScript를 사용하여 URL의 쿼리 파라미터에서 `message` 값을 추출하고, 이를 페이지에 표시합니다.

* * *

## 6\. 템플릿 내 숨겨진 필드 사용

HTML 폼의 숨겨진 필드를 사용하여 서버 측 데이터를 저장하고, JavaScript에서 이를 읽어오는 방법입니다.

### 예제

```html
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org">
<head>
    <title>숨겨진 필드 예제</title>
</head>
<body>
    <form>
        <input type="hidden" id="userId" th:value="${user.id}" />
        <input type="hidden" id="userName" th:value="${user.name}" />
    </form>

    <script>
        var userId = document.getElementById('userId').value;
        var userName = document.getElementById('userName').value;
        console.log("사용자 ID:", userId);
        console.log("사용자 이름:", userName);
    </script>
</body>
</html>
```

**설명:**

-   `<input type="hidden">` 요소를 사용하여 `user` 객체의 속성을 저장합니다.
-   JavaScript에서는 `getElementById`를 사용하여 해당 값을 읽어옵니다.

* * *

## 7\. 보안 및 최적화 고려사항

JavaScript에서 Thymeleaf 변수를 사용할 때 몇 가지 주의할 점이 있습니다.

### 보안 고려사항

-   **XSS(교차 사이트 스크립팅) 방지:** 서버 측 데이터를 JavaScript에 삽입할 때는 반드시 적절하게 이스케이프 처리하여 악의적인 스크립트가 실행되지 않도록 해야 합니다. `th:inline="javascript"`를 사용하면 Thymeleaf가 자동으로 데이터를 안전하게 이스케이프 처리해 줍니다.

### 데이터 크기 최적화

-   **필요한 데이터만 전달:** 클라이언트 측에서 반드시 필요한 데이터만 전달하여 페이지 로딩 속도와 성능을 최적화합니다.

### 유지보수성

-   **데이터와 로직 분리:** 서버 측 데이터와 클라이언트 측 로직을 명확하게 분리하여 코드의 가독성과 유지보수성을 높입니다.

* * *

## 8\. 결론

Thymeleaf와 JavaScript를 효과적으로 통합하면 서버 측 데이터와 클라이언트 측 스크립트 간의 원활한 상호작용이 가능합니다. 위에서 소개한 다양한 방법들을 상황에 맞게 적절히 활용하면, 보다 동적이고 인터랙티브한 웹 애플리케이션을 개발할 수 있습니다. 항상 보안과 성능을 고려하여 데이터를 안전하게 처리하는 것이 중요합니다.
