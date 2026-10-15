---
title: "[JAVA] SimpleDateFormat parse 에러"
description: "기존 코드"
date: "2025-01-03"
tags: []
category: "java"
origin: "hexo"
legacyUrl: "/2025/01/03/SimpleDateFormatError/"
---
<!-- hexo-import:v1 sha256=f2009800ff6ede9708277dd160b8fdae84fdf8ae50d7adb5986e9feb3351b446 -->

![](/legacy-assets/images/thumbnail/java.png)  
기존 코드

```java
String day = "20210129"
SimpleDateFormat dayFormat = new java.text.SimpleDateFormat("yyyyMMdd");
Date dt = dayFormat.parse(day);
```

바뀐 코드

```java
try{
  String day = "20210129"
  SimpleDateFormat dayFormat = new java.text.SimpleDateFormat("yyyyMMdd");
  Date dt = dayFormat.parse(day);
} catch(Exception e){
  System.out.println(e.getMessage());
}
```

simpledateformat으로 String 타입을 Date 타입으로 바꾸려고 하니 에러가 발생했다.

(parse를 사용할 때 try catch 문 안에 넣지 않으면 에러가 발생)

자바는 이렇게 꼭 try catch 문 안에 들어가야 하는 메소드들이 좀 있다고 하니 외우지는 않더라도 인지해 두어야겠다.

참조: [https://rural-mouse.tistory.com/75](https://rural-mouse.tistory.com/75)
