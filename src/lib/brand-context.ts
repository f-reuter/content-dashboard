import { prisma } from "@/lib/prisma";
import { BRAND_DEFAULTS, buildSystemPromptFromContext } from "@/lib/brand-config";

export async function loadBrandContext(): Promise<Record<string, string>> {
  const configs = await prisma.brandConfig.findMany();
  const result: Record<string, string> = { ...BRAND_DEFAULTS };
  for (const c of configs) {
    result[c.key] = c.value;
  }
  return result;
}

export { buildSystemPromptFromContext };
