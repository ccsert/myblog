type CursorElement = {
  style: Pick<CSSStyleDeclaration, 'transform'>;
};

type PointerCoordinates = Pick<PointerEvent, 'clientX' | 'clientY'>;

export function syncCursorPosition(
  cursor: CursorElement | null,
  pointer: PointerCoordinates,
) {
  if (!cursor) return;

  cursor.style.transform = `translate3d(${pointer.clientX}px, ${pointer.clientY}px, 0) translate(-50%, -50%)`;
}
