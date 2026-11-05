import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { Mail } from './Mail.js';
it('Mail renders a titled currentColor icon at the requested size', () => {
  const markup = renderToStaticMarkup(<Mail title="Email" size={20} />);
  expect(markup).toContain('data-icon="Mail"');
  expect(markup).toContain('stroke="currentColor"');
  expect(markup).toContain('>Email</title>');
  expect(markup).toContain('width="20"');
});
