import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { CalendarDays } from './CalendarDays.js';
it('CalendarDays renders a titled currentColor icon at the requested size', () => {
  const markup = renderToStaticMarkup(<CalendarDays title="Calendar days" size={20} />);
  expect(markup).toContain('data-icon="CalendarDays"');
  expect(markup).toContain('stroke="currentColor"');
  expect(markup).toContain('>Calendar days</title>');
  expect(markup).toContain('width="20"');
});
