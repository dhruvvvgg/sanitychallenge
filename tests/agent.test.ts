import {afterEach,expect,it,vi} from 'vitest';
import {tool} from 'ai';
import {z} from 'zod';
import {agentRuling,observations} from '../src/lib/agent';
import * as content from '../src/lib/content';
import {scenarioSchema,type Document} from '../src/lib/types';
import documents from '../data/production.json';
import examples from '../data/examples/questions.json';

afterEach(()=>{vi.unstubAllEnvs();vi.unstubAllGlobals();vi.restoreAllMocks();});

it('forces Gemini retrieval and computation without incompatible JSON response mode',async()=>{
 vi.stubEnv('GOOGLE_GENERATIVE_AI_API_KEY','unit-test-placeholder');
 vi.stubEnv('LLM_MODEL','');
 vi.stubEnv('SANITY_PROJECT_ID','unit-test-project');
 vi.stubEnv('SANITY_KB_MCP_URL','https://example.org/kb');
 vi.stubEnv('SANITY_DATA_MCP_URL','https://example.org/data');
 vi.stubEnv('SANITY_ORGANIZATION_TOKEN','unit-test-placeholder');
 vi.stubEnv('SANITY_ORGANIZATION_ID','');
 vi.spyOn(console,'info').mockImplementation(()=>{});
 const scenario=scenarioSchema.parse(examples[0].input);
 const fixture=await content.getDossier(scenario,documents as Document[]);
 vi.spyOn(content,'getDossier').mockResolvedValue(fixture);
 const required=['kb_knowledge_base_read','data_groq_query','query_rules','compute_entitlement'];
 let step=0;
 const fetchMock=vi.fn(async(_url:unknown,init?:RequestInit)=>{
  const body=JSON.parse(String(init?.body));
  expect(body.generationConfig?.responseMimeType).toBeUndefined();
  expect(body.generationConfig?.responseSchema).toBeUndefined();
  if(step<required.length){
   expect(body.toolConfig.functionCallingConfig.mode).toBe('ANY');
   expect(body.tools[0].functionDeclarations.map((t:{name:string})=>t.name)).toEqual([required[step]]);
  }else expect(body.tools).toBeUndefined();
  const parts=step<required.length?[{functionCall:{name:required[step],args:{}},thoughtSignature:'dGVzdA=='}]:[{text:observations[0]}];
  step++;
  return Response.json({candidates:[{content:{role:'model',parts},finishReason:'STOP'}],usageMetadata:{promptTokenCount:10,candidatesTokenCount:10,totalTokenCount:20}});
 });
 vi.stubGlobal('fetch',fetchMock);
 const kbRead=vi.fn().mockResolvedValue({content:[{type:'text',text:'Unit-test KB evidence'}]});
 const groqRead=vi.fn().mockResolvedValue({result:[{_id:'unit-test-rule'}]});
 const close=vi.fn().mockResolvedValue(undefined);
 const result=await agentRuling(scenario,{connect:async()=>({initialContext:'Unit-test outline',tools:{
  kb_knowledge_base_read:tool({inputSchema:z.object({}),execute:kbRead}),
  data_groq_query:tool({inputSchema:z.object({}),execute:groqRead}),
 },close})});
 expect(result.toolCalls).toEqual(required);
 expect(result.ruling.findings[0].amount).toBe(250);
 expect(result.annotation).toBe(observations[0]);
 expect(fetchMock).toHaveBeenCalledTimes(5);
 expect(kbRead).toHaveBeenCalledTimes(1);
 expect(groqRead).toHaveBeenCalledTimes(1);
 expect(close).toHaveBeenCalledTimes(1);
});
