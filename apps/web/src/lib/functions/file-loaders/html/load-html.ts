/**
 * @license BSD-3-Clause
 * Copyright (c) 2026, ッツ Reader Authors
 * All rights reserved.
 */

import type { LoadData } from '$lib/functions/file-loaders/types';
import extractTxt from '$lib/functions/file-loaders/txt/extract-txt';
import { getFormattedElementTxt } from '$lib/functions/file-loaders/txt/generate-txt-html';
import { extractReadablePage } from './extract-readable-page';

export default async function loadHtml(file: File, lastBookModified: number): Promise<LoadData> {
  return loadHtmlText(await extractTxt(file), file.name, lastBookModified);
}

export function loadHtmlText(
  html: string,
  fallbackTitle: string,
  lastBookModified: number
): LoadData {
  const { paragraphs, title } = extractReadablePage(html, fallbackTitle);
  const { element, characters } = getFormattedElementTxt(paragraphs.join('\n'));

  return {
    title,
    styleSheet: '',
    elementHtml: element.innerHTML,
    blobs: {},
    coverImage: undefined,
    hasThumb: false,
    characters,
    lastBookModified,
    lastBookOpen: 0
  };
}
