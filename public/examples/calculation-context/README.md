# Calculation context experiment

Node.js 22.12+, no dependencies. Save example.mjs and test.mjs together, then `node test.mjs`.

The predicate is reduced to four context fields. Number normalization uses the
same operations as the original helper. inputSignature is a deliberately smaller
fixed tuple, not a copy of every medical LOL/DED API field.

Tests document what is rejected and what is still accepted, including repeated
requests with the same context. The normalizer is not a numeric input validator,
percentage conversion utility or arbitrary-precision money representation.
