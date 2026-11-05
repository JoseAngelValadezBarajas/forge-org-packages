import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { SlidersHorizontal } from './SlidersHorizontal.js';
it('SlidersHorizontal renders a titled currentColor icon at the requested size', () => {
  const markup = renderToStaticMarkup(<SlidersHorizontal title="Adjust filters" size={20} />);
  expect(markup).toContain('data-icon="SlidersHorizontal"');
  expect(markup).toContain('stroke="currentColor"');
  expect(markup).toContain('>Adjust filters</title>');
  expect(markup).toContain('width="20"');
});
