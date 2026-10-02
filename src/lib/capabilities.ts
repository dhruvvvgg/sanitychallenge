export type Mode = 'FULL' | 'STRUCTURED_AGENT' | 'DETERMINISTIC';
export function getCapabilities(env: Record<string, string | undefined> = process.env) {
  const provider = env.GOOGLE_GENERATIVE_AI_API_KEY ? 'google' : env.ANTHROPIC_API_KEY ? 'anthropic' : env.OPENAI_API_KEY ? 'openai' : null;
  const full = !!(provider && env.SANITY_KB_MCP_URL && env.SANITY_DATA_MCP_URL && env.SANITY_ORGANIZATION_TOKEN);
  const mode: Mode = full ? 'FULL' : provider ? 'STRUCTURED_AGENT' : 'DETERMINISTIC';
  return { mode, provider, backend: env.SANITY_PROJECT_ID ? 'SANITY_LIVE' as const : 'LOCAL_SNAPSHOT' as const, insights: full && !!env.SANITY_ORGANIZATION_ID, gapWrites: !!(env.SANITY_PROJECT_ID && env.SANITY_WRITE_TOKEN) };
}
