/**
 * @license BSD-3-Clause
 * Copyright (c) 2026, ッツ Reader Authors
 * All rights reserved.
 */

import { describe, expect, it } from 'vitest';
import { extractReadablePage } from './extract-readable-page';

describe('extractReadablePage', () => {
  it('keeps article paragraphs and excludes page chrome and linked cards', () => {
    const page = extractReadablePage(
      `
        <html>
          <head><title>NHK article</title></head>
          <body>
            <nav><p>Navigation text.</p></nav>
            <main>
              <p>警察は<a href="/details">詳しいいきさつ</a>を調べています。</p>
              <a href="/related"><p>Related article card.</p></a>
              <aside><p>Sidebar text.</p></aside>
            </main>
            <footer><p>Footer text.</p></footer>
          </body>
        </html>
      `,
      'fallback.html'
    );

    expect(page).toEqual({
      title: 'NHK article',
      paragraphs: ['警察は詳しいいきさつを調べています。']
    });
  });

  it('falls back to body paragraphs for simple local HTML documents', () => {
    const page = extractReadablePage(
      '<html><body><div><p>First paragraph.</p><p>Second paragraph.</p></div></body></html>',
      'saved-page.html'
    );

    expect(page).toEqual({
      title: 'saved-page',
      paragraphs: ['First paragraph.', 'Second paragraph.']
    });
  });

  it('uses only the structured VRT article body when Next.js data is present', () => {
    const nextData = JSON.stringify({
      props: {
        pageProps: {
          data: {
            compositions: [
              {
                type: 'articleDetail',
                compositions: [
                  {
                    type: 'articleMain',
                    compositions: [
                      {
                        type: 'articleHeading',
                        subtitle: { html: '<p>Structured introduction.</p>' }
                      },
                      {
                        type: 'articleText',
                        text: { html: '<p>Structured article body.</p>' }
                      }
                    ]
                  },
                  {
                    type: 'articleBottom',
                    compositions: [{ type: 'banner', subtitle: { text: 'Promotional content.' } }]
                  }
                ]
              }
            ]
          }
        }
      }
    });
    const page = extractReadablePage(
      `<html><head><title>VRT article</title></head><body><main><p>Rendered duplicate.</p></main><script id="__NEXT_DATA__" type="application/json">${nextData}</script></body></html>`,
      'fallback.html'
    );

    expect(page.paragraphs).toEqual(['Structured introduction.', 'Structured article body.']);
  });

  it('rejects HTML without readable paragraphs', () => {
    expect(() =>
      extractReadablePage('<html><body><img src="cover.jpg"></body></html>', 'empty.html')
    ).toThrow('No readable article content');
  });
});
