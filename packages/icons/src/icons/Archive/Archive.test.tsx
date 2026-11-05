import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { Archive } from './Archive.js';
it('Archive renders a titled currentColor icon at the requested size', () => {
  const markup = renderToStaticMarkup(<Archive title="Archive" size={20} />);
  expect(markup).toContain('data-icon="Archive"');
  expect(markup).toContain('stroke="currentColor"');
  expect(markup).toContain('>Archive</title>');
  expect(markup).toContain('width="20"');
});
