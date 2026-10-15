---
title: "SimpleDateFormat.parse 오류: 예외 선언과 날짜 검증은 별개다"
description: "ParseException을 처리하는 이유와 존재하지 않는 날짜를 거르는 방법을 구분합니다. Java 17의 엄격한 LocalDate 파싱 예제도 함께 정리합니다."
date: "2025-01-03"
tags: ["Java","날짜","입력 검증"]
category: "Java"
origin: "hexo"
legacyUrl: "/2025/01/03/SimpleDateFormatError/"
updated: "2026-10-15"
---



이전 글에서는 `parse`를 try-catch 안에 넣어야 한다고 적었다. 정확히는 `ParseException`이 checked 예외이므로 호출자가 잡거나 `throws`로 선언해야 한다. 이것은 날짜가 실제로 유효한지 검사하는 문제와 별개다.

## 컴파일 오류부터 구분하기

```java
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

public final class LegacyDates {
    public static Date parse(String text) throws ParseException {
        var formatter = new SimpleDateFormat("yyyyMMdd", Locale.ROOT);
        formatter.setLenient(false);
        return formatter.parse(text);
    }
}
```

`throws ParseException`으로 책임을 호출자에게 전달할 수도 있다. 사용자 입력을 받는 계층에서 처리한다면 그곳에서 `ParseException`을 잡고 입력 오류로 안내한다. 무조건 `Exception`을 잡아 성공처럼 계속 진행할 필요는 없다.

## setLenient(false)만으로 모든 형식 검사가 끝나지는 않는다

날짜 보정을 막으면 2월 30일 같은 값은 실패한다. 다만 `DateFormat.parse(String)`은 문자열 전체를 반드시 소비하는 계약이 아니다. 고정 길이 날짜 코드라면 길이와 문자 형식도 검사해야 한다. 기존 API를 유지해야 하는 경우에는 `ParsePosition`으로 읽은 위치까지 확인하는 방법도 있다.

## 날짜만 필요하다면 LocalDate로 표현하기

다음 코드는 Java 17 기준이다. 시간대가 필요 없는 달력 날짜를 다룬다.

```java
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.ResolverStyle;
import java.util.Locale;

public final class Dates {
    private static final DateTimeFormatter FORMAT =
        DateTimeFormatter.ofPattern("uuuuMMdd", Locale.ROOT)
            .withResolverStyle(ResolverStyle.STRICT);

    public static LocalDate parse(String text) {
        if (text == null || !text.matches("[0-9]{8}")) {
            throw new IllegalArgumentException("날짜는 숫자 8자리여야 합니다.");
        }
        return LocalDate.parse(text, FORMAT);
    }
}
```

엄격한 파싱에서 `uuuu`는 연도 자체를 나타낸다. `yyyy`는 연호 안의 연도를 나타내므로 같은 의미로 치환하지 않는다. `DateTimeParseException`은 unchecked이지만 사용자에게 입력 오류를 보여줄 계층에서는 명시적으로 처리할 수 있다.

이 예제는 “올해부터 10년 이내” 같은 업무상 날짜 범위를 검사하지 않는다. 허용 연도나 계약 기간 규칙은 별도로 적용한다.

## 확인할 입력

| 입력 | 예상 결과 |
| --- | --- |
| `20240229` | 윤년 날짜로 성공 |
| `20230229` | 존재하지 않는 날짜로 실패 |
| `20260230` | 자동 보정하지 않고 실패 |
| `20260101abc` | 형식 오류로 실패 |
| `2026-01-01` | 8자리 형식이 아니므로 실패 |
| null | 입력 오류로 실패 |

`SimpleDateFormat` 인스턴스를 여러 스레드가 공유하는 것도 별도 문제다. 이 예제는 매번 생성하며, `DateTimeFormatter`는 불변이고 스레드 안전한 대안이다.

참고: [SimpleDateFormat](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/text/SimpleDateFormat.html), [DateFormat.parse](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/text/DateFormat.html#parse(java.lang.String)), [DateTimeFormatter](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/time/format/DateTimeFormatter.html).

