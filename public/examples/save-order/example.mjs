// Explanatory synchronous model, not the production React/AG Grid implementation.
export function createEditor(initial = '10') {
  let draft = initial;
  let committed = initial;
  return {
    type: value => { draft = value; },
    flush: () => { committed = draft; },
    read: () => committed,
  };
}

function validate(text) {
  return /^\d+(?:\.\d+)?$/.test(text) && Number.isFinite(Number(text));
}

export function prepareSave(editor, serverItem) {
  editor.flush();
  const rate = editor.read();
  if (!validate(rate)) return { errors: ['RATE_INVALID'], payload: null };
  return { errors: [], payload: { ...serverItem, rate: Number(rate) } };
}

export function prepareInWrongOrder(editor, serverItem) {
  const rate = editor.read(); // Captures the old value before flush.
  editor.flush();
  return { ...serverItem, rate: Number(rate) };
}
