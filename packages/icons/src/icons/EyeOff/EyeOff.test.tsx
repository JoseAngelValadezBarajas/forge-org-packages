import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { EyeOff } from './EyeOff.js';
it('EyeOff renders a titled currentColor icon at the requested size', () => {
  const markup = renderToStaticMarkup(<EyeOff title="Hide details" size={20} />);
  expect(markup).toContain('data-icon="EyeOff"');
  expect(markup).toContain('stroke="currentColor"');
  expect(markup).toContain('>Hide details</title>');
  expect(markup).toContain('width="20"');
});
