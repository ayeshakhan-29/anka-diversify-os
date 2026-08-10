"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, AlertTriangle } from "lucide-react";
import { aiClient, type ArchitectureDriftRecord } from "@/lib/ai-client";

const riskBadgeClass: Record<string, string> = {
  low: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
  medium: "bg-amber-500/10 text-amber-500 border-amber-500/30",
  high: "bg-orange-500/10 text-orange-500 border-orange-500/30",
  critical: "bg-rose-500/10 text-rose-500 border-rose-500/30",
};

const RESOLUTION_OPTIONS = [
  { value: "resolved_code_corrected", label: "Resolved — code corrected" },
  { value: "resolved_architecture_updated", label: "Resolved — architecture updated" },
  { value: "accepted_exception", label: "Accepted as exception" },
  { value: "dismissed", label: "Dismissed" },
];

interface ArchitectureDriftPanelProps {
  projectId: string;
}

export function ArchitectureDriftPanel({ projectId }: ArchitectureDriftPanelProps) {
  const [records, setRecords] = useState<ArchitectureDriftRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const load = () => {
    aiClient.getDriftRecords(projectId).then(setRecords).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const handleResolve = async (recordId: string, status: string) => {
    setResolvingId(recordId);
    try {
      await aiClient.resolveDriftRecord(projectId, recordId, status);
      load();
    } finally {
      setResolvingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    );
  }

  const openRecords = records.filter((r) => r.status === "open");
  const resolvedRecords = records.filter((r) => r.status !== "open");

  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
        <AlertTriangle className="h-10 w-10 mb-3 opacity-30" />
        <p className="text-sm">No architecture drift flagged.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {[...openRecords, ...resolvedRecords].map((record) => (
        <Card key={record.id} className={record.status === "open" ? "border-amber-500/30" : "opacity-60"}>
          <CardContent className="p-3">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm flex-1 min-w-0">{record.description}</p>
              <Badge variant="outline" className={`text-[10px] shrink-0 ${riskBadgeClass[record.risk] || ""}`}>
                {record.risk}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <Badge variant="outline" className="text-[10px]">{record.detectedBy}</Badge>
              <Badge variant="outline" className="text-[10px]">{record.status.replace(/_/g, " ")}</Badge>
              <span className="text-xs text-muted-foreground">
                {new Date(record.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
            </div>
            {record.status === "open" && (
              <div className="mt-3">
                <Select onValueChange={(v) => handleResolve(record.id, v)} disabled={resolvingId === record.id}>
                  <SelectTrigger className="h-7 w-56 text-xs">
                    <SelectValue placeholder={resolvingId === record.id ? "Saving..." : "Resolve..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {RESOLUTION_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
