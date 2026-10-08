/**
 * @license BSD-3-Clause
 * Copyright (c) 2026, ッツ Reader Authors
 * All rights reserved.
 */

const PRIMARY_TEXT_SELECTOR = 'article p, main p, [role="main"] p';
const EXCLUDED_TEXT_CONTAINER_SELECTOR = [
  'a',
  'aside',
  'dialog',
  'footer',
  'header',
  'nav',
  '[role="navigation"]'
].join(',');
const EXCLUDED_TEXT_CHILD_SELECTOR = [
  'aside',
  'dialog',
  'footer',
  'header',
  'nav',
  '[role="navigation"]'
].join(',');

export interface ReadablePage {
  paragraphs: string[];
  title: string;
}

export function extractReadablePage(html: string, fallbackTitle: string): ReadablePage {
  const pageDocument = new DOMParser().parseFromString(html, 'text/html');
  const structuredTexts = extractStructuredTexts(pageDocument);
  const paragraphs = structuredTexts ?? extractArticleParagraphs(pageDocument);

  if (!paragraphs.length) {
    throw new Error('No readable article content was found in the HTML page');
  }

  return {
    paragraphs,
    title:
      normalizeWhitespace(pageDocument.title) || fallbackTitle.replace(/\.(?:html?|xhtml)$/i, '')
  };
}

function extractArticleParagraphs(pageDocument: Document) {
  const primaryParagraphs = extractParagraphs(pageDocument, PRIMARY_TEXT_SELECTOR);

  return primaryParagraphs.length ? primaryParagraphs : extractParagraphs(pageDocument, 'body p');
}

function extractParagraphs(pageDocument: Document, selector: string) {
  return [...pageDocument.querySelectorAll<HTMLElement>(selector)]
    .filter((node) => !node.closest(EXCLUDED_TEXT_CONTAINER_SELECTOR))
    .map(extractParagraphText)
    .filter(Boolean);
}

function extractParagraphText(node: HTMLElement) {
  const clone = node.cloneNode(true) as HTMLElement;

  for (const excludedChild of clone.querySelectorAll(EXCLUDED_TEXT_CHILD_SELECTOR)) {
    excludedChild.remove();
  }

  return normalizeWhitespace(clone.textContent || '');
}

function extractStructuredTexts(pageDocument: Document): string[] | null {
  const nextDataText = pageDocument.querySelector('script#__NEXT_DATA__')?.textContent;

  if (!nextDataText) {
    return null;
  }

  try {
    return extractVrtNewsStructuredTexts(JSON.parse(nextDataText));
  } catch {
    return null;
  }
}

function extractVrtNewsStructuredTexts(nextData: any): string[] | null {
  const compositions = nextData?.props?.pageProps?.data?.compositions;

  if (!Array.isArray(compositions)) {
    return null;
  }

  const articleDetail = findCompositionByType(compositions, 'articleDetail');

  if (articleDetail) {
    return collectArticleBodyTexts(articleDetail);
  }

  const videoDetail = findCompositionByType(compositions, 'videoDetailV2');

  return videoDetail ? collectVideoHeadingTexts(videoDetail) : null;
}

function collectArticleBodyTexts(articleDetail: any) {
  const texts: string[] = [];
  const articleMain = findCompositionByType(articleDetail.compositions || [], 'articleMain');

  if (!articleMain) {
    return texts;
  }

  walkCompositions(articleMain, (node) => {
    if (node?.type === 'articleHeading') {
      addStructuredText(texts, node.subtitle);
    }

    if (node?.type === 'articleText') {
      addStructuredText(texts, node.text);
    }
  });

  return texts;
}

function collectVideoHeadingTexts(videoDetail: any) {
  const texts: string[] = [];

  walkCompositions(videoDetail, (node) => {
    if (node?.type === 'videoHeading') {
      addStructuredText(texts, node.subtitle);
    }
  });

  return texts;
}

function addStructuredText(texts: string[], value: any) {
  const text = structuredTextValue(value);

  if (text) {
    texts.push(text);
  }
}

function structuredTextValue(value: any) {
  if (typeof value?.html === 'string') {
    const document = new DOMParser().parseFromString(value.html, 'text/html');

    return normalizeWhitespace(document.body.textContent || '');
  }

  return typeof value?.text === 'string' ? normalizeWhitespace(value.text) : '';
}

function findCompositionByType(compositions: any[], type: string): any | null {
  for (const composition of compositions) {
    if (composition?.type === type) {
      return composition;
    }

    const nested = Array.isArray(composition?.compositions)
      ? findCompositionByType(composition.compositions, type)
      : null;

    if (nested) {
      return nested;
    }
  }

  return null;
}

function walkCompositions(composition: any, visit: (composition: any) => void) {
  visit(composition);

  for (const child of composition?.compositions || []) {
    walkCompositions(child, visit);
  }
}

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}
