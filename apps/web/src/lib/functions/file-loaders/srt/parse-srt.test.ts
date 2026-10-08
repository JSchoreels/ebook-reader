/**
 * @license BSD-3-Clause
 * Copyright (c) 2026, ッツ Reader Authors
 * All rights reserved.
 */

import { describe, expect, it } from 'vitest';
import { parseSrt } from './parse-srt';

describe('parseSrt', () => {
  it('keeps cue text while removing indexes and timestamps', () => {
    expect(
      parseSrt(
        '\uFEFF1\r\n00:00:01,000 --> 00:00:03,500\r\n最初の字幕です。\r\n\r\n2\r\n00:00:04,000 --> 00:00:07,000\r\n次の字幕です。\r\n'
      )
    ).toEqual(['最初の字幕です。', '次の字幕です。']);
  });

  it('joins multiline cues and removes subtitle formatting', () => {
    expect(
      parseSrt(`1
00:00:01,000 --> 00:00:03,500 position:50%
<i>Hello &amp; welcome</i>
{\\an8}<b>to the show.</b>
`)
    ).toEqual(['Hello & welcome to the show.']);
  });

  it('ignores content that is not part of a timed cue', () => {
    expect(parseSrt('This is not an SRT subtitle file.')).toEqual([]);
  });
});
