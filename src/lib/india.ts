import type {Dataset,Scenario,Finding,Rule} from './types';

const usable=(r:Rule|undefined,s:Scenario):r is Rule=>!!r&&r.verified&&s.flightDate>=r.effectiveFrom&&(!r.effectiveTo||s.flightDate<=r.effectiveTo);
function cite(f:Finding,r:Rule){f.ruleIds.push(r._id);f.sourceIds.push(...r.sources.map(x=>x._ref));}
function abstain(f:Finding,reason:string){f.status='abstain';f.eligible=null;f.amount=null;f.currency=null;f.amountLabel='Not determined';f.uncertainties.push(reason);}
function award(f:Finding,n:number){f.amount=Math.round(n*100)/100;f.currency='INR';f.eligible=n>0;f.amountLabel='CAR compensation; ticket refund is separate';if(n>0)f.entitlements.push('compensation');}

/** CAR Part IV, Rev.4; content supplies thresholds and bands, facts supply the basis. */
export function assessIndia(s:Scenario,data:Dataset,f:Finding){
 const rules=data.rules.filter(r=>r.regime._ref==='regime-in');
 const rule=rules.find(r=>r.trigger===s.trigger);
 if(!usable(rule,s)){abstain(f,'No verified Indian rule for this disruption and flight date.');return;}
 cite(f,rule);
 f.uncertainties.push('Claim with the operating airline first; escalate to its nodal/appellate officer and AirSewa. Statutory bodies or courts remain available under applicable law.');
 if(s.trigger==='baggage'){
  f.entitlements.push('baggage_claim_guidance');
  abstain(f,'Baggage is a claim for evidenced damage, not an automatic fixed payout. Report it to the airline, keep the baggage report and receipts. Domestic and international liability regimes differ; treaty scope, custody/fault, declarations, defenses and complaint deadlines require individual review. See the cited Act and current ICAO limits.');
  return;
 }
 if(!s.eligibleTicketAndAircraft||!s.confirmedBooking||(!s.checkedInOnTime&&s.trigger!=='cancellation')){abstain(f,'Confirm covered carriage, reservation and applicable check-in conditions.');return;}
 f.met.push('India route within CAR scope','Confirmed reservation');
 const t=rule.thresholds;
 const refund=rules.find(r=>r.trigger==='refund');
 if(usable(refund,s)){
  cite(f,refund);
  f.uncertainties.push('Refund process: credit-card refunds within seven days; cash immediately at the selling airline office; agent/portal refunds within 14 working days. Credit shells are the passenger’s choice. Refundable statutory taxes/airport charges apply even to non-refundable fares.');
 }
 if(!s.singleFlight){
  const denied=s.trigger==='denied_boarding'&&s.disruptedFirstLeg==='yes';
  const cancelled=s.trigger==='cancellation'&&s.sameTicketConnection==='yes'&&s.missedConnection==='yes';
  if(!denied&&!cancelled){abstain(f,'Supported connections: denied boarding on the first leg with final arrival at least three hours late, or a missed same-ticket connection under CAR cancellation provisions. Separate tickets and delay-only connections require individual review.');return;}
  f.met.push(denied?'Denied boarding on first leg; final-arrival connection threshold met':'Missed connection on the same ticket');
 }
 if(s.trigger==='denied_boarding'){
  if(!s.involuntary||s.deniedReason!=='oversales'){abstain(f,'CAR fixed denied-boarding compensation requires involuntary oversales, not a safety, health, document or voluntary refusal.');return;}
  if(!s.singleFlight&&s.arrivalDelayMinutes<t.connectionMinutes){f.met=f.met.filter(x=>!x.includes('final-arrival connection threshold'));f.unmet.push('Connecting denied-boarding claim requires final arrival at least three hours late');return;}
  if(s.carrier!=='in'){abstain(f,'Foreign-carrier compensation may follow its country-of-origin rules or CAR 3.6.1; the governing award requires review.');return;}
  if(s.acceptedAlternate==='unknown'){abstain(f,'State whether you chose the alternative flight.');return;}
  if(s.acceptedAlternate==='yes'&&(!s.reroutingOffered||s.alternateDepartureDelayMinutes===undefined)){abstain(f,'Accepted alternative requires its scheduled departure delay, not arrival delay.');return;}
  if(s.acceptedAlternate==='yes'&&s.alternateDepartureDelayMinutes!<=t.noCompensationMinutes){f.unmet.push('Alternative scheduled to depart within one hour; no fixed CAR award');return;}
  if(s.basicFareAndFuelINR===undefined){abstain(f,'Supply booked one-way basic fare plus airline fuel charge in INR; total fare including taxes is not the basis.');return;}
  const high=s.acceptedAlternate==='no'||s.alternateDepartureDelayMinutes!>t.departureMinutes;
  const band=data.bands.find(b=>rule.bands.some(r=>r._ref===b._id)&&b.multiplier===(high?t.highMultiplier:t.lowMultiplier));
  if(!band||band.cap===undefined||!Number.isFinite(band.cap)||band.cap<0||!Number.isFinite(band.multiplier)){abstain(f,'Verified Indian fare band is missing or invalid.');return;}
  f.sourceIds.push(band.source._ref);
  if(s.acceptedAlternate==='no')f.entitlements.push('unused_ticket_refund');
  award(f,Math.min(s.basicFareAndFuelINR*band.multiplier!,band.cap));return;
 }
 if(s.trigger==='cancellation'){
  f.entitlements.push('refund_or_rerouting_choice');
  if(s.acceptedAlternate==='yes'&&!s.reroutingOffered){abstain(f,'An accepted alternative conflicts with the answer that none was offered; check the flight facts.');return;}
  if(s.acceptedAlternate==='no')f.entitlements.push('unused_ticket_refund');
  if(s.checkedInOnTime&&s.reroutingOffered)f.entitlements.push('meals_and_refreshments');
  if(s.contactProvided==='no'){f.unmet.push('No financial compensation without adequate booking contact information');return;}
  if(s.singleFlight&&s.noticeHours>=t.noticeMediumHours){f.unmet.push('At least 24 hours notice; alternate flight or refund remains available');return;}
  if(s.extraordinaryEvidence==='proven'){f.unmet.push('Proven extraordinary-circumstances defense excludes cancellation compensation');return;}
  if(s.extraordinaryEvidence==='unknown'){abstain(f,'Cancellation defense is unverified; refund or alternate-flight choice remains.');return;}
  if(s.acceptedAlternate==='yes'){f.unmet.push('Accepted alternative flight under the CAR cancellation choice');return;}
  if(s.contactProvided==='unknown'||s.acceptedAlternate==='unknown'){abstain(f,'Confirm booking contact information and whether you chose an alternative flight.');return;}
  if(s.carrier!=='in'){abstain(f,'Foreign-carrier compensation under CAR 3.6.1 requires review of its home rules or CAR award.');return;}
  if(s.blockTimeMinutes===undefined||s.basicFareAndFuelINR===undefined){abstain(f,'Supply scheduled block time and booked one-way basic fare plus fuel charge in INR.');return;}
  const band=data.bands.find(b=>rule.bands.some(r=>r._ref===b._id)&&b.dimension==='block_time_minutes'&&(b.min===0?s.blockTimeMinutes!>0:s.blockTimeMinutes!>b.min)&&(b.max===null||s.blockTimeMinutes!<=b.max));
  if(!band||!Number.isFinite(band.value)||band.value<0){abstain(f,'Verified block-time compensation band is missing or invalid.');return;}
  f.sourceIds.push(band.source._ref);f.entitlements.push('unused_ticket_refund');award(f,Math.min(band.value,s.basicFareAndFuelINR));return;
 }
 // Delay creates specified assistance/choices, not a general fixed arrival-delay award.
 f.amountLabel='No fixed CAR delay award; assistance and refund assessed separately';
 const care=rules.find(r=>r.trigger==='care');
 if(!usable(care,s)){abstain(f,'Verified Indian assistance rule is missing.');return;}
 cite(f,care);const ct=care.thresholds;
 if(s.departure==='in'&&s.arrival==='in'&&s.departureDelayMinutes>ct.domesticRefundMinutes){f.entitlements.push('refund_or_rerouting_choice');f.uncertainties.push('For an expected domestic delay beyond six hours, the airline must offer an alternative within six hours or a full ticket refund.');}
 if(s.trigger==='refund'){
  f.amount=null;f.eligible=null;f.amountLabel='Refund process and choices; no fixed award';
  if(!f.entitlements.length)f.uncertainties.push('Refund procedure does not itself create a full-ticket refund for every delay; taxes/airport charges remain refundable for unused tickets.');
  return;
 }
 if(s.extraordinaryEvidence==='proven'){f.unmet.push('CAR 3.4.4 excludes delay assistance for unavoidable extraordinary circumstances');return;}
 if(s.extraordinaryEvidence==='unknown'){abstain(f,'The delay defense must be assessed before CAR assistance is determined.');return;}
 if(s.blockTimeMinutes===undefined){abstain(f,'Supply scheduled block time to assess the departure-delay care threshold.');return;}
 const wait=s.blockTimeMinutes<=ct.shortBlockMinutes?ct.shortMinutes:s.blockTimeMinutes<=ct.mediumBlockMinutes?ct.mediumMinutes:ct.longMinutes;
 if(s.departureDelayMinutes>=wait)f.entitlements.push('meals_and_refreshments');else f.unmet.push('Departure-delay threshold for meals not reached');
 if(s.departureDelayMinutes>ct.hotelMinutes||s.departureDelayMinutes>ct.nightHotelMinutes&&s.scheduledNightDeparture==='yes')f.entitlements.push('hotel_and_transport');
 else if(s.departureDelayMinutes>ct.nightHotelMinutes&&s.scheduledNightDeparture==='unknown')f.uncertainties.push('Hotel eligibility also depends on original departure between 20:00 and 03:00; supply the night-departure condition.');
}
