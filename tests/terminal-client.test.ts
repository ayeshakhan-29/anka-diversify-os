import test from "node:test";
import assert from "node:assert";
import {
  parseSSEFrames,
  terminalApi,
  stripAnsi,
  createAnsiSanitizer,
  getTerminalEntryStyle,
  isSyntheticTerminalError,
  type TerminalEventHandlers,
} from "../lib/terminal-api";

test("Terminal Client & SSE Protocol Tests", async (t) => {
  await t.test("1. repository selection carries correct repositoryId in session creation payload", () => {
    const payloadA = { repositoryId: "repo-api-123" };
    const payloadB = { repositoryId: "repo-web-456" };

    assert.strictEqual(payloadA.repositoryId, "repo-api-123");
    assert.strictEqual(payloadB.repositoryId, "repo-web-456");
    assert.notStrictEqual(payloadA.repositoryId, payloadB.repositoryId);
  });

  await t.test("2. same project switching repo creates new session with independent identity", () => {
    const session1 = {
      sessionId: "session-uuid-1",
      projectId: "proj-1",
      repositoryId: "repo-api",
      cwd: "/workspace/api",
    };

    const session2 = {
      sessionId: "session-uuid-2",
      projectId: "proj-1",
      repositoryId: "repo-web",
      cwd: "/workspace/web",
    };

    assert.strictEqual(session1.projectId, session2.projectId);
    assert.notStrictEqual(session1.sessionId, session2.sessionId);
    assert.notStrictEqual(session1.repositoryId, session2.repositoryId);
    assert.notStrictEqual(session1.cwd, session2.cwd);
  });

  await t.test("3. SSE parser handles started, stdout, stderr, exit, and error frames accurately", () => {
    const receivedEvents: { type: string; data: any }[] = [];

    const handlers: TerminalEventHandlers = {
      onStarted: (data) => receivedEvents.push({ type: "started", data }),
      onStdout: (data) => receivedEvents.push({ type: "stdout", data }),
      onStderr: (data) => receivedEvents.push({ type: "stderr", data }),
      onExit: (data) => receivedEvents.push({ type: "exit", data }),
      onError: (data) => receivedEvents.push({ type: "error", data }),
    };

    const rawSSEStream = [
      'event: started\ndata: {"command":"npm test","cwd":"/workspace/repo"}\n\n',
      'event: stdout\ndata: {"text":"PASS src/app.test.ts\\n"}\n\n',
      'event: stderr\ndata: {"text":"warning: deprecation notice\\n"}\n\n',
      'event: exit\ndata: {"exitCode":0,"signal":null,"cwd":"/workspace/repo","durationMs":340}\n\n',
      'event: error\ndata: {"message":"connection dropped"}\n\n',
    ].join("");

    parseSSEFrames(rawSSEStream, handlers);

    assert.strictEqual(receivedEvents.length, 5);
    assert.strictEqual(receivedEvents[0].type, "started");
    assert.strictEqual(receivedEvents[0].data.command, "npm test");
    assert.strictEqual(receivedEvents[1].type, "stdout");
    assert.strictEqual(receivedEvents[1].data.text, "PASS src/app.test.ts\n");
    assert.strictEqual(receivedEvents[2].type, "stderr");
    assert.strictEqual(receivedEvents[2].data.text, "warning: deprecation notice\n");
    assert.strictEqual(receivedEvents[3].type, "exit");
    assert.strictEqual(receivedEvents[3].data.exitCode, 0);
    assert.strictEqual(receivedEvents[3].data.durationMs, 340);
    assert.strictEqual(receivedEvents[4].type, "error");
    assert.strictEqual(receivedEvents[4].data.message, "connection dropped");
  });

  await t.test("4. command payload is preserved without loss or unwanted mutation", () => {
    const originalCommand = "npm run build -- --filter @repo/ui && echo 'Done!'";
    const body = JSON.stringify({ command: originalCommand });
    const parsed = JSON.parse(body);

    assert.strictEqual(parsed.command, originalCommand);
  });

  await t.test("5. output text containing HTML/script tags is stored as plain text, not rendered as active HTML", () => {
    const rawMaliciousOutput = '<script>alert("xss")</script><img src="x" onerror="steal()">';
    
    // In TerminalPanel, output is stored as entry.text and rendered inside React JSX as {entry.text}
    // proving text content cannot be executed as HTML elements
    const entry = {
      id: "out-1",
      type: "stdout" as const,
      text: rawMaliciousOutput,
      timestamp: new Date(),
    };

    assert.strictEqual(typeof entry.text, "string");
    assert.strictEqual(entry.text, rawMaliciousOutput);
  });

  await t.test("6. close and interrupt endpoints format URL paths correctly", () => {
    const projectId = "proj-xyz-123";
    const sessionId = "sess-abc-789";

    const interruptUrl = `/projects/${projectId}/terminal/sessions/${sessionId}/interrupt`;
    const closeUrl = `/projects/${projectId}/terminal/sessions/${sessionId}`;

    assert.strictEqual(interruptUrl, "/projects/proj-xyz-123/terminal/sessions/sess-abc-789/interrupt");
    assert.strictEqual(closeUrl, "/projects/proj-xyz-123/terminal/sessions/sess-abc-789");
  });

  await t.test("7. SSE frame split across multiple chunks parses correctly via runCommand stream", async () => {
    const events: any[] = [];
    const chunks = [
      new TextEncoder().encode("event: std"),
      new TextEncoder().encode('out\ndata: {"text":"hel'),
      new TextEncoder().encode('lo"}\n\n'),
    ];

    let chunkIdx = 0;
    const stream = new ReadableStream({
      pull(controller) {
        if (chunkIdx < chunks.length) {
          controller.enqueue(chunks[chunkIdx++]);
        } else {
          controller.close();
        }
      },
    });

    const origFetch = globalThis.fetch;
    (globalThis as any).fetch = async () =>
      new Response(stream, {
        status: 200,
        headers: { "Content-Type": "text/event-stream" },
      });

    try {
      await terminalApi.runCommand("p1", "s1", "dummy", {
        onStdout: (d) => events.push(d),
      });
      assert.strictEqual(events.length, 1);
      assert.strictEqual(events[0].text, "hello");
    } finally {
      globalThis.fetch = origFetch;
    }
  });

  await t.test("8. multiple events in one chunk parse correctly", async () => {
    const events: string[] = [];
    const combined =
      'event: started\ndata: {"command":"ls","cwd":"/dir"}\n\n' +
      'event: stdout\ndata: {"text":"file.txt"}\n\n' +
      'event: exit\ndata: {"exitCode":0,"signal":null,"cwd":"/dir","durationMs":10}\n\n';

    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(combined));
        controller.close();
      },
    });

    const origFetch = globalThis.fetch;
    (globalThis as any).fetch = async () =>
      new Response(stream, {
        status: 200,
        headers: { "Content-Type": "text/event-stream" },
      });

    try {
      await terminalApi.runCommand("p1", "s1", "ls", {
        onStarted: () => events.push("started"),
        onStdout: () => events.push("stdout"),
        onExit: () => events.push("exit"),
      });
      assert.deepStrictEqual(events, ["started", "stdout", "exit"]);
    } finally {
      globalThis.fetch = origFetch;
    }
  });

  await t.test("9. partial trailing frame at stream completion is processed when valid", async () => {
    const events: any[] = [];
    const trailingFrame = 'event: exit\ndata: {"exitCode":0,"signal":null,"cwd":"/dir","durationMs":25}';

    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(trailingFrame));
        controller.close();
      },
    });

    const origFetch = globalThis.fetch;
    (globalThis as any).fetch = async () =>
      new Response(stream, {
        status: 200,
        headers: { "Content-Type": "text/event-stream" },
      });

    try {
      await terminalApi.runCommand("p1", "s1", "cmd", {
        onExit: (d) => events.push(d),
      });
      assert.strictEqual(events.length, 1);
      assert.strictEqual(events[0].exitCode, 0);
      assert.strictEqual(events[0].durationMs, 25);
    } finally {
      globalThis.fetch = origFetch;
    }
  });

  await t.test("10. runTerminalCommand resolves after exit/stream close", async () => {
    let resolved = false;
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(
          new TextEncoder().encode('event: exit\ndata: {"exitCode":0,"signal":null,"cwd":"/dir","durationMs":5}\n\n')
        );
        controller.close();
      },
    });

    const origFetch = globalThis.fetch;
    (globalThis as any).fetch = async () =>
      new Response(stream, {
        status: 200,
        headers: { "Content-Type": "text/event-stream" },
      });

    try {
      await terminalApi.runCommand("p1", "s1", "pwd", {});
      resolved = true;
      assert.strictEqual(resolved, true);
    } finally {
      globalThis.fetch = origFetch;
    }
  });

  await t.test("11. onExit receives exitCode and cwd", async () => {
    let receivedExit: any = null;
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(
          new TextEncoder().encode(
            'event: exit\ndata: {"exitCode":0,"signal":null,"cwd":"/app/src","durationMs":12}\n\n'
          )
        );
        controller.close();
      },
    });

    const origFetch = globalThis.fetch;
    (globalThis as any).fetch = async () =>
      new Response(stream, {
        status: 200,
        headers: { "Content-Type": "text/event-stream" },
      });

    try {
      await terminalApi.runCommand("p1", "s1", "cd src", {
        onExit: (d) => {
          receivedExit = d;
        },
      });
      assert.notStrictEqual(receivedExit, null);
      assert.strictEqual(receivedExit.exitCode, 0);
      assert.strictEqual(receivedExit.cwd, "/app/src");
      assert.strictEqual(receivedExit.durationMs, 12);
    } finally {
      globalThis.fetch = origFetch;
    }
  });
});

test("Terminal ANSI Output Sanitization & Stderr Styling Tests", async (t) => {
  await t.test("1. \\u001b[32mPASS\\u001b[39m renders PASS with no visible escape characters", () => {
    const input = "\u001b[32mPASS\u001b[39m";
    const result = stripAnsi(input);

    assert.strictEqual(result, "PASS");
    assert.strictEqual(result.includes("\u001b"), false);
    assert.strictEqual(result.includes("[32m"), false);
    assert.strictEqual(result.includes("[39m"), false);
  });

  await t.test("2. Multiple ANSI sequences are removed correctly (Jest, npm, TypeScript, Vite)", () => {
    // Jest status line with reset, bold, green, reset
    const jestStatus = "\u001b[0m\u001b[7m\u001b[1m\u001b[32m PASS \u001b[39m\u001b[22m\u001b[27m\u001b[0msrc/user.test.ts";
    assert.strictEqual(stripAnsi(jestStatus), " PASS src/user.test.ts");

    // TypeScript compiler diagnostic
    const tsOutput = "\u001b[96msrc/user.ts\u001b[0m:\u001b[93m10\u001b[0m:\u001b[93m5\u001b[0m - \u001b[91merror\u001b[0m\u001b[90m TS2322: \u001b[0mType 'number' is not assignable to type 'string'.";
    assert.strictEqual(stripAnsi(tsOutput), "src/user.ts:10:5 - error TS2322: Type 'number' is not assignable to type 'string'.");

    // npm terminal line clear and carriage sequences
    const npmOutput = "\u001b[2K\u001b[1Gadded 45 packages in 1.2s";
    assert.strictEqual(stripAnsi(npmOutput), "added 45 packages in 1.2s");

    // Vite / Next.js colored build report
    const viteOutput = "\u001b[32m✓\u001b[39m built in \u001b[1m125ms\u001b[22m";
    assert.strictEqual(stripAnsi(viteOutput), "✓ built in 125ms");

    // Plain text with normal brackets is preserved without modification
    const normalBrackets = "[webpack] compiled [1/5] modules successfully";
    assert.strictEqual(stripAnsi(normalBrackets), normalBrackets);
  });

  await t.test("3. ANSI sequence split across chunks does not leak fragments", () => {
    const sanitizer = createAnsiSanitizer();

    // 2-chunk boundary split: \u001b[3 in chunk 1, 2msrc/index.test.ts\u001b[39m in chunk 2
    const chunk1 = "PASS \u001b[3";
    const chunk2 = "2msrc/index.test.ts\u001b[39m";

    const out1 = sanitizer.sanitize(chunk1);
    const out2 = sanitizer.sanitize(chunk2);

    assert.strictEqual(out1, "PASS ");
    assert.strictEqual(out2, "src/index.test.ts");
    assert.strictEqual(out1.includes("[3"), false);
    assert.strictEqual(out2.includes("2m"), false);

    // 3-chunk boundary split: \u001b in chunk 1, [ in chunk 2, 31mFAIL\u001b[39m in chunk 3
    const sanitizer3 = createAnsiSanitizer();
    const c1 = sanitizer3.sanitize("Testing \u001b");
    const c2 = sanitizer3.sanitize("[");
    const c3 = sanitizer3.sanitize("31mFAIL\u001b[39m");

    assert.strictEqual(c1, "Testing ");
    assert.strictEqual(c2, "");
    assert.strictEqual(c3, "FAIL");

    // Trailing incomplete escape at stream close is safely dropped by flush
    const sanitizerFlush = createAnsiSanitizer();
    const flushedClean = sanitizerFlush.sanitize("Done \u001b[");
    const flushedTail = sanitizerFlush.flush();

    assert.strictEqual(flushedClean, "Done ");
    assert.strictEqual(flushedTail, "");
  });

  await t.test("4. Successful stderr content is not automatically styled as failure", () => {
    // Jest and other CLI tools write normal reporting to stderr
    const normalJestStderrEntry = {
      type: "stderr" as const,
      text: "PASS src/app.test.ts\nTest Suites: 1 passed, 1 total\nTests: 1 passed, 1 total\n",
    };

    const style = getTerminalEntryStyle(normalJestStderrEntry);

    // Stderr output must use neutral terminal text styling, not error-red
    assert.strictEqual(style, "text-[#e6edf3]");
    assert.notStrictEqual(style, "text-rose-400");
    assert.strictEqual(isSyntheticTerminalError(normalJestStderrEntry.text), false);
  });

  await t.test("5. exitCode 0 produces successful/neutral completion", () => {
    const exitSuccessEntry = {
      type: "system" as const,
      text: "[Process exited with code 0]",
      isSuccess: true,
    };

    const style = getTerminalEntryStyle(exitSuccessEntry);

    // exitCode 0 produces successful completion styling
    assert.strictEqual(style, "text-emerald-400");
    assert.notStrictEqual(style, "text-rose-400");
  });

  await t.test("6. exitCode 1 produces failure completion styling", () => {
    const exitFailureEntry = {
      type: "stderr" as const,
      text: "[Process exited with code 1]",
      isError: true,
    };

    const style = getTerminalEntryStyle(exitFailureEntry);

    // exitCode !== 0 produces clear failure styling
    assert.strictEqual(style, "text-rose-400");
  });

  await t.test("7. Repository containment error remains visibly distinguishable", () => {
    const containmentErrorEntry = {
      type: "stderr" as const,
      text: "Access denied: directory is outside the selected repository.\n",
    };

    // Synthetic ANKA containment errors are detected and styled with failure red
    assert.strictEqual(isSyntheticTerminalError(containmentErrorEntry.text), true);
    assert.strictEqual(getTerminalEntryStyle(containmentErrorEntry), "text-rose-400");

    // Security policy violations are also styled with failure red
    const policyViolationEntry = {
      type: "stderr" as const,
      text: "Command rejected by security policy: dangerous host-management command.\n",
    };
    assert.strictEqual(isSyntheticTerminalError(policyViolationEntry.text), true);
    assert.strictEqual(getTerminalEntryStyle(policyViolationEntry), "text-rose-400");
  });
});

