"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Save, Check, Plus, Trash2, Key, Eye, EyeOff, Plug, Zap } from "lucide-react";

interface ApiKeyStatus {
  name: string;
  label: string;
  connected: boolean;
  masked: string | null;
}

interface Pillar {
  key: string;
  label: string;
  description: string;
  target: number;
}

interface PlatformStrategy {
  focus: string;
  frequency: string;
  tone: string;
}

export default function SettingsPage() {
  const [config, setConfig] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [apiKeys, setApiKeys] = useState<ApiKeyStatus[]>([]);
  const [apiKeyInputs, setApiKeyInputs] = useState<Record<string, string>>({});
  const [apiKeyVisible, setApiKeyVisible] = useState<Record<string, boolean>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const fetchConfig = useCallback(async () => {
    const res = await fetch("/api/brand-config");
    if (res.ok) {
      const data = await res.json();
      // Seed missing defaults
      const mod = await import("@/lib/brand-config");
      const defaults = mod.BRAND_DEFAULTS;
      const missingKeys = Object.keys(defaults).filter((k) => !(k in data));
      if (missingKeys.length > 0) {
        await fetch("/api/brand-config", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            missingKeys.map((key) => ({ key, value: defaults[key] }))
          ),
        });
        const seededRes = await fetch("/api/brand-config");
        if (seededRes.ok) {
          setConfig(await seededRes.json());
          return;
        }
      }
      setConfig(data);
    }
  }, []);

  const fetchApiKeys = useCallback(async () => {
    const res = await fetch("/api/api-keys");
    if (res.ok) setApiKeys(await res.json());
  }, []);

  useEffect(() => { fetchConfig(); fetchApiKeys(); }, [fetchConfig, fetchApiKeys]);

  async function saveApiKey(name: string) {
    const value = apiKeyInputs[name];
    if (!value) return;
    setSavingKey(name);
    await fetch("/api/api-keys", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, value }),
    });
    setApiKeyInputs((prev) => ({ ...prev, [name]: "" }));
    setSavingKey(null);
    fetchApiKeys();
  }

  async function saveSection(keys: string[]) {
    const sectionKey = keys[0];
    setSaving(sectionKey);
    await fetch("/api/brand-config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(keys.map((key) => ({ key, value: config[key] || "" }))),
    });
    setSaving(null);
    setSaved(sectionKey);
    setTimeout(() => setSaved(null), 2000);
  }

  function updateConfig(key: string, value: string) {
    setConfig((prev) => ({ ...prev, [key]: value }));
  }

  const pillars: Pillar[] = (() => {
    try { return JSON.parse(config.pillars || "[]"); } catch { return []; }
  })();

  const antiPatterns: string[] = (() => {
    try { return JSON.parse(config.antiPatterns || "[]"); } catch { return []; }
  })();

  const platformStrategy: Record<string, PlatformStrategy> = (() => {
    try { return JSON.parse(config.platformStrategy || "{}"); } catch { return {}; }
  })();

  function updatePillar(index: number, field: keyof Pillar, value: string | number) {
    const updated = [...pillars];
    (updated[index] as Record<string, unknown>)[field] = value;
    updateConfig("pillars", JSON.stringify(updated));
  }

  function updateAntiPattern(index: number, value: string) {
    const updated = [...antiPatterns];
    updated[index] = value;
    updateConfig("antiPatterns", JSON.stringify(updated));
  }

  function addAntiPattern() {
    updateConfig("antiPatterns", JSON.stringify([...antiPatterns, ""]));
  }

  function removeAntiPattern(index: number) {
    updateConfig("antiPatterns", JSON.stringify(antiPatterns.filter((_, i) => i !== index)));
  }

  function updatePlatformStrategy(platform: string, field: keyof PlatformStrategy, value: string) {
    const updated = { ...platformStrategy };
    if (!updated[platform]) updated[platform] = { focus: "", frequency: "", tone: "" };
    updated[platform][field] = value;
    updateConfig("platformStrategy", JSON.stringify(updated));
  }

  function SaveButton({ sectionKey, keys }: { sectionKey: string; keys: string[] }) {
    return (
      <Button size="sm" onClick={() => saveSection(keys)} disabled={saving === sectionKey}>
        {saved === sectionKey ? (
          <><Check className="mr-1 h-3 w-3" />Gespeichert</>
        ) : saving === sectionKey ? "Speichern..." : (
          <><Save className="mr-1 h-3 w-3" />Speichern</>
        )}
      </Button>
    );
  }

  const platforms = [
    { key: "INSTAGRAM", label: "Instagram" },
    { key: "TIKTOK", label: "TikTok" },
    { key: "YOUTUBE", label: "YouTube" },
    { key: "LINKEDIN", label: "LinkedIn" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Einstellungen</h1>
        <p className="text-muted-foreground">Dein Brand-Profil — wird von der KI für alle Inhalte genutzt.</p>
      </div>

      {/* Über mich */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Über mich</CardTitle>
          <SaveButton sectionKey="name" keys={["name", "handle", "positioning", "tone"]} />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Name</Label>
              <Input value={config.name || ""} onChange={(e) => updateConfig("name", e.target.value)} />
            </div>
            <div>
              <Label>Handle</Label>
              <Input value={config.handle || ""} onChange={(e) => updateConfig("handle", e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Positionierung</Label>
            <Textarea rows={3} value={config.positioning || ""} onChange={(e) => updateConfig("positioning", e.target.value)} placeholder="Deine Kernbotschaft..." />
          </div>
          <div>
            <Label>Tonalität</Label>
            <Textarea rows={3} value={config.tone || ""} onChange={(e) => updateConfig("tone", e.target.value)} placeholder="Wie sprichst du deine Audience an..." />
          </div>
        </CardContent>
      </Card>

      {/* Zielgruppe */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Zielgruppe</CardTitle>
          <SaveButton sectionKey="audience" keys={["audience"]} />
        </CardHeader>
        <CardContent>
          <Textarea rows={4} value={config.audience || ""} onChange={(e) => updateConfig("audience", e.target.value)} placeholder="Beschreibe deine Zielgruppe..." />
        </CardContent>
      </Card>

      {/* Content-Säulen */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Content-Säulen</CardTitle>
          <SaveButton sectionKey="pillars" keys={["pillars"]} />
        </CardHeader>
        <CardContent className="space-y-4">
          {pillars.map((pillar, i) => (
            <div key={pillar.key} className="grid gap-3 md:grid-cols-4 items-end rounded-lg border p-3">
              <div>
                <Label>Label</Label>
                <Input value={pillar.label} onChange={(e) => updatePillar(i, "label", e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <Label>Beschreibung</Label>
                <Input value={pillar.description} onChange={(e) => updatePillar(i, "description", e.target.value)} />
              </div>
              <div>
                <Label>Ziel %</Label>
                <Input type="number" min={0} max={100} value={pillar.target} onChange={(e) => updatePillar(i, "target", parseInt(e.target.value) || 0)} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Style Guide */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Style Guide</CardTitle>
          <SaveButton sectionKey="styleGuide" keys={["styleGuide"]} />
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">Dein ausführlicher Stil-Leitfaden — die KI nutzt ihn für jeden Content den sie erstellt.</p>
          <Textarea
            rows={20}
            value={config.styleGuide || ""}
            onChange={(e) => updateConfig("styleGuide", e.target.value)}
            className="font-mono text-sm"
            placeholder="Sprache, Ton, Hook-Patterns, CTA-Varianten, Plattform-Anpassungen..."
          />
        </CardContent>
      </Card>

      {/* Skill Prompts */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2"><Zap className="h-4 w-4" />Skill Prompts</CardTitle>
          <SaveButton sectionKey="skillPrompts" keys={["skillPrompts"]} />
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">Pro Format ein System-Prompt der definiert wie der Output aussehen soll. Die KI nutzt den passenden Prompt automatisch.</p>
          {(() => {
            const skills: Record<string, { name: string; prompt: string }> = (() => {
              try { return JSON.parse(config.skillPrompts || "{}"); } catch { return {}; }
            })();
            return Object.entries(skills).map(([key, skill]) => (
              <div key={key} className="rounded-lg border p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{key}</Badge>
                    <span className="text-sm font-medium">{skill.name}</span>
                  </div>
                </div>
                <Textarea
                  rows={6}
                  value={skill.prompt}
                  onChange={(e) => {
                    const updated = { ...skills, [key]: { ...skill, prompt: e.target.value } };
                    updateConfig("skillPrompts", JSON.stringify(updated));
                  }}
                  className="font-mono text-xs p-3"
                />
              </div>
            ));
          })()}
        </CardContent>
      </Card>

      {/* Anti-Patterns */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Anti-Patterns</CardTitle>
          <SaveButton sectionKey="antiPatterns" keys={["antiPatterns"]} />
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground mb-3">Was du NICHT machen willst — die KI berücksichtigt das.</p>
          {antiPatterns.map((pattern, i) => (
            <div key={i} className="flex gap-2">
              <Input value={pattern} onChange={(e) => updateAntiPattern(i, e.target.value)} />
              <Button variant="ghost" size="icon" onClick={() => removeAntiPattern(i)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addAntiPattern}><Plus className="mr-1 h-3 w-3" />Hinzufügen</Button>
        </CardContent>
      </Card>

      {/* Plattform-Strategie */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Plattform-Strategie</CardTitle>
          <SaveButton sectionKey="platformStrategy" keys={["platformStrategy"]} />
        </CardHeader>
        <CardContent className="space-y-4">
          {platforms.map(({ key, label }) => {
            const strategy = platformStrategy[key] || { focus: "", frequency: "", tone: "" };
            return (
              <div key={key} className="rounded-lg border p-3 space-y-3">
                <p className="font-medium text-sm">{label}</p>
                <div className="grid gap-3 md:grid-cols-3">
                  <div><Label className="text-xs">Fokus</Label><Input value={strategy.focus} onChange={(e) => updatePlatformStrategy(key, "focus", e.target.value)} /></div>
                  <div><Label className="text-xs">Frequenz</Label><Input value={strategy.frequency} onChange={(e) => updatePlatformStrategy(key, "frequency", e.target.value)} /></div>
                  <div><Label className="text-xs">Ton</Label><Input value={strategy.tone} onChange={(e) => updatePlatformStrategy(key, "tone", e.target.value)} /></div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Meine Accounts */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2"><Plug className="h-4 w-4" />Meine Accounts</CardTitle>
          <SaveButton sectionKey="accountUrls" keys={["accountUrls"]} />
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">Deine Profil-URLs — die KI nutzt diese für Kontext und Verlinkungen.</p>
          {platforms.map(({ key, label }) => {
            const urls = (() => { try { return JSON.parse(config.accountUrls || "{}"); } catch { return {}; } })();
            return (
              <div key={key} className="flex items-center gap-3">
                <Label className="w-24 text-sm flex-shrink-0">{label}</Label>
                <Input
                  value={urls[key] || ""}
                  onChange={(e) => {
                    const updated = { ...urls, [key]: e.target.value };
                    updateConfig("accountUrls", JSON.stringify(updated));
                  }}
                  placeholder={`https://${key === "INSTAGRAM" ? "instagram.com/felix_reuter" : key === "TIKTOK" ? "tiktok.com/@felix_reuter" : key === "YOUTUBE" ? "youtube.com/@felix_reuter" : "linkedin.com/in/felix-reuter"}`}
                />
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* API Keys */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Key className="h-4 w-4" />API-Verbindungen</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">API-Keys werden sicher gespeichert und nach dem Speichern nur maskiert angezeigt.</p>
          {apiKeys.map((api) => (
            <div key={api.name} className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{api.label}</p>
                  <p className="text-xs text-muted-foreground font-mono">{api.name}</p>
                </div>
                <Badge variant={api.connected ? "default" : "outline"}>
                  {api.connected ? "Verbunden" : "Nicht verbunden"}
                </Badge>
              </div>
              {api.connected && api.masked && (
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-muted px-2 py-1 rounded flex-1 font-mono">
                    {apiKeyVisible[api.name] ? api.masked : "••••••••••••••••"}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setApiKeyVisible((prev) => ({ ...prev, [api.name]: !prev[api.name] }))}
                  >
                    {apiKeyVisible[api.name] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </Button>
                </div>
              )}
              <div className="flex gap-2">
                <Input
                  type="password"
                  value={apiKeyInputs[api.name] || ""}
                  onChange={(e) => setApiKeyInputs((prev) => ({ ...prev, [api.name]: e.target.value }))}
                  placeholder={api.connected ? "Neuen Key eingeben zum Überschreiben..." : "API-Key eingeben..."}
                  className="font-mono text-sm"
                />
                <Button
                  size="sm"
                  onClick={() => saveApiKey(api.name)}
                  disabled={!apiKeyInputs[api.name] || savingKey === api.name}
                >
                  {savingKey === api.name ? "..." : <><Save className="mr-1 h-3 w-3" />Speichern</>}
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
