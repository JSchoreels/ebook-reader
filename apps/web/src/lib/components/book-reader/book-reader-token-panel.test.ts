/**
 * @license BSD-3-Clause
 * Copyright (c) 2026, ッツ Reader Authors
 * All rights reserved.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { tick } from 'svelte';
import TokenPanel from './book-reader-token-panel.svelte';
import type { DocumentTokenAnalysisEntry } from '$lib/functions/anki';

describe('virtual token panel', () => {
  const scrollToDescriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollTo');
  let panel: TokenPanel;
  let target: HTMLDivElement;
  const entries: DocumentTokenAnalysisEntry[] = Array.from({ length: 4289 }, (_, index) => ({
    token: `語${index}`,
    count: 4289 - index,
    firstOccurrence: index,
    status: index % 2 ? 'young' : 'mature',
    due: index % 2 === 1,
    cardIds: [index + 1]
  }));

  beforeEach(() => {
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      }
    );
    Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
      configurable: true,
      value: vi.fn(function (this: HTMLElement, options: ScrollToOptions | number) {
        if (typeof options === 'object') this.scrollTop = options.top ?? 0;
        this.dispatchEvent(new Event('scroll'));
      })
    });
    target = document.createElement('div');
    document.body.append(target);
    panel = new TokenPanel({
      target,
      props: { entries, uniqueTokens: entries.length, totalTokens: 24406, progress: undefined }
    });
  });

  afterEach(() => {
    panel?.$destroy();
    target?.remove();
    if (scrollToDescriptor)
      Object.defineProperty(HTMLElement.prototype, 'scrollTo', scrollToDescriptor);
    else Reflect.deleteProperty(HTMLElement.prototype, 'scrollTo');
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('keeps complete counts while mounting only a window and filtering correctly', async () => {
    expect(target.querySelector('aside')?.style.writingMode).toBe('horizontal-tb');
    expect(target.textContent).toContain('4289');
    expect(target.querySelectorAll('[data-token-row]').length).toBeLessThan(30);
    const due = [...target.querySelectorAll('button')].find((button) =>
      button.textContent?.startsWith('Due')
    )!;
    due.click();
    await tick();
    expect(target.textContent).toContain('2144');
    expect(
      [...target.querySelectorAll<HTMLElement>('[data-token-row]')].every(
        (row) => Number(row.dataset.tokenRow?.slice(1)) % 2 === 1
      )
    ).toBe(true);
  });

  it('mounts a selected offscreen token, retains sentences and preserves focused rows', async () => {
    const first = target.querySelector<HTMLButtonElement>('[data-token-row] button')!;
    first.focus();
    await tick();
    panel.$set({
      activeToken: '語4288',
      tokenSentences: { 語4288: [{ sentence: '最後の語4288。', page: 12 }] }
    });
    await tick();
    await tick();
    expect(target.querySelector('[data-token-row="語4288"]')?.textContent).toContain('Page 12');
    expect(document.activeElement).toBe(first);
    expect(target.querySelectorAll('[data-token-row]').length).toBeLessThan(30);
  });
});
