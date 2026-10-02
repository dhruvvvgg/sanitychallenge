import {createClient} from '@sanity/client';
import {appendFile,mkdir,readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {getCapabilities} from './capabilities';
export type Gap={_id:string;_type:'gap';category:string;reason:string;mode:string;backend:string;createdAt:string;regime:string};
const directory=process.env.GAP_STORAGE_DIR || join(process.cwd(),'.local');
export async function recordGap(category:string,reason:string,regime='uncovered') {
 const c=getCapabilities();const gap:Gap={_id:'gap-'+crypto.randomUUID(),_type:'gap',category,reason:reason.slice(0,500),mode:c.mode,backend:c.backend,createdAt:new Date().toISOString(),regime};
 // Store only controlled classifications; never store the user's free text or IP.
 if(c.gapWrites) {
  await createClient({projectId:process.env.SANITY_PROJECT_ID!,dataset:process.env.SANITY_DATASET||'production',apiVersion:'2026-01-01',useCdn:false,token:process.env.SANITY_WRITE_TOKEN}).create(gap);
  return {persisted:true,storage:'SANITY'};
 }
 await mkdir(directory,{recursive:true});await appendFile(join(directory,'gaps.ndjson'),JSON.stringify(gap)+'\n');
 return {persisted:true,storage:'LOCAL_ONLY',warning:'No Sanity write binding; gap is local and will not persist across serverless instances.'};
}
export async function getGaps():Promise<Gap[]> {
 if(getCapabilities().backend==='SANITY_LIVE') {
  const {publicClient}=await import('./content');return publicClient().fetch<Gap[]>('*[_type=="gap"] | order(createdAt desc)[0...50]');
 }
 try {return (await readFile(join(directory,'gaps.ndjson'),'utf8')).trim().split('\n').filter(Boolean).map(l=>JSON.parse(l) as Gap).slice(-50).reverse();}catch(e){if((e as NodeJS.ErrnoException).code==='ENOENT')return [];throw e;}
}
