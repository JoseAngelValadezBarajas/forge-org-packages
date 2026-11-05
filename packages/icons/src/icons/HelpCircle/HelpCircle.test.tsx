import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { HelpCircle } from './HelpCircle.js';
it('HelpCircle renders a titled currentColor icon at the requested size', () => {
  const markup = renderToStaticMarkup(<HelpCircle title="Help" size={20} />);
  expect(markup).toContain('data-icon="HelpCircle"');
  expect(markup).toContain('stroke="currentColor"');
  expect(markup).toContain('>Help</title>');
  expect(markup).toContain('width="20"');
});
