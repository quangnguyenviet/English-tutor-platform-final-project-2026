import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";

import { hmacSha256Hex } from "../src/hmac";

// Chữ ký phải trùng với HMAC của Node, vì backend (Java) kiểm tra bằng HmacSHA256 chuẩn.
const CASES: [string, string][] = [
  ["dev-only-change-me-hmac", "{\"rocketRoomId\":\"abc\",\"types\":[\"PHONE\"]}"],
  ["k", ""],
  ["a-very-long-secret-".repeat(8), "Nội dung có tiếng Việt: Gọi em số 0981 234 567 😀"],
];

for (const [secret, body] of CASES) {
  test(`HMAC-SHA256 khớp Node crypto (${body.slice(0, 20)})`, () => {
    assert.equal(hmacSha256Hex(secret, body), createHmac("sha256", secret).update(body, "utf8").digest("hex"));
  });
}
