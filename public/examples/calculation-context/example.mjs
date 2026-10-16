// Reduced explanation of the current-context predicate, not a network controller.
export function canApply(request, current) {
  return current !== null
    && request.epoch === current.epoch
    && request.contract === current.contract
    && request.target === current.target
    && request.signature === current.signature;
}
// Same normalization operations as the original toCompactNumberString.
export function compact(value) {
  if (value == null || value === '') return '';
  const parsed = Number(String(value).replace(/[,%\s]/g, ''));
  return Number.isFinite(parsed) ? parsed.toString() : String(value);
}
// Deliberately small fixed input tuple; basePremium is a result and is excluded.
export function inputSignature({ currency, aoc, agg }) {
  return JSON.stringify([currency, compact(aoc), compact(agg)]);
}
