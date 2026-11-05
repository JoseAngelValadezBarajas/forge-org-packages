import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { User } from './User.js';

it('User renders its original currentColor SVG with an accessible title and requested size', () => {
  const markup = renderToStaticMarkup(<User title="User profile" size={20} />);
  expect(markup).toContain('data-icon="User"');
  expect(markup).toContain('stroke="currentColor"');
  expect(markup).toContain('>User profile</title>');
  expect(markup).toContain('width="20"');
});
