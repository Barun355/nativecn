import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import { AGENTS_MD_LIMIT, agentKitProblems, parseFrontmatter, skillProblems } from "./check.ts";

const skill = (frontmatter: string) => `---\n${frontmatter}\n---\n\n# Body\n`;

test("the repo's Agent Kit passes", () => {
  assert.deepEqual(agentKitProblems(), []);
});

test("parses top-level and nested frontmatter", () => {
  assert.deepEqual(
    parseFrontmatter(
      skill(
        'name: a-skill\ndescription: "Does: things"\nmetadata:\n  author: nativecn\n  version: "1"',
      ),
    ),
    {
      name: "a-skill",
      description: "Does: things",
      metadata: { author: "nativecn", version: "1" },
    },
  );
});

test("a valid Skill has no problems", () => {
  assert.deepEqual(
    skillProblems("nativecn-x", skill("name: nativecn-x\ndescription: Use when.\nlicense: MIT")),
    [],
  );
});

test("flags a name that doesn't match its folder", () => {
  assert.match(
    skillProblems("nativecn-x", skill("name: nativecn-y\ndescription: Use when."))[0]!,
    /"name" is "nativecn-y" but the folder is "nativecn-x"/,
  );
});

test("flags missing, unknown and malformed frontmatter", () => {
  assert.match(skillProblems("a", "# No frontmatter")[0]!, /must start with a ---/);
  assert.match(skillProblems("a", "---\nname: a\n")[0]!, /not closed/);
  assert.deepEqual(skillProblems("a", skill("name: a")), [`"description" is required`]);
  assert.match(
    skillProblems("a", skill("name: a\ndescription: d\ntriggers: x"))[0]!,
    /"triggers" is not a portable frontmatter key/,
  );
  assert.match(
    skillProblems("a", skill("name: a\ndescription: Use when: always"))[0]!,
    /quote this value/,
  );
  assert.match(
    skillProblems("Bad_Name", skill("name: Bad_Name\ndescription: d"))[0]!,
    /lowercase letters, digits and single hyphens/,
  );
  assert.match(
    skillProblems("a", skill(`name: a\ndescription: ${"x".repeat(1025)}`))[0]!,
    /over 1024 characters/,
  );
});

test("flags an AGENTS.md over 24 KB and a Skill folder without SKILL.md", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "nativecn-kit-"));
  fs.mkdirSync(path.join(root, "packages/agent-kit/rules"), { recursive: true });
  fs.writeFileSync(
    path.join(root, "packages/agent-kit/rules/AGENTS.md"),
    "x".repeat(AGENTS_MD_LIMIT + 1),
  );
  fs.mkdirSync(path.join(root, "skills/nativecn-empty"), { recursive: true });
  const problems = agentKitProblems(root);
  fs.rmSync(root, { recursive: true, force: true });
  assert.equal(problems.length, 2);
  assert.match(problems[0]!, /AGENTS\.md is 24001 bytes, over the 24000-byte limit/);
  assert.match(problems[1]!, /nativecn-empty: SKILL\.md is missing/);
});
