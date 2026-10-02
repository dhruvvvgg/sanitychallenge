import {scenarioSchema} from '@/lib/types';
import {getCapabilities} from '@/lib/capabilities';
import {getDossier} from '@/lib/content';
import {compute_entitlement} from '@/lib/compute';
import {agentRuling} from '@/lib/agent';
import {readJson,safeError,RequestError} from '@/lib/guards';
import {recordGap} from '@/lib/gaps';
export const runtime='nodejs';
export const maxDuration=90;
export async function POST(request:Request) {
 try {
  const parsed=scenarioSchema.safeParse(await readJson(request));
  if(!parsed.success)throw new RequestError('Check flight facts and required confirmations. A field is missing or invalid.',400);
  const caps=getCapabilities();
  const result=caps.mode==='DETERMINISTIC'?{ruling:compute_entitlement(parsed.data,await getDossier(parsed.data)),annotation:null,toolCalls:[]}:await agentRuling(parsed.data);
  let gap:unknown=null;
  if(result.ruling.status!=='assessed') {
   try {gap=await recordGap('ruling_abstention','Verified corpus or supplied conditions did not determine all entitlements.',result.ruling.findings.find(f=>f.status==='abstain')?.regime);}catch{gap={persisted:false,warning:'The gap could not be saved.'};}
  }
  return Response.json({...result,capabilities:caps,gap});
 }catch(e){return safeError(e);}
}
