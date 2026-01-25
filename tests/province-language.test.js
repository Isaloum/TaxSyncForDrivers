import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getProvinceName, getProvinceOptions, detectLanguage, isValidProvinceCode } from '../province-language-fix.js';

test('getProvinceName: returns French for QC', () => {
  assert.strictEqual(getProvinceName('QC', 'fr'), 'Québec');
});

test('getProvinceName: returns English for QC', () => {
  assert.strictEqual(getProvinceName('QC', 'en'), 'Quebec');
});

test('getProvinceName: returns French for ON', () => {
  assert.strictEqual(getProvinceName('ON', 'fr'), 'Ontario');
});

test('getProvinceName: returns English for BC', () => {
  assert.strictEqual(getProvinceName('BC', 'en'), 'British Columbia');
});

test('getProvinceName: returns French for BC', () => {
  assert.strictEqual(getProvinceName('BC', 'fr'), 'Colombie-Britannique');
});

test('getProvinceName: handles lowercase codes', () => {
  assert.strictEqual(getProvinceName('qc', 'en'), 'Quebec');
  assert.strictEqual(getProvinceName('on', 'fr'), 'Ontario');
});

test('getProvinceName: throws error for invalid code', () => {
  assert.throws(() => getProvinceName('XX', 'en'), {
    message: 'Unknown province code: XX'
  });
});

test('getProvinceName: throws error for invalid language', () => {
  assert.throws(() => getProvinceName('QC', 'es'), {
    message: 'Invalid language: must be "en" or "fr"'
  });
});

test('getProvinceName: throws error for non-string code', () => {
  assert.throws(() => getProvinceName(null, 'en'), {
    message: 'Invalid province code: must be a string'
  });
});

test('getProvinceOptions: returns sorted array in French', () => {
  const options = getProvinceOptions('fr');
  assert.ok(Array.isArray(options));
  assert.strictEqual(options.length, 13); // 10 provinces + 3 territories
  assert.ok(options[0].code);
  assert.ok(options[0].name);
  // Verify it's sorted alphabetically in French
  for (let i = 1; i < options.length; i++) {
    assert.ok(options[i - 1].name.localeCompare(options[i].name) <= 0,
      `Options should be sorted: ${options[i - 1].name} vs ${options[i].name}`);
  }
});

test('getProvinceOptions: returns sorted array in English', () => {
  const options = getProvinceOptions('en');
  assert.ok(Array.isArray(options));
  assert.strictEqual(options.length, 13);
  // Verify it's sorted alphabetically in English
  for (let i = 1; i < options.length; i++) {
    assert.ok(options[i - 1].name.localeCompare(options[i].name) <= 0);
  }
});

test('getProvinceOptions: includes all provinces and territories', () => {
  const options = getProvinceOptions('en');
  const codes = options.map(opt => opt.code);
  const expected = ['AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'ON', 'PE', 'QC', 'SK', 'NT', 'NU', 'YT'];
  expected.forEach(code => {
    assert.ok(codes.includes(code), `Should include ${code}`);
  });
});

test('getProvinceOptions: throws error for invalid language', () => {
  assert.throws(() => getProvinceOptions('de'), {
    message: 'Invalid language: must be "en" or "fr"'
  });
});

test('isValidProvinceCode: validates QC', () => {
  assert.strictEqual(isValidProvinceCode('QC'), true);
});

test('isValidProvinceCode: validates ON', () => {
  assert.strictEqual(isValidProvinceCode('ON'), true);
});

test('isValidProvinceCode: validates lowercase', () => {
  assert.strictEqual(isValidProvinceCode('qc'), true);
  assert.strictEqual(isValidProvinceCode('on'), true);
});

test('isValidProvinceCode: rejects invalid code', () => {
  assert.strictEqual(isValidProvinceCode('XX'), false);
});

test('isValidProvinceCode: rejects null', () => {
  assert.strictEqual(isValidProvinceCode(null), false);
});

test('isValidProvinceCode: rejects non-string', () => {
  assert.strictEqual(isValidProvinceCode(123), false);
  assert.strictEqual(isValidProvinceCode({}), false);
});

test('detectLanguage: returns default "en" in Node.js', () => {
  // In Node.js environment, navigator is undefined
  const lang = detectLanguage();
  assert.strictEqual(lang, 'en');
});
