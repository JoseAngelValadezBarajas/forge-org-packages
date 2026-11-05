import './style.css';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { applyTheme, createTheme, presets } from '@corefoundry-labs/forge-tokens/theme-v2';
import { catalog } from './catalog.js';
import { Sidebar, ThemeControls } from './shell.js';
import { ComponentPage } from './pages/component-page.js';

const h = React.createElement;
const defaultPage = 'ButtonV2';

function pageFromHash() {
  const name = decodeURIComponent(window.location.hash.replace(/^#\/?/, ''));
  return catalog.find((item) => item.name === name) ?? catalog.find((item) => item.name === defaultPage);
}

function usePage() {
  const [page, setPage] = useState(pageFromHash);
  useEffect(() => {
    const update = () => setPage(pageFromHash());
    window.addEventListener('hashchange', update);
    return () => window.removeEventListener('hashchange', update);
  }, []);
  return page;
}

function App() {
  const page = usePage();
  const [preset, setPreset] = useState('forge');
  const [mode, setMode] = useState(presets.forge.mode);
  const [primary, setPrimary] = useState(presets.forge.colors.primary);
  const preview = useRef(null);
  const themed = page.version !== 'V1';
  const theme = useMemo(() => {
    const selected = presets[preset];
    return createTheme({ ...selected, mode, colors: { ...selected.colors, primary } });
  }, [preset, mode, primary]);

  useEffect(() => {
    if (preview.current) applyTheme(preview.current, theme);
  }, [theme, page]);

  function choosePreset(next) {
    setPreset(next);
    setMode(presets[next].mode);
    setPrimary(presets[next].colors.primary);
  }

  return h('div', { className: 'host' },
    h(Sidebar, { current: page.name }),
    h('main', { className: 'host-main' },
      h(ComponentPage, {
        key: page.name,
        page,
        theme,
        preview,
        controls: themed && h(ThemeControls, { preset, mode, primary, onPreset: choosePreset, onMode: setMode, onPrimary: setPrimary }),
      }),
    ),
  );
}

createRoot(document.querySelector('#app')).render(h(App));
