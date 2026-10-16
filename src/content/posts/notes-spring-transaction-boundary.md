---
title: '@Transactional을 붙였는데 왜 데이터가 남았을까'
description: '실제 Spring 트랜잭션 프록시와 H2로 8가지 호출을 비교했습니다. 자기 호출·checked exception·예외를 잡는 위치에 따라 커밋 결과가 달라지는 이유를 설명합니다.'
date: '2026-10-16T06:25:54.5165002Z'
category: 'Java'
tags: ['Java', 'Spring', '트랜잭션', '실험']
origin: 'original'
---

메서드에 @Transactional이 있고 예외도 발생했다. 그런데 테이블에 행이 남아 있다. 어노테이션을 더 붙이기 전에 **어떤 호출이 프록시를 통과했고, 어떤 예외가 그 경계 밖으로 나왔는지** 확인해야 한다.

이 글은 회사 프로젝트의 장애 사례가 아닌 별도 실행 실습이다. Spring Framework 6.2.11의 실제 트랜잭션 advice와 H2 2.3.232를 연결해 INSERT 후 남은 행을 확인했다. Boot 애플리케이션을 띄우는 대신 JDK 프록시를 명시적으로 구성하여 호출 경계를 좁혔다. Java 소스는 --release 17로 컴파일했다.

## 예외 발생과 롤백은 같은 사건이 아니다

프록시 기반의 트랜잭션은 호출 앞뒤를 감싸는 로직으로 이해할 수 있다.

```text
호출자 → 트랜잭션 프록시 → 대상 메서드 → JDBC INSERT
                         ↓ 정상 복귀 / 예외
       ← 커밋·롤백 결정 ←
```

대상 메서드에 표시가 있다는 사실만으로 모든 호출이 이 경로를 지나지는 않는다. 다른 메서드에서 this로 직접 호출하면 내부 호출은 새로 프록시를 통과하지 않는다. [Spring의 프록시 모드 설명](https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/annotations.html)을 실행 결과와 함께 확인할 부분이다.

실습은 ProxyFactory, TransactionInterceptor, AnnotationTransactionAttributeSource로 이 경계를 직접 만들었다. 어노테이션 기반 규칙은 실제로 읽지만, 컴포넌트 스캔이나 Boot 자동 설정을 검증하는 구성은 아니다.

## 먼저 결과를 비교하기

각 경우는 별도 메모리 DB를 사용한다. INSERT 직전에 실제 트랜잭션 활성 여부를 기록하고, 호출이 끝난 다음 바깥에서 행 수를 읽었다. 테스트 자체에 트랜잭션을 걸어 커밋 결과를 가리지 않았다.

| 호출 | INSERT 시 트랜잭션 | 종료 때 보이는 예외 | 남은 행 |
| --- | --- | --- | --- |
| 프록시 → RuntimeException 발생 | 활성 | IllegalStateException | 0 |
| 프록시 → 비트랜잭션 메서드 → this 호출 | 비활성 | IllegalStateException | 1 |
| 프록시 없는 원본 객체 직접 호출 | 비활성 | IllegalStateException | 1 |
| 프록시 → checked exception 발생 | 활성 | IOException | 1 |
| IOException을 rollbackFor로 지정 | 활성 | IOException | 0 |
| 같은 메서드 안에서 예외를 잡고 정상 반환 | 활성 | 없음 | 1 |
| 외부 메서드가 트랜잭션을 시작한 뒤 this 호출 | 활성 | IllegalStateException | 0 |
| 외부 트랜잭션에서 다른 REQUIRED 프록시의 예외를 잡음 | 활성 | UnexpectedRollbackException | 0 |

마지막 두 행 때문에 “자기 호출이면 트랜잭션이 없다”, “catch하면 커밋된다”는 요약은 충분하지 않다. 시작된 경계와 rollback-only 상태를 함께 봐야 한다.

## 자기 호출에서 빠지는 것은 내부 메서드의 새 경계다

실습의 비트랜잭션 진입점은 다음과 같다.

```java
public void selfInvocation() {
    this.runtimeFailure();
}

@Transactional
public void runtimeFailure() {
    insert();
    throw new IllegalStateException("simulated failure");
}
```

selfInvocation에는 트랜잭션 규칙이 없고, 내부 this 호출도 advice를 다시 지나지 않는다. H2 연결은 이 경로에서 자동 커밋으로 동작하여 INSERT가 남는다. 밖으로 나온 예외가 이미 끝난 INSERT를 되돌려 주지는 않는다.

반대로 outerTransaction에도 @Transactional을 붙이고 프록시를 통해 호출하면, 외부 진입 때 이미 트랜잭션이 시작된다. 내부 this 호출이 그 트랜잭션을 없애는 것은 아니다. 실습에서는 INSERT 시 활성 상태였고, RuntimeException이 외부 경계까지 전달되어 0건이 남았다.

그래서 내부 호출에 REQUIRES_NEW 같은 별도 전파 정책을 붙이는 요구와, 기존 외부 트랜잭션 안에서 수행되는 상황을 구분해야 한다. 자기 호출을 보고 곧바로 “모든 DB 작업이 비트랜잭션”이라고 판정하면 안 된다.

## checked exception은 별도 규칙을 확인한다

이 실습의 기본 규칙에서 RuntimeException은 롤백되지만 IOException은 예외가 밖으로 나와도 커밋됐다. rollbackFor = IOException.class를 지정한 경우에는 같은 INSERT가 롤백됐다.

이것은 예외 메시지가 심각해 보이는지로 결정되지 않는다. 프레임워크가 읽는 롤백 규칙과 예외 타입의 문제다. [Spring 롤백 규칙 문서](https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/rolling-back.html)도 프로젝트에서 규칙을 재정의했는지와 함께 확인해야 한다.

rollbackFor = Exception.class를 모든 메서드에 붙이는 것부터 해결책으로 삼으면 업무상 정상적인 종료 신호까지 실패로 취급할 수 있다. 어느 실패가 데이터를 되돌려야 하는지 먼저 정하고, 의미에 맞는 예외 타입과 규칙으로 표현하는 편이 명확하다. 여기서는 기본 규칙과 명시적 IOException 규칙만 비교했다.

## catch의 위치가 바뀌면 결과도 바뀐다

catchInside는 같은 메서드 안에서 직접 만든 IllegalStateException을 잡는다. JDBC 자체는 성공했으며 rollback-only도 설정하지 않았다. 프록시는 정상 반환을 보므로 1건이 커밋된다.

다른 경우에는 외부 트랜잭션 안에서 별도 프록시의 runtimeFailure를 호출했다. 내부 프록시는 기본 REQUIRED로 같은 물리 트랜잭션에 참여한다. 그 경계를 예외가 통과하면서 rollback-only가 표시된다. 외부 메서드가 예외를 잡아 정상 반환해도 이 표시가 지워지지 않는다. 최종 커밋 시도에서 UnexpectedRollbackException이 발생했고 행은 남지 않았다.

이 둘을 구분하지 않으면 “catch했는데 왜 롤백됐는가”라는 반대 질문에도 답하기 어렵다. DB 제약 오류처럼 연결·DB 자체가 실패 상태가 되는 경우도 단순한 내부 catch 실험과 같다고 볼 수 없다.

## 고칠 때 선택할 수 있는 구조

| 선택 | 맞는 상황 | 추가로 볼 것 |
| --- | --- | --- |
| 호출을 별도 서비스로 분리 | 독립적인 업무 경계를 실제로 나눌 때 | 분리한 서비스의 전파 정책과 예외 계약 |
| 진입 서비스에 경계 선언 | 전체 작업이 하나로 성공·실패해야 할 때 | 외부 API 호출까지 오래 묶지 않는지 |
| TransactionTemplate로 범위 명시 | 같은 메서드 안에서 경계를 드러낼 필요가 있을 때 | 예외 변환과 중첩 호출을 팀 규칙과 맞추기 |
| 실패를 정상 결과 타입으로 반환 | 호출자가 복구 가능한 업무 거절을 처리할 때 | 트랜잭션에는 정상 반환으로 보인다는 사실 |

단지 프록시를 통과시키려고 자기 자신을 주입하는 방식도 가능하지만, 업무 경계가 불분명한 상태를 가릴 수 있다. 어떤 범위를 원자적으로 묶을지가 먼저이고, 어노테이션 위치는 그 결정을 표현하는 수단이다.

## 직접 실행하기

[Java 소스](/examples/transaction-boundary/TransactionBoundary.java), [실행 안내](/examples/transaction-boundary/README.md), [실행 결과 JSON](/examples/transaction-boundary/results.json)을 공개했다. 저장소에서는 다음 명령으로 검증한다. JDK 17 이상이 필요하며, 처음에는 Maven Central에서 고정한 의존성을 내려받는다.

```sh
npm run test:transaction
```

runner는 다운로드한 jar의 SHA-256을 확인하고 .qa에만 보관한다. 실제 INSERT와 활성 상태, 예외 타입을 검사하며 하나라도 기대와 다르면 실패한다. 결과 표를 미리 출력하는 흉내가 아니다.

Maven을 사용하는 독자를 위한 pom.xml도 함께 제공한다. 이번 기록은 Node/javac runner로 실행한 결과이며 Maven 실행 결과를 별도로 주장하지 않는다.

## 이 실험으로 판단할 수 없는 것

H2와 단일 JDBC 트랜잭션의 경계는 확인했지만, 운영 DB의 격리 수준·잠금·성능이나 JPA flush 시점, 여러 데이터소스, 외부 메시지 전송까지 검증하지는 않았다. 파일이나 외부 API의 부수 효과가 DB 롤백과 함께 취소된다는 보장도 없다.

실제 프로젝트에 적용할 때는 프록시를 거치는 호출인지, 선택된 트랜잭션 매니저가 어떤 연결을 관리하는지, 예외가 어느 경계를 통과하는지, 호출 후 DB가 어떤 상태인지 순서대로 확인하면 된다. 어노테이션 존재 여부만 검색하는 것보다 이 네 가지가 결과를 더 잘 설명한다.

[CSV 적재의 트랜잭션과 기록 범위](/writing/legacy-oracle-ch3/) · [예외를 처리하는 위치와 호출자 계약](/writing/legacy-javatrycatch/)
