import { test, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

test('catalog.js loads as a classic script and contains lop1-bai09', () => {
  const source = fs.readFileSync(path.resolve(__dirname, '../js/catalog.js'), 'utf8');
  const context = vm.createContext({ window: {} });
  vm.runInContext(source, context, { filename: 'js/catalog.js' });
  expect(context.window.ZM_CATALOG.lessons.some(lesson => lesson.href === 'bai.html?id=lop1-bai09')).toBe(true);
});
