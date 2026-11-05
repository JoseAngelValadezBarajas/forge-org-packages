import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { File } from './File.js';
it('File renders a titled currentColor icon at the requested size', () => {
  const markup = renderToStaticMarkup(<File title="File" size={20} />);
  expect(markup).toContain('data-icon="File"');
  expect(markup).toContain('stroke="currentColor"');
  expect(markup).toContain('>File</title>');
  expect(markup).toContain('width="20"');
});
