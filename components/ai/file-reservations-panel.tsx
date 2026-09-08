"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Lock } from "lucide-react";
import { aiClient, type FileReservation } from "@/lib/ai-client";

interface FileReservationsPanelProps {
  projectId: string;
}

export function FileReservationsPanel({ projectId }: FileReservationsPanelProps) {
  const [reservations, setReservations] = useState<FileReservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    aiClient
      .getFileReservations(projectId)
      .then((data) => { if (!cancelled) setReservations(data); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    );
  }

  if (reservations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
        <Lock className="h-10 w-10 mb-3 opacity-30" />
        <p className="text-sm">No files currently reserved.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {reservations.map((r) => (
        <Card key={r.id}>
          <CardContent className="p-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-mono truncate">{r.filePath}</p>
              {r.reason && <p className="text-xs text-muted-foreground mt-0.5 truncate">{r.reason}</p>}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge variant="outline" className="text-[10px]">{r.holderType}</Badge>
              <span className="text-xs text-muted-foreground">
                expires {new Date(r.expiresAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
