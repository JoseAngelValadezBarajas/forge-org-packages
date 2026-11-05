import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { Copy } from './Copy.js';
it('Copy renders a titled currentColor icon at the requested size', () => {
  const markup = renderToStaticMarkup(<Copy title="Copy" size={20} />);
  expect(markup).toContain('data-icon="Copy"');
  expect(markup).toContain('stroke="currentColor"');
  expect(markup).toContain('>Copy</title>');
  expect(markup).toContain('width="20"');
});
