# Evaluation results

Run: 2026-10-02T21:44:18.659Z. This report labels actual mode and backend; no live Sanity or Context claim is implied by local scores.

| Method | Runtime mode / content | Primary cases | Eligibility | Amount | Entitlement-set F1 | Citation metadata validity | Correct abstention |
|---|---|---:|---:|---:|---:|---:|---:|
| D | DETERMINISTIC / LOCAL_SNAPSHOT | 32 | 100.0% | 100.0% | 100.0% | 100.0% | 100.0% |
| B1 | DETERMINISTIC / LOCAL_SNAPSHOT | 32 | 46.9% | 43.8% | 48.4% | 100.0% | 46.9% |

- B0: not run: no LLM key
- STRUCTURED_AGENT: not run: no LLM key
- B2: not run: Context/LLM bindings unavailable

## Method

Forty prospectively specified cases; frozen 28 development / 12 held-out test split. 12 cases expect partial/total abstention. Rule code was validated on development cases before the held-out evaluation; no fitting to test results. Headline metrics use only verification=primary_text; coverage-policy abstentions labeled agent_inferred are excluded. Report separately below. Official regulator guidance and worked statutory conditions are primary evidence here; EU arrival-delay expectations also use labeled official court announcements rather than full judgments.

D uses the structured GROQ dossier and pure compute function. B1 ranks the same source-page text with normalized keyword frequency, keeps rules attached to the best source, and uses the same arithmetic function. This isolates retrieval and keeps numbers in code. B1 retains shared band/regime metadata, so it is a stronger baseline than plain keyword search alone. For absent ignored downloads it uses own-words corpus sections; this fallback is a reproducibility limit, not live retrieval. B0, when a key exists, receives facts only and selects symbolic bands and entitlements from prior knowledge. A shared code calculator supplies numeric awards after selection; the model never emits monetary amounts. B0 is an evaluation-only hybrid, not the usual free-form monetary LLM baseline. It is not run without credentials. B2/STRUCTURED_AGENT run only if getCapabilities exposes the required bindings; errors are failures, never local fallback.

Citation validity means a cited URL/hash matches a successfully retrieved evidence record. It does not measure independent legal entailment or continuing freshness. Set F1 is macro-averaged per expected regime; two empty sets count as one. Eligibility is fixed-compensation eligibility, not a claim that no other rights exist. Expected/actual sets, amounts, sources and errors are retained in eval/runs/latest.json.

## Failures and limits

- D: none on this finite suite
- B1: scenario-02, scenario-03, scenario-04, scenario-05, scenario-06, scenario-07, scenario-08, scenario-10, scenario-11, scenario-13, scenario-14, scenario-15, scenario-16, scenario-17, scenario-24, scenario-29, scenario-31, scenario-32

- D held-out primary cases: 7; amount 100.0%; entitlement F1 100.0%; all-case correct abstention 100.0%
- B1 held-out primary cases: 7; amount 57.1%; entitlement F1 64.3%; all-case correct abstention 57.5%

India CAR, full judgments, requested airline breadth, non-time schedule changes, connecting flights, claim deadlines and future/historical law remain coverage gaps. Forty small curated cases are not a legal accuracy benchmark. Local backend validation does not satisfy the challenge requirement to query real Sanity content; deployment/import and FULL eval remain in HANDOFF.md.
