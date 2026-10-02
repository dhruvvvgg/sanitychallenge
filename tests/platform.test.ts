import {describe,it,expect,vi,afterEach} from 'vitest';
import {getCapabilities} from '../src/lib/capabilities';
import {initialContextUrl,SanityContextAdapter} from '../src/lib/context';
import {readJson,rateLimit} from '../src/lib/guards';
import {scenarioSchema} from '../src/lib/types';
import examples from '../data/examples/questions.json';
import {validateAgentObservation} from '../src/lib/agent';
afterEach(()=>vi.unstubAllEnvs());
describe('Capabilities and explicit transport errors',()=>{
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
