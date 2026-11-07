import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { ZoomIn } from './ZoomIn.js';
it('ZoomIn renders original currentColor SVG geometry with an accessible title', () => {
  const markup = renderToStaticMarkup(<ZoomIn title="ZoomIn" size={20} />);
  expect(markup).toContain('data-icon="ZoomIn"');
  expect(markup).toContain('stroke="currentColor"');
  expect(markup).toContain('>ZoomIn</title>');
  expect(markup).toContain('width="20"');
});
