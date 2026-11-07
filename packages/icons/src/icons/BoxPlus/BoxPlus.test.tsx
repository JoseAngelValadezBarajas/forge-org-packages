import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { BoxPlus } from './BoxPlus.js';
it('BoxPlus renders original currentColor SVG geometry with an accessible title', () => {
  const markup = renderToStaticMarkup(<BoxPlus title="BoxPlus" size={20} />);
  expect(markup).toContain('data-icon="BoxPlus"');
  expect(markup).toContain('stroke="currentColor"');
  expect(markup).toContain('>BoxPlus</title>');
  expect(markup).toContain('width="20"');
});
