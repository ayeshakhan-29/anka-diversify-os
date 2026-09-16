import test from "node:test";
import assert from "node:assert";
import {
  getChangeKey,
  normalizePreservedSelection,
  toggleChangeSelection,
  type AgentFileChange
} from "../components/ai/types";
import { AIClientError, extractErrorMessage, isGitApprovalUnavailable } from "../lib/ai-client";

test("Multi-Repo Push Selection Compatibility & Error Visibility", async (t) => {
  const repoA = "cmto0ny8w000hkd5vx6m7jve9"; // API
  const repoB = "cmtnzklyx000bwljrhclpqj03"; // WEB

  const sampleChanges: AgentFileChange[] = [
    { path: "src/types/user.ts", content: "export type UserStatus = 'active';", description: "API user types", repositoryId: repoA },
    { path: "src/services/users.service.ts", content: "export function getUsers() {}", description: "API users service", repositoryId: repoA },
    { path: "src/controllers/users.controller.ts", content: "export function usersController() {}", description: "API controller", repositoryId: repoA },
    { path: "src/routes/users.routes.ts", content: "export function usersRoutes() {}", description: "API routes", repositoryId: repoA },
    { path: "src/types/user.ts", content: "export interface User { status: string; }", description: "WEB user types", repositoryId: repoB },
    { path: "src/api/users.ts", content: "export async function fetchUsers() {}", description: "WEB users client", repositoryId: repoB },
    { path: "src/components/UserCard.tsx", content: "export function UserCard() {}", description: "WEB user card", repositoryId: repoB },
  ];

  // Helper filter representing handlePush / diff panel selection predicate
  function filterSelected(selected: Set<string>, changes: AgentFileChange[]): AgentFileChange[] {
    return changes.filter((c) => selected.has(getChangeKey(c)) || selected.has(c.path));
  }

  await t.test("1. selectedFiles contains canonical keys for all 7 changes -> 7 changes selected", () => {
    const canonicalKeys = new Set(sampleChanges.map((c) => getChangeKey(c)));
    const selected = filterSelected(canonicalKeys, sampleChanges);

    assert.strictEqual(selected.length, 7);
    assert.strictEqual(selected.filter((c) => c.repositoryId === repoA).length, 4);
    assert.strictEqual(selected.filter((c) => c.repositoryId === repoB).length, 3);
  });

  await t.test("2. selectedFiles contains legacy/plain path entries -> matching changes remain selectable/pushable", () => {
    // Legacy state has only relative paths without repo prefixes
    const legacySelected = new Set([
      "src/types/user.ts",
      "src/services/users.service.ts",
      "src/controllers/users.controller.ts",
      "src/routes/users.routes.ts",
      "src/api/users.ts",
      "src/components/UserCard.tsx"
    ]);

    const selected = filterSelected(legacySelected, sampleChanges);
    assert.strictEqual(selected.length, 7, "All 7 changes must be retained by compatibility matching");
  });

  await t.test("3. same path in two repos with canonical keys -> both independently selectable", () => {
    const onlyRepoA = new Set([`${repoA}:src/types/user.ts`]);
    const selectedA = filterSelected(onlyRepoA, sampleChanges);

    assert.strictEqual(selectedA.length, 1);
    assert.strictEqual(selectedA[0].repositoryId, repoA);
    assert.strictEqual(selectedA[0].path, "src/types/user.ts");

    const onlyRepoB = new Set([`${repoB}:src/types/user.ts`]);
    const selectedB = filterSelected(onlyRepoB, sampleChanges);

    assert.strictEqual(selectedB.length, 1);
    assert.strictEqual(selectedB[0].repositoryId, repoB);
    assert.strictEqual(selectedB[0].path, "src/types/user.ts");
  });

  await t.test("4. legacy selectedFiles contains src/types/user.ts and two repos contain that path -> compatibility does not drop both from push unexpectedly", () => {
    const legacyDuplicate = new Set(["src/types/user.ts"]);
    const selected = filterSelected(legacyDuplicate, sampleChanges);

    assert.strictEqual(selected.length, 2);
    assert.ok(selected.some((c) => c.repositoryId === repoA && c.path === "src/types/user.ts"));
    assert.ok(selected.some((c) => c.repositoryId === repoB && c.path === "src/types/user.ts"));
  });

  await t.test("5. toggling repo-a same-path change uses canonical key and does not corrupt repo-b selection", () => {
    // Initial state: legacy plain path selected
    const initial = new Set(["src/types/user.ts"]);

    // User deselects repoA's change
    const afterDeselectA = toggleChangeSelection(initial, `${repoA}:src/types/user.ts`, sampleChanges);

    assert.strictEqual(afterDeselectA.has(`${repoA}:src/types/user.ts`), false, "Repo A must be deselected");
    assert.strictEqual(afterDeselectA.has("src/types/user.ts"), false, "Plain path must be removed so Repo A is not re-matched");
    assert.strictEqual(afterDeselectA.has(`${repoB}:src/types/user.ts`), true, "Repo B must remain selected under canonical key");

    // Filter should now select ONLY Repo B's user.ts
    const selected = filterSelected(afterDeselectA, sampleChanges);
    assert.strictEqual(selected.length, 1);
    assert.strictEqual(selected[0].repositoryId, repoB);
    assert.strictEqual(selected[0].path, "src/types/user.ts");

    // Now re-select Repo A
    const afterReselectA = toggleChangeSelection(afterDeselectA, `${repoA}:src/types/user.ts`, sampleChanges);
    assert.strictEqual(afterReselectA.has(`${repoA}:src/types/user.ts`), true);
    assert.strictEqual(afterReselectA.has(`${repoB}:src/types/user.ts`), true);

    const selectedBoth = filterSelected(afterReselectA, sampleChanges);
    assert.strictEqual(selectedBoth.length, 2);
  });

  await t.test("6. handlePush with selected changes preserves repositoryId, path, and content", () => {
    const canonicalKeys = new Set(sampleChanges.map((c) => getChangeKey(c)));
    const selected = filterSelected(canonicalKeys, sampleChanges);

    const pushPayloadChanges = selected.map((c) => ({
      path: c.path,
      content: c.content,
      repositoryId: c.repositoryId,
    }));

    assert.strictEqual(pushPayloadChanges.length, 7);
    for (const item of pushPayloadChanges) {
      assert.ok(item.path, "path must be non-empty");
      assert.ok(item.content, "content must be non-empty");
      assert.ok(item.repositoryId === repoA || item.repositoryId === repoB, "repositoryId must be preserved");
    }
  });

  await t.test("7. handlePush with zero selected changes does NOT call API", () => {
    let apiCalled = false;
    const mockPushAgentChanges = async () => {
      apiCalled = true;
      return { sha: "dummy", url: "dummy" };
    };

    const emptySelected = new Set<string>();
    const changesToPush = filterSelected(emptySelected, sampleChanges);

    let pushError: string | null = null;
    if (changesToPush.length === 0) {
      pushError = "No proposed files are currently selected for push.";
    } else {
      mockPushAgentChanges();
    }

    assert.strictEqual(apiCalled, false, "API must not be called when 0 changes are selected");
    assert.strictEqual(pushError, "No proposed files are currently selected for push.");
  });

  await t.test("8. AIClient error parser: { error: 'No changes provided' } -> throws/displays 'No changes provided'", () => {
    const parsed = extractErrorMessage({ error: "No changes provided" }, 400, "Bad Request");
    assert.strictEqual(parsed, "No changes provided");
  });

  await t.test("9. AIClient error parser: { message: 'Something failed' } -> displays 'Something failed'", () => {
    const parsed = extractErrorMessage({ message: "Something failed" }, 500, "Internal Server Error");
    assert.strictEqual(parsed, "Something failed");
  });

  await t.test("10. generic non-JSON/non-string failure -> safe HTTP fallback", () => {
    const nonJson = extractErrorMessage({}, 400, "Bad Request");
    assert.strictEqual(nonJson, "HTTP 400: Bad Request");

    const nonString = extractErrorMessage({ error: { code: 123 } }, 404, "Not Found");
    assert.strictEqual(nonString, "HTTP 404: Not Found");

    const emptyObj = extractErrorMessage(null, 502, "Bad Gateway");
    assert.strictEqual(emptyObj, "HTTP 502: Bad Gateway");
  });

  await t.test("10a. stale and expired Git approvals are typed recovery conditions", () => {
    assert.strictEqual(
      isGitApprovalUnavailable(new AIClientError("GIT_APPROVAL_NOT_FOUND", "Approval missing", 409)),
      true,
    );
    assert.strictEqual(
      isGitApprovalUnavailable(new AIClientError("GIT_APPROVAL_EXPIRED", "Approval expired", 409)),
      true,
    );
    assert.strictEqual(
      isGitApprovalUnavailable(new AIClientError("GIT_STAGE_MISMATCH", "Stage mismatch", 409)),
      false,
    );
  });

  await t.test("11. normalizePreservedSelection migrates unambiguous plain paths and keeps ambiguous paths safe", () => {
    const rawLegacy = ["src/services/users.service.ts", "src/types/user.ts"];
    const normalized = normalizePreservedSelection(rawLegacy, sampleChanges);

    // src/services/users.service.ts appears only in API repo -> must be canonicalized
    assert.strictEqual(normalized.has(`${repoA}:src/services/users.service.ts`), true);
    assert.strictEqual(normalized.has("src/services/users.service.ts"), false);

    // src/types/user.ts appears in both API and WEB -> must be preserved as plain path so both remain selected
    assert.strictEqual(normalized.has("src/types/user.ts"), true);

    const selected = filterSelected(normalized, sampleChanges);
    assert.strictEqual(selected.length, 3); // 1 service + 2 types
  });
});
