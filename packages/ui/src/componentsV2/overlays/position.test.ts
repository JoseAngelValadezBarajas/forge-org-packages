import { describe, expect, it } from 'vitest';
import { computePosition, type PositionInput } from './position';

const base: PositionInput = {
  anchor: { left: 400, top: 300, width: 100, height: 40 },
  panel: { width: 200, height: 120 },
  viewport: { width: 1000, height: 800 },
  placement: 'bottom',
  align: 'start',
  offset: 10,
  margin: 16,
};

describe('computePosition', () => {
  it.each([
    ['top', 170, 350],
    ['bottom', 350, 350],
  ] as const)('centers on the %s side', (placement, top, left) => {
    expect(computePosition({ ...base, placement, align: 'center' })).toMatchObject({ top, left, placement });
  });

  it.each([
    ['left', 190],
    ['right', 510],
  ] as const)('places on the %s side', (placement, left) => {
    expect(computePosition({ ...base, placement, align: 'center' })).toMatchObject({ left, top: 260, placement });
  });

  it('aligns to the start and end edges of the anchor', () => {
    expect(computePosition(base).left).toBe(400);
    expect(computePosition({ ...base, align: 'end' }).left).toBe(300);
  });

  it('mirrors start and end in right-to-left documents', () => {
    expect(computePosition({ ...base, rtl: true }).left).toBe(300);
    expect(computePosition({ ...base, align: 'end', rtl: true }).left).toBe(400);
  });

  it('flips when the preferred side has no room and the other side has more', () => {
    const anchor = { ...base.anchor, top: 700 };
    expect(computePosition({ ...base, anchor })).toMatchObject({ placement: 'top', top: 570 });
    expect(computePosition({ ...base, placement: 'top', anchor: { ...base.anchor, top: 20 } }).placement).toBe('bottom');
    expect(computePosition({ ...base, placement: 'left', anchor: { ...base.anchor, left: 30 } }).placement).toBe('right');
  });

  it('keeps the preferred side when the other side is tighter', () => {
    const viewport = { width: 1000, height: 200 };
    const anchor = { ...base.anchor, top: 60 };
    expect(computePosition({ ...base, viewport, anchor }).placement).toBe('bottom');
  });

  it('shifts to stay inside the viewport margin', () => {
    expect(computePosition({ ...base, anchor: { ...base.anchor, left: 2 } }).left).toBe(16);
    expect(computePosition({ ...base, anchor: { ...base.anchor, left: 950 } }).left).toBe(784);
  });

  it('keeps the arrow on the anchor center after a shift', () => {
    const shifted = computePosition({ ...base, align: 'center', anchor: { ...base.anchor, left: 2 } });
    expect(shifted.arrow).toBe(36);
    expect(computePosition({ ...base, align: 'center' }).arrow).toBe(100);
    expect(computePosition({ ...base, placement: 'right', align: 'center' }).arrow).toBe(60);
  });
});
