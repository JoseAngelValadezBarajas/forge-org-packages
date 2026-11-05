import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { FilePlus } from './FilePlus.js';
it('FilePlus renders a titled currentColor icon at the requested size', () => {
  const markup = renderToStaticMarkup(<FilePlus title="New file" size={20} />);
  expect(markup).toContain('data-icon="FilePlus"');
  expect(markup).toContain('stroke="currentColor"');
  expect(markup).toContain('>New file</title>');
  expect(markup).toContain('width="20"');
});
