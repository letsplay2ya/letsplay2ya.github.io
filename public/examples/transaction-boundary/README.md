# Spring transaction boundary experiment

Standalone Java 17+ experiment using Spring Framework 6.2.11 and H2 2.3.232.
No company project, application configuration or business data is used.

The example explicitly creates a JDK proxy with ProxyFactory,
TransactionInterceptor and AnnotationTransactionAttributeSource. It uses the real
Spring JDBC transaction manager and real H2 inserts, without starting a Boot
application or reproducing its auto-configuration.

## Reproduce from the blog repository

Install Node.js 22.12+ and a JDK 17+, then run from the repository root:

```sh
npm run test:transaction
```

The runner downloads the pinned dependencies from Maven Central into `.qa`, checks
their SHA-256 hashes, compiles with `javac --release 17` and compares 8 scenarios
against results.json. Jars and class files are not published as blog assets.

## Alternative with Maven

Download TransactionBoundary.java and pom.xml into the same directory:

```sh
mvn compile exec:java
```

This is an alternative dependency-resolution route. The recorded verification
used the repository's Node/javac runner, not Maven. The program throws an
AssertionError if a row count, transaction-active flag or exception differs.

Every scenario uses a separate in-memory database. Counts are read after the
invocation completes. No outer test transaction hides commits or rollbacks.
Default rollback rules are used except for the explicit IOException rollbackFor
case. Custom application-wide rollback rules would change the expectations.
