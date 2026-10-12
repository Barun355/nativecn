import assert from "node:assert/strict";
import { test } from "node:test";

import { isSiteNavActive, SITE_NAV } from "./site-nav.ts";

test("the site links are Docs, Create and Changelog, in the header's order", () => {
  assert.deepEqual(SITE_NAV, [
    { href: "/docs", title: "Docs" },
    { href: "/create", title: "Create" },
    { href: "/docs/changelog", title: "Changelog" },
  ]);
});

test("Create is active on the Preset builder only", () => {
  assert.equal(isSiteNavActive("/create", "/create"), true);
  assert.equal(isSiteNavActive("/create", "/create/"), true);
  assert.equal(isSiteNavActive("/create", "/"), false);
  assert.equal(isSiteNavActive("/create", "/docs"), false);
  assert.equal(isSiteNavActive("/create", "/created"), false);
});

test("Docs is active on docs pages except the changelog, which has its own link", () => {
  assert.equal(isSiteNavActive("/docs", "/docs"), true);
  assert.equal(isSiteNavActive("/docs", "/docs/components/button"), true);
  assert.equal(isSiteNavActive("/docs", "/docs/changelog"), false);
  assert.equal(isSiteNavActive("/docs/changelog", "/docs/changelog"), true);
  assert.equal(isSiteNavActive("/docs", "/create"), false);
});
