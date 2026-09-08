import { test } from "node:test";
import assert from "node:assert/strict";
import type { AgentResult, VisualVerificationResult } from "../components/ai/types";

test("Visual Verification Frontend Contract Tests", async (t) => {
  await t.test("1. AgentResult accepts valid VisualVerificationResult with PASSED status", () => {
    const visualResult: VisualVerificationResult = {
      status: "PASSED",
      framework: "VITE_REACT",
      route: "/",
      url: "http://127.0.0.1:54321/",
      httpStatus: 200,
      title: "ANKA Verified Dashboard",
      screenshotPath: "C:\\Users\\PCC\\AppData\\Local\\Temp\\anka\\screenshots\\test.png",
      pageErrors: [],
      consoleErrors: [],
      failedRequests: [],
      durationMs: 320,
    };

    const agentResult: AgentResult = {
      explanation: "Updated dashboard header title and subtitle.",
      changes: [
        {
          path: "src/components/layout/Header/Header.tsx",
          content: "export const Header = () => null;",
          description: "Update title",
        },
      ],
      commitMessage: "feat: Update dashboard header title",
      sessionId: "session-1",
      buildVerified: true,
      securityPass: true,
      visualVerification: visualResult,
    };

    assert.equal(agentResult.visualVerification?.status, "PASSED");
    assert.equal(agentResult.visualVerification?.framework, "VITE_REACT");
    assert.equal(agentResult.visualVerification?.route, "/");
    assert.equal(agentResult.visualVerification?.httpStatus, 200);
    assert.equal(
      agentResult.visualVerification?.screenshotPath,
      "C:\\Users\\PCC\\AppData\\Local\\Temp\\anka\\screenshots\\test.png"
    );
    assert.equal(agentResult.buildVerified, true);
    assert.equal(agentResult.securityPass, true);
  });

  await t.test("2. AgentResult handles STARTUP_FAILED state with diagnostics", () => {
    const failedResult: VisualVerificationResult = {
      status: "STARTUP_FAILED",
      framework: "VITE_REACT",
      route: "/",
      startupErrors: "Frontend server failed to become ready (exit code 1): CACError: Unknown option '--hostname'",
      pageErrors: [],
      consoleErrors: [],
      failedRequests: [],
      durationMs: 45,
    };

    const agentResult: AgentResult = {
      explanation: "UI change",
      changes: [],
      commitMessage: "test",
      sessionId: "s-1",
      buildVerified: true,
      visualVerification: failedResult,
    };

    assert.equal(agentResult.visualVerification?.status, "STARTUP_FAILED");
    assert.ok(agentResult.visualVerification?.startupErrors?.includes("CACError"));
    // Build verified remains true even if visual verification fails
    assert.equal(agentResult.buildVerified, true);
  });

  await t.test("3. AgentResult handles PASSED_WITH_WARNINGS with console errors", () => {
    const warnResult: VisualVerificationResult = {
      status: "PASSED_WITH_WARNINGS",
      framework: "NEXT_JS",
      route: "/",
      httpStatus: 200,
      pageErrors: [],
      consoleErrors: ["Warning: Extra attributes from server: class"],
      failedRequests: [],
      durationMs: 450,
    };

    const agentResult: AgentResult = {
      explanation: "UI change",
      changes: [],
      commitMessage: "test",
      sessionId: "s-1",
      visualVerification: warnResult,
    };

    assert.equal(agentResult.visualVerification?.status, "PASSED_WITH_WARNINGS");
    assert.equal(agentResult.visualVerification?.consoleErrors.length, 1);
  });
});
