import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { Tag } from './Tag.js';
it('Tag renders original currentColor SVG geometry with an accessible title', () => {
  const markup = renderToStaticMarkup(<Tag title="Tag" size={20} />);
  expect(markup).toContain('data-icon="Tag"');
  expect(markup).toContain('stroke="currentColor"');
  expect(markup).toContain('>Tag</title>');
  expect(markup).toContain('width="20"');
});
