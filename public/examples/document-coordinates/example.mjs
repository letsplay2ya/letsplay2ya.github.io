// Body ported from ModalRawDataConfirm.tsx/toHighlightArea; TypeScript types removed.
export function toHighlightArea(pos) {
  const pageWidth = Number(pos.imgWdtVlu || 1653);
  const pageHeight = Number(pos.imgHgtVlu || 2339);
  const safeWidth = pageWidth > 0 ? pageWidth : 1;
  const safeHeight = pageHeight > 0 ? pageHeight : 1;
  const cdntVlu1 = Number(pos.cdntVlu1 || 0);
  const cdntVlu2 = Number(pos.cdntVlu2 || 0);
  const cdntVlu3 = Number(pos.cdntVlu3 || 0);
  const cdntVlu4 = Number(pos.cdntVlu4 || 0);
  const rectWidth = cdntVlu3 - cdntVlu1;
  const rectHeight = cdntVlu4 - cdntVlu2;
  return {
    pageIndex: Math.max(0, Number(pos.pageNo || 1) - 1),
    left: (cdntVlu1 / safeWidth) * 100,
    top: (cdntVlu2 / safeHeight) * 100,
    width: (rectWidth / safeWidth) * 100,
    height: (rectHeight / safeHeight) * 100,
  };
}

// Explanatory document filter: explicit PDF type, no filename inference.
export function areasForDocument(points, document) {
  if (!document || document.previewType !== 'pdf') return [];
  return points.flatMap((point, pointIndex) => point.ocrId === document.id
    ? [{ ...toHighlightArea(point), pointIndex, documentId: point.ocrId }]
    : []);
}
