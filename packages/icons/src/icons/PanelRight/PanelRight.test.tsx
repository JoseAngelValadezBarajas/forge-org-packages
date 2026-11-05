import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { PanelRight } from './PanelRight.js';
it('PanelRight renders a titled currentColor icon at the requested size', () => {
  const markup = renderToStaticMarkup(<PanelRight title="Toggle side panel" size={20} />);
  expect(markup).toContain('data-icon="PanelRight"');
  expect(markup).toContain('stroke="currentColor"');
  expect(markup).toContain('>Toggle side panel</title>');
  expect(markup).toContain('width="20"');
});
