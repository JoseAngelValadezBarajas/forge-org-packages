import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { Calendar } from './Calendar.js';

it('Calendar renders its original currentColor SVG with an accessible title and requested size', () => {
  const markup = renderToStaticMarkup(<Calendar title="Calendar" size={20} />);
  expect(markup).toContain('data-icon="Calendar"');
  expect(markup).toContain('stroke="currentColor"');
  expect(markup).toContain('>Calendar</title>');
  expect(markup).toContain('width="20"');
});
