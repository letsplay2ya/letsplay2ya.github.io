---
title: "[JAVA] 에러(Error) / 예외처리(Exception Handling)"
description: "프로그램 실행중 어떤원인에 의해 오작동하거나 비정상 종료된 경우."
date: "2025-01-03"
tags: []
category: "java"
origin: "hexo"
legacyUrl: "/2025/01/03/javaTryCatch/"
---
<!-- hexo-import:v1 sha256=368ad2e57a84ab87a844968c9c2e9df5aacb13531ce5466c48cab0ed061f3a06 -->

![](/legacy-assets/images/thumbnail/java.png)

<span id="에러-Error"></span>

## 에러(Error)

프로그램 실행중 어떤원인에 의해 오작동하거나 비정상 종료된 경우.

이를 초래하는 원인을 프로그램 에러 또는 오류라고 한다.

발생시점에 따라 컴파일에러 Compile Error, 와 런타임 에러 Runtime Error 로 나눌수 있다.

외에도 논리적 에러 Logical Error가 있다.

컴파일에러 Compile Error  
말그대로 컴파일 시 (실행 전) 발생하는 에러.

런타임 에러 Runtime Error  
프로그램 실행도중 발생하는 에러.

논리적 에러 Logical Error  
컴파일도 잘 되고, 실행도 잘 되지만 의도한 것과 다르게 동작하는 에러.

ex) 창고의 재고가 음수가 된다던가, 게임에서 캐릭터가 총알을 맞아도 죽지 않는 경우가 이에 해당됨.

소스를 컴파일하면 컴파일러가 소스코드(\*.java)에 대해 오타나 자료형 체크 등기본검사를 수행하여 오류를 알린다.

컴파일러가 알려 준 에러들을 모두 수정해서 컴파일을 성공적으로 하면,

클래스파일(\*.class) 이 생성되고 생성된 클래스 파일을 실행할 수 있게 되는 것이다.

컴파일을 성공했다고 해서 프로그램의 실행시에도 에러가 발생하지 않는것은 아니다. 컴파일러가 소스코드의 기본적 사항은 컴파일 시 모두 걸러줄 수는 있지만 실행도중 발생하는 잠재적 오류(런타임 에러)까지 검사할 수는 없다.

런타임 에러를 방지하기 위해서는 프로그램의 실행도중 발생할 수 있는 모든 경우의 수를 고려하여 대비를 해야한다. 자바에서는 실행시 (runtime) 발생할 수 있는 프로그램 오류를 에러 error 와 예외 exception 두가지로 구분한다.

에러 Error  
프로그램 코드에 의해서 수습될 수 있는 심각한 오류. 발생시 프로그램 비정상 종료됨.

ex) out of memory, stack over flow…

예외 Exception  
프로그램 코드에 의해서 수습될 수 있는 다소 미약한 오류

예외클래스 종류

-   Exception 클래스들

주로 사용자의 실수와 같은 외적요인에 의해 발생하는 예외

ex) 파일명오타 FileNotFoundException

```text
 클래스명오타ClassnotFoundException

 잘못된 데이터 형식 DataFormatException ...
```

-   RuntimeException 클래스들

프로그래머의 실수로 발생하는 예외.

ex) 배열범위 초과 IndexOutOfBoundsException

```text
 null 처리 안함  NullPointerException

 클래스간 형변환 ClassCastException ...
```

<span id="예외처리-Exception-Handling"></span>

## 예외처리(Exception Handling)

프로그램실행중 발생에러는 어쩔 수 없지만 예외는 프로그래머가 이에 대한 처리를 미리 해주어야 한다.

예외처리란, 프로그램 실행시 발생할수있는 얘기치 못한 얘외발생에 대비한 코드를 작성하는 것이다.

목적은 예외발생으로 인한 비정상 종료를 막고 정상실행상태는 유지할수 있도록 하는 것이다.

발생예외를 처리하지 못하면 프로그램은 비정상 종료되며, 처리되지 못한 얘외는 JVM의 예외처리기가 받아서 예외원인을 화면에 출력한다.

예외처리구문 Try - Catch 문.  
try-catch문의 구조  
‘’’java  
try {  
//예외발생할 가능성이 있는 문장

}catch(Exception1 e1) {  
//Exception1이 발생했을 경우, 이를 처리하지 위한 문장적는다.  
//보통 이곳에 예외메세지를 출력하고 로그로 남김.

}catch(Exception2 e2) {  
//Exception2이 발생했을 경우, 이를 처리하지 위한 문장적는다.

}catch(ExceptionN eN) {  
//ExceptionN이 발생했을 경우, 이를 처리하지 위한 문장적는다.

}  
‘’’

기본적인 try catch 구문의 구조이다.

try 문에서 Exception 예외가 발생할 경우 catch (Exception e) 로 빠져서 그 안의 실행문을 실행한다.

try-catch문 플로우

-   예외가 try 블럭에서 발생한 경우
    
    1.  발생한 예외와 일치하는 catch 문이 있는지 확인.
    2.  일치하는 catch 문이 있다면 catch 블럭 내의 문장을 모두 실행하고 try catch 문을 빠져나가서 그다음 문장을 수행.
    3.  일치하는 catch 문이 없다면 예외는 처리되지 못하고 에러 발생.
-   예외가 try 블럭 안에서 발생하지 않은 경우
    
    1.  catch블럭을 거치지 않고 전체 try-catch문을 빠져나가서 수행을 계속한다.
-   예외가 try 블럭 밖에서 발생한 경우
    
    1.  예외는 아무 처리되지 못한 채 에러 발생.
