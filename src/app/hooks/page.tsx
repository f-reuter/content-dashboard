"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { HOOK_TYPES } from "@/lib/brand-config";
import { Plus, Anchor, Trash2 } from "lucide-react";

interface Hook {
  id: string;
  text: string;
  type: string;
  postId: string | null;
  performanceScore: number | null;
  createdAt: string;
}

export default function HooksPage() {
  const [hooks, setHooks] = useState<Hook[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState("alle");

  const fetchHooks = useCallback(async () => {
    const res = await fetch("/api/hooks");
    if (res.ok) setHooks(await res.json());
  }, []);

  useEffect(() => { fetchHooks(); }, [fetchHooks]);

  async function saveHook(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await fetch("/api/hooks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: fd.get("text"), type: fd.get("type") }),
    });
    setDialogOpen(false);
    fetchHooks();
  }

  async function deleteHook(id: string) {
    await fetch(`/api/hooks?id=${id}`, { method: "DELETE" });
    fetchHooks();
  }

  const filtered = typeFilter === "alle" ? hooks : hooks.filter((h) => h.type === typeFilter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Hook-Bibliothek</h1>
          <p className="text-muted-foreground">{hooks.length} Hooks gespeichert</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger>
            <Button><Plus className="mr-2 h-4 w-4" />Neuer Hook</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Hook hinzufügen</DialogTitle></DialogHeader>
            <form onSubmit={saveHook} className="space-y-4">
              <div>
                <Label>Hook-Text</Label>
                <Input name="text" required placeholder="Die ersten 1-2 Sekunden..." />
              </div>
              <div>
                <Label>Typ</Label>
                <select name="type" className="flex h-9 w-full rounded-md border bg-background px-3 py-1 text-sm">
                  {Object.entries(HOOK_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <Button type="submit">Speichern</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-2">
        <Button variant={typeFilter === "alle" ? "default" : "outline"} size="sm" onClick={() => setTypeFilter("alle")}>Alle</Button>
        {Object.entries(HOOK_TYPES).map(([k, v]) => (
          <Button key={k} variant={typeFilter === k ? "default" : "outline"} size="sm" onClick={() => setTypeFilter(k)}>{v}</Button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.length === 0 && (
          <Card><CardContent className="pt-6 text-center text-muted-foreground">Noch keine Hooks. Füge welche hinzu!</CardContent></Card>
        )}
        {filtered.map((hook) => (
          <Card key={hook.id}>
            <CardContent className="pt-4 flex items-center justify-between">
              <div>
                <p className="font-medium">&ldquo;{hook.text}&rdquo;</p>
                <div className="flex gap-2 mt-1">
                  <Badge variant="outline">{HOOK_TYPES[hook.type as keyof typeof HOOK_TYPES] || hook.type}</Badge>
                  {hook.performanceScore != null && (
                    <Badge variant="secondary">{hook.performanceScore.toFixed(1)}% Engagement</Badge>
                  )}
                </div>
              </div>
              <Button size="sm" variant="ghost" onClick={() => deleteHook(hook.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
