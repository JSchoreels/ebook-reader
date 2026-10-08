/**
 * @license BSD-3-Clause
 * Copyright (c) 2026, ッツ Reader Authors
 * All rights reserved.
 */

import { describe, expect, it, vi } from 'vitest';
import { fetchHtmlPageFile } from './fetch-html-page';

describe('fetchHtmlPageFile', () => {
  it('loads an HTML response into an importable file', async () => {
    const fetchImpl = vi.fn(
      async () =>
        ({
          ok: true,
          status: 200,
          url: 'https://example.com/news/article',
          headers: { get: () => 'text/html; charset=utf-8' },
          text: async () => '<html><main><p>Article body.</p></main></html>'
        }) as unknown as Response
    );

    const file = await fetchHtmlPageFile('https://example.com/news/article', fetchImpl);

    expect(fetchImpl).toHaveBeenCalledWith(
      'https://example.com/news/article',
      expect.objectContaining({ credentials: 'omit', redirect: 'follow' })
    );
    expect(file.name).toBe('article.html');
    expect(file.type).toBe('text/html');
  });

  it('rejects non-web URL schemes', async () => {
    await expect(fetchHtmlPageFile('file:///tmp/article.html', vi.fn())).rejects.toThrow(
      'Only HTTP and HTTPS'
    );
  });

  it('explains the local-file fallback when the browser fetch is blocked', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new TypeError('Failed to fetch');
    });

    await expect(fetchHtmlPageFile('https://example.com/article', fetchImpl)).rejects.toThrow(
      'download the page as an HTML file'
    );
  });
});
