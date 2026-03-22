"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PILLARS, type PillarKey } from "@/lib/brand-config";
import { Star, Trash2, ArrowRight } from "lucide-react";

interface Idea {
  id: string;
  hook: string;
  description: string | null;
  pillar: string;
  format: string | null;
  rating: number;
  sourceVideoUrls: string | null;
  convertedToPostId: string | null;
  createdAt: string;
}

export default function IdeasPage() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [filter, setFilter] = useState("alle");

  const fetchIdeas = useCallback(async () => {
    const res = await fetch("/api/ideas");
    setIdeas(await res.json());
  }, []);

  useEffect(() => { fetchIdeas(); }, [fetchIdeas]);

  async function updateRating(id: string, rating: number) {
    await fetch("/api/ideas", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, rating }),
    });
    fetchIdeas();
  }

  async function deleteIdea(id: string) {
    await fetch(`/api/ideas?id=${id}`, { method: "DELETE" });
    fetchIdeas();
  }

  async function convertToPost(idea: Idea) {
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: idea.hook,
        hook: idea.hook,
        pillar: idea.pillar,
        format: idea.format || "REEL",
        platforms: ["INSTAGRAM"],
        status: "IDEA",
      }),
    });
    const post = await res.json();
    await fetch("/api/ideas", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: idea.id, convertedToPostId: post.id }),
    });
    fetchIdeas();
  }

  const filtered = filter === "alle" ? ideas : ideas.filter((i) => i.pillar === filter);
  const unconverted = filtered.filter((i) => !i.convertedToPostId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Ideen-Pool</h1>
          <p className="text-muted-foreground">{unconverted.length} offene Ideen</p>
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant={filter === "alle" ? "default" : "outline"} size="sm" onClick={() => setFilter("alle")}>Alle</Button>
        {(Object.entries(PILLARS) as [PillarKey, (typeof PILLARS)[PillarKey]][]).map(([k, v]) => (
          <Button key={k} variant={filter === k ? "default" : "outline"} size="sm" onClick={() => setFilter(k)}>{v.label}</Button>
        ))}
      </div>

      <div className="space-y-3">
        {unconverted.length === 0 && (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              Keine Ideen vorhanden. Generiere welche im AI Studio!
            </CardContent>
          </Card>
        )}
        {unconverted.sort((a, b) => b.rating - a.rating).map((idea) => (
          <Card key={idea.id}>
            <CardContent className="pt-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="font-semibold">&ldquo;{idea.hook}&rdquo;</p>
                  {idea.description && <p className="text-sm text-muted-foreground mt-1">{idea.description}</p>}
                  <div className="flex gap-2 mt-2">
                    <Badge className={PILLARS[idea.pillar as PillarKey]?.color + " text-white"}>
                      {PILLARS[idea.pillar as PillarKey]?.label || idea.pillar}
                    </Badge>
                    {idea.format && <Badge variant="outline">{idea.format}</Badge>}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button key={s} onClick={() => updateRating(idea.id, s)} className="p-0.5">
                        <Star className={`h-4 w-4 ${s <= idea.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={() => convertToPost(idea)}>
                      <ArrowRight className="mr-1 h-3 w-3" />Post
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => deleteIdea(idea.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
