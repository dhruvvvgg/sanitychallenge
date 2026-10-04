import {describe,it,expect,vi,afterEach} from 'vitest';
import {getCapabilities} from '../src/lib/capabilities';
import {initialContextUrl,SanityContextAdapter} from '../src/lib/context';
import {readJson,rateLimit} from '../src/lib/guards';
import {scenarioSchema} from '../src/lib/types';
import examples from '../data/examples/questions.json';
import {selectModel,validateAgentObservation} from '../src/lib/agent';
afterEach(()=>{vi.unstubAllEnvs();vi.unstubAllGlobals();vi.restoreAllMocks();});
describe('Capabilities and explicit transport errors',()=>{
 it('reads Gemini and FULL bindings from the deployment environment at request time',()=>{
  vi.stubEnv('GOOGLE_GENERATIVE_AI_API_KEY','');
  vi.stubEnv('ANTHROPIC_API_KEY','');
  vi.stubEnv('OPENAI_API_KEY','');
  expect(getCapabilities().mode).toBe('DETERMINISTIC');
  vi.stubEnv('GOOGLE_GENERATIVE_AI_API_KEY','test-presence-only');
  vi.stubEnv('ANTHROPIC_API_KEY','test-other-provider');
  vi.stubEnv('SANITY_PROJECT_ID','ro8wcpqg');
  vi.stubEnv('SANITY_KB_MCP_URL','https://api.sanity.io/v1/context/organizations/o7zotfmdd/mcp/disruption-kb');
  vi.stubEnv('SANITY_DATA_MCP_URL','https://api.sanity.io/v1/context/organizations/o7zotfmdd/mcp/disruption-data');
  vi.stubEnv('SANITY_ORGANIZATION_TOKEN','test-presence-only');
  vi.stubEnv('LLM_MODEL','');
  expect(getCapabilities()).toMatchObject({mode:'FULL',provider:'google',backend:'SANITY_LIVE'});
  expect(selectModel()).toMatchObject({modelId:'gemini-3.8-flash'});
  vi.stubEnv('LLM_MODEL','gemini-test-override');
  expect(selectModel()).toMatchObject({modelId:'gemini-test-override'});
  vi.stubEnv('SANITY_ORGANIZATION_TOKEN','');
  expect(getCapabilities().mode).toBe('STRUCTURED_AGENT');
 });
 it('selects all three modes with one capability function',()=>{
  expect(getCapabilities({}).mode).toBe('DETERMINISTIC');
  expect(getCapabilities({ANTHROPIC_API_KEY:'test-presence-only'}).mode).toBe('STRUCTURED_AGENT');
  expect(getCapabilities({OPENAI_API_KEY:'test-presence-only',SANITY_KB_MCP_URL:'https://a.example/kb',SANITY_DATA_MCP_URL:'https://a.example/data',SANITY_ORGANIZATION_TOKEN:'test-presence-only'}).mode).toBe('FULL');
 });
 it('does not declare FULL with only one endpoint',()=>expect(getCapabilities({OPENAI_API_KEY:'presence',SANITY_KB_MCP_URL:'https://a.example/kb',SANITY_ORGANIZATION_TOKEN:'presence'}).mode).toBe('STRUCTURED_AGENT'));
 it('keeps endpoint query parameters when appending initial context',()=>expect(initialContextUrl('https://example.org/mcp/?tools=groq_query')).toBe('https://example.org/mcp/initial-context?tools=groq_query'));
 it('rejects insecure or embedded-credential URLs before network access',()=>{
  expect(()=>initialContextUrl('http://example.org/mcp')).toThrow('HTTPS');
  expect(()=>initialContextUrl('https://user:secret@example.org/mcp')).toThrow('credentials');
 });
 it('an aborted connection produces a real error and no mocked Context results',async()=>{
  const controller=new AbortController();controller.abort();
  const adapter=new SanityContextAdapter({kb:'https://example.invalid/mcp',data:'https://example.invalid/data'},'non-secret-test-placeholder');
  await expect(adapter.connect(controller.signal)).rejects.toThrow();
 });
 it('reports the failing MCP stage without logging credentials or response content',async()=>{
  const log=vi.spyOn(console,'error').mockImplementation(()=>{});
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response('private server detail',{status:403})));
  const adapter=new SanityContextAdapter({kb:'https://example.org/kb?private=value',data:'https://example.org/data'},'test-secret-must-not-be-logged');
  await expect(adapter.connect()).rejects.toThrow('Context kb initial context failed (403)');
  expect(log.mock.calls).toEqual([['Sanity Context connection failed',{endpoint:'kb',stage:'initial-context',httpStatus:403}]]);
 });
 it('AI prose is limited to validated, number-free observations',()=>{
  expect(()=>validateAgentObservation('You receive 999 EUR')).toThrow();
  expect(()=>validateAgentObservation('You receive nine hundred euros')).toThrow();
  expect(validateAgentObservation('The available evidence leaves a coverage gap.')).toContain('coverage gap');
 });
});
describe('Request guards',()=>{
 it('rate limits the sixteenth request in a window',()=>{
  const id=crypto.randomUUID();for(let i=0;i<15;i++)rateLimit(id,1000);expect(()=>rateLimit(id,1000)).toThrow('Too many');expect(()=>rateLimit(id,61001)).not.toThrow();
 });
 it('enforces streamed body size even without content-length',async()=>{
  const req=new Request('https://example.org',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({q:'x'.repeat(12500)})});
  await expect(readJson(req)).rejects.toMatchObject({status:413});
 });
 it('rejects invalid JSON and invalid flight dates',async()=>{
  await expect(readJson(new Request('https://example.org',{method:'POST',headers:{'Content-Type':'application/json'},body:'{bad'}))).rejects.toMatchObject({status:400});
  expect(scenarioSchema.safeParse({...examples[0].input,flightDate:'2026-02-31'}).success).toBe(false);
 });
 it('rejects negative fares and distances',()=>{
  expect(scenarioSchema.safeParse({...examples[0].input,fare:-1}).success).toBe(false);
  expect(scenarioSchema.safeParse({...examples[0].input,distanceKm:Infinity}).success).toBe(false);
 });
});
