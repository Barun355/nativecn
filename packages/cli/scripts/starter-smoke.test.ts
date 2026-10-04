import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import {
  expectedInstalledFiles,
  planLeg,
  promoScreenProblems,
  sdkMajor,
  starterSdk,
} from "./starter-smoke.ts";

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

test("expectedInstalledFiles follows registryDependencies to Destination folders", () => {
  const index = {
    items: [
      {
        name: "button",
        registryDependencies: ["text"],
        files: [{ target: "{components}/button.tsx" }],
      },
      {
        name: "text",
        registryDependencies: ["theme"],
        files: [{ target: "{components}/text.tsx" }],
      },
      { name: "theme", files: [{ target: "{theme}/index.ts" }] },
      { name: "chip", files: [{ target: "{components}/chip.tsx" }] },
    ],
  };
  assert.deepEqual(expectedInstalledFiles(index, ["button"]), [
    "src/components/button.tsx",
    "src/components/text.tsx",
    "src/theme/index.ts",
  ]);
});

test("promoScreenProblems checks the route, the Preset and exactly the installed files", () => {
  const starter = fs.mkdtempSync(path.join(os.tmpdir(), "ncn-smoke-starter-"));
  const app = fs.mkdtempSync(path.join(os.tmpdir(), "ncn-smoke-promo-"));
  const write = (root: string, file: string, content: string) => {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    fs.writeFileSync(path.join(root, file), content);
  };
  const screen = 'import config from "../../components.json";\n';
  write(starter, "src/app/index.tsx", screen);
  write(app, "src/app/index.tsx", screen);
  write(
    app,
    "components.json",
    JSON.stringify({ preset: { style: "nova", accentColor: "violet" } }),
  );
  write(app, "src/components/button.tsx", "");
  write(app, "src/screens/starter-promo/index.tsx", "");
  const preset = { style: "nova", accentColor: "violet" };
  assert.deepEqual(
    promoScreenProblems(
      app,
      { preset, installed: ["src/components/button.tsx", "src/screens/starter-promo/index.tsx"] },
      starter,
    ),
    [],
  );
  write(app, "src/app/index.tsx", "export default function Index() {}\n");
  assert.deepEqual(
    promoScreenProblems(
      app,
      {
        preset: { style: "vega" },
        installed: ["src/components/button.tsx", "src/components/text.tsx"],
      },
      starter,
    ),
    [
      "src/app/index.tsx is not the Starter's promo Screen",
      "src/app/index.tsx does not read components.json",
      'components.json preset.style is "nova", not "vega"',
      "installed but not expected: src/screens/starter-promo/index.tsx",
      "expected but not installed: src/components/text.tsx",
    ],
  );
});
