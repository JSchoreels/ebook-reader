/**
 * @license BSD-3-Clause
 * Copyright (c) 2026, ッツ Reader Authors
 * All rights reserved.
 */

import { describe, expect, it } from 'vitest';
import { getRowOffsets, getVisibleRange } from './token-panel-window';

describe('token panel window', () => {
  it('covers expanded rows without mounting the entire list', () => {
    const keys = Array.from({ length: 4289 }, (_, index) => String(index));
    const offsets = getRowOffsets(keys, new Map([['2', 320]]));
    expect(offsets.slice(0, 5)).toEqual([0, 80, 160, 480, 560]);
    expect(getVisibleRange(offsets, 200, 100, 0)).toEqual({ start: 2, end: 3 });
    const range = getVisibleRange(offsets, 2000, 400);
    expect(range.end - range.start).toBeLessThan(20);
    expect(offsets[range.start]).toBeLessThanOrEqual(2000);
    expect(offsets[range.end]).toBeGreaterThanOrEqual(2400);
  });

  it('handles the final row, filter shrinkage and empty results', () => {
    const offsets = getRowOffsets(['one', 'two', 'three'], new Map());
    expect(getVisibleRange(offsets, 10000, 80, 0)).toEqual({ start: 2, end: 3 });
    expect(getVisibleRange(offsets, -10, 500)).toEqual({ start: 0, end: 3 });
    expect(getVisibleRange([0], 100, 400)).toEqual({ start: 0, end: 0 });
  });
});
