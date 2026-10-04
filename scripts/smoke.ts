import {scenarioSchema} from '../src/lib/types';
import examples from '../data/examples/questions.json';
const origin=process.env.SMOKE_ORIGIN || 'http://127.0.0.1:3000';
async function request(path:string,body?:unknown) {
 const r=await fetch(origin+path,body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:undefined);
 if(!r.ok)throw new Error(`Smoke ${path}: HTTP ${r.status}`);return r;
}
async function main(){
 const html=await (await request('/')).text();if(!html.includes('Disruption')||!html.includes('DETERMINISTIC')&&!html.includes('STRUCTURED')&&!html.includes('FULL'))throw new Error('Missing app/mode badge');
 const source=examples[0];const result=await (await request('/api/ruling',scenarioSchema.parse(source.input))).json();
 if(result.ruling.findings[0].amount!==250||result.ruling.sources.length===0)throw new Error('Expected sourced short-route EU ruling');
 const gap=await (await request('/api/ruling',examples.find(e=>e.input.departure==='in')!.input)).json();if(gap.ruling.status!=='abstain')throw new Error('Missing Indian conditions must abstain');
 const india=scenarioSchema.parse({...source.input,departure:'in',arrival:'in',carrier:'in',trigger:'cancellation',blockTimeMinutes:60,basicFareAndFuelINR:6000,contactProvided:'yes',acceptedAlternate:'no'});
 const indian=await (await request('/api/ruling',india)).json();if(indian.ruling.findings[0].amount!==5000)throw new Error('Verified CAR cancellation calculation failed');
 const search=await (await request('/api/search',{query:'refund'})).json();if(!search.matches.length)throw new Error('No refund search results');
 const gaps=await (await request('/gaps')).text();if(!gaps.includes('ruling abstention'))throw new Error('Missing recorded abstention');
 const bad=await fetch(origin+'/api/ruling',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});if(bad.status!==400)throw new Error('Invalid input not rejected');
 console.log('Home, sourced ruling, Indian CAR ruling and missing-facts abstention, keyword search, durable local gap and invalid-input checks passed.');
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
