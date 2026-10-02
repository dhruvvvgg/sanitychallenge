import {writeFile} from 'node:fs/promises';
import scenarios from '../eval/scenarios.json';
import {getDossier} from '../src/lib/content';
import {compute_entitlement} from '../src/lib/compute';
import {scenarioSchema} from '../src/lib/types';
async function main() {
 const selection=[0,7,9,14,19,23,25,30];
 const examples=await Promise.all(selection.map(async i=>{const c=scenarios[i];const s=scenarioSchema.parse(c.input);return {id:c.id,question:c.title,label:'precomputed',input:s,ruling:compute_entitlement(s,await getDossier(s))};}));
 await writeFile('data/examples/questions.json',JSON.stringify(examples,null,2)+'\n');
 console.log(`${examples.length} deterministic examples precomputed; not personalized free-text answers.`);
}
main().catch(()=>{console.error('Example generation failed');process.exitCode=1;});
