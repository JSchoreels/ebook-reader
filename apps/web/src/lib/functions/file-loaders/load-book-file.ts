/**
 * @license BSD-3-Clause
 * Copyright (c) 2026, ッツ Reader Authors
 * All rights reserved.
 */

import loadEpub from '$lib/functions/file-loaders/epub/load-epub';
import loadHtml from '$lib/functions/file-loaders/html/load-html';
import loadHtmlz from '$lib/functions/file-loaders/htmlz/load-htmlz';
import loadSrt from '$lib/functions/file-loaders/srt/load-srt';
import loadTxt from '$lib/functions/file-loaders/txt/load-txt';
import type { LoadData } from '$lib/functions/file-loaders/types';

const supportedExtensions = new Set(['epub', 'html', 'htm', 'htmlz', 'srt', 'txt']);

export const supportedBookFileAccept = [
  'application/epub+zip',
  '.epub',
  '.htmlz',
  'text/html',
  '.html',
  '.htm',
  'application/x-subrip',
  '.srt',
  'text/plain',
  '.txt'
].join(',');

export function isSupportedBookFile(file: File) {
  return supportedExtensions.has(getFileExtension(file.name));
}

export async function loadBookFile(
  file: File,
  document: Document,
  lastBookModified: number
): Promise<LoadData> {
  switch (getFileExtension(file.name)) {
    case 'epub':
      return loadEpub(file, document, lastBookModified);
    case 'html':
    case 'htm':
      return loadHtml(file, lastBookModified);
    case 'srt':
      return loadSrt(file, lastBookModified);
    case 'txt':
      return loadTxt(file, lastBookModified);
    case 'htmlz':
      return loadHtmlz(file, document, lastBookModified);
    default:
      throw new Error(`Unsupported book file: ${file.name}`);
  }
}

function getFileExtension(filename: string) {
  return filename.split('.').pop()?.toLowerCase() || '';
}
