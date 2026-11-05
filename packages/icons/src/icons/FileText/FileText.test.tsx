import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { FileText } from './FileText.js';

it('FileText renders its original currentColor SVG with an accessible title and requested size', () => {
  const markup = renderToStaticMarkup(<FileText title="File details" size={20} />);
  expect(markup).toContain('data-icon="FileText"');
  expect(markup).toContain('stroke="currentColor"');
  expect(markup).toContain('>File details</title>');
  expect(markup).toContain('width="20"');
});
