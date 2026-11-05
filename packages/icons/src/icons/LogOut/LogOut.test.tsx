import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { LogOut } from './LogOut.js';
it('LogOut renders a titled currentColor icon at the requested size', () => {
  const markup = renderToStaticMarkup(<LogOut title="Sign out" size={20} />);
  expect(markup).toContain('data-icon="LogOut"');
  expect(markup).toContain('stroke="currentColor"');
  expect(markup).toContain('>Sign out</title>');
  expect(markup).toContain('width="20"');
});
