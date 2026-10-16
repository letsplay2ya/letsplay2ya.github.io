# OCR coordinate boundary experiment

Node.js 22.12+, no dependencies: download example.mjs and test.mjs together and run `node test.mjs`.

The conversion body is ported from the project's toHighlightArea with types removed.
The document filter is a small adaptation that requires previewType explicitly;
the original also infers preview type from file metadata.

The tests include undesirable but real conversion outcomes: negative width, NaN,
and the difference between numeric 0 and string "0" in default selection. They
document current boundaries rather than presenting them as correct input policy.
This does not render a PDF or validate OCR recognition accuracy.
