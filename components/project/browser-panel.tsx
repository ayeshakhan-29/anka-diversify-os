"use client";

import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RefreshCw, ExternalLink, Globe, AlertTriangle } from "lucide-react";

export function BrowserPanel() {
  const [url, setUrl] = useState("http://localhost:3000");
  const [inputUrl, setInputUrl] = useState("http://localhost:3000");
  const [key, setKey] = useState(0); // force iframe reload
  const [error, setError] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const navigate = (target?: string) => {
    const dest = target ?? inputUrl;
    let normalized = dest.trim();
    if (normalized && !normalized.match(/^https?:\/\//)) {
      normalized = "http://" + normalized;
    }
    setUrl(normalized);
    setInputUrl(normalized);
    setError(false);
    setKey((k) => k + 1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") navigate();
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Address bar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b shrink-0 bg-[#161b22]">
        <Globe className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <Input
          value={inputUrl}
          onChange={(e) => setInputUrl(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="http://localhost:3000"
          className="h-6 text-xs bg-white/5 border-white/10 font-mono"
        />
        <Button size="sm" variant="ghost" className="h-6 w-6 p-0 shrink-0" onClick={() => navigate()}>
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
        <a href={url} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground shrink-0">
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      {/* Suggested quick links */}
      <div className="flex gap-1 px-3 py-1 border-b border-white/5 bg-[#161b22] shrink-0">
        {["http://localhost:3000", "http://localhost:3001/health"].map((u) => (
          <button
            key={u}
            onClick={() => { setInputUrl(u); navigate(u); }}
            className="text-xs text-muted-foreground hover:text-foreground px-2 py-0.5 rounded hover:bg-white/5 transition-colors font-mono"
          >
            {u.replace("http://", "")}
          </button>
        ))}
      </div>

      {/* iframe */}
      <div className="flex-1 relative overflow-hidden">
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <AlertTriangle className="h-8 w-8 opacity-40" />
            <p className="text-sm">Could not load {url}</p>
            <p className="text-xs opacity-60">The page may block embedding, or the server isn't running.</p>
            <a href={url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
              Open in new tab <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        ) : (
          <iframe
            key={key}
            ref={iframeRef}
            src={url}
            className="w-full h-full border-0"
            onError={() => setError(true)}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
            title="Browser Preview"
          />
        )}
      </div>
    </div>
  );
}
