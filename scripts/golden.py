from pathlib import Path
import json
root=Path(__file__).resolve().parent.parent
base={'departure':'eu','arrival':'other','carrier':'eu','airline':'Unspecified','flightDate':'2026-10-01','trigger':'arrival_delay','distanceKm':1200,'arrivalDelayMinutes':180,'departureDelayMinutes':0,'cause':'operational','extraordinaryEvidence':'not_proven','noticeHours':0,'confirmedBooking':True,'checkedInOnTime':True,'involuntary':True,'deniedReason':'oversales','aircraftSeats':180,'fare':200,'fareCurrency':'USD','declinedTravelAndBenefits':False,'overnight':False,'reroutingOffered':False,'reroutedArrivalDelayMinutes':0,'reroutedDepartureEarlyMinutes':0,'receivedBenefitsAbroad':False,'singleFlight':True}
cases=[]
def case(title,patch,expected,verification='primary_text',sources=None):
 cases.append({'id':f'scenario-{len(cases)+1:02}','title':title,'input':{**base,**patch},'expected':expected,'verification':verification,'sources':sources or ['source-eu261-original']})
def E(amount,ent=None,regime='eu',currency='EUR',status='assessed'):
 return {'status':status,'regime':regime,'amount':amount,'currency':currency,'entitlements':ent or (['compensation'] if amount and amount>0 else [])}
care=['meals_and_refreshments','communications']
cancel=care+['refund_or_rerouting_choice']
# Dev set. Expectations fixed from reviewed primary paragraphs, never generated from engine output.
case('EU short route at three hours',{},E(250),sources=['source-eu261-original','source-sturgeon-press'])
case('EU at 1500 km',{'distanceKm':1500},E(250))
case('EU just beyond 1500 km',{'distanceKm':1501},E(400))
case('EU at 3500 km',{'distanceKm':3500},E(400))
case('EU long haul four hours',{'distanceKm':5000,'arrivalDelayMinutes':240},E(600))
case('EU intra-EU long route',{'arrival':'eu','distanceKm':4000,'arrivalDelayMinutes':240},E(400))
case('EU arrival just under three hours',{'arrivalDelayMinutes':179},E(0))
case('EU weather proven defense retains care',{'cause':'weather','extraordinaryEvidence':'proven','departureDelayMinutes':120},E(0,care))
case('EU cancellation fourteen days notice',{'trigger':'cancellation','noticeHours':336},E(0,cancel))
case('EU cancellation late notice',{'trigger':'cancellation'},E(250,cancel+['compensation']))
case('EU cancellation ten days notice with close rerouting',{'trigger':'cancellation','noticeHours':240,'reroutingOffered':True,'reroutedDepartureEarlyMinutes':120,'reroutedArrivalDelayMinutes':239},E(0,cancel))
case('EU cancellation exact four-hour exception boundary',{'trigger':'cancellation','noticeHours':240,'reroutingOffered':True,'reroutedArrivalDelayMinutes':240},E(250,cancel+['compensation']))
case('EU denied boarding ordinary oversales',{'trigger':'denied_boarding'},E(250,cancel+['compensation']))
case('EU denied boarding short rerouting reduction',{'trigger':'denied_boarding','reroutingOffered':True,'reroutedArrivalDelayMinutes':120},E(125,cancel+['compensation']))
case('UK short distance current band',{'departure':'uk','arrival':'other','carrier':'uk'},E(220,regime='uk',currency='GBP'),sources=['source-uk261-xml'])
case('UK medium distance current band',{'departure':'uk','carrier':'uk','distanceKm':2000},E(350,regime='uk',currency='GBP'),sources=['source-uk261-xml'])
case('UK long distance current band',{'departure':'uk','carrier':'uk','distanceKm':5000,'arrivalDelayMinutes':240},E(520,regime='uk',currency='GBP'),sources=['source-uk261-xml'])
us={'departure':'us','arrival':'us','carrier':'us','trigger':'denied_boarding','reroutingOffered':True}
case('US oversales within one hour', {**us,'reroutedArrivalDelayMinutes':60},E(0,regime='us',currency=None),sources=['source-us250'])
case('US oversales short domestic delay', {**us,'reroutedArrivalDelayMinutes':90},E(400,regime='us',currency='USD'),sources=['source-us250'])
case('US domestic exactly two hours', {**us,'reroutedArrivalDelayMinutes':120},E(800,regime='us',currency='USD'),sources=['source-us250'])
case('US short band statutory cap', {**us,'reroutedArrivalDelayMinutes':90,'fare':1000},E(1075,regime='us',currency='USD'),sources=['source-us250'])
case('US long band statutory cap', {**us,'reroutedArrivalDelayMinutes':180,'fare':1000},E(2150,regime='us',currency='USD'),sources=['source-us250'])
case('US international exactly four hours', {**us,'arrival':'other','reroutedArrivalDelayMinutes':240},E(800,regime='us',currency='USD'),sources=['source-us250'])
case('US cancelled flight declined travel', {'departure':'us','arrival':'us','carrier':'us','trigger':'cancellation','declinedTravelAndBenefits':True},E(0,['unused_ticket_refund'],regime='us',currency=None),sources=['source-us-refund-reg','source-dot-refund'])
case('US domestic significant delay declined travel', {'departure':'us','arrival':'us','carrier':'us','arrivalDelayMinutes':180,'declinedTravelAndBenefits':True},E(0,['unused_ticket_refund'],regime='us',currency=None),sources=['source-us-refund-reg','source-dot-refund'])
case('Delhi to Mumbai: current CAR unverified',{'departure':'in','arrival':'in','carrier':'in','airline':'IndiGo'},E(None,regime='in',currency=None,status='abstain'),'agent_inferred',[])
case('Uncovered foreign domestic route',{'departure':'other','arrival':'other','carrier':'other'},E(None,regime='uncovered',currency=None,status='abstain'),'agent_inferred',[])
case('EU unknown extraordinary circumstances evidence',{'extraordinaryEvidence':'unknown'},E(None,currency=None,status='abstain'),'agent_inferred')
# Held-out test set: frozen before tests/evaluation. No fitting to observed outputs.
case('UK care overnight',{'departure':'uk','arrival':'other','carrier':'uk','trigger':'care','departureDelayMinutes':120,'overnight':True},E(None,care+['hotel_and_transport'],regime='uk',currency='GBP'),sources=['source-uk261-xml'])
case('US no rerouting higher band', {**us,'reroutingOffered':False},E(800,regime='us',currency='USD'),sources=['source-us250'])
case('EU and UK both scope an EU–UK flight',{'departure':'eu','arrival':'uk','carrier':'uk'},E(250,regime='eu',currency='EUR'),sources=['source-eu261-original','source-uk261-xml'])
cases[-1]['expected']['additional']=[E(220,regime='uk',currency='GBP')]
case('India origin arriving EU on EU carrier',{'departure':'in','arrival':'eu','carrier':'eu'},E(250,regime='eu',currency='EUR',status='partial'),'primary_text',['source-eu261-original'])
cases[-1]['expected']['additional']=[E(None,regime='in',currency=None,status='abstain')]
case('Indian domestic cancellation gap',{'departure':'in','arrival':'in','carrier':'in','trigger':'cancellation','airline':'Air India'},E(None,regime='in',currency=None,status='abstain'),'agent_inferred',[])
case('Baggage outside scope',{'trigger':'baggage'},E(None,currency=None,status='abstain'),'agent_inferred')
case('Connecting itinerary outside engine scope',{'singleFlight':False},E(None,currency=None,status='abstain'),'agent_inferred')
case('Denied boarding voluntary surrender',{'trigger':'denied_boarding','involuntary':False},E(None,currency=None,status='abstain'),'agent_inferred')
case('US inbound oversales outside Part 250 scope',{'departure':'other','arrival':'us','carrier':'us','trigger':'denied_boarding'},E(None,regime='us',currency=None,status='abstain'),'primary_text',['source-us250'])
case('EU no confirmed reservation',{'confirmedBooking':False},E(None,currency=None,status='abstain'),'primary_text')
case('UK historical unverified version',{'departure':'uk','arrival':'other','carrier':'uk','flightDate':'2020-01-01'},E(None,regime='uk',currency=None,status='abstain'),'agent_inferred',['source-uk261-xml'])
case('EU check-in missed',{'checkedInOnTime':False},E(None,currency=None,status='abstain'),'primary_text')
assert len(cases)==40
for i,c in enumerate(cases):c['split']='dev' if i<28 else 'test'
(root/'eval/scenarios.json').write_text(json.dumps(cases,indent=2)+'\n')
seeds=[{'_id':c['id'],'_type':'scenario','title':c['title'],'split':c['split'],'verification':c['verification'],'input':c['input'],'expected':{k:v for k,v in c['expected'].items() if k!='additional'},'sources':[{'_type':'reference','_ref':s,'_key':f's{i}'} for i,s in enumerate(c['sources'])]} for c in cases]
(root/'data/import/scenarios-1.json').write_text(json.dumps(seeds,indent=2)+'\n')
assert (root/'data/import/scenarios-1.json').stat().st_size<100000
print('40 manually specified golden cases frozen: 28 dev / 12 test; no engine outputs used to set expectations.')
