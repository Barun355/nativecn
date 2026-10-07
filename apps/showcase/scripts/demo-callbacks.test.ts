// Blocks run for real with a fake server: real validation, fake submit, Toast feedback (#29).
import assert from "node:assert/strict";
import { test } from "node:test";

import { callbackKind, callbackLabel, failsOnPurpose } from "../src/demo-callbacks.ts";
import { registryIndex } from "../src/registry-index.ts";

test("submit and send-code callbacks are fake server calls", () => {
  assert.equal(callbackKind("onSubmit"), "server");
  assert.equal(callbackKind("onSendCode"), "server");
  assert.equal(callbackKind("onSocialSignIn"), "social");
  assert.equal(callbackKind("onForgotPassword"), "press");
  assert.equal(callbackKind("onLogOut"), "press");
});

test("every Screen Block can be submitted", () => {
  for (const [name, entry] of Object.entries(registryIndex)) {
    if (entry.kind !== "Block" || entry.category === "navigation") continue;
    assert.ok(entry.callbacks?.includes("onSubmit"), name);
  }
});

test("callback names read as labels", () => {
  assert.equal(callbackLabel("onForgotPassword"), "Forgot password");
  assert.equal(callbackLabel("onTermsPress"), "Terms");
  assert.equal(callbackLabel("onLogOut"), "Log out");
  assert.equal(callbackLabel("onSignUp"), "Sign up");
});

test('the fake server fails for "error" values and the code 000000 only', () => {
  assert.equal(failsOnPurpose([{ email: "error@example.com", password: "x" }]), true);
  assert.equal(failsOnPurpose([{ email: "a@example.com", code: "000000" }]), true);
  assert.equal(failsOnPurpose([{ email: "jane@example.com", code: "123456" }]), false);
  assert.equal(failsOnPurpose(["apple"]), false);
});
