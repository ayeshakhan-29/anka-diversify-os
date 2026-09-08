import test from "node:test";
import assert from "node:assert";
import {
  getChangeKey,
  findChangeByRepoAndPath,
  createChangeMap,
  type AgentFileChange,
} from "../components/ai/types";

test("Multi-Repo Change Identity & Frontend State Disambiguation", async (t) => {
  const changeRepoA: AgentFileChange = {
    path: "src/types/user.ts",
    content: "export interface UserA { id: string; }",
    description: "Define UserA",
    repositoryId: "repo-a",
  };

  const changeRepoB: AgentFileChange = {
    path: "src/types/user.ts",
    content: "export interface UserB { id: string; }",
    description: "Define UserB",
    repositoryId: "repo-b",
  };

  const changeSingleRepo: AgentFileChange = {
    path: "src/types/user.ts",
    content: "export interface UserLegacy { id: string; }",
    description: "Define UserLegacy",
  };

  await t.test("1. Two changes with same path across different repos produce two unique internal keys", () => {
    const keyA = getChangeKey(changeRepoA);
    const keyB = getChangeKey(changeRepoB);
    assert.strictEqual(keyA, "repo-a:src/types/user.ts");
    assert.strictEqual(keyB, "repo-b:src/types/user.ts");
    assert.notStrictEqual(keyA, keyB, "Keys must not collide for different repositories");
  });

  await t.test("2. Same path + different repositoryId do not collide in a Set or Map", () => {
    const changeSet = new Set<string>();
    changeSet.add(getChangeKey(changeRepoA));
    changeSet.add(getChangeKey(changeRepoB));
    assert.strictEqual(changeSet.size, 2, "Set must contain both entries");

    const changeMap = createChangeMap([changeRepoA, changeRepoB]);
    assert.strictEqual(changeMap.size, 2);
    assert.strictEqual(changeMap.get("repo-a:src/types/user.ts"), changeRepoA);
    assert.strictEqual(changeMap.get("repo-b:src/types/user.ts"), changeRepoB);
  });

  await t.test("3. Same repositoryId + same path remains one identity", () => {
    const duplicateChange: AgentFileChange = { ...changeRepoA, description: "Updated description" };
    assert.strictEqual(getChangeKey(changeRepoA), getChangeKey(duplicateChange));

    const map = createChangeMap([changeRepoA, duplicateChange]);
    assert.strictEqual(map.size, 1, "Duplicate change key should overwrite or deduplicate cleanly");
  });

  await t.test("4. Single-repo change without repositoryId remains supported", () => {
    const singleRepoKey = getChangeKey(changeSingleRepo);
    assert.strictEqual(singleRepoKey, "primary:src/types/user.ts");

    const isSelected = (selectedSet: Set<string>, c: AgentFileChange) =>
      selectedSet.has(getChangeKey(c)) || (!c.repositoryId && selectedSet.has(c.path));

    // Supported via path fallback
    const legacyPathSet = new Set(["src/types/user.ts"]);
    assert.strictEqual(isSelected(legacyPathSet, changeSingleRepo), true);

    // Supported via canonical key
    const canonicalKeySet = new Set([getChangeKey(changeSingleRepo)]);
    assert.strictEqual(isSelected(canonicalKeySet, changeSingleRepo), true);
  });

  await t.test("5. expanded/selected/review state for repo-a file does NOT affect repo-b same path", () => {
    const selectedChanges = new Set<string>();
    let expandedFileKey: string | null = null;

    // Select and expand only repo-a
    selectedChanges.add(getChangeKey(changeRepoA));
    expandedFileKey = getChangeKey(changeRepoA);

    // Verify repo-a is selected & expanded
    assert.strictEqual(selectedChanges.has(getChangeKey(changeRepoA)), true);
    assert.strictEqual(expandedFileKey === getChangeKey(changeRepoA), true);

    // Verify repo-b is NOT selected & NOT expanded despite identical path
    assert.strictEqual(selectedChanges.has(getChangeKey(changeRepoB)), false);
    assert.strictEqual(expandedFileKey === getChangeKey(changeRepoB), false);

    // Deselect repo-a
    selectedChanges.delete(getChangeKey(changeRepoA));
    assert.strictEqual(selectedChanges.has(getChangeKey(changeRepoA)), false);
    assert.strictEqual(selectedChanges.has(getChangeKey(changeRepoB)), false);
  });

  await t.test("6. lookup of repo-a/src/types/user.ts returns only repo-a change", () => {
    const changes = [changeRepoA, changeRepoB];
    const foundA = findChangeByRepoAndPath(changes, "src/types/user.ts", "repo-a");
    const foundB = findChangeByRepoAndPath(changes, "src/types/user.ts", "repo-b");
    const foundC = findChangeByRepoAndPath(changes, "src/types/user.ts", "repo-c");

    assert.strictEqual(foundA, changeRepoA);
    assert.strictEqual(foundA?.content, "export interface UserA { id: string; }");
    assert.strictEqual(foundB, changeRepoB);
    assert.strictEqual(foundB?.content, "export interface UserB { id: string; }");
    assert.strictEqual(foundC, undefined);
  });

  await t.test("7. push payload preserves both repositoryIds", () => {
    const allChanges = [changeRepoA, changeRepoB];
    const selectedKeys = new Set([getChangeKey(changeRepoA), getChangeKey(changeRepoB)]);

    // Emulate handlePush filtering
    const pushChanges = allChanges.filter((c) =>
      selectedKeys.has(getChangeKey(c)) || (!c.repositoryId && selectedKeys.has(c.path))
    );

    assert.strictEqual(pushChanges.length, 2);
    assert.strictEqual(pushChanges[0].repositoryId, "repo-a");
    assert.strictEqual(pushChanges[0].path, "src/types/user.ts");
    assert.strictEqual(pushChanges[1].repositoryId, "repo-b");
    assert.strictEqual(pushChanges[1].path, "src/types/user.ts");

    // Partial selection: only repo-a selected
    const partialSelectedKeys = new Set([getChangeKey(changeRepoA)]);
    const partialPushChanges = allChanges.filter((c) =>
      partialSelectedKeys.has(getChangeKey(c)) || (!c.repositoryId && partialSelectedKeys.has(c.path))
    );

    assert.strictEqual(partialPushChanges.length, 1);
    assert.strictEqual(partialPushChanges[0].repositoryId, "repo-a");
  });

  await t.test("8. existing single-repo diff panel still works", () => {
    const singleRepoChanges: AgentFileChange[] = [
      { path: "src/index.ts", content: "console.log('hi');", description: "Entry" },
      { path: "src/types.ts", content: "export type Foo = string;", description: "Types" },
    ];

    const keys = singleRepoChanges.map(getChangeKey);
    assert.deepStrictEqual(keys, ["primary:src/index.ts", "primary:src/types.ts"]);

    const selectedSet = new Set(keys);
    assert.strictEqual(selectedSet.size, 2);
    assert.strictEqual(selectedSet.has(getChangeKey(singleRepoChanges[0])), true);
    assert.strictEqual(selectedSet.has(getChangeKey(singleRepoChanges[1])), true);
  });
});
