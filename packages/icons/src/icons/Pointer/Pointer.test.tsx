import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { Pointer } from './Pointer.js';
it('Pointer renders original currentColor SVG geometry with an accessible title', () => {
  const markup = renderToStaticMarkup(<Pointer title="Pointer" size={20} />);
  expect(markup).toContain('data-icon="Pointer"');
  expect(markup).toContain('stroke="currentColor"');
  expect(markup).toContain('>Pointer</title>');
  expect(markup).toContain('width="20"');
});
