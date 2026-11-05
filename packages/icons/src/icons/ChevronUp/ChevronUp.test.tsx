import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { ChevronUp } from './ChevronUp.js';
it('ChevronUp renders a titled currentColor icon at the requested size', () => {
  const markup = renderToStaticMarkup(<ChevronUp title="Expand" size={20} />);
  expect(markup).toContain('data-icon="ChevronUp"');
  expect(markup).toContain('stroke="currentColor"');
  expect(markup).toContain('>Expand</title>');
  expect(markup).toContain('width="20"');
});
