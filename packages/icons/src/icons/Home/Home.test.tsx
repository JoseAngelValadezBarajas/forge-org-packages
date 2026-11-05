import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { Home } from './Home.js';
it('Home renders a titled currentColor icon at the requested size', () => {
  const markup = renderToStaticMarkup(<Home title="Home" size={20} />);
  expect(markup).toContain('data-icon="Home"');
  expect(markup).toContain('stroke="currentColor"');
  expect(markup).toContain('>Home</title>');
  expect(markup).toContain('width="20"');
});
