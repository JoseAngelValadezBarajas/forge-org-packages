import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { UserPlus } from './UserPlus.js';
it('UserPlus renders a titled currentColor icon at the requested size', () => {
  const markup = renderToStaticMarkup(<UserPlus title="Invite user" size={20} />);
  expect(markup).toContain('data-icon="UserPlus"');
  expect(markup).toContain('stroke="currentColor"');
  expect(markup).toContain('>Invite user</title>');
  expect(markup).toContain('width="20"');
});
