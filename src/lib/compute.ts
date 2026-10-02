import type {Dataset,Scenario,Finding,Ruling,Regime,Rule,Band} from './types';
const anyMatch = (values:string[],v:string) => values.includes('*') || values.includes(v);
export function applies(regime:Regime,s:Scenario) {
  return regime.applicability.alternatives.some(a=>anyMatch(a.departure,s.departure)&&anyMatch(a.arrival,s.arrival)&&anyMatch(a.carriers,s.carrier));
}
function bandFor(rule:Rule,s:Scenario,data:Dataset):Band|undefined {
  const bands=data.bands.filter(b=>rule.bands.some(r=>r._ref===b._id));
  const intra=s.departure==='eu'&&s.arrival==='eu';
  return bands.find(b=>b.dimension==='distance_km' && !!b.intraEU===intra && (b.min===0?s.distanceKm>=0:s.distanceKm>b.min)&&(b.max===null||s.distanceKm<=b.max))
    || bands.find(b=>b.dimension==='distance_km'&&!b.intraEU&&(b.min===0?s.distanceKm>=0:s.distanceKm>b.min)&&(b.max===null||s.distanceKm<=b.max));
}
function reference(f:Finding,rule:Rule) {
 f.ruleIds.push(rule._id);f.sourceIds.push(...rule.sources.map(r=>r._ref));
}
function unknown(f:Finding,reason:string) {f.status='abstain';f.eligible=null;f.amount=null;f.currency=null;f.amountLabel='Not determined';f.uncertainties.push(reason);}
function cash(f:Finding,value:number,currency:string,label='Statutory compensation') {f.eligible=value>0;f.amount=value;f.currency=currency;f.amountLabel=label;if(value>0)f.entitlements.push('compensation');}
function usable(rule:Rule|undefined,s:Scenario) {return !!rule&&rule.verified&&s.flightDate>=rule.effectiveFrom&&(!rule.effectiveTo||s.flightDate<=rule.effectiveTo);}
/** Pure computation: all monetary bands and legal thresholds come from content documents. */
export function compute_entitlement(s:Scenario,data:Dataset):Ruling {
 const findings:Finding[]=[];
 const matching=data.regimes.filter(r=>applies(r,s));
 for(const regime of matching) {
  const f:Finding={regime:regime.key,status:'assessed',eligible:false,amount:0,currency:null,amountLabel:'No fixed compensation',entitlements:[],met:[],unmet:[],uncertainties:[],ruleIds:[],sourceIds:regime.sources.map(r=>r._ref)};
  findings.push(f);
  if(s.trigger==='baggage'||!s.singleFlight) {unknown(f,s.trigger==='baggage'?'Baggage is outside this corpus.':'Connecting itineraries need a separate scope analysis; this engine covers single flights.');continue;}
  if(s.flightDate > new Date().toISOString().slice(0,10)) {unknown(f,'Future flight: rules have not been verified for that date.');continue;}
  if(!s.eligibleTicketAndAircraft) {unknown(f,'Non-public concession/staff fares or non-covered aircraft need individual scope review.');continue;}
  if(!s.confirmedBooking || (!s.checkedInOnTime && s.trigger!=='cancellation')) {unknown(f,'Confirmed reservation and applicable check-in conditions are not established.');continue;}
  f.met.push('Route and operating-carrier scope match','Confirmed reservation');
  if(s.trigger!=='cancellation')f.met.push('Check-in deadline met');
  if((regime.key==='eu' && s.departure!=='eu' || regime.key==='uk' && s.departure!=='uk')&&s.receivedBenefitsAbroad) {unknown(f,'Benefits already received abroad may exclude this inbound claim. Individual review needed.');continue;}
  const rules=data.rules.filter(r=>r.regime._ref===regime._id);
  const rule=rules.find(r=>r.trigger===s.trigger);
  if(!usable(rule,s)) {unknown(f,'No verified rule for this disruption and date in the current corpus.');continue;}
  reference(f,rule!);
  const t=rule!.thresholds;
  if(regime.key==='eu'||regime.key==='uk') {
   const band=bandFor(rule!,s,data);
   if(!band) {unknown(f,'No verified distance band; check great-circle distance.');continue;}
   f.sourceIds.push(band.source._ref);
   if(!Number.isFinite(band.value)||band.value<0) {unknown(f,'The entitlement band is invalid.');continue;}
   f.currency=band.currency;
   if(s.trigger==='denied_boarding'&&(!s.involuntary||s.deniedReason!=='oversales')) {unknown(f,'Voluntary surrender or reasonable boarding refusal needs individual review.');continue;}
   // Care is independent of extraordinary-circumstances compensation defenses.
   const care=rules.find(r=>r.trigger==='care');
   if(usable(care,s)) {
    reference(f,care!);
    const ct=care!.thresholds;
    const threshold=s.distanceKm<=ct.shortDistance?ct.shortMinutes:(regime.key==='eu'&&s.departure==='eu'&&s.arrival==='eu'||s.distanceKm<=ct.mediumDistance)?ct.mediumMinutes:ct.longMinutes;
    if(s.trigger==='cancellation'||s.trigger==='denied_boarding'||s.departureDelayMinutes>=threshold) {
     f.entitlements.push('meals_and_refreshments','communications');
     if(s.overnight)f.entitlements.push('hotel_and_transport');
     f.met.push('Care trigger met; reasonable waiting-time assistance');
    } else f.unmet.push('Departure-delay threshold for care not reached');
   }
   const refund=rules.find(r=>r.trigger==='refund');
   if(usable(refund,s)) {
    reference(f,refund!);
    if(s.trigger==='cancellation'||s.trigger==='denied_boarding') f.entitlements.push('refund_or_rerouting_choice');
    else if(s.departureDelayMinutes>=refund!.thresholds.departureMinutes&&s.declinedTravelAndBenefits)f.entitlements.push('unused_ticket_refund');
   }
   if(s.trigger==='arrival_delay'&&s.declinedTravelAndBenefits) {unknown(f,'Arrival-delay compensation requires a covered final-arrival delay for the passenger. You declined travel; care/refund are separate and the fixed award is not determined.');continue;}
   if(s.trigger==='care'||s.trigger==='refund') {f.amount=null;f.eligible=null;f.amountLabel='Care / refund assessed separately; ticket value not computed';continue;}
   if(s.trigger==='denied_boarding') {
    if(!s.involuntary) {unknown(f,'Voluntary surrender is negotiated separately; no fixed involuntary denied-boarding award.');continue;}
    if(s.deniedReason!=='oversales') {unknown(f,'Health, safety, documents or another reason requires individual denied-boarding review.');continue;}
    f.met.push('Involuntary oversales denial');
   } else {
    if(s.trigger==='arrival_delay'&&s.arrivalDelayMinutes<t.arrivalMinutes) {f.unmet.push('Arrival delay below compensation threshold');continue;}
    if(s.trigger==='cancellation') {
     const noticeExempt = s.noticeHours>=t.noticeLongHours || s.reroutingOffered && (
       s.noticeHours>=t.noticeMediumHours && s.reroutedDepartureEarlyMinutes<=t.mediumEarlyMinutes && s.reroutedArrivalDelayMinutes<t.mediumArrivalMinutes ||
       s.noticeHours<t.noticeMediumHours && s.reroutedDepartureEarlyMinutes<=t.shortEarlyMinutes && s.reroutedArrivalDelayMinutes<t.shortArrivalMinutes);
     if(noticeExempt) {f.unmet.push('Advance notice / offered rerouting exception applies');continue;}
     f.met.push('Notice and rerouting do not meet a compensation exception');
    }
    const stance=data.stances.find(x=>x.regime._ref===regime._id&&x.cause._ref===`cause-${s.cause}`&&x.verified);
    if(stance) {f.sourceIds.push(...stance.sources.map(x=>x._ref));f.met.push(stance.paraphrase);}
    if(s.extraordinaryEvidence==='proven') {f.unmet.push('Carrier extraordinary-circumstances defense proven, including reasonable measures');continue;}
    if(s.extraordinaryEvidence==='unknown') {unknown(f,'Carrier defense is unverified. Cause labels alone cannot settle extraordinary circumstances; care and refund findings remain.');continue;}
    f.met.push('No proven extraordinary-circumstances defense');
   }
   let value=band.value;
   if(s.reroutingOffered&&s.reroutedArrivalDelayMinutes<=(band.reductionMinutes??-1)) {value*=t.reductionFraction;f.met.push('Permitted rerouting reduction applied');}
   else if(regime.key==='eu'&&s.trigger==='arrival_delay'&&band.value===t.longBandValue&&s.arrivalDelayMinutes<t.longReductionBelowMinutes) {value*=t.reductionFraction;f.met.push('Long-distance arrival-delay reduction applied');}
   cash(f,value,band.currency);
  } else if(regime.key==='us') {
   if(rule!.algorithm==='us_oversales') {
    if(s.departure!=='us') {unknown(f,'US oversales compensation covers flights departing the US, not this inbound flight.');continue;}
    if(!s.involuntary||s.deniedReason!=='oversales'||s.aircraftSeats<t.minimumSeats) {unknown(f,'Oversales, involuntary denial, or covered aircraft conditions not established.');continue;}
    if(s.fareCurrency!=='USD'||s.fare<=0) {unknown(f,'Positive USD fare to first stopover / destination is required; award tickets need a separate comparable-fare check.');continue;}
    f.met.push('US-origin involuntary oversales; covered aircraft; fare supplied');
    // Regulation controls: exactly 2h domestic / 4h international is the higher band.
    const delay=s.reroutingOffered?s.reroutedArrivalDelayMinutes:Infinity;
    if(delay<=t.noCompensationMinutes) {f.unmet.push('Alternate transport offered within the no-compensation window');continue;}
    const high=!s.reroutingOffered||delay>=(s.arrival==='us'?t.domesticHighMinutes:t.internationalHighMinutes);
    const b=data.bands.find(b=>rule!.bands.some(r=>r._ref===b._id)&&b.multiplier===(high?t.highMultiplier:t.lowMultiplier));
    if(!b) {unknown(f,'Required fare band is missing.');continue;}
    f.sourceIds.push(b.source._ref);cash(f,Math.round(Math.min(s.fare*(b.multiplier||0),b.cap??Infinity)*100)/100,b.currency,'Statutory minimum (carrier may pay more)');
   } else {
    if(s.declinedTravelAndBenefits&&s.trigger!=='cancellation')f.uncertainties.push('Refund depends on the changed scheduled arrival, not an actual delay after travel. The supplied delay must describe the carrier’s revised schedule.');
    f.unmet.push('No general federal fixed compensation mandate for ordinary flight delay or cancellation');
    if(s.declinedTravelAndBenefits && (s.trigger==='cancellation'||s.arrivalDelayMinutes>=(s.departure==='us'&&s.arrival==='us'?t.domesticRefundMinutes:t.internationalRefundMinutes)))f.entitlements.push('unused_ticket_refund');
    else f.unmet.push('Refund requires cancellation/significant change and declining travel and benefits');
    f.amountLabel='No general fixed delay award; airline commitments may add rights';
    f.uncertainties.push('Airline-specific care commitments and non-time schedule changes are not adjudicated here.');
   }
  } else unknown(f,'Current DGCA CAR revision could not be verified; Indian entitlements are not determined.');
 }
 if(!findings.length) findings.push({regime:'uncovered',status:'abstain',eligible:null,amount:null,currency:null,amountLabel:'Not determined',entitlements:[],met:[],unmet:[],uncertainties:['No regime in the verified corpus covers this route and carrier.'],sourceIds:[],ruleIds:[]});
 for(const f of findings) {
  if(f.status==='assessed' && f.sourceIds.some(id=>!data.sources.some(source=>source._id===id))) {unknown(f,'A cited primary source is missing from the dataset.');f.entitlements=[];}
  if(f.amount!==null&&!Number.isFinite(f.amount)) {unknown(f,'A monetary input or source band is invalid.');f.entitlements=[];}
  f.sourceIds=[...new Set(f.sourceIds)];f.ruleIds=[...new Set(f.ruleIds)];f.entitlements=[...new Set(f.entitlements)];}
 const sources=data.sources.filter(x=>findings.some(f=>f.sourceIds.includes(x._id)));
 const conflicts:Ruling['conflicts']=[];
 const statute=sources.find(x=>x._id==='source-us250');const guidance=sources.find(x=>x._id==='source-dot-denied');
 if(statute&&guidance&&s.trigger==='denied_boarding'&&s.departure==='us'&&s.reroutingOffered&&s.reroutedArrivalDelayMinutes===(data.rules.find(r=>r.algorithm==='us_oversales')?.thresholds[s.arrival==='us'?'domesticHighMinutes':'internationalHighMinutes']))conflicts.push({topic:'Exact rerouting-delay boundary',left:{claim:'Regulation puts exactly two hours domestic / four hours international in the higher band.',source:statute},right:{claim:'DOT consumer table says “1 to 2” / “1 to 4” and “over”, which obscures the exact boundary.',source:guidance},resolution:'Use 14 CFR 250.5, the higher-authority operative rule.'});
 return {status:findings.every(f=>f.status==='abstain')?'abstain':findings.some(f=>f.status==='abstain')?'partial':'assessed',findings,sources,conflicts,computedBy:'compute_entitlement',notice:'Information, not legal advice. Conditional on the facts supplied. Separate overlapping regimes are not additive; do not recover twice for the same loss.'};
}
