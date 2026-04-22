"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

const WS_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api")
  .replace(/^http/, "ws")
  .replace(/\/api$/, "/terminal");

export function TerminalPanel({ projectId }: { height?: number; projectId?: string }) {
  const WS_URL = projectId ? `${WS_BASE}?projectId=${projectId}` : WS_BASE;
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<any>(null);
  const fitRef = useRef<any>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCount = useRef(0);
  const destroyedRef = useRef(false);
  const [status, setStatus] = useState<"connecting" | "connected" | "disconnected">("connecting");

  const connect = useCallback(() => {
    if (destroyedRef.current || !termRef.current) return;
    const term = termRef.current;

    setStatus("connecting");
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      if (destroyedRef.current) { ws.close(); return; }
      retryCount.current = 0;
      setStatus("connected");
      const fit = fitRef.current;
      if (fit) fit.fit();
      ws.send(JSON.stringify({ type: "resize", cols: term.cols, rows: term.rows }));
    };

    ws.onmessage = (e) => {
      if (!destroyedRef.current) term.write(e.data);
    };

    ws.onclose = () => {
      if (destroyedRef.current) return;
      setStatus("disconnected");
      // Auto-retry up to 5 times with backoff
      if (retryCount.current < 5) {
        const delay = Math.min(1000 * 2 ** retryCount.current, 15000);
        retryCount.current++;
        term.write(`\r\n\x1b[33m[Reconnecting in ${Math.round(delay / 1000)}s...]\x1b[0m`);
        retryRef.current = setTimeout(connect, delay);
      } else {
        term.write("\r\n\x1b[31m[Connection failed. Click Reconnect to try again.]\x1b[0m\r\n");
      }
    };

    ws.onerror = () => {
      if (!destroyedRef.current) ws.close();
    };

    term.onData((data: string) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "input", data }));
      }
    });
  }, []);

  const reconnect = useCallback(() => {
    if (retryRef.current) clearTimeout(retryRef.current);
    retryCount.current = 0;
    wsRef.current?.close();
    termRef.current?.clear();
    connect();
  }, [connect]);

  useEffect(() => {
    destroyedRef.current = false;
    let roCleanup: (() => void) | undefined;

    async function init() {
      const { Terminal } = await import("@xterm/xterm");
      const { FitAddon } = await import("@xterm/addon-fit");
      await import("@xterm/xterm/css/xterm.css");

      if (destroyedRef.current || !containerRef.current) return;

      const term = new Terminal({
        fontFamily: '"Cascadia Code", "JetBrains Mono", "Fira Code", monospace',
        fontSize: 13,
        lineHeight: 1.4,
        theme: {
          background: "#0d1117",
          foreground: "#e6edf3",
          cursor: "#58a6ff",
          selectionBackground: "#264f78",
          black: "#0d1117",
          brightBlack: "#6e7681",
          red: "#ff7b72",
          brightRed: "#ffa198",
          green: "#3fb950",
          brightGreen: "#56d364",
          yellow: "#d29922",
          brightYellow: "#e3b341",
          blue: "#58a6ff",
          brightBlue: "#79c0ff",
          magenta: "#bc8cff",
          brightMagenta: "#d2a8ff",
          cyan: "#39c5cf",
          brightCyan: "#56d4dd",
          white: "#b1bac4",
          brightWhite: "#f0f6fc",
        },
        cursorBlink: true,
        allowProposedApi: true,
      });

      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      term.open(containerRef.current!);
      fitAddon.fit();
      termRef.current = term;
      fitRef.current = fitAddon;

      connect();

      const ro = new ResizeObserver(() => {
        try { fitAddon.fit(); } catch {}
        const ws = wsRef.current;
        if (ws?.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "resize", cols: term.cols, rows: term.rows }));
        }
      });
      if (containerRef.current) ro.observe(containerRef.current);
      roCleanup = () => ro.disconnect();
    }

    init();

    return () => {
      destroyedRef.current = true;
      if (retryRef.current) clearTimeout(retryRef.current);
      roCleanup?.();
      wsRef.current?.close();
      termRef.current?.dispose();
    };
  }, [connect]);

  return (
    <div className="relative flex flex-col h-full bg-[#0d1117]">
      {/* Status bar */}
      <div className="flex items-center gap-2 px-3 py-1 bg-[#161b22] border-b border-white/10 shrink-0">
        <div className={`h-2 w-2 rounded-full shrink-0 ${
          status === "connected" ? "bg-green-500" :
          status === "connecting" ? "bg-yellow-500 animate-pulse" : "bg-red-500"
        }`} />
        <span className="text-xs text-muted-foreground font-mono flex-1">
          {status === "connected" ? "Shell connected" :
           status === "connecting" ? "Connecting..." : "Disconnected"}
        </span>
        {status === "disconnected" && (
          <Button size="sm" variant="ghost" className="h-5 px-2 text-xs gap-1" onClick={reconnect}>
            <RotateCcw className="h-3 w-3" /> Reconnect
          </Button>
        )}
      </div>

      {status === "connecting" && !termRef.current && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-[#0d1117] top-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}

      <div ref={containerRef} className="flex-1 p-1 overflow-hidden" />
    </div>
  );
}
