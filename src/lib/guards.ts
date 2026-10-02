import {createHash} from 'node:crypto';
export class RequestError extends Error {constructor(message:string,public status:number){super(message);}}
const buckets=new Map<string,{count:number;until:number}>();
export function rateLimit(key:string,now=Date.now()) {
 for(const [k,v] of buckets)if(v.until<=now)buckets.delete(k);
 const bucket=buckets.get(key)||{count:0,until:now+60000};
 if(bucket.count>=15)throw new RequestError('Too many requests. Try again in a minute.',429);
 if(buckets.size>=10000&&!buckets.has(key))throw new RequestError('Service busy. Try again shortly.',503);
 bucket.count++;buckets.set(key,bucket);
}
export async function readJson(request:Request) {
 const ip=request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'local';
 rateLimit(createHash('sha256').update(ip).digest('hex'));
 if(Number(request.headers.get('content-length'))>12000)throw new RequestError('Request exceeds the size limit.',413);
 if(!request.headers.get('content-type')?.includes('application/json'))throw new RequestError('JSON content type required.',415);
 if(!request.body)throw new RequestError('Request body required.',400);
 const reader=request.body.getReader();let bytes=0;const chunks:Uint8Array[]=[];
 try {while(true){const {value,done}=await reader.read();if(done)break;bytes+=value.length;if(bytes>12000){await reader.cancel();throw new RequestError('Request exceeds the size limit.',413);}chunks.push(value);}}finally{reader.releaseLock();}
 try{return JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw new RequestError('Invalid JSON.',400);}
}
export function safeError(error:unknown) {
 // Do not echo SDK errors that may contain endpoint query strings, keys or server content.
 if(error instanceof RequestError)return Response.json({error:error.message},{status:error.status});
 return Response.json({error:'The configured content or agent service failed. No fallback ruling was generated.'},{status:502});
}
