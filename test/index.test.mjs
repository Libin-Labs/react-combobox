import { beforeEach, afterEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { setup, click, key, input } from './helpers.mjs';
import { Combobox } from '../dist/index.js';
let ui;
beforeEach(async () => (ui = await setup()));
afterEach(async () => ui.cleanup());
test('search, disabled skipping and multiple selection limits', async () => {
  const values = [];
  await ui.render(
    createElement(Combobox, {
      label: 'Fruit',
      multiple: true,
      maxSelected: 1,
      options: [
        { value: 'a', label: 'Apple' },
        { value: 'b', label: 'Blocked', disabled: true },
        { value: 'c', label: 'Cherry' },
      ],
      onChange: (value) => values.push(value),
    }),
  );
  const field = ui.container.querySelector('[role="combobox"]');
  await click(field);
  await input(field, 'Apple');
  await key(field, 'ArrowDown');
  await key(field, 'Enter');
  assert.deepEqual(values.at(-1), ['a']);
  await input(field, 'Cherry');
  await key(field, 'Enter');
  assert.match(ui.container.querySelector('[role="alert"]').textContent, /limit/);
  assert.deepEqual(values.at(-1), ['a']);
});
