import {createMCPClient,type MCPClient} from '@ai-sdk/mcp';
import type {ToolSet} from 'ai';
export interface ContextSession {initialContext:string;tools:ToolSet;close():Promise<void>}
export interface ContextAdapter {connect(signal?:AbortSignal):Promise<ContextSession>}
export function initialContextUrl(endpoint:string) {
 const url=new URL(endpoint);
 if(url.protocol!=='https:')throw new Error('Context endpoints must use HTTPS');
 if(url.username||url.password)throw new Error('Do not embed credentials in endpoint URLs');
 url.pathname=url.pathname.replace(/\/$/,'')+'/initial-context';return url.toString();
}
export class SanityContextAdapter implements ContextAdapter {
 constructor(private endpoints:{kb:string;data:string},private token:string) {}
 async connect(signal:AbortSignal=AbortSignal.timeout(20000)):Promise<ContextSession> {
  const clients:MCPClient[]=[];
  let endpointName='kb';let stage='initial-context';let httpStatus:number|undefined;
  try {
   const initial:string[]=[];const combined:ToolSet={};
   // Sequential resource acquisition ensures a failed second connection closes the first.
   for(const [prefix,endpoint] of [['kb',this.endpoints.kb],['data',this.endpoints.data]]) {
    endpointName=prefix;stage='initial-context';httpStatus=undefined;
    const response=await fetch(initialContextUrl(endpoint),{headers:{Authorization:`Bearer ${this.token}`},signal,redirect:'error'});
    httpStatus=response.status;
    if(!response.ok)throw new Error(`Context ${prefix} initial context failed (${response.status})`);
    const text=await response.text();if(!text.trim())throw new Error(`Context ${prefix} returned empty initial context`);
    initial.push(`${prefix.toUpperCase()} outline/schema:\n${text.slice(0,24000)}`);
    stage='mcp-connect';httpStatus=undefined;
    const client=await createMCPClient({transport:{type:'http',url:endpoint,headers:{Authorization:`Bearer ${this.token}`}}});clients.push(client);
    stage='tools-list';
    const tools=await client.tools();
    const allowed=prefix==='kb'?['knowledge_base_read']:['groq_query','schema_explorer','array_field_reader'];
    const required=prefix==='kb'?'knowledge_base_read':'groq_query';
    if(!tools[required])throw new Error(`Context ${prefix} endpoint does not serve ${required}`);
    for(const name of allowed)if(tools[name])combined[`${prefix}_${name}`]=tools[name];
   }
   return {initialContext:initial.join('\n\n'),tools:combined,close:async()=>{await Promise.allSettled(clients.map(c=>c.close()));}};
  } catch(error) {
   // Log only fixed labels and status, never SDK errors, URLs, headers or content.
   console.error('Sanity Context connection failed',{endpoint:endpointName,stage,httpStatus});
   await Promise.allSettled(clients.map(c=>c.close()));throw error;
  }
 }
}
