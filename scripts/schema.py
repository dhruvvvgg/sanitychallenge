from pathlib import Path
import json
root=Path(__file__).resolve().parent.parent
schemas=[]
def f(n,t='string',**kw):return {'name':n,'title':n,'type':t,**kw}
def refs(n,types):return f(n,'array',of=[{'type':'reference','to':[{'type':t} for t in types]}])
def ref(n,t):return f(n,'reference',to=[{'type':t}])
def strings(n):return f(n,'array',of=[{'type':'string'}])
def typ(n,fields):schemas.append({'name':n,'title':n,'type':'document','fields':fields})
typ('source',[f('title'),f('url','url'),f('publisher'),f('authorityTier','number'),f('retrievedAt','datetime'),f('licenseNote','text'),f('evidencePath'),f('sha256')])
a=f('alternatives','array',of=[{'type':'object','name':'scopeAlternative','fields':[strings('departure'),strings('arrival'),strings('carriers')]}])
typ('regime',[f('key',options={'list':['eu','uk','in','us']}),f('instrument'),f('applicability','object',fields=[a]),f('effectiveFrom','date'),refs('sources',['source'])])
typ('entitlementBand',[ref('regime','regime'),f('dimension',options={'list':['distance_km','block_time_minutes','fare_percentage','fixed']}),f('min','number'),f('max','number'),f('value','number'),f('currency'),f('multiplier','number'),f('cap','number'),f('intraEU','boolean'),f('reductionMinutes','number'),f('note','text'),ref('source','source')])
thresholds=['arrivalMinutes','reductionFraction','longBandValue','longReductionBelowMinutes','noticeLongHours','noticeMediumHours','mediumEarlyMinutes','mediumArrivalMinutes','shortEarlyMinutes','shortArrivalMinutes','shortDistance','mediumDistance','shortMinutes','mediumMinutes','longMinutes','departureMinutes','minimumSeats','noCompensationMinutes','domesticHighMinutes','internationalHighMinutes','lowMultiplier','highMultiplier','domesticRefundMinutes','internationalRefundMinutes']
typ('rule',[f('title'),ref('regime','regime'),f('trigger',options={'list':['arrival_delay','cancellation','denied_boarding','care','refund']}),f('algorithm'),f('thresholds','object',fields=[f(n,'number') for n in thresholds]),strings('conditions'),strings('entitlements'),refs('bands',['entitlementBand']),refs('sources',['source']),f('claimDeadline','text'),f('paraphrase','text'),f('quote','text'),f('verified','boolean'),f('verificationStatus'),f('effectiveFrom','date'),f('effectiveTo','date')])
typ('cause',[f('key'),f('title')])
typ('causeStance',[ref('regime','regime'),ref('cause','cause'),f('stance',options={'list':['exempts','does_not_exempt','contested','unspecified']}),f('paraphrase','text'),refs('sources',['source']),f('verified','boolean')])
typ('caseLaw',[f('title'),f('holding','text'),refs('stances',['causeStance']),refs('sources',['source']),f('verified','boolean'),f('verificationStatus')])
typ('airlinePolicy',[f('title'),f('airline'),f('summary','text'),refs('conflictsWith',['rule']),refs('sources',['source']),f('verified','boolean')])
# Scenario input fields follow the API, not opaque serialized blobs.
sc=[f('departure'),f('arrival'),f('carrier'),f('airline'),f('flightDate','date'),f('trigger'),f('cause'),f('extraordinaryEvidence'),f('fareCurrency'),f('deniedReason')]
sc += [f(n,'number') for n in ['distanceKm','arrivalDelayMinutes','departureDelayMinutes','noticeHours','aircraftSeats','fare','reroutedArrivalDelayMinutes','reroutedDepartureEarlyMinutes']]
sc += [f(n,'boolean') for n in ['confirmedBooking','checkedInOnTime','involuntary','declinedTravelAndBenefits','overnight','reroutingOffered','receivedBenefitsAbroad','singleFlight']]
typ('scenario',[f('title'),f('split'),f('verification'),f('input','object',fields=sc),refs('sources',['source']),f('expected','object',fields=[f('status'),f('regime'),f('amount','number'),f('currency'),strings('entitlements')])])
typ('gap',[f('category'),f('reason','text'),f('mode'),f('backend'),f('createdAt','datetime'),f('regime')])
typ('corpusDoc',[f('title'),f('url','url'),f('publisher'),f('tier','number'),f('markdown','text'),f('retrievedAt','datetime')])
(root/'schema/types.json').write_text(json.dumps(schemas,indent=2)+'\n')
print('12 plain schema types; no Studio project or sanity.config file.')
