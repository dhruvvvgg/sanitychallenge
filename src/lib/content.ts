import {createClient} from '@sanity/client';
import {parse,evaluate} from 'groq-js';
import documents from '../../data/production.json';
import type {Dataset, Document,Scenario} from './types';
import {getCapabilities} from './capabilities';
export const dossierQuery = `{
 "sources": *[_type == "source"],
 "regimes": *[_type == "regime"],
 "bands": *[_type == "entitlementBand"],
 "rules": *[_type == "rule" && trigger in $triggers],
 "stances": *[_type == "causeStance" && cause._ref == $cause],
 "cases": *[_type == "caseLaw"],
 "policies": *[_type == "airlinePolicy" && airline == $airline]
}`;
export const searchQuery = `*[_type in ["rule","causeStance","caseLaw","airlinePolicy"] && (title match $terms || paraphrase match $terms || holding match $terms || summary match $terms)][0...12]`;
export function publicClient() {
  if (!process.env.SANITY_PROJECT_ID) throw new Error('SANITY_PROJECT_ID is required for live Sanity');
  return createClient({projectId:process.env.SANITY_PROJECT_ID,dataset:process.env.SANITY_DATASET || 'production',apiVersion:'2026-01-01',useCdn:false});
}
export async function queryContent<T>(query:string,params:Record<string,unknown>={},local?:Document[]):Promise<T> {
  if (!local && getCapabilities().backend === 'SANITY_LIVE') return publicClient().fetch<T>(query,params,{timeout:15000});
  const result = await evaluate(parse(query),{dataset: local || documents as Document[],params});
  return await result.get() as T;
}
export async function getDossier(s:Scenario,local?:Document[]):Promise<Dataset> {
  return queryContent<Dataset>(dossierQuery,{triggers:[s.trigger,'care','refund'],cause:`cause-${s.cause}`,airline:s.airline},local);
}
export async function searchContent(text:string) {
  const terms=text.toLowerCase().split(/\W+/).filter(w=>w.length>2).slice(0,12).map(w=>`${w}*`);
  return terms.length ? queryContent<Document[]>(searchQuery,{terms}) : [];
}
