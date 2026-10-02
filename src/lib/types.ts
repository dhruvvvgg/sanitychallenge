import {z} from 'zod';
export const region = z.enum(['eu','uk','in','us','other']);
export const scenarioSchema = z.object({
  departure: region, arrival: region, carrier: region,
  airline: z.string().max(80).default('Unspecified'),
  flightDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(s => !Number.isNaN(Date.parse(s)) && new Date(s).toISOString().slice(0,10) === s, 'Invalid date'),
  trigger: z.enum(['arrival_delay','cancellation','denied_boarding','care','refund','baggage']),
  distanceKm: z.number().finite().min(0).max(25000),
  arrivalDelayMinutes: z.number().int().min(0).max(100000),
  departureDelayMinutes: z.number().int().min(0).max(100000),
  cause: z.enum(['operational','technical','weather','atc','strike','unknown']),
  extraordinaryEvidence: z.enum(['proven','not_proven','unknown']),
  noticeHours: z.number().min(0).max(100000),
  confirmedBooking: z.boolean(), checkedInOnTime: z.boolean(), eligibleTicketAndAircraft: z.boolean().default(true),
  involuntary: z.boolean(), deniedReason: z.enum(['oversales','security','health','documentation','other']),
  aircraftSeats: z.number().int().min(1).max(1000),
  fare: z.number().finite().min(0).max(1000000), fareCurrency: z.enum(['USD','EUR','GBP','INR']),
  declinedTravelAndBenefits: z.boolean(), overnight: z.boolean(),
  reroutingOffered: z.boolean(), reroutedArrivalDelayMinutes: z.number().min(0).max(100000),
  reroutedDepartureEarlyMinutes: z.number().min(0).max(100000),
  receivedBenefitsAbroad: z.boolean(), singleFlight: z.boolean(),
});
export type Scenario = z.infer<typeof scenarioSchema>;
export type Ref = {_type:'reference'; _ref:string};
export type Source = {_id:string; _type:'source'; title:string; url:string; publisher:string; authorityTier:number; retrievedAt:string; licenseNote:string; evidencePath?:string; sha256?:string};
export type Band = {_id:string; _type:'entitlementBand'; regime:Ref; dimension:'distance_km'|'block_time_minutes'|'fare_percentage'|'fixed'; min:number; max:number|null; value:number; currency:string; multiplier?:number; cap?:number; intraEU?:boolean; reductionMinutes?:number; source:Ref};
export type Rule = {_id:string; _type:'rule'; title:string; regime:Ref; trigger:string; algorithm:string; verified:boolean; verificationStatus:string; paraphrase:string; thresholds:Record<string,number>; conditions:string[]; entitlements:string[]; bands:Ref[]; sources:Ref[]; effectiveFrom:string; effectiveTo?:string; claimDeadline:string; quote?:string};
export type Regime = {_id:string; _type:'regime'; key:string; instrument:string; applicability:{alternatives:{departure:string[]; arrival:string[]; carriers:string[]}[]}; effectiveFrom:string; sources:Ref[]};
export type CauseStance = {_id:string; _type:'causeStance'; regime:Ref; cause:Ref; stance:string; paraphrase:string; verified:boolean; sources:Ref[]};
export type CaseLaw = {_id:string; _type:'caseLaw'; title:string; holding:string; stances:Ref[]; sources:Ref[]; verified:boolean};
export type AirlinePolicy = {_id:string; _type:'airlinePolicy'; airline:string; title:string; summary:string; conflictsWith:Ref[]; sources:Ref[]; verified:boolean};
export type Document = Source | Band | Rule | Regime | CauseStance | CaseLaw | AirlinePolicy | {_id:string;_type:string;[key:string]:unknown};
export type Dataset = {sources:Source[]; bands:Band[]; rules:Rule[]; regimes:Regime[]; stances:CauseStance[]; cases:CaseLaw[]; policies:AirlinePolicy[]};
export type Finding = {regime:string; status:'assessed'|'abstain'; eligible:boolean|null; amount:number|null; currency:string|null; amountLabel:string; entitlements:string[]; met:string[]; unmet:string[]; uncertainties:string[]; ruleIds:string[]; sourceIds:string[]};
export type Ruling = {status:'assessed'|'partial'|'abstain'; findings:Finding[]; sources:Source[]; conflicts:{topic:string;left:{claim:string;source:Source};right:{claim:string;source:Source};resolution:string}[]; notice:string; computedBy:'compute_entitlement'|'baseline_calculator';};
