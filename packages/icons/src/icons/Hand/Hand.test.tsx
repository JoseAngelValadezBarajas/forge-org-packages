import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { Hand } from './Hand.js';
it('Hand renders original currentColor SVG geometry with an accessible title', () => {
  const markup = renderToStaticMarkup(<Hand title="Hand" size={20} />);
  expect(markup).toContain('data-icon="Hand"');
  expect(markup).toContain('stroke="currentColor"');
  expect(markup).toContain('>Hand</title>');
  expect(markup).toContain('width="20"');
});
