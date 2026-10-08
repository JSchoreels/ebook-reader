/**
 * @license BSD-3-Clause
 * Copyright (c) 2026, ッツ Reader Authors
 * All rights reserved.
 */

const TIMING_LINE_REGEX =
  /^\s*\d{1,3}:\d{2}:\d{2}[,.]\d{1,3}\s*-->\s*\d{1,3}:\d{2}:\d{2}[,.]\d{1,3}(?:\s+.*)?$/;

export function parseSrt(data: string) {
  const cues: string[] = [];
  const lines = data
    .replace(/^\uFEFF/, '')
    .replace(/\r/g, '')
    .split('\n');

  let cueLines: string[] | undefined;

  const finishCue = () => {
    if (!cueLines) {
      return;
    }

    const cue = normalizeWhitespace(cueLines.map(stripSubtitleMarkup).filter(Boolean).join(' '));

    if (cue) {
      cues.push(cue);
    }

    cueLines = undefined;
  };

  for (const line of lines) {
    if (TIMING_LINE_REGEX.test(line)) {
      finishCue();
      cueLines = [];
      continue;
    }

    if (!cueLines) {
      continue;
    }

    if (!line.trim()) {
      finishCue();
      continue;
    }

    cueLines.push(line);
  }

  finishCue();

  return cues;
}

function stripSubtitleMarkup(value: string) {
  const html = value.replace(/\{\\[^}]*\}/g, '').replace(/<br\s*\/?\s*>/gi, ' ');
  const document = new DOMParser().parseFromString(html, 'text/html');

  return document.body.textContent || '';
}

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}
