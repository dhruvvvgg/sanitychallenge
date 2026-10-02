/** Evaluation-only no-retrieval LLM. It chooses symbolic bands; code supplies every number. */
import {generateText,Output} from 'ai';
import {z} from 'zod';
import {selectModel} from './agent';
import type {Dataset,Scenario,Ruling,Finding} from './types';
const bands=['none','undetermined','band-eu-0','band-eu-1','band-eu-2','band-eu-intra','band-uk-0','band-uk-1','band-uk-2','band-us-0','band-us-1'] as const;
const entitlements=['compensation','meals_and_refreshments','communications','hotel_and_transport','refund_or_rerouting_choice','unused_ticket_refund'] as const;
const sources=['source-eu261-original','source-uk261-xml','source-us250','source-us-refund-reg','source-dot-denied','source-dot-refund','source-dot-delay-alt','source-sturgeon-press','source-nelson-press'] as const;
export async function noRetrievalBaseline(s:Scenario,data:Dataset):Promise<Ruling> {
 const schema=z.object({findings:z.array(z.object({regime:z.enum(['eu','uk','us','in','uncovered']),band:z.enum(bands),reduction:z.enum(['full','half']),entitlements:z.array(z.enum(entitlements)),citations:z.array(z.enum(sources))})).min(1).max(4)});
 const {airline:unused,...facts}=s;void unused;
 const result=await generateText({model:selectModel(),system:'Evaluation baseline, no retrieval. Using only prior knowledge, classify flight rights and select symbolic bands: eu/uk 0=short, 1=medium, 2=long; eu-intra=intra-EU middle; us 0=lower multiplier, 1=higher multiplier. No documents, legal thresholds, currency amounts, compute tools or retrieval results are supplied to you. A separate code calculator supplies amounts after your selections. Choose undetermined when unsupported. Do not invent citations beyond the allowed IDs.',prompt:JSON.stringify(facts),output:Output.object({schema}),maxOutputTokens:1000,maxRetries:0,abortSignal:AbortSignal.timeout(45000)});
 const findings:Finding[]=result.output.findings.map(prediction=>{
  const band=data.bands.find(b=>b._id===prediction.band);let amount:number|null=prediction.band==='none'?0:null;let currency:string|null=null;
  if(band){amount=band.dimension==='fare_percentage'?Math.min(s.fare*(band.multiplier||0),band.cap??Infinity):band.value;if(prediction.reduction==='half')amount/=2;amount=Math.round(amount*100)/100;currency=band.currency;}
  return {regime:prediction.regime,status:prediction.band==='undetermined'?'abstain':'assessed',eligible:amount===null?null:amount>0,amount,currency,amountLabel:'Evaluation-only symbolic LLM decision; arithmetic from the shared calculator',entitlements:prediction.entitlements,met:[],unmet:[],uncertainties:['No retrieval baseline; not an application ruling.'],ruleIds:[],sourceIds:prediction.citations};
 });
 return {status:findings.every(f=>f.status==='abstain')?'abstain':findings.some(f=>f.status==='abstain')?'partial':'assessed',findings,sources:data.sources.filter(source=>findings.some(f=>f.sourceIds.includes(source._id))),conflicts:[],computedBy:'baseline_calculator',notice:'Evaluation-only no-retrieval LLM with symbolic award selection and separate code arithmetic. Not legal advice.'};
}
