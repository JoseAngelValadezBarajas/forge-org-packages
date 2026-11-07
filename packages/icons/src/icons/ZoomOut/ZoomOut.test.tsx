import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { ZoomOut } from './ZoomOut.js';
it('ZoomOut renders original currentColor SVG geometry with an accessible title', () => {
  const markup = renderToStaticMarkup(<ZoomOut title="ZoomOut" size={20} />);
  expect(markup).toContain('data-icon="ZoomOut"');
  expect(markup).toContain('stroke="currentColor"');
  expect(markup).toContain('>ZoomOut</title>');
  expect(markup).toContain('width="20"');
});
