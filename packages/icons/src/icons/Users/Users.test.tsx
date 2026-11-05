import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { Users } from './Users.js';
it('Users renders a titled currentColor icon at the requested size', () => {
  const markup = renderToStaticMarkup(<Users title="Users" size={20} />);
  expect(markup).toContain('data-icon="Users"');
  expect(markup).toContain('stroke="currentColor"');
  expect(markup).toContain('>Users</title>');
  expect(markup).toContain('width="20"');
});
