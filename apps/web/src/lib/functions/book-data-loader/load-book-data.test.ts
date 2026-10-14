/**
 * @license BSD-3-Clause
 * Copyright (c) 2026, ッツ Reader Authors
 * All rights reserved.
 */

import { firstValueFrom } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { BlurMode } from '$lib/data/blur-mode';
import type { BooksDbBookData } from '$lib/data/database/books-db/versions/books-db';
import loadBookData from './load-book-data';

vi.mock('$lib/data/storage/handler/base-handler', () => ({ BaseStorageHandler: {} }));

function book(elementHtml: string, styleSheet = ''): BooksDbBookData {
  return {
    id: 1,
    title: 'Reader settings',
    elementHtml,
    styleSheet,
    blobs: {},
    hasThumb: false,
    characters: 0,
    lastBookModified: 0,
    lastBookOpen: 0
  };
}

describe('book styles respect reader settings', () => {
  it.each([true, false])('normalizes inline EPUB styles (paginated: %s)', async (isPaginated) => {
    const source = book(
      '<div style="writing-mode:vertical-rl!important; -webkit-writing-mode:vertical-rl; -moz-writing-mode:vertical-rl; -ms-writing-mode:tb-rl">' +
        '<p style="line-height:2!important; text-indent:3em; text-align:justify; margin:0 2em">' +
        '<span style="font-size:1.0rem">日本語</span>' +
        '<span style="font-size:1.5rem!important">見出し</span>' +
        '</p></div>'
    );
    const { htmlContent } = await firstValueFrom(
      loadBookData(source, '.book-content', document, isPaginated, BlurMode.ALL)
    );
    const content = document.createElement('div');
    content.innerHTML = htmlContent;

    expect(htmlContent).not.toMatch(/writing-mode/i);
    expect(content.querySelector('p')?.style.lineHeight).toBe('');
    expect(content.querySelector('p')?.style.textIndent).toBe('');
    expect(content.querySelector('p')?.style.textAlign).toBe('justify');
    expect(content.querySelector('p')?.style.margin).toBe('0px 2em');
    expect(content.querySelector('span')?.style.fontSize).toBe(
      'calc(var(--book-content-font-size) * 1)'
    );
    expect(content.querySelectorAll('span')[1].style.fontSize).toBe(
      'calc(var(--book-content-font-size) * 1.5)'
    );
    expect(content.querySelectorAll('span')[1].style.getPropertyPriority('font-size')).toBe(
      'important'
    );
    expect(content.textContent).toBe('日本語見出し');
    expect(source.elementHtml).toContain('writing-mode:vertical-rl');
  });

  it('applies the same normalization to EPUB stylesheets and preserves relative text sizes', async () => {
    const { styleSheet } = await firstValueFrom(
      loadBookData(
        book(
          '<h2 class="title">見出し</h2><p>本文</p>',
          '.title { WRITING-MODE:vertical-rl; font-size:1.5rem!important; color:red }' +
            'p { -epub-writing-mode:vertical-rl; line-height:2; text-indent:3em; font-size:1em }'
        ),
        '.book-content',
        document,
        true,
        BlurMode.ALL
      )
    );

    expect(styleSheet).not.toMatch(/writing-mode|line-height|text-indent/i);
    expect(styleSheet).toContain('.book-content .title{');
    expect(styleSheet).toContain('font-size:calc(var(--book-content-font-size) * 1.5)!important;');
    expect(styleSheet).toContain('color:red;');
    expect(styleSheet).toContain('font-size:1em;');
  });

  it('keeps images, inline formatting and font sizes that already follow their parent', async () => {
    const { htmlContent } = await firstValueFrom(
      loadBookData(
        book(
          '<p><em style="font-size:1.2em; color:red">本文</em>' +
            '<ruby>漢字<rt style="font-size:50%">かんじ</rt></ruby></p>' +
            '<div><svg width="100" height="200"><image href="cover.png" /></svg></div>'
        ),
        '.book-content',
        document,
        true,
        BlurMode.ALL
      )
    );
    const content = document.createElement('div');
    content.innerHTML = htmlContent;

    expect(content.querySelector('em')?.style.fontSize).toBe('1.2em');
    expect(content.querySelector('em')?.style.color).toBe('red');
    expect(content.querySelector('rt')?.style.fontSize).toBe('50%');
    expect(content.querySelector('svg')?.hasAttribute('width')).toBe(false);
    expect(content.querySelector('[data-ttu-spoiler-img] image')?.getAttribute('href')).toBe(
      'cover.png'
    );
  });
});
