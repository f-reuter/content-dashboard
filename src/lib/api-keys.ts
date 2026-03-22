import { prisma } from "@/lib/prisma";

const KEY_PREFIX = "apikey_";

// Strip non-ASCII chars and whitespace from API keys
function sanitizeKey(key: string): string {
  return key.trim().replace(/[^\x20-\x7E]/g, "");
}

export async function getApiKey(name: string): Promise<string | null> {
  // Check env first, then DB
  const envValue = process.env[name];
  if (envValue) return sanitizeKey(envValue);

  const dbEntry = await prisma.brandConfig.findUnique({
    where: { key: `${KEY_PREFIX}${name}` },
  });
  return dbEntry?.value ? sanitizeKey(dbEntry.value) : null;
}

export async function setApiKey(name: string, value: string): Promise<void> {
  const sanitized = sanitizeKey(value);
  await prisma.brandConfig.upsert({
    where: { key: `${KEY_PREFIX}${name}` },
    update: { value: sanitized },
    create: { key: `${KEY_PREFIX}${name}`, value: sanitized },
  });
}

export async function getApiKeyStatus(): Promise<
  Array<{ name: string; label: string; connected: boolean; masked: string | null }>
> {
  const keys = [
    { name: "ANTHROPIC_API_KEY", label: "Claude AI" },
    { name: "YOUTUBE_API_KEY", label: "YouTube Data API" },
    { name: "APIFY_TOKEN", label: "Apify (Instagram/TikTok)" },
  ];

  const results = [];
  for (const key of keys) {
    const value = await getApiKey(key.name);
    results.push({
      name: key.name,
      label: key.label,
      connected: !!value,
      masked: value ? maskKey(value) : null,
    });
  }
  return results;
}

function maskKey(key: string): string {
  if (key.length <= 8) return "••••••••";
  return key.slice(0, 4) + "••••••••" + key.slice(-4);
}
