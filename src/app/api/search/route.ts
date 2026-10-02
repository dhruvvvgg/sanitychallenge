import {z} from 'zod';
import {searchContent} from '@/lib/content';
import {getCapabilities} from '@/lib/capabilities';
import {recordGap} from '@/lib/gaps';
import {readJson,safeError,RequestError} from '@/lib/guards';
import examples from '../../../../data/examples/questions.json';
export async function POST(request:Request) {
 try {
  const parsed=z.object({query:z.string().trim().min(3).max(400)}).safeParse(await readJson(request));
  if(!parsed.success)throw new RequestError('Search must be between three and four hundred characters.',400);
  const matches=await searchContent(parsed.data.query);
  const words=parsed.data.query.toLowerCase().split(/\W+/).filter(w=>w.length>2);
  const curated=examples.filter(e=>words.some(w=>e.question.toLowerCase().includes(w))).slice(0,3);
  let gap:unknown=null;if(!matches.length&&!curated.length)try{gap=await recordGap('search_abstention','No indexed rule or curated example matched.');}catch{gap={persisted:false,warning:'Gap storage failed.'};}
  return Response.json({matches,examples:curated,capabilities:getCapabilities(),gap,notice:'Keyword discovery and labeled precomputed examples. Free text is not a personalized legal ruling; use the structured form.'});
 }catch(e){return safeError(e);}
}
