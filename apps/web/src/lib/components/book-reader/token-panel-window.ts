/**
 * @license BSD-3-Clause
 * Copyright (c) 2026, ッツ Reader Authors
 * All rights reserved.
 */

export function getRowOffsets(
  keys: readonly string[],
  heights: ReadonlyMap<string, number>,
  estimatedHeight = 80
): number[] {
  const offsets = [0];
  for (const key of keys)
    offsets.push(offsets[offsets.length - 1] + (heights.get(key) ?? estimatedHeight));
  return offsets;
}

export function getVisibleRange(
  offsets: readonly number[],
  scrollTop: number,
  viewportHeight: number,
  overscan = 5
): { start: number; end: number } {
  const count = offsets.length - 1;
  if (!count) return { start: 0, end: 0 };
  const top = Math.max(0, Math.min(scrollTop, offsets[count] - viewportHeight));
  const rowAt = (position: number) => {
    let low = 0;
    let high = count;
    while (low < high) {
      const middle = Math.floor((low + high) / 2);
      if (offsets[middle + 1] <= position) low = middle + 1;
      else high = middle;
    }
    return low;
  };
  return {
    start: Math.max(0, rowAt(top) - overscan),
    end: Math.min(count, rowAt(top + viewportHeight) + 1 + overscan)
  };
}
