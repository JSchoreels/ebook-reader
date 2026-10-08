/**
 * @license BSD-3-Clause
 * Copyright (c) 2026, ッツ Reader Authors
 * All rights reserved.
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { isSupportedBookFile, loadBookFile } from './load-book-file';

const innerTextDescriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'innerText');

beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, 'innerText', {
    configurable: true,
    get() {
      return this.textContent || '';
    },
    set(value: string) {
      this.textContent = value;
    }
  });
});

afterAll(() => {
  if (innerTextDescriptor) {
    Object.defineProperty(HTMLElement.prototype, 'innerText', innerTextDescriptor);
  } else {
    delete (HTMLElement.prototype as any).innerText;
  }
});

describe('loadBookFile', () => {
  it('recognizes HTML and SRT files case-insensitively', () => {
    expect(isSupportedBookFile(new File([], 'article.HTML'))).toBe(true);
    expect(isSupportedBookFile(new File([], 'dialogue.SRT'))).toBe(true);
    expect(isSupportedBookFile(new File([], 'document.pdf'))).toBe(false);
  });

  it('loads SRT cue text through the shared import dispatcher', async () => {
    const file = new File(['1\n00:00:01,000 --> 00:00:03,000\n最初の字幕です。\n'], 'dialogue.SRT');
    const book = await loadBookFile(file, document, 123);

    expect(book.title).toBe('dialogue');
    expect(book.elementHtml).toContain('<p>最初の字幕です。</p>');
    expect(book.lastBookModified).toBe(123);
  });

  it('loads a local HTML article through the shared import dispatcher', async () => {
    const file = new File(
      [
        '<html><head><title>Saved article</title></head><body><main><p>Article body.</p></main></body></html>'
      ],
      'article.html'
    );
    const book = await loadBookFile(file, document, 456);

    expect(book.title).toBe('Saved article');
    expect(book.elementHtml).toContain('<p>Article body.</p>');
    expect(book.lastBookModified).toBe(456);
  });
});
