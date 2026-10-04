import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import cases from '../eval/scenarios.json';
import documents from '../data/production.json';
import corpus from '../data/corpus.json';
import retrieval from '../data/retrieval.json';
import {getCapabilities} from '../src/lib/capabilities';
import {getDossier} from '../src/lib/content';
import {compute_entitlement} from '../src/lib/compute';
import {agentRuling} from '../src/lib/agent';
import {noRetrievalBaseline} from '../src/lib/baseline';
import {scenarioSchema,type Dataset,type Document,type Ruling,type Scenario} from '../src/lib/types';
if(existsSync('.env.local'))process.loadEnvFile('.env.local');
type Expected={status:string;regime:string;amount:number|null;currency:string|null;entitlements:string[];additional?:Expected[]};
type Scores={eligibility:boolean;amount:boolean;entitlementF1:number;citationValidity:number|null;abstention:boolean;status:boolean};
const sha=(text:string)=>createHash('sha256').update(text).digest('hex');
function measure(r:Ruling,e:Expected):Scores {
 const expected=[e,...e.additional||[]];
 let eligible=true,amount=true,f1=0;
 for(const x of expected) {
  const f=r.findings.find(f=>f.regime===x.regime);
  eligible&&=!!f&&f.eligible===(x.amount===null?null:x.amount>0);
  amount&&=!!f&&f.amount===x.amount&&f.currency===x.currency;
  const predicted=new Set(f?.entitlements||[]),gold=new Set(x.entitlements),intersection=[...predicted].filter(y=>gold.has(y)).length;
  f1+=(predicted.size+gold.size===0?1:2*intersection/(predicted.size+gold.size));
 }
 const citations=r.sources;const valid=citations.filter(s=>retrieval.some(v=>v.url===s.url&&v.status==='fetched'&&v.sha256===s.sha256)).length;
 return {eligibility:eligible,amount,entitlementF1:f1/expected.length,citationValidity:citations.length?valid/citations.length:null,abstention:(r.status!=='assessed')===(e.status!=='assessed'),status:r.status===e.status};
}
async function keywordDossier(s:Scenario,title:string,all:Dataset) {
 // Baseline ranks the same source pages, then passes only rules backed by its best page to the same arithmetic function.
 // It has no jurisdiction × trigger × cause join. Raw downloads are ignored in Git; statutory copies are retained.
 const terms=(title+' '+s.trigger.replaceAll('_',' ')+' '+s.cause).toLowerCase().match(/[a-z]{3,}/g)||[];
 const stop=new Set(['the','and','with','flight','route','current','exactly']);const words=[...new Set(terms.filter(x=>!stop.has(x)))];
 const ranked=await Promise.all(all.sources.map(async source=>{
  const key=source._id.replace('source-','');let text='';
  const legal=key==='eu261-original'||key==='uk261-xml'?`data/sources/${key}-legal.txt`:key==='us250'||key==='us-refund-reg'?`data/sources/${key}.txt`:source.evidencePath;
  try{if(legal)text=await readFile(legal,'utf8');}catch{text=corpus.filter(c=>c.url===source.url).map(c=>c.markdown).join('\n');}
  text=text.replace(/<script[\s\S]*?<\/script>/gi,'').replace(/<style[\s\S]*?<\/style>/gi,'').replace(/<[^>]*>/g,' ').toLowerCase();
  const tokens=text.match(/[a-z]{3,}/g)||[];const frequency=new Map<string,number>();for(const t of tokens)frequency.set(t,(frequency.get(t)||0)+1);
  const score=words.reduce((a,w)=>a+Math.log(1+(frequency.get(w)||0)),0)/Math.sqrt(Math.max(1,tokens.length));return {id:source._id,score};
 }));
 ranked.sort((a,b)=>b.score-a.score);const selected=ranked[0]?.id;
 return {...all,rules:all.rules.filter(rule=>rule.sources.some(ref=>ref._ref===selected)),stances:all.stances.filter(stance=>stance.sources.some(ref=>ref._ref===selected))};
}
function aggregate(rows:{verification:string;scores:Scores}[]) {
 const primary=rows.filter(r=>r.verification==='primary_text');
 const mean=(key:keyof Scores)=>{const valid=primary.filter(x=>x.scores[key]!==null);return valid.length?valid.reduce((a,r)=>a+Number(r.scores[key]),0)/valid.length:null;};
 const abstentions=rows.filter(r=>r.scores.abstention!==undefined);
 return {primaryCount:primary.length,eligibility:mean('eligibility'),amount:mean('amount'),entitlementF1:mean('entitlementF1'),citationValidity:mean('citationValidity'),correctAbstention:mean('abstention'),allCaseCorrectAbstention:abstentions.reduce((a,r)=>a+Number(r.scores.abstention),0)/abstentions.length};
}
async function main() {
 const caps=getCapabilities();const time=new Date().toISOString();const outputs:Record<string,unknown[]>={D:[],B1:[]};const scores:Record<string,{verification:string;scores:Scores;id:string;split:string}[]>={D:[],B1:[]};
 const failures:Record<string,string[]>={D:[],B1:[]};let unavailableFailure=false;
 // Evaluation remains deterministic when no credentials exist. No model output is manufactured.
 for(const c of cases) {
  const s=scenarioSchema.parse(c.input);const dossier=await getDossier(s);const expected=c.expected as Expected;
  const modes:{name:string;run:()=>Promise<Ruling>}[]=[{name:'D',run:async()=>compute_entitlement(s,dossier)},{name:'B1',run:async()=>compute_entitlement(s,await keywordDossier(s,c.title,dossier))}];
  if(caps.provider)modes.push({name:'B0',run:()=>noRetrievalBaseline(s,dossier)});
  if(caps.mode!=='DETERMINISTIC')modes.push({name:caps.mode==='FULL'?'B2':'STRUCTURED_AGENT',run:async()=>(await agentRuling(s)).ruling});
  for(const mode of modes) {
   outputs[mode.name]||=[];scores[mode.name]||=[];failures[mode.name]||=[];
   try {const ruling=await mode.run();const metrics=measure(ruling,expected);outputs[mode.name].push({id:c.id,split:c.split,verification:c.verification,ruling,metrics});scores[mode.name].push({id:c.id,split:c.split,verification:c.verification,scores:metrics});
    if(!metrics.eligibility||!metrics.amount||metrics.entitlementF1<1||!metrics.abstention||!metrics.status)failures[mode.name].push(c.id);
   }catch{outputs[mode.name].push({id:c.id,error:'Configured retrieval/model failed; no fallback or fabricated result.'});failures[mode.name].push(c.id);unavailableFailure=true;}
  }
 }
 const summary={time,capabilities:caps,scenarios:cases.length,split:{dev:cases.filter(c=>c.split==='dev').length,test:cases.filter(c=>c.split==='test').length},expectedAbstentions:cases.filter(c=>c.expected.status!=='assessed').length,
  hashes:{scenarios:sha(JSON.stringify(cases)),production:sha(JSON.stringify(documents)),corpus:sha(JSON.stringify(corpus))},modes:Object.fromEntries(Object.entries(scores).map(([name,rows])=>[name,{status:'ran',backend:caps.backend,...aggregate(rows),dev:aggregate(rows.filter(r=>r.split==='dev')),test:aggregate(rows.filter(r=>r.split==='test')),failures:failures[name]}])),notRun:{...!caps.provider?{B0:'not run: no LLM key'}:{},...caps.mode==='DETERMINISTIC'?{STRUCTURED_AGENT:'not run: no LLM key',B2:'not run: Context/LLM bindings unavailable'}:caps.mode!=='FULL'?{B2:'not run: complete Context bindings unavailable'}:{}}};
 await mkdir('eval/runs',{recursive:true});const tag=time.replace(/[:.]/g,'-');await writeFile(`eval/runs/${tag}.json`,JSON.stringify({summary,outputs},null,2)+'\n');await writeFile('eval/runs/latest.json',JSON.stringify({summary,outputs},null,2)+'\n');
 const percent=(v:number|null)=>v===null?'N/A':(100*v).toFixed(1)+'%';
 const table=Object.entries(summary.modes).map(([name,m])=>`| ${name} | ${caps.mode} / ${caps.backend} | ${m.primaryCount} | ${percent(m.eligibility)} | ${percent(m.amount)} | ${percent(m.entitlementF1)} | ${percent(m.citationValidity)} | ${percent(m.correctAbstention)} |`).join('\n');
 const lines=`# Evaluation results\n\nRun: ${time}. This report labels actual mode and backend; no live Sanity or Context claim is implied by local scores.\n\n| Method | Runtime mode / content | Primary cases | Eligibility | Amount | Entitlement-set F1 | Citation metadata validity | Correct abstention |\n|---|---|---:|---:|---:|---:|---:|---:|\n${table}\n\n${Object.entries(summary.notRun).map(([k,v])=>'- '+k+': '+v).join('\n')}\n\n## Method\n\nForty prospectively specified cases; frozen 28 development / 12 held-out test split. ${summary.expectedAbstentions} cases expect partial/total abstention. Rule code was validated on development cases before the held-out evaluation; no fitting to test results. Headline metrics use only verification=primary_text; coverage-policy abstentions labeled agent_inferred are excluded. Report separately below. Official regulator guidance and worked statutory conditions are primary evidence here; EU arrival-delay expectations also use labeled official court announcements rather than full judgments.\n\nD uses the structured GROQ dossier and pure compute function. B1 ranks the same source-page text with normalized keyword frequency, keeps rules attached to the best source, and uses the same arithmetic function. This isolates retrieval and keeps numbers in code. B1 retains shared band/regime metadata, so it is a stronger baseline than plain keyword search alone. For absent ignored downloads it uses own-words corpus sections; this fallback is a reproducibility limit, not live retrieval. B0, when a key exists, receives facts only and selects symbolic bands and entitlements from prior knowledge. A shared code calculator supplies numeric awards after selection; the model never emits monetary amounts. B0 is an evaluation-only hybrid, not the usual free-form monetary LLM baseline. It is not run without credentials. B2/STRUCTURED_AGENT run only if getCapabilities exposes the required bindings; errors are failures, never local fallback.\n\nCitation validity means a cited URL/hash matches a successfully retrieved evidence record. It does not measure independent legal entailment or continuing freshness. Set F1 is macro-averaged per expected regime; two empty sets count as one. Eligibility is fixed-compensation eligibility, not a claim that no other rights exist. Expected/actual sets, amounts, sources and errors are retained in eval/runs/latest.json.\n\n## Failures and limits\n\n${Object.entries(failures).map(([name,ids])=>'- '+name+': '+(ids.length?ids.join(', '):'none on this finite suite')).join('\n')}\n\n${Object.entries(summary.modes).map(([name,m])=>'- '+name+' held-out primary cases: '+m.test.primaryCount+'; amount '+percent(m.test.amount)+'; entitlement F1 '+percent(m.test.entitlementF1)+'; all-case correct abstention '+percent(m.allCaseCorrectAbstention)).join('\n')}\n\nIndia CAR is now verified; the original India cancellation expectation was explicitly revised for its sourced refund choice. Added CAR boundary cases live in tests/india.test.ts. Foreign-carrier compensation, unsupported connections, individual baggage damages, full judgments, broader airline terms, non-time changes and universal deadlines require further scope review. Forty small curated cases are not a legal accuracy benchmark. Local backend validation does not satisfy the challenge requirement to query real Sanity content; deployment/import and FULL eval remain in HANDOFF.md.\n`;
 await writeFile('EVAL_RESULTS.md',lines);console.log(JSON.stringify(summary,null,2));
 if(failures.D.length||unavailableFailure)process.exitCode=1;
}
main().catch(()=>{console.error('Evaluation failed; no passing report fabricated.');process.exitCode=1;});
