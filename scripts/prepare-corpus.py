"""Rebuild reviewed document payloads; no Sanity writes. Rule evidence anchors fail closed."""
from pathlib import Path
import json,xml.etree.ElementTree as ET
root=Path(__file__).resolve().parent.parent
retrieval=json.loads((root/'data/retrieval.json').read_text());fetches={r['id']:r for r in retrieval}
for key in ['eu261-original','uk261-xml']:
 r=ET.fromstring((root/f'data/sources/{key}.html').read_text());ns={'l':'http://www.legislation.gov.uk/namespaces/legislation'};body=r.find('.//l:EURetained',ns)
 if body is None:body=r
 (root/f'data/sources/{key}-legal.txt').write_text('\n'.join(' '.join(''.join(x.itertext()).split()) for x in body.iter() if x.tag.endswith('Text')))
# Legal review anchors checked against the retrieved text, not merely HTTP status.
checks={'eu261-original':['EUR 250','EUR 400','EUR 600','two weeks','two hours','five hours','Community carrier'], 'uk261-xml':['£220','£350','£520','three hours or more','UK air carrier'], 'us250':['$1,075','$2,150','less than two hours','less than four hours'], 'dot-refund':['3 hours or more','6 hours or more','chooses not to travel'], 'dot-delay-alt':['airlines are not required to compensate passengers'], 'sturgeon-press':['three hours or more','technical problem'], 'nelson-press':['three hours or more'], 'us-cap-effective':['January 22, 2025','$1,075','$2,150']}
# HTML evidence for the US regulation/refunds was already converted to text during review.
from html.parser import HTMLParser
class T(HTMLParser):
 def __init__(self):super().__init__();self.p=[];self.skip=0
 def handle_starttag(self,t,a):
  if t in ['script','style']:self.skip+=1
 def handle_endtag(self,t):
  if t in ['script','style']:self.skip=max(0,self.skip-1)
  if t in ['p','div','li','tr']:self.p.append('\n')
 def handle_data(self,s):
  if not self.skip:self.p.append(s)
for key in ['us250','us-refund-reg','dot-refund','dot-delay-alt','dot-denied','eu-your-europe']:
 h=T();h.feed((root/f'data/sources/{key}.html').read_text());(root/f'data/sources/{key}.txt').write_text('\n'.join(' '.join(x.split()) for x in ''.join(h.p).splitlines() if x.strip()))
for key,anchors in checks.items():
 p=root/f'data/sources/{key}{"-legal" if key in ["eu261-original","uk261-xml"] else ""}.txt'
 txt=p.read_text()
 for a in anchors:assert a in txt, f'{key}: evidence anchor missing: {a}'
D=[];C=[]
def ref(id):return {'_type':'reference','_ref':id}
def add(t,id,**kw):d={'_id':id,'_type':t,**kw};D.append(d);return id
def source(key,title,publisher,tier,note='Primary legal text / official evidence; retrieved during this build.'):
 r=fetches[key];assert r['status']=='fetched' and r['bytes']>1000
 return add('source','source-'+key,title=title,url=r['url'],publisher=publisher,authorityTier=tier,retrievedAt=r['retrievedAt'],licenseNote=note,evidencePath=r.get('path'),sha256=r['sha256'])
source('eu261-original','EU261 original legal text (National Archives mirror)','EU legislature / UK National Archives',1)
source('uk261-xml','UK261 consolidated text, Articles 3–9','UK National Archives',1)
source('us-cap-effective','US oversales cap revision: effective January 22, 2025','US Department of Transportation / Federal Register',1)
source('us250','14 CFR Part 250: oversales, sections 250.2–250.6','US eCFR / Department of Transportation',1)
source('us-refund-reg','14 CFR Part 260: refunds','US eCFR / Department of Transportation',1)
source('dot-denied','DOT bumping / oversales guidance','US Department of Transportation',2,'Official consumer guidance. Boundary wording is less precise than the regulation.')
source('dot-refund','DOT refunds guidance','US Department of Transportation',2)
source('dot-delay-alt','DOT Fly Rights: delayed and cancelled flights','US Department of Transportation',2)
source('eu-your-europe','Your Europe: air passenger rights','European Commission',2)
source('sturgeon-press','Sturgeon, C-402/07 and C-432/07 — official court announcement','Court of Justice of the European Union',3,'Official court press summary; not full judgment. Full judgment could not be retrieved.')
source('nelson-press','Nelson, C-581/10 and C-629/10 — official court announcement','Court of Justice of the European Union',3,'Official court press summary; not full judgment. Full judgment could not be retrieved.')
source('indigo','IndiGo Conditions of Carriage','IndiGo',4,'Contractual terms: own-words excerpt only in corpus; does not establish current DGCA law.')
source('delta','Delta domestic contract, Rule 20','Delta Air Lines',4,'Contractual terms: own-words excerpt only in corpus.')
regions=['eu','uk','in','us','other']
for key,instrument,alts,sids,effective in [
 ('eu','Regulation (EC) 261/2004',[{'departure':['eu'],'arrival':['*'],'carriers':['*']},{'departure':['uk','in','us','other'],'arrival':['eu'],'carriers':['eu']}],['source-eu261-original'],'2005-02-17'),
 ('uk','Regulation 261/2004 as retained and amended',[{'departure':['uk'],'arrival':['*'],'carriers':['*']},{'departure':['eu','in','us','other'],'arrival':['uk'],'carriers':['eu','uk']},{'departure':['eu','in','us','other'],'arrival':['eu'],'carriers':['uk']}],['source-uk261-xml'],'2023-12-14'),
 ('us','US federal aviation consumer protections',[{'departure':['us'],'arrival':['*'],'carriers':['*']},{'departure':['*'],'arrival':['us'],'carriers':['*']}],['source-us250','source-us-refund-reg'],'2024-10-28'),
 ('in','DGCA CAR Section 3 Series M Part IV — revision unverified',[{'departure':['in'],'arrival':['*'],'carriers':['*']},{'departure':['*'],'arrival':['in'],'carriers':['*']}],[],None)]:
 add('regime','regime-'+key,key=key,instrument=instrument,applicability={'alternatives':alts},effectiveFrom=effective,sources=[ref(s) for s in sids])
for key,values,currency,sid in [('eu',[250,400,600],'EUR','source-eu261-original'),('uk',[220,350,520],'GBP','source-uk261-xml')]:
 for i,(lo,hi,value,reduce) in enumerate(zip([0,1500,3500],[1500,3500,None],values,[120,180,240])):
  add('entitlementBand',f'band-{key}-{i}',regime=ref('regime-'+key),dimension='distance_km',min=lo,max=hi,value=value,currency=currency,note='Great-circle distance. Lower endpoint exclusive except zero; upper inclusive.',source=ref(sid),reductionMinutes=reduce)
 if key=='eu':add('entitlementBand','band-eu-intra',regime=ref('regime-eu'),dimension='distance_km',min=1500,max=None,value=400,currency='EUR',intraEU=True,reductionMinutes=180,note='Intra-EU flights over 1500 km remain in the middle band.',source=ref(sid))
for i,mult,cap in [(0,2,1075),(1,4,2150)]:add('entitlementBand',f'band-us-{i}',regime=ref('regime-us'),dimension='fare_percentage',min=0,max=None,value=mult*100,multiplier=mult,cap=cap,currency='USD',note='Minimum award capped by statute; carriers can pay more. Fare to first stopover or final destination.',source=ref('source-us250'))
def rule(key,trigger,algorithm,title,para,thresholds,sids,bands,entitlements,effective):
 add('rule',f'rule-{key}-{trigger}',title=title,regime=ref('regime-'+key),trigger=trigger,algorithm=algorithm,thresholds=thresholds,conditions=['confirmed reservation','check-in deadline met unless cancellation','single-flight scope','publicly available fare or rewards ticket'],entitlements=entitlements,bands=[ref(b) for b in bands],sources=[ref(s) for s in sids],effectiveFrom=effective,claimDeadline='Not adjudicated: verify the competent jurisdiction and current limitation rules.',verified=True,verificationStatus='verified',paraphrase=para)
for key,sid,date in [('eu','source-eu261-original','2009-11-19'),('uk','source-uk261-xml','2023-12-14')]:
 bands=[f'band-{key}-{i}' for i in range(3)]+(['band-eu-intra'] if key=='eu' else [])
 shared={'reductionFraction':0.5,'longBandValue':600 if key=='eu' else 520,'longReductionBelowMinutes':240}
 sids=[sid]+(['source-sturgeon-press','source-nelson-press','source-eu-your-europe'] if key=='eu' else [])
 rule(key,'arrival_delay','distance_compensation',f'{key.upper()}: long arrival delay','Fixed compensation can arise at three hours final-arrival delay, subject to a proven extraordinary-circumstances defense. Care uses departure delay, not arrival delay.',{**shared,'arrivalMinutes':180},sids,bands,['compensation'],date)
 rule(key,'cancellation','distance_compensation',f'{key.upper()}: cancellation notice and rerouting','Cancellation gives refund/rerouting and assistance. Fixed compensation depends on notice, offered rerouting, and any proven extraordinary-circumstances defense.',{**shared,'noticeLongHours':336,'noticeMediumHours':168,'mediumEarlyMinutes':120,'mediumArrivalMinutes':240,'shortEarlyMinutes':60,'shortArrivalMinutes':120},[sid],bands,['compensation','refund_or_rerouting_choice','meals_and_refreshments','communications'],date)
 rule(key,'denied_boarding','distance_compensation',f'{key.upper()}: involuntary denied boarding','Involuntary denial when boarding conditions are met carries compensation and refund/rerouting plus assistance. Reasonable health, safety and documentation refusals are separate.',shared,[sid],bands,['compensation','refund_or_rerouting_choice','meals_and_refreshments','communications'],date)
 rule(key,'care','care',f'{key.upper()}: meals, communications, overnight care','Departure delay of two, three or four hours depending on distance triggers meals and communications. Hotel and transport apply where an overnight stay becomes necessary. Extraordinary circumstances do not erase the care duty.',{'shortDistance':1500,'mediumDistance':3500,'shortMinutes':120,'mediumMinutes':180,'longMinutes':240},[sid],bands,['meals_and_refreshments','communications','hotel_and_transport'],date)
 rule(key,'refund','refund',f'{key.upper()}: refund choice','Cancellation or involuntary denied boarding brings a choice of reimbursement or rerouting. A departure delay of at least five hours brings reimbursement when the passenger abandons the journey.',{'departureMinutes':300},[sid],bands,['unused_ticket_refund','refund_or_rerouting_choice'],date)
rule('us','denied_boarding','us_oversales','US: involuntary oversales compensation','Use the regulation for exact two-hour domestic and four-hour international boundaries: at the boundary, the higher band applies. The schedule of offered alternate transport matters, not only actual arrival.',{'minimumSeats':30,'noCompensationMinutes':60,'domesticHighMinutes':120,'internationalHighMinutes':240,'lowMultiplier':2,'highMultiplier':4},['source-us250','source-us-cap-effective','source-dot-denied'],['band-us-0','band-us-1'],['compensation'],'2025-01-22')
for trigger in ['arrival_delay','cancellation','care','refund']:
 rule('us',trigger,'us_refund',f'US: {trigger.replace("_"," ")} and refund','Federal law does not generally require fixed delay/cancellation compensation. Refunds apply to cancellations or significant schedule changes when travel and alternative benefits are declined; late-arrival thresholds are three hours domestic and six hours international. Airline commitments can add rights.',{'domesticRefundMinutes':180,'internationalRefundMinutes':360},['source-us-refund-reg','source-dot-refund','source-dot-delay-alt'],[],['unused_ticket_refund'],'2024-10-28')
for cause in ['operational','technical','weather','atc','strike','unknown']:add('cause','cause-'+cause,key=cause,title=cause.title())
for key in ['eu','uk']:
 sid='source-sturgeon-press' if key=='eu' else 'source-uk261-xml'
 for cause,stance,para in [('technical','contested','A technical label alone is insufficient: assess inherent activity, actual control and reasonable measures.'),('weather','contested','Weather may support a defense; carrier proof and reasonable measures remain required.'),('unknown','unspecified','The cause is not established. Do not infer eligibility from a vague disruption description.')]:
  add('causeStance',f'stance-{key}-{cause}',regime=ref('regime-'+key),cause=ref('cause-'+cause),stance=stance,paraphrase=para,verified=True,sources=[ref(sid)])
add('caseLaw','case-sturgeon',title='Sturgeon: long arrival delays',holding='The official court announcement reports compensation at three hours or more, subject to extraordinary circumstances. A technical defect requires assessment of its nature and control.',stances=[ref('stance-eu-technical')],sources=[ref('source-sturgeon-press')],verified=True,verificationStatus='official_summary_only')
add('caseLaw','case-nelson',title='Nelson: long-delay approach confirmed',holding='The official court announcement confirms the Sturgeon treatment of three-hour final-arrival delay and the extraordinary-circumstances defense.',stances=[],sources=[ref('source-nelson-press')],verified=True,verificationStatus='official_summary_only')
for airline,sid,summary in [('IndiGo','source-indigo','Refund provisions describe original-payment and credit-shell options and special processing rules. This contract is not a substitute for the current DGCA CAR.'),('Delta','source-delta','Rule 20 describes alternate transport, overnight assistance for bumped passengers, and denied-boarding compensation. Regulatory rights are not replaced by a contractual liability statement.')]:
 add('airlinePolicy','policy-'+airline.lower(),airline=airline,title=airline+' conditions of carriage',summary=summary,conflictsWith=[],sources=[ref(sid)],verified=True)
# Private corpus: own-words official summaries; complete original statutory sections permitted.
# Chunk covered legal provisions by article/section; exclude baggage provisions.
import re
for key in ['eu261-original','uk261-xml']:
 tree=ET.fromstring((root/f'data/sources/{key}.html').read_text())
 selected={'article-2','article-3','article-4','article-5','article-6','article-7','article-8','article-9','article-15'}
 for article in tree.iter():
  aid=article.attrib.get('id','')
  if article.tag.endswith('P1') and aid in selected:
   text='\n'.join(' '.join(''.join(x.itertext()).split()) for x in article.iter() if x.tag.endswith('Text'))
   C.append({'_id':f'corpus-{key}-{aid.lower()}','_type':'corpusDoc','title':f'{"EU261 original" if key=="eu261-original" else "UK261 consolidated"} / {aid.replace("-"," ")}','url':fetches[key]['url'],'publisher':'UK National Archives / legislature','tier':1,'markdown':text,'retrievedAt':fetches[key]['retrievedAt']})
for key,sections in [('us250',{'250.2','250.5','250.6','250.9'}),('us-refund-reg',{'260.3','260.6','260.7','260.9','260.10'})]:
 text=(root/f'data/sources/{key}.txt').read_text();matches=list(re.finditer(r'^§ (\d+\.\w+) ',text,re.M))
 for i,match in enumerate(matches):
  section=match.group(1)
  if section not in sections:continue
  chunk=text[match.start():matches[i+1].start() if i+1<len(matches) else len(text)]
  C.append({'_id':f'corpus-{key}-{section.replace(".","-")}','_type':'corpusDoc','title':f'14 CFR section {section}','url':fetches[key]['url'],'publisher':'US eCFR / Department of Transportation','tier':1,'markdown':chunk,'retrievedAt':fetches[key]['retrievedAt']})
C.append({'_id':'corpus-us-cap-effective','_type':'corpusDoc','title':'US denied-boarding cap revision: effective date','url':fetches['us-cap-effective']['url'],'publisher':'US Department of Transportation / Federal Register','tier':1,'markdown':'The October 24, 2024 final rule makes the revised involuntary denied-boarding caps effective on January 22, 2025. The revised lower and higher caps are USD 1,075 and USD 2,150. This corpus covers only the oversales amendment; no baggage entitlement is modeled.','retrievedAt':fetches['us-cap-effective']['retrievedAt']})
for key in ['sturgeon-press','nelson-press','dot-denied','dot-refund','dot-delay-alt','eu-your-europe','indigo','delta']:
 summaries=[x.get('paraphrase',x.get('holding',x.get('summary',''))) for x in D if x['_type'] in ['rule','caseLaw','airlinePolicy'] and any(s['_ref']=='source-'+key for s in x['sources'])]
 C.append({'_id':'corpus-'+key,'_type':'corpusDoc','title':next(x['title'] for x in D if x['_id']=='source-'+key),'url':fetches[key]['url'],'publisher':next(x['publisher'] for x in D if x['_id']=='source-'+key),'tier':next(x['authorityTier'] for x in D if x['_id']=='source-'+key),'markdown':'\n\n'.join(dict.fromkeys(summaries)) or 'Official source reviewed. See linked primary page for details.','retrievedAt':fetches[key]['retrievedAt']})
def add_array_keys(value):
 if isinstance(value,dict):
  for v in value.values():add_array_keys(v)
 elif isinstance(value,list):
  for i,v in enumerate(value):
   if isinstance(v,dict):v.setdefault('_key',f'k{i}')
   add_array_keys(v)
for document in D+C:add_array_keys(document)
(root/'data/production.json').write_text(json.dumps(D,indent=2)+'\n');(root/'data/corpus.json').write_text(json.dumps(C,indent=2)+'\n')
# Each import batch contains fewer than 100 kB, with no credentials.
(root/'data/import').mkdir(exist_ok=True)
for dataset,docs in [('production',D),('corpus',C)]:
 for old_batch in (root/'data/import').glob(dataset+'-*.json'):old_batch.unlink()
 batches=[];batch=[]
 for doc in docs:
  if len(json.dumps(batch+[doc]).encode())>90000:batches.append(batch);batch=[]
  batch.append(doc)
 if batch:batches.append(batch)
 for i,b in enumerate(batches):(root/f'data/import/{dataset}-{i+1}.json').write_text(json.dumps(b,indent=2)+'\n')
assert len(D)+len(C)+40<140,(len(D),len(C))
(root/'data/verification.json').write_text(json.dumps({'checkedAnchors':checks,'publicDocuments':len(D),'privateDocuments':len(C),'livePublished':False,'method':'Manual primary-text review with reproducible anchor checks; official court summaries are labeled, not full judgments.'},indent=2)+'\n')
print(f'Prepared {len(D)} public and {len(C)} private documents, plus budget for 40 golden scenarios. Nothing uploaded.')
