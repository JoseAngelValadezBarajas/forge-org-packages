export type OverlayPlacement = 'top' | 'bottom' | 'left' | 'right';
export type OverlayAlign = 'start' | 'center' | 'end';

type Box = { left: number; top: number; width: number; height: number };

export type PositionInput = {
  anchor: Box;
  panel: { width: number; height: number };
  viewport: { width: number; height: number };
  placement: OverlayPlacement;
  align: OverlayAlign;
  offset: number;
  margin: number;
  rtl?: boolean;
};

const opposite: Record<OverlayPlacement, OverlayPlacement> = {
  top: 'bottom',
  bottom: 'top',
  left: 'right',
  right: 'left',
};

const clamp = (value: number, minimum: number, maximum: number) => Math.max(minimum, Math.min(value, maximum));

function crossStart(start: number, anchorSize: number, panelSize: number, align: OverlayAlign) {
  if (align === 'center') return start + (anchorSize - panelSize) / 2;
  return align === 'start' ? start : start + anchorSize - panelSize;
}

export function computePosition({ anchor, panel, viewport, placement, align, offset, margin, rtl = false }: PositionInput) {
  const right = anchor.left + anchor.width;
  const bottom = anchor.top + anchor.height;
  const room: Record<OverlayPlacement, number> = {
    top: anchor.top - margin,
    bottom: viewport.height - bottom - margin,
    left: anchor.left - margin,
    right: viewport.width - right - margin,
  };
  const vertical = placement === 'top' || placement === 'bottom';
  const needed = (vertical ? panel.height : panel.width) + offset;
  const side = room[placement] < needed && room[opposite[placement]] > room[placement] ? opposite[placement] : placement;

  const mirrored = rtl && vertical && align !== 'center' ? (align === 'start' ? 'end' : 'start') : align;
  const idealLeft = vertical
    ? crossStart(anchor.left, anchor.width, panel.width, mirrored)
    : side === 'left'
      ? anchor.left - offset - panel.width
      : right + offset;
  const idealTop = vertical
    ? side === 'top'
      ? anchor.top - offset - panel.height
      : bottom + offset
    : crossStart(anchor.top, anchor.height, panel.height, align);

  const left = clamp(idealLeft, margin, viewport.width - panel.width - margin);
  const top = clamp(idealTop, margin, viewport.height - panel.height - margin);
  const arrow = vertical
    ? clamp(anchor.left + anchor.width / 2 - left, 0, panel.width)
    : clamp(anchor.top + anchor.height / 2 - top, 0, panel.height);

  return { left, top, placement: side, arrow };
}
