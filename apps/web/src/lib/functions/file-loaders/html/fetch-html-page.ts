/**
 * @license BSD-3-Clause
 * Copyright (c) 2026, ッツ Reader Authors
 * All rights reserved.
 */

export async function fetchHtmlPageFile(
  pageUrl: string,
  fetchImpl: typeof fetch = fetch
): Promise<File> {
  const url = parsePageUrl(pageUrl);
  let response: Response;

  try {
    response = await fetchImpl(url.href, {
      headers: {
        Accept: 'text/html,application/xhtml+xml'
      },
      credentials: 'omit',
      redirect: 'follow'
    });
  } catch {
    throw new Error(
      'The page could not be loaded. The site may block cross-origin requests; download the page as an HTML file and import that file instead.'
    );
  }

  if (!response.ok) {
    throw new Error(`The page request failed with HTTP ${response.status}`);
  }

  const contentType = response.headers.get('content-type') || '';

  if (
    contentType &&
    !contentType.toLowerCase().includes('text/html') &&
    !contentType.toLowerCase().includes('application/xhtml+xml')
  ) {
    throw new Error(`The URL returned unsupported content (${contentType}) instead of HTML`);
  }

  const html = await response.text();

  if (!html.trim()) {
    throw new Error('The URL returned an empty HTML page');
  }

  return new File([html], createPageFilename(response.url || url.href), {
    type: 'text/html',
    lastModified: Date.now()
  });
}

function parsePageUrl(value: string) {
  let url: URL;

  try {
    url = new URL(value.trim());
  } catch {
    throw new Error('Enter a valid web page URL');
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('Only HTTP and HTTPS page URLs are supported');
  }

  return url;
}

function createPageFilename(pageUrl: string) {
  const url = new URL(pageUrl);
  const pathSegment = decodeURIComponent(url.pathname.split('/').filter(Boolean).pop() || 'index');
  const safeName = pathSegment.replace(/[\\/:*?"<>|]/g, '-');

  return /\.html?$/i.test(safeName) ? safeName : `${safeName || url.hostname}.html`;
}
