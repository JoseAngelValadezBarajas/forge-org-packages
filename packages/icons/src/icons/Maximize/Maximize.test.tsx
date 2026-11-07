import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { Maximize } from './Maximize.js';
it('Maximize renders original currentColor SVG geometry with an accessible title', () => {
  const markup = renderToStaticMarkup(<Maximize title="Maximize" size={20} />);
  expect(markup).toContain('data-icon="Maximize"');
  expect(markup).toContain('stroke="currentColor"');
  expect(markup).toContain('>Maximize</title>');
  expect(markup).toContain('width="20"');
});
