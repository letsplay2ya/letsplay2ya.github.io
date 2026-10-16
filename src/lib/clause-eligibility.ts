// Predicate ported from TermnCondition/termClauseEligibility.ts.
// Only the business API type was replaced with the fields this predicate reads.
export type ClauseEligibilityInput = {
  appLevlDvCd?: string;
  appYn?: string;
  clusDcExchgExsoYn?: string;
};
const toUpperText = (value: unknown) => String(value ?? '').trim().toUpperCase();
export const isDerivedClauseDiscountTarget = (term: ClauseEligibilityInput) => {
  const discountTargetYn = toUpperText(term.clusDcExchgExsoYn);
  return (
    toUpperText(term.appLevlDvCd) !== '04' &&
    toUpperText(term.appYn) === 'Y' &&
    (discountTargetYn === '' || discountTargetYn === 'Y')
  );
};
