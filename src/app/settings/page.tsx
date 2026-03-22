"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, Key, CheckCircle2 } from "lucide-react";

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);

  function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Einstellungen</h1>
        <p className="text-muted-foreground">API-Keys und Konfiguration</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />API-Keys
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            API-Keys werden in der <code className="bg-muted px-1 py-0.5 rounded">.env</code> Datei im Projektordner gespeichert.
            Ändere sie dort direkt und starte den Server neu.
          </p>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">ANTHROPIC_API_KEY</p>
                <p className="text-xs text-muted-foreground">Für AI-Ideengenerierung & Script-Writing</p>
              </div>
              <Badge variant={process.env.NEXT_PUBLIC_HAS_ANTHROPIC_KEY ? "default" : "secondary"}>
                In .env konfigurieren
              </Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">YOUTUBE_API_KEY</p>
                <p className="text-xs text-muted-foreground">Für Video-Recherche (kostenlos, 10.000 Requests/Tag)</p>
              </div>
              <Badge variant="secondary">In .env konfigurieren</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />Über das Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p><strong>Felix Reuter Content Dashboard</strong></p>
          <p>Positionierung: KI-Unternehmer × Effizienz × High Performance</p>
          <p>Plattformen: Instagram, TikTok, YouTube, LinkedIn</p>
          <p>Säulen: AI im Alltag (40%), Effizienz-Systeme (25%), Fitness & Energie (20%), Real Talk (15%)</p>
        </CardContent>
      </Card>
    </div>
  );
}
