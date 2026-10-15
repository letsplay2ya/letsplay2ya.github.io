---
title: "Getter와 Setter를 만들기 전에 정할 것: 객체의 변경 규칙"
description: "필드를 private으로 바꾸는 것만으로 캡슐화가 완성되지는 않습니다. 금액 변경과 컬렉션 반환 예제로 객체가 지켜야 할 규칙을 정리합니다."
date: "2025-01-03"
tags: ["Java","객체 설계","캡슐화"]
category: "Java"
origin: "hexo"
legacyUrl: "/2025/01/03/Getter&Setter/"
updated: "2026-10-15"
---



잔액 필드를 `private`으로 바꾼 뒤 모든 필드에 Getter와 Setter를 붙이면 안전해질까? 직접 대입은 막을 수 있지만, `setBalance(-100)`을 허용하면 객체의 규칙은 여전히 깨진다. 중요한 것은 접근 메서드의 유무보다 어떤 변경을 허용할지다.

## 값 대입 대신 변경의 의미를 드러내기

다음 코드는 통화의 최소 단위로 금액을 저장하는 학습용 예제다. 실제 금융 거래나 프로젝트 코드를 옮긴 것이 아니다.

```java
public final class Wallet {
    private long balance;

    public Wallet(long openingBalance) {
        if (openingBalance < 0) {
            throw new IllegalArgumentException("초기 잔액은 음수일 수 없습니다.");
        }
        balance = openingBalance;
    }

    public void withdraw(long amount) {
        if (amount <= 0 || amount > balance) {
            throw new IllegalArgumentException("출금 금액을 확인하세요.");
        }
        balance -= amount;
    }

    public long getBalance() {
        return balance;
    }
}
```

`setBalance`는 최종 숫자만 전달받는다. 반면 `withdraw`는 출금이라는 동작과 검증을 함께 표현한다. 호출자가 잔액을 먼저 조회해 검사하고 다시 저장할 필요도 줄어든다.

다만 이 클래스는 동시 접근을 제어하지 않는다. 여러 요청이 같은 객체를 변경하는 환경의 원자성이나 DB 트랜잭션까지 해결한 예제로 보면 안 된다.

## 생성 시점에도 같은 규칙이 필요하다

Setter만 검증해도 생성자에서 잘못된 값을 허용하면 객체는 처음부터 유효하지 않다. 생성·수정·역직렬화처럼 값이 들어오는 경로를 함께 봐야 한다. 외부 요청 검증과 객체 내부 규칙도 역할이 다르다. API가 아닌 다른 경로에서 사용하더라도 객체의 핵심 규칙은 유지되어야 한다.

## Getter도 내부 상태를 노출할 수 있다

`List` 필드를 그대로 반환하면 호출자는 그 목록을 직접 수정할 수 있다.

```java
public List<String> getTags() {
    return List.copyOf(tags);
}
```

이 방식은 수정 불가능한 목록을 반환하지만 깊은 복사는 아니다. 요소가 가변 객체라면 요소 자체의 변경은 별도로 고려해야 한다. 위 예제의 요소는 불변인 `String`이다. `List.copyOf`는 null 요소를 허용하지 않으므로 데이터 조건도 확인해야 한다.

## DTO에도 무조건 같은 방식을 적용할까

전송용 DTO는 데이터를 운반하는 것이 목적이다. 프레임워크와 직렬화 방식에 따라 접근자가 필요할 수 있고, Java record처럼 생성 시 값을 받는 모델을 선택할 수도 있다. 모든 DTO에 업무 메서드를 넣거나 모든 엔티티에 무조건 Setter를 금지하는 규칙보다, 변경 책임이 어디에 있는지 먼저 정하는 편이 낫다.

검증할 때는 정상 값만 보지 않는다. 초기 음수 잔액, 0원 출금, 잔액 초과, 정상 출금 뒤 잔액, 반환된 컬렉션의 변경 가능 여부를 확인한다.

참고: [Java 클래스 작성](https://dev.java/learn/classes-objects/creating-classes/), [Java 17 List.copyOf](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/List.html#copyOf(java.util.Collection)).

