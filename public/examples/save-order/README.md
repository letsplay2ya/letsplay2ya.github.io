# Save order reproduction

Node.js 22.12+; no additional dependencies.

Download example.mjs and test.mjs to the same directory, then run:

```sh
node test.mjs
```

This synchronous model isolates the difference between an editor draft, committed state,
and a payload. It does not mount React or AG Grid, simulate DOM focus, call a server,
or reproduce the business system's full validation rules. The intentionally wrong path
captures the old value before flushing; the correct path flushes, reads, then validates.
An asynchronous editor would require an explicit awaitable commit contract.
