"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Film, Trash2, CheckCircle2 } from "lucide-react";

interface BatchSession {
  id: string;
  name: string;
  plannedDate: string | null;
  setupType: string | null;
  notes: string | null;
  checklist: string | null;
  posts?: { id: string; title: string; status: string }[];
}

const SETUP_TYPES: Record<string, string> = {
  TALKING_HEAD: "Talking Head",
  SCREENCAST: "Screencast",
  GYM: "Gym / Sport",
  OUTDOOR: "Outdoor",
  MIXED: "Gemischt",
};

export default function BatchPage() {
  const [sessions, setSessions] = useState<BatchSession[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchSessions = useCallback(async () => {
    const res = await fetch("/api/batch");
    if (res.ok) setSessions(await res.json());
  }, []);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  async function saveSession(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await fetch("/api/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: fd.get("name"),
        plannedDate: fd.get("plannedDate") || null,
        setupType: fd.get("setupType"),
        notes: fd.get("notes"),
        checklist: fd.get("checklist"),
      }),
    });
    setDialogOpen(false);
    fetchSessions();
  }

  async function deleteSession(id: string) {
    await fetch(`/api/batch?id=${id}`, { method: "DELETE" });
    fetchSessions();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Batch-Session-Planer</h1>
          <p className="text-muted-foreground">Plane Dreh-Sessions für mehrere Videos</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger>
            <Button><Plus className="mr-2 h-4 w-4" />Neue Session</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Neue Batch-Session</DialogTitle></DialogHeader>
            <form onSubmit={saveSession} className="space-y-4">
              <div><Label>Name</Label><Input name="name" required placeholder="z.B. Montag Dreh-Session" /></div>
              <div className="grid gap-4 md:grid-cols-2">
                <div><Label>Geplantes Datum</Label><Input name="plannedDate" type="date" /></div>
                <div>
                  <Label>Setup-Typ</Label>
                  <select name="setupType" className="flex h-9 w-full rounded-md border bg-background px-3 py-1 text-sm">
                    {Object.entries(SETUP_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>
              <div><Label>Checkliste</Label><Textarea name="checklist" rows={3} placeholder="- Kamera geladen&#10;- Ring-Light&#10;- Scripts ausgedruckt" /></div>
              <div><Label>Notizen</Label><Textarea name="notes" rows={2} /></div>
              <Button type="submit">Erstellen</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {sessions.length === 0 && (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              Noch keine Batch-Sessions. Plane deine erste Dreh-Session!
            </CardContent>
          </Card>
        )}
        {sessions.map((session) => (
          <Card key={session.id}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Film className="h-5 w-5" />{session.name}
              </CardTitle>
              <div className="flex items-center gap-2">
                {session.plannedDate && (
                  <Badge variant="outline">
                    {new Date(session.plannedDate).toLocaleDateString("de-DE")}
                  </Badge>
                )}
                {session.setupType && (
                  <Badge variant="secondary">{SETUP_TYPES[session.setupType] || session.setupType}</Badge>
                )}
                <Button size="sm" variant="ghost" onClick={() => deleteSession(session.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {session.checklist && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Checkliste:</p>
                  <div className="text-sm whitespace-pre-line bg-muted/50 rounded p-2">{session.checklist}</div>
                </div>
              )}
              {session.notes && <p className="text-sm text-muted-foreground">{session.notes}</p>}
              <p className="text-xs text-muted-foreground mt-2">{session.posts?.length || 0} Posts zugeordnet</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
