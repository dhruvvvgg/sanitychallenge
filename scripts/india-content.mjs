import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const ref=_ref=>({_type:'reference',_ref});
const retrievedAt='2026-10-04T14:00:00.000Z';
const source=(id,title,url,publisher,tier=1)=>({_id:id,_type:'source',title,url,publisher,authorityTier:tier,retrievedAt,licenseNote:'Official source reviewed 4 October 2026. The linked version and its effective date control; baggage limits are not automatic awards.'});
const iv=source('source-dgca-part-iv','DGCA CAR Section 3 Series M Part IV, Rev.4 (25 January 2023), effective 15 February 2023','https://www.dgca.gov.in/digigov-portal/Upload?attachId=we1PSlOuQhYdHcwKKrm7ew%3D%3D&flag=iframeAttachView','Directorate General of Civil Aviation, India');
const ii=source('source-dgca-part-ii-2026','DGCA ticket refunds, Part II Rev.3 (24 February 2026), effective 26 March 2026','https://www.dgca.gov.in/digigov-portal/Upload?attachId=cuYJ%2FdQQ6Gx93z%2Fwchd5xw%3D%3D&flag=iframeAttachView','Directorate General of Civil Aviation, India');
const act=source('source-india-carriage-act','Carriage by Air Act 1972 — Third Schedule: baggage liability and complaints','https://www.indiacode.nic.in/bitstream/123456789/1658/2/A1972-69.pdf','India Code / Ministry of Law and Justice');
const icao=source('source-montreal-limits-2024','ICAO: Montreal Convention liability limits effective 28 December 2024','https://www.icao.int/sites/default/files/secretariat/legal/LEB%20Treaty%20Collection%20Documents/2024_Revised_Limits_of_Liability_Under_the_Montreal_Convention_of_1999_en.pdf','International Civil Aviation Organization');
const charter=source('source-india-passenger-charter','Ministry of Civil Aviation Passenger Charter — domestic baggage guidance','https://www.civilaviation.gov.in/sites/default/files/2025-11/passenger-charter-moca-india-feb-2019-133.pdf','Ministry of Civil Aviation, India',2);
charter.licenseNote='2019 official guidance, still hosted by MoCA. Its international SDR figures are outdated: use the current ICAO revision. Domestic guidance is not a substitute for individual statutory liability analysis.';
const band=(id,dimension,min,max,value,extra={})=>({_id:id,_type:'entitlementBand',regime:ref('regime-in'),dimension,min,max,value,currency:'INR',source:ref(iv._id),...extra});
const bands=[band('band-in-cancel-0','block_time_minutes',0,60,5000),band('band-in-cancel-1','block_time_minutes',60,120,7500),band('band-in-cancel-2','block_time_minutes',120,null,10000),band('band-in-denied-0','fare_percentage',0,null,200,{multiplier:2,cap:10000}),band('band-in-denied-1','fare_percentage',0,null,400,{multiplier:4,cap:20000})];
const rule=(trigger,paraphrase,thresholds={},ids=[],sources=[iv._id],effectiveFrom='2023-02-15')=>({_id:`rule-in-${trigger}`,_type:'rule',title:`India: ${trigger.replaceAll('_',' ')}`,regime:ref('regime-in'),trigger,algorithm:`in_${trigger}`,verified:true,verificationStatus:'primary_text_reviewed_2026-10-04',effectiveFrom,paraphrase,thresholds,conditions:['Covered India route','Confirmed reservation and applicable check-in','Basic fare plus fuel charge, not total tax-inclusive fare','Specific CAR conditions; foreign-carrier and damages claims may require review'],entitlements:[],bands:ids.map(ref),sources:sources.map(ref),claimDeadline:'CAR redress: airline, nodal/appellate officer, AirSewa, then competent statutory body/court. Limitation depends on remedy; no universal deadline asserted.'});
const care={shortBlockMinutes:150,mediumBlockMinutes:300,shortMinutes:120,mediumMinutes:180,longMinutes:240,domesticRefundMinutes:360,hotelMinutes:1440,nightHotelMinutes:360};
const rules=[
 rule('cancellation','CAR 3.3: alternate flight or refund. Late notice or missed same-ticket connection may bring compensation plus refund, subject to contact information and extraordinary-circumstances defenses.',{noticeMediumHours:24},bands.filter(b=>b.dimension==='block_time_minutes').map(b=>b._id)),
 rule('denied_boarding','CAR 3.2: involuntary oversales compensation uses basic fare plus fuel charge, alternative departure timing and passenger choice. First-leg connection claims require final arrival at least three hours late.',{noCompensationMinutes:60,departureMinutes:1440,connectionMinutes:180,lowMultiplier:2,highMultiplier:4},bands.filter(b=>b.dimension==='fare_percentage').map(b=>b._id)),
 rule('arrival_delay','CAR 3.4 provides specified assistance and domestic refund/alternate choices; no general fixed arrival-delay award.',care),
 rule('care','CAR 3.4 and 3.8: block-time meal thresholds, long/night-delay hotel assistance, and an unavoidable-extraordinary-circumstances exception.',care),
 rule('refund','Part II Rev.3: credit card seven days, cash immediately, agents/portals fourteen working days. Credit shell by passenger choice; refundable taxes and airport charges on unused tickets. Part IV creates disruption refund choices.',{},[],[iv._id,ii._id],'2026-03-26'),
 rule('baggage','Baggage claims need evidence, applicable carriage regime and complaint checks. Montreal baggage liability limit is 1,519 SDR per passenger from 28 December 2024, not a guaranteed payment. The 2019 MoCA charter describes domestic INR 20,000 guidance; its old international figure is superseded.',{},[],[act._id,icao._id,charter._id],'2024-12-28'),
];
export const indiaDocuments=[iv,ii,act,icao,charter,...bands,...rules];
export const indiaRegime={_id:'regime-in',_type:'regime',key:'in',instrument:'DGCA CAR Part IV Rev.4 + refund Part II Rev.3 (2026); baggage claims guidance',effectiveFrom:'2023-02-15',applicability:{alternatives:[{departure:['in'],arrival:['*'],carriers:['*']},{departure:['*'],arrival:['in'],carriers:['*']}]},sources:[ref(iv._id)]};
export const indiaCorpus=rules.map(r=>({_id:`corpus-${r._id}`,_type:'corpusDoc',title:r.title,url:iv.url,publisher:iv.publisher,tier:1,markdown:r.paraphrase,retrievedAt}));
indiaCorpus.find(c=>c._id==='corpus-rule-in-refund').url=ii.url;
indiaCorpus.find(c=>c._id==='corpus-rule-in-baggage').url=act.url;
function keyed(v){if(Array.isArray(v))v.forEach((x,i)=>{if(x&&typeof x==='object')x._key??=`k${i}`;keyed(x);});else if(v&&typeof v==='object')Object.values(v).forEach(keyed);return v;}
indiaDocuments.forEach(keyed);keyed(indiaRegime);
export async function prepareIndia(){
 for(const [name,updates] of [['production',[indiaRegime,...indiaDocuments]],['corpus',indiaCorpus]]){
  const file=path.join(root,`data/${name}.json`);const docs=JSON.parse(await readFile(file,'utf8'));const ids=new Set(updates.map(d=>d._id));
  await writeFile(file,JSON.stringify([...docs.filter(d=>!ids.has(d._id)),...updates],null,2)+'\n');
 }
 await writeFile(path.join(root,'data/import/india-production.json'),JSON.stringify([indiaRegime,...indiaDocuments],null,2)+'\n');
 await writeFile(path.join(root,'data/import/india-corpus.json'),JSON.stringify(indiaCorpus,null,2)+'\n');
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){await prepareIndia();console.log('Prepared verified Indian sources, bands, rules and corpus summaries.');}
