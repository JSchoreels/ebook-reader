/**
 * @license BSD-3-Clause
 * Copyright (c) 2026, ッツ Reader Authors
 * All rights reserved.
 */

import type { LoadData } from '$lib/functions/file-loaders/types';
import extractTxt from '$lib/functions/file-loaders/txt/extract-txt';
import { getFormattedElementTxt } from '$lib/functions/file-loaders/txt/generate-txt-html';
import { parseSrt } from './parse-srt';

export default async function loadSrt(file: File, lastBookModified: number): Promise<LoadData> {
  const cues = parseSrt(await extractTxt(file));

  if (!cues.length) {
    throw new Error(`No subtitle cues found in ${file.name}`);
  }

  const { element, characters } = getFormattedElementTxt(cues.join('\n'));

  return {
    title: file.name.replace(/\.srt$/i, ''),
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
