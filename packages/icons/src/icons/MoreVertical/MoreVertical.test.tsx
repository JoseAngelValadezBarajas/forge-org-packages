import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { MoreVertical } from './MoreVertical.js';
it('MoreVertical renders a titled currentColor icon at the requested size', () => {
  const markup = renderToStaticMarkup(<MoreVertical title="More actions" size={20} />);
  expect(markup).toContain('data-icon="MoreVertical"');
  expect(markup).toContain('stroke="currentColor"');
  expect(markup).toContain('>More actions</title>');
  expect(markup).toContain('width="20"');
});
