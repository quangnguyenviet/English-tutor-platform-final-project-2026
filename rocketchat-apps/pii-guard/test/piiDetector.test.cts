import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

import { detectPii } from "../src/piiDetector";

// Bộ fixture dùng chung với backend (PiiDetectorTest) để hai lớp chặn luôn cùng hành vi.
const fixtures = JSON.parse(
  readFileSync(path.join(__dirname, "..", "..", "pii-fixtures.json"), "utf-8"),
) as { blocked: { type: string; text: string }[]; allowed: string[] };

for (const { type: expectedType, text: input } of fixtures.blocked) {
  test(`chặn ${expectedType}: ${input}`, () => {
    const result = detectPii(input);
    assert.equal(result.blocked, true);
    assert.ok(result.types.includes(expectedType as never));
  });
}

for (const input of fixtures.allowed) {
  test(`cho phép nội dung không có cấu trúc liên hệ: ${input}`, () => {
    assert.deepEqual(detectPii(input), { blocked: false, types: [] });
  });
}
