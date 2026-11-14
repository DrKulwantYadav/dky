import test from "node:test";
import assert from "node:assert/strict";
import { normalizeIndianMobile } from "../lib/appointment-phone.ts";

test("appointment mobile accepts normal spacing and country code", () => {
  for (const value of ["9876543210", "98765 43210", "98765-43210", "+91 98765 43210", "919876543210"])
    assert.equal(normalizeIndianMobile(value), "9876543210");
});

test("appointment mobile rejects invalid numbers", () => {
  for (const value of ["987654321", "5876543210", "98765432101", "98765x43210", null])
    assert.equal(normalizeIndianMobile(value), null);
});
