import {describe,it,expect} from 'vitest';
import golden from '../eval/scenarios.json';
import docs from '../data/production.json';
import {compute_entitlement} from '../src/lib/compute';
import {getDossier,dossierQuery,queryContent} from '../src/lib/content';
import {scenarioSchema,type Scenario,type Document,type Dataset} from '../src/lib/types';
const scenario=(patch:Partial<Scenario>={})=>scenarioSchema.parse({...golden[0].input,...patch});
async function run(patch:Partial<Scenario>={}) {const s=scenario(patch);return compute_entitlement(s,await getDossier(s,docs as Document[]));}
describe('Reviewed development cases (held-out cases are only used by eval)',()=>{
 for(const c of golden.filter(c=>c.split==='dev'))it(c.title,async()=>{
  const s=scenarioSchema.parse(c.input);const ruling=compute_entitlement(s,await getDossier(s,docs as Document[]));
  const finding=ruling.findings.find(f=>f.regime===c.expected.regime);
  expect(ruling.status).toBe(c.expected.status);expect(finding?.amount).toBe(c.expected.amount);expect(finding?.currency).toBe(c.expected.currency);expect([...(finding?.entitlements||[])].sort()).toEqual([...c.expected.entitlements].sort());
 });
});
describe('Structural and boundary invariants',()=>{
 it('does not infer departure care from arrival delay',async()=>{
  expect((await run({arrivalDelayMinutes:900,departureDelayMinutes:0})).findings[0].entitlements).toEqual(['compensation']);
 });
 it('care survives a proven extraordinary defense',async()=>{
  const r=await run({departureDelayMinutes:120,cause:'weather',extraordinaryEvidence:'proven'});
  expect(r.findings[0].amount).toBe(0);expect(r.findings[0].entitlements).toContain('meals_and_refreshments');
 });
 it('does not fabricate fixed compensation under uncertainty',async()=>{
  const r=await run({extraordinaryEvidence:'unknown',departureDelayMinutes:120});
  expect(r.status).toBe('abstain');expect(r.findings[0].amount).toBeNull();expect(r.findings[0].entitlements).toContain('meals_and_refreshments');
 });
 it('structured reference and band changes control the award',async()=>{
  const s=scenario();const d=await getDossier(s,docs as Document[]);const changed=structuredClone(d);
  changed.bands.find(b=>b._id==='band-eu-0')!.value=271;
  expect(compute_entitlement(s,changed).findings[0].amount).toBe(271);
 });
 it('US exactly two hours follows regulation and surfaces source tension',async()=>{
  const r=await run({departure:'us',arrival:'us',carrier:'us',trigger:'denied_boarding',fare:200,reroutingOffered:true,reroutedArrivalDelayMinutes:120});
  expect(r.findings[0].amount).toBe(800);expect(r.conflicts).toHaveLength(1);expect(r.conflicts[0].left.source.authorityTier).toBe(1);
 });
 it('US just under two hours uses the lower multiplier',async()=>{
  expect((await run({departure:'us',arrival:'us',carrier:'us',trigger:'denied_boarding',reroutingOffered:true,reroutedArrivalDelayMinutes:119})).findings[0].amount).toBe(400);
 });
 it('UK medium and long bands do not use EU intra-regime exception',async()=>{
  const r=await run({departure:'eu',arrival:'eu',carrier:'uk',distanceKm:4000,arrivalDelayMinutes:240});
  expect(r.findings.find(f=>f.regime==='eu')?.amount).toBe(400);expect(r.findings.find(f=>f.regime==='uk')?.amount).toBe(520);
 });
 it('rejects missing provenance instead of showing an unsupported award',async()=>{
  const s=scenario();const d=await getDossier(s,docs as Document[]);d.sources=d.sources.filter(x=>x._id!=='source-eu261-original');
  expect(compute_entitlement(s,d).status).toBe('abstain');expect(compute_entitlement(s,d).findings[0].amount).toBeNull();
 });
 it('unverified rules are not applied',async()=>{
  const s=scenario();const d=await getDossier(s,docs as Document[]);d.rules.find(r=>r._id==='rule-eu-arrival_delay')!.verified=false;
  expect(compute_entitlement(s,d).status).toBe('abstain');
 });
 it('does not assess excluded fares or aircraft',async()=>{expect((await run({eligibleTicketAndAircraft:false})).status).toBe('abstain');});
 it('never modifies rules or scenario inputs',async()=>{
  const s=scenario();const d=await getDossier(s,docs as Document[]);const before=JSON.stringify({s,d});compute_entitlement(s,d);expect(JSON.stringify({s,d})).toBe(before);
 });
 it('limits cancellation rerouting exceptions at the exact arrival threshold',async()=>{
  const r=await run({trigger:'cancellation',noticeHours:48,reroutingOffered:true,reroutedArrivalDelayMinutes:120});
  expect(r.findings[0].amount).toBe(125);
 });
 it('checks band/source references resolve and public text quotes stay within the limit',()=>{
  const ids=new Set(docs.map(d=>d._id));
  function refs(value:unknown):void {if(!value||typeof value!=='object')return;if('_ref' in value)expect(ids.has(String(value._ref))).toBe(true);else for(const v of Object.values(value))refs(v);}
  for(const d of docs){refs(d);if('quote' in d&&d.quote)expect(String(d.quote).split(/\s+/).length).toBeLessThanOrEqual(25);}
 });
 it('GROQ filters trigger and cause by structured fields',async()=>{
  const d=await queryContent<Dataset>(dossierQuery,{triggers:['arrival_delay','care','refund'],cause:'cause-weather',airline:'Delta'},docs as Document[]);
  expect(d.rules.every(r=>['arrival_delay','care','refund'].includes(r.trigger))).toBe(true);expect(d.stances.every(s=>s.cause._ref==='cause-weather')).toBe(true);
 });
});
