import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { Phone } from './Phone.js';
it('Phone renders a titled currentColor icon at the requested size', () => {
  const markup = renderToStaticMarkup(<Phone title="Phone" size={20} />);
  expect(markup).toContain('data-icon="Phone"');
  expect(markup).toContain('stroke="currentColor"');
  expect(markup).toContain('>Phone</title>');
  expect(markup).toContain('width="20"');
});
