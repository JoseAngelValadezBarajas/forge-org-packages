import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { Undo } from './Undo.js';
it('Undo renders original currentColor SVG geometry with an accessible title', () => {
  const markup = renderToStaticMarkup(<Undo title="Undo" size={20} />);
  expect(markup).toContain('data-icon="Undo"');
  expect(markup).toContain('stroke="currentColor"');
  expect(markup).toContain('>Undo</title>');
  expect(markup).toContain('width="20"');
});
