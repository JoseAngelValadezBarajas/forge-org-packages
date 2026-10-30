import './style.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { Button } from '@corefoundry-labs/forge-ui';
import { applyTheme, createTheme, generateThemeCss, presets, validateTheme } from '@corefoundry-labs/forge-tokens/theme-v2';

const $ = (selector) => document.querySelector(selector);
const fields = ['primary', 'secondary', 'neutral', 'neutralVariant', 'tertiary', 'error', 'warning', 'success', 'info'];
const preview = $('#preview');
const comparison = $('#comparison');
const controls = Object.fromEntries(fields.map((field) => [field, $(`#${field === 'error' ? 'errorSeed' : field}`)]));
let activeTheme;

createRoot($('#v1-button')).render(React.createElement(Button, null, 'Existing V1 button'));
applyTheme(comparison, createTheme({ ...presets.neutral, mode: 'dark' }));

function node(tag, text, className) {
  const element = document.createElement(tag);
  element.textContent = text;
  if (className) element.className = className;
  return element;
}

function render(theme) {
  applyTheme(preview, theme);
  const paletteGrid = $('#palettes');
  paletteGrid.replaceChildren();
  for (const [name, palette] of Object.entries(theme.palettes)) {
    const group = node('div', '', 'palette');
    group.append(node('h3', name));
    const swatches = node('div', '', 'swatches');
    for (const tone of [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 100]) {
      const swatch = node('span', String(tone));
      swatch.style.backgroundColor = palette[tone];
      swatch.style.color = tone < 50 ? '#fff' : '#000';
      swatch.title = `${name} ${tone}: ${palette[tone]}`;
      swatches.append(swatch);
    }
    group.append(swatches); paletteGrid.append(group);
  }
  const roleGrid = $('#roles'); roleGrid.replaceChildren();
  for (const [name, value] of Object.entries(theme.roles)) {
    const item = node('div', '', 'role'); const swatch = node('span', '', 'role-swatch'); swatch.style.background = value;
    item.append(swatch, node('span', name), node('code', value)); roleGrid.append(item);
  }
  const contrastGrid = $('#contrast'); contrastGrid.replaceChildren();
  for (const check of validateTheme(theme).contrasts) {
    const item = node('div', '', 'contrast-item');
    const sample = node('span', 'Aa', 'contrast-sample'); sample.style.color = theme.roles[check.foreground]; sample.style.background = theme.roles[check.background];
    item.append(sample, node('span', `${check.foreground} / ${check.background}`), node('strong', `${check.ratio.toFixed(2)}:1 · ${check.passed ? 'PASS' : 'FAIL'}`)); contrastGrid.append(item);
  }
}

function update() {
  try {
    const preset = presets[$('#preset').value];
    const colors = { ...preset.colors, ...Object.fromEntries(fields.map((field) => [field, controls[field].value])) };
    activeTheme = createTheme({ name: preset.name, colors, mode: $('#mode').value });
    $('#error').textContent = ''; render(activeTheme);
  } catch (error) { $('#error').textContent = error.message; }
}

function selectPreset() {
  const preset = presets[$('#preset').value];
  const normalized = createTheme(preset);
  for (const field of fields) controls[field].value = normalized.colors[field];
  $('#mode').value = preset.mode; update();
}

function download(filename, content, type) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
$('#preset').addEventListener('change', selectPreset);
$('#mode').addEventListener('change', update);
for (const field of fields) controls[field].addEventListener('input', update);
$('#export-json').addEventListener('click', () => download('corefoundry-theme.json', JSON.stringify({ name: activeTheme.name, mode: activeTheme.mode, colors: activeTheme.colors }, null, 2), 'application/json'));
$('#export-css').addEventListener('click', () => download('corefoundry-theme.css', generateThemeCss(activeTheme, '.my-theme'), 'text/css'));
selectPreset();
