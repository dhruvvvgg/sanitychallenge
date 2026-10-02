"""Fetch immutable evidence artifacts without credentials; TLS verification stays enabled."""
from pathlib import Path
import urllib.request, json, hashlib, concurrent.futures, datetime, re
root=Path(__file__).resolve().parent.parent
sources={
 'eu261':'https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32004R0261',
 'uk261':'https://www.legislation.gov.uk/eur/2004/261/contents',
 'caa':'https://www.caa.co.uk/passengers/before-you-fly/am-i-entitled-to-compensation/',
 'dot-denied':'https://www.transportation.gov/individuals/aviation-consumer-protection/bumping-oversales',
 'dot-refund':'https://www.transportation.gov/individuals/aviation-consumer-protection/refunds',
 'dot-delay':'https://www.transportation.gov/individuals/aviation-consumer-protection/flight-delays-cancellations',
 'us250':'https://www.ecfr.gov/current/title-14/chapter-II/subchapter-A/part-250',
 'dgca':'https://www.dgca.gov.in/digigov-portal/Upload?flag=iframeAttachView&attachId=150612014',
 'sturgeon':'https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:62007CJ0402',
 'nelson':'https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:62010CJ0581',
 'wallentin':'https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:62007CJ0549',
 'mcdonagh':'https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:62011CJ0012',
 'folkerts':'https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:62011CJ0011',
 'vanderlans':'https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:62014CJ0257',
 'krusemann':'https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:62017CJ0195',
 'peuskova':'https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:62015CJ0315',
 'finnair':'https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:62011CJ0022',
 'germanwings':'https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:62013CJ0452',
 'indigo':'https://www.goindigo.in/information/conditions-of-carriage.html',
 'airindia':'https://www.airindia.com/in/en/conditions-of-carriage.html',
 'airindiaexpress':'https://www.airindiaexpress.com/terms-and-conditions',
 'spicejet':'https://www.spicejet.com/tnc.aspx',
 'akasa':'https://www.akasaair.com/terms-and-conditions',
 'ryanair':'https://help.ryanair.com/hc/en-gb/articles/12889869090705-General-Terms-Conditions-of-Carriage',
 'easyjet':'https://www.easyjet.com/en/terms-and-conditions',
 'lufthansa':'https://www.lufthansa.com/us/en/conditions-of-carriage',
 'ba':'https://www.britishairways.com/content/information/legal/conditions-of-carriage',
 'delta':'https://www.delta.com/us/en/legal/contract-of-carriage-dgr',
 'united':'https://www.united.com/en/us/fly/contract-of-carriage.html',
}
docs=['sanity-context','sanity-context-create-knowledge-base','sanity-context-source-types','sanity-context-resolve-issues','sanity-context-configure-mcp','sanity-context-mcp-tools','sanity-context-retrieval-modes','sanity-context-insights','sanity-context-vercel-ai-sdk']
for d in docs:sources['docs-'+d]='https://www.sanity.io/docs/ai/'+d+'.md'
sources['docs-cli-context']='https://www.sanity.io/docs/cli-reference/cli-context.md'
def fetch(item):
 key,url=item
 try:
  req=urllib.request.Request(url,headers={'User-Agent':'DisruptionDeskEvidence/1.0 (research; primary source validation)'})
  with urllib.request.urlopen(req,timeout=35) as r: body=r.read(8_000_000);ctype=r.headers.get('Content-Type','');final=r.url
  # reject bot challenge/empty page evidence
  text=body.decode('utf-8',errors='replace') if 'pdf' not in ctype else ''
  challenged=any(t in text[:20000].lower() for t in ['checking your browser','just a moment...','enable javascript and cookies','captcha'])
  suffix='.pdf' if 'pdf' in ctype else ('.md' if key.startswith('docs-') else '.html')
  path=root/'data'/'sources'/(key+suffix);path.write_bytes(body)
  return {'id':key,'url':url,'resolvedUrl':final,'status':'challenge' if challenged else 'fetched','bytes':len(body),'sha256':hashlib.sha256(body).hexdigest(),'contentType':ctype,'path':str(path.relative_to(root)),'retrievedAt':datetime.datetime.now(datetime.timezone.utc).isoformat()}
 except Exception as e:return {'id':key,'url':url,'status':'failed','error':str(e)}
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool: results=list(pool.map(fetch,sources.items()))
(root/'data'/'retrieval.json').write_text(json.dumps(results,indent=2))
for r in results:print(r['id'],r['status'],r.get('bytes',r.get('error')))
