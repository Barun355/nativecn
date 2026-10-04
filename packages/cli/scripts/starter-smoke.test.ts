import assert from "node:assert/strict";
import { test } from "node:test";

import { planLeg, sdkMajor, starterSdk } from "./starter-smoke.ts";

test("sdkMajor reads versions and ranges", () => {
  assert.equal(sdkMajor("~57.0.26"), 57);
  assert.equal(sdkMajor("58.0.1"), 58);
  assert.equal(sdkMajor("^60.1.0-canary"), 60);
  assert.throws(() => sdkMajor("latest"), /Can't read an Expo SDK/);
});

test("the Starter is on a supported SDK", () => {
  assert.ok(starterSdk() >= 57);
});

test("the floor leg runs on SDK 57; the latest leg is skipped while 57 is the latest", () => {
  assert.deepEqual(planLeg("57", "57.0.26", 57), { run: true, sdk: 57, npmTag: "sdk-57" });
  const latest = planLeg("latest", "57.0.26", 57);
  assert.equal(latest.run, false);
});

test("once a newer SDK ships, the legs switch the Starter's SDK where they differ", () => {
  // The Starter still on 57: the latest leg upgrades it.
  assert.deepEqual(planLeg("latest", "58.0.3", 57), {
    run: true,
    sdk: 58,
    npmTag: "latest",
    switchFrom: 57,
  });
  // The Starter moved to 58: the floor leg downgrades it.
  assert.deepEqual(planLeg("57", "58.0.3", 58), {
    run: true,
    sdk: 57,
    npmTag: "sdk-57",
    switchFrom: 58,
  });
  assert.deepEqual(planLeg("latest", "58.0.3", 58), { run: true, sdk: 58, npmTag: "latest" });
});

test("rejects SDKs below the floor", () => {
  assert.throws(() => planLeg("56", "58.0.0", 58), /at least 57/);
  assert.throws(() => planLeg("next", "58.0.0", 58), /at least 57/);
});
