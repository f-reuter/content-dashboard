"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PILLARS, FORMATS, type PillarKey } from "@/lib/brand-config";
import { Plus, Repeat, Trash2 } from "lucide-react";

interface Series {
  id: string;
  name: string;
  description: string | null;
  pillar: string;
  frequency: string | null;
  templateHook: string | null;
  templateFormat: string | null;
  isActive: boolean;
  posts?: { id: string }[];
}

export default function SeriesPage() {
  const [series, setSeries] = useState<Series[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchSeries = useCallback(async () => {
    const res = await fetch("/api/series");
    if (res.ok) setSeries(await res.json());
  }, []);

  useEffect(() => { fetchSeries(); }, [fetchSeries]);

  async function saveSeries(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await fetch("/api/series", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: fd.get("name"),
        description: fd.get("description"),
        pillar: fd.get("pillar"),
        frequency: fd.get("frequency"),
        templateHook: fd.get("templateHook"),
        templateFormat: fd.get("templateFormat"),
      }),
    });
    setDialogOpen(false);
    fetchSeries();
  }

  async function deleteSeries(id: string) {
    await fetch(`/api/series?id=${id}`, { method: "DELETE" });
    fetchSeries();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Content-Serien</h1>
          <p className="text-muted-foreground">Wiederkehrende Formate verwalten</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger>
            <Button><Plus className="mr-2 h-4 w-4" />Neue Serie</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Neue Serie</DialogTitle></DialogHeader>
            <form onSubmit={saveSeries} className="space-y-4">
              <div><Label>Name</Label><Input name="name" required placeholder="z.B. AI Tool der Woche" /></div>
              <div><Label>Beschreibung</Label><Textarea name="description" rows={2} /></div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Säule</Label>
                  <select name="pillar" className="flex h-9 w-full rounded-md border bg-background px-3 py-1 text-sm">
                    {Object.entries(PILLARS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div><Label>Frequenz</Label><Input name="frequency" placeholder="z.B. Wöchentlich, Montags" /></div>
              </div>
              <div><Label>Template-Hook</Label><Input name="templateHook" placeholder="Optionaler Hook-Template..." /></div>
              <div>
                <Label>Format</Label>
                <select name="templateFormat" className="flex h-9 w-full rounded-md border bg-background px-3 py-1 text-sm">
                  {Object.entries(FORMATS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <Button type="submit">Erstellen</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {series.length === 0 && (
          <Card className="md:col-span-2">
            <CardContent className="pt-6 text-center text-muted-foreground">
              Noch keine Serien. Erstelle z.B. &ldquo;AI Tool der Woche&rdquo; oder &ldquo;60s Effizienz-Hack&rdquo;!
            </CardContent>
          </Card>
        )}
        {series.map((s) => (
          <Card key={s.id}>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Repeat className="h-4 w-4" />{s.name}
                </CardTitle>
              </div>
              <Button size="sm" variant="ghost" onClick={() => deleteSeries(s.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              {s.description && <p className="text-sm text-muted-foreground mb-2">{s.description}</p>}
              <div className="flex flex-wrap gap-2">
                <Badge className={PILLARS[s.pillar as PillarKey]?.color + " text-white"}>
                  {PILLARS[s.pillar as PillarKey]?.label || s.pillar}
                </Badge>
                {s.frequency && <Badge variant="outline">{s.frequency}</Badge>}
                {s.templateFormat && <Badge variant="secondary">{s.templateFormat}</Badge>}
                <Badge variant={s.isActive ? "default" : "secondary"}>{s.isActive ? "Aktiv" : "Pausiert"}</Badge>
              </div>
              {s.templateHook && <p className="text-xs text-muted-foreground mt-2">Hook: &ldquo;{s.templateHook}&rdquo;</p>}
              <p className="text-xs text-muted-foreground mt-1">{s.posts?.length || 0} Episoden</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
