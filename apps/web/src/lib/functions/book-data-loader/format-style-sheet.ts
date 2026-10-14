/**
 * @license BSD-3-Clause
 * Copyright (c) 2026, ッツ Reader Authors
 * All rights reserved.
 */

import type { BooksDbBookData } from '$lib/data/database/books-db/versions/books-db';
import parseCss from '../css-parser/css-parser';
import stringifyCss from '../css-parser/css-stringify';
import type { Declaration, Rule } from '../css-parser/types';

const htmlRegex = /\s?html\s?/gi;
const bodyRegex = /\s?body\s?/gi;

export default function formatStyleSheet(bookData: BooksDbBookData, parentSelector: string) {
  const cssTree = parseCss(bookData.styleSheet);

  const newRules = cssTree.stylesheet.rules
    .filter((r) => r.type === 'rule')
    .filter((r) => !r.selectors.some((s) => htmlRegex.test(s) || bodyRegex.test(s)));

  newRules.forEach((rule) => {
    rule.declarations = formatStyleDeclarations(rule.declarations);
  });

  newRules.push(getGeckoBrSolutionRule());

  newRules.forEach((rule) => {
    rule.selectors = encapsulatedSelectors(rule.selectors, parentSelector);
  });

  return stringifyCss({
    stylesheet: {
      rules: newRules
    },
    type: 'stylesheet'
  });
}

export function formatStyleDeclarations(declarations: Declaration[]) {
  const newDeclarations: Record<string, string> = {};
  const formattedDeclarations = declarations.filter(
    (d) => !/(?:line-height|text-indent)\s*$/i.test(d.property)
  );
  const lineBreakFormatter = new LineBreakFormatter(formattedDeclarations, newDeclarations);

  formattedDeclarations.forEach((declaration) => {
    assignKeyValToObj(newDeclarations, convertPrefixedDeclaration(declaration));
    assignKeyValToObj(newDeclarations, convertFontFamily(declaration));
    assignKeyValToObj(newDeclarations, convertFontSize(declaration));
    assignKeyValToObj(newDeclarations, lineBreakFormatter.convert(declaration));
  });

  Object.entries(newDeclarations).forEach(([property, value]) => {
    formattedDeclarations.push({ type: 'declaration', property, value });
  });

  return formattedDeclarations.filter((d) => !/writing-mode\s*$/i.test(d.property));
}

function encapsulatedSelectors(selectors: string[], parentSelector: string) {
  return selectors.map((selector) => `${parentSelector} ${selector}`);
}

function assignKeyValToObj(
  obj: Record<string, string>,
  keyValObj:
    | {
        key: string;
        value: string;
      }
    | undefined
) {
  if (keyValObj) {
    obj[keyValObj.key] = keyValObj.value;
  }
  return obj;
}

function convertPrefixedDeclaration(declaration: Declaration) {
  const regexResult = /(?:(?:-epub-)|(?:-webkit-))(.+)/i.exec(declaration.property);
  if (regexResult) {
    return {
      key: regexResult[1],
      value: declaration.value
    };
  }
  return undefined;
}

function convertFontFamily(declaration: Declaration) {
  if (declaration.property === 'font-family') {
    let newValue: string = declaration.value;
    if (newValue.includes('sans-serif')) {
      newValue = `var(--font-family-sans-serif, Noto Sans JP, sans-serif)`;
    } else if (newValue.includes('serif')) {
      newValue = `var(--font-family-serif, Noto Serif JP, serif)`;
    }
    return {
      key: declaration.property,
      value: newValue
    };
  }
  return undefined;
}

function convertFontSize(declaration: Declaration) {
  if (declaration.property.toLowerCase() !== 'font-size') return undefined;

  const remSize = /^(\d*\.?\d+)rem\s*(!important)?\s*$/i.exec(declaration.value);
  if (!remSize) return undefined;

  // Keep root-relative sizes proportional to the reader font, including nested spans.
  return {
    key: 'font-size',
    value: `calc(var(--book-content-font-size) * ${remSize[1]})${remSize[2] || ''}`
  };
}

class LineBreakFormatter {
  private hasLineBreakDefined?: boolean | undefined;

  constructor(
    private ruleDeclarations: Declaration[],
    private newDeclarations: Readonly<Record<string, string>>
  ) {}

  convert(declaration: Declaration) {
    if (
      /(?:(?:-epub-)|(?:-webkit-))?word-break$/i.exec(declaration.property) &&
      declaration.value === 'break-all'
    ) {
      if (this.hasLineBreakDefined === undefined) {
        this.hasLineBreakDefined = this.ruleDeclarations.some(
          (d) => d.type === 'declaration' && d.property === 'line-break'
        );
      }
      if (!this.hasLineBreakDefined && !this.newDeclarations['line-break']) {
        // to allow breaks one long string of periods
        return {
          key: 'line-break',
          value: 'loose'
        };
      }
    }
    return undefined;
  }
}

function getGeckoBrSolutionRule(): Rule {
  // <br> + display: block makes it line-height: 0 on Firefox, when it creates space on Chrome (regardless of display value)
  return {
    type: 'rule',
    selectors: ['br'],
    declarations: [
      {
        type: 'declaration',
        property: 'display',
        value: 'inline!important'
      }
    ]
  };
}
