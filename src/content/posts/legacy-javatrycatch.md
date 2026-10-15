---
title: "Java 예외 처리: 잡을 예외와 전달할 예외 구분하기"
description: "checked 예외와 unchecked 예외의 차이, 원인을 보존하는 예외 변환, try-with-resources를 파일 읽기 예제로 살펴봅니다."
date: "2025-01-03"
tags: ["Java","예외 처리","자원 관리"]
category: "Java"
origin: "hexo"
legacyUrl: "/2025/01/03/javaTryCatch/"
updated: "2026-10-15"
---

<span id="에러-Error" aria-hidden="true"></span>
<span id="에러error" aria-hidden="true"></span>
<span id="예외처리-Exception-Handling" aria-hidden="true"></span>
<span id="예외처리exception-handling" aria-hidden="true"></span>

예외를 잡았다고 문제가 해결된 것은 아니다. 파일 읽기에 실패했는데 빈 문자열을 반환하면, 호출자는 빈 파일을 읽은 것인지 읽기에 실패한 것인지 구분할 수 없다. 예외 처리에서는 실행을 계속하는 것보다 실패를 어떤 의미로 전달할지 먼저 정해야 한다.

## checked와 unchecked는 심각도의 등급이 아니다

Java에서 `RuntimeException` 계열과 `Error` 계열은 unchecked다. 그 밖의 예외는 checked이며, 발생 가능한 checked 예외는 잡거나 메서드에 선언해야 한다. 이것은 컴파일러의 검사 규칙이다. “사용자 실수면 checked, 개발자 실수면 unchecked”처럼 원인으로 나누는 기준은 정확하지 않다.

`Error`는 보통 일반적인 애플리케이션 코드에서 복구를 기대하지 않는 상황을 나타낸다. 그렇다고 모든 `Error`가 반드시 즉시 프로세스를 종료한다거나 모든 `Exception`이 복구 가능한 것은 아니다. 처리되지 않은 예외가 현재 요청이나 스레드에 미치는 영향은 실행 환경에 따라 달라진다.

## 처리할 수 없는 계층에서는 전달하기

```java
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

public final class TextFiles {
    public static String read(Path path) throws IOException {
        return Files.readString(path, StandardCharsets.UTF_8);
    }
}
```

이 메서드는 파일이 없을 때 새로 생성할지, 사용자에게 다른 경로를 요청할지 결정할 정보가 없다. 그래서 `IOException`을 호출자에게 전달한다. 메서드 안에 try-catch가 없다고 잘못된 코드가 아니다.

## 업무 의미로 바꿀 때는 원인 보존하기

상위 계층에서는 “설정 파일을 읽지 못했다”는 의미를 붙일 수 있다.

```java
try {
    return TextFiles.read(path);
} catch (IOException cause) {
    throw new IllegalStateException("설정 파일을 읽지 못했습니다.", cause);
}
```

원인 예외를 함께 전달해야 실제 실패 지점을 추적할 수 있다. 반대로 모든 계층에서 같은 예외를 기록하고 다시 던지면 로그가 중복될 수 있다. 로그와 사용자 응답을 책임지는 경계를 정해 두는 편이 낫다.

위 조각의 `path`와 반환값은 호출하는 메서드의 문맥에 속한다. 모든 IO 실패를 `IllegalStateException`으로 바꾸라는 규칙은 아니다.

## 자원을 닫는 책임은 별도로 해결하기

```java
try (var reader = Files.newBufferedReader(path, StandardCharsets.UTF_8)) {
    return reader.readLine();
}
```

try-with-resources는 `AutoCloseable` 자원을 닫는다. 본문과 close가 모두 실패한 경우에는 닫기 실패가 suppressed 예외로 남을 수 있다. 예외를 처리하는 일과 자원을 정리하는 일을 한 개의 catch로 뭉뚱그리지 않는 것이 핵심이다.

## 피하고 싶은 처리

`catch (Exception e) { return ""; }`는 실패와 정상 결과를 섞는다. `catch (Throwable e)`로 모든 오류를 무조건 삼키는 것도 일반적인 복구 전략이 되기 어렵다. 재시도 역시 횟수·대기 시간·중복 실행의 영향을 정하지 않으면 같은 실패를 반복할 뿐이다.

실패 테스트에는 없는 파일, 읽기 권한이 없는 파일, 빈 파일을 따로 둔다. 세 경우가 호출자에게 같은 정상 값으로 보인다면 예외 정책을 다시 살펴볼 필요가 있다.

참고: [Java 언어 명세의 예외 검사](https://docs.oracle.com/javase/specs/jls/se17/html/jls-11.html), [try-with-resources](https://docs.oracle.com/javase/tutorial/essential/exceptions/tryResourceClose.html).

