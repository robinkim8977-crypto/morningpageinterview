import test from 'node:test';
import assert from 'node:assert/strict';
import { wrapImageText } from '../lib/report-images.ts';

test('긴 한국어 답변과 줄바꿈을 손실 없이 이미지 행으로 나눈다', () => {
  const text = '온유의미래기억'.repeat(100);
  const lines = wrapImageText(text, (value) => Array.from(value).length, 13);
  assert.equal(lines.join(''), text);
  assert.ok(lines.every((line) => Array.from(line).length <= 13));
  assert.deepEqual(wrapImageText('첫 줄\n\n다음 줄🙂', (value) => Array.from(value).length, 30), ['첫 줄', '', '다음 줄🙂']);
});
