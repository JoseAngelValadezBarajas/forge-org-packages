import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { MoreHorizontal } from './MoreHorizontal.js';

it('MoreHorizontal renders its original currentColor SVG with an accessible title and requested size', () => {
  const markup = renderToStaticMarkup(<MoreHorizontal title="More actions" size={20} />);
  expect(markup).toContain('data-icon="MoreHorizontal"');
  expect(markup).toContain('stroke="currentColor"');
  expect(markup).toContain('>More actions</title>');
  expect(markup).toContain('width="20"');
});
