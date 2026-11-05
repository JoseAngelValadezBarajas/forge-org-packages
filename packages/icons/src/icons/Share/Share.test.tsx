import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { Share } from './Share.js';
it('Share renders a titled currentColor icon at the requested size', () => {
  const markup = renderToStaticMarkup(<Share title="Share" size={20} />);
  expect(markup).toContain('data-icon="Share"');
  expect(markup).toContain('stroke="currentColor"');
  expect(markup).toContain('>Share</title>');
  expect(markup).toContain('width="20"');
});
