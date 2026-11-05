import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { PanelLeft } from './PanelLeft.js';
it('PanelLeft renders a titled currentColor icon at the requested size', () => {
  const markup = renderToStaticMarkup(<PanelLeft title="Toggle sidebar" size={20} />);
  expect(markup).toContain('data-icon="PanelLeft"');
  expect(markup).toContain('stroke="currentColor"');
  expect(markup).toContain('>Toggle sidebar</title>');
  expect(markup).toContain('width="20"');
});
