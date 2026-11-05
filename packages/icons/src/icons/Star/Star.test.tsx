import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { Star } from './Star.js';
it('Star renders a titled currentColor icon at the requested size', () => {
  const markup = renderToStaticMarkup(<Star title="Favorite" size={20} />);
  expect(markup).toContain('data-icon="Star"');
  expect(markup).toContain('stroke="currentColor"');
  expect(markup).toContain('>Favorite</title>');
  expect(markup).toContain('width="20"');
});
