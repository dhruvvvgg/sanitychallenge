# Handoff

The local application and deterministic suite are complete for bounded reviewed coverage. Live Sanity project/schema/corpus/KB/Studio creation did not run because no Sanity MCP tools were exposed to this cloud session. The challenge's real-content requirement is not satisfied by the local snapshot. Do not submit a post claiming otherwise. Do not paste keys into chat or commit them; all `.env*` files are ignored.

## 1. Context app: create/build KB, resolve Issues

First perform the authenticated project/dataset/schema/import steps in **KB_SETUP.md**, using the installed Sanity plugin in a session that exposes its tools. Project `disruption-desk`; `production` public, `corpus` private. Deploy plain `schema/types.json` through `deploy_schema`, then `deploy_studio`, create/publish all prepared batches, and verify refs/counts with `query_documents`. Do not overwrite pre-existing user data. Payload budget: 133 total documents.

In Context, create **Passenger rights corpus**, bind `*[_type=="corpusDoc"]` from private `corpus`, and build. Verify import count, entry count and actual Issues. Use `CONFLICT_WATCHLIST.md` as review guidance; persist real decisions in the Issues interface. An absent queue is not a resolved queue. Current official CLI forms and Dashboard path are in **KB_SETUP.md**. If Context reports no schema, note and repair through supported MCP schema deployment.

India, full judgments and missing airlines remain explicit gaps. Add a current primary DGCA CAR only after verifying its revision and exact block-time/fare bases. Do not mark a new rule verified from a carrier page. Remove the Indian abstention policy only in a separately reviewed corpus/engine change with primary expectations; do not expand into baggage or other regimes.

## 2. Create two MCP endpoints and record names/URLs

Context app → MCPs → create a KB-mode MCP serving the built KB, then a GROQ-mode MCP serving project `disruption-desk`, dataset `production`. Record real names in `SANITY_CONTEXT_ENDPOINT_NAMES` (comma separated), and HTTPS URLs in `SANITY_KB_MCP_URL` / `SANITY_DATA_MCP_URL`. Scope the public GROQ endpoint to the source/regime/rule/band/cause/stance/case/policy documents needed by this app. Verify `knowledge_base_read` and `groq_query` tools are exposed. No endpoint is fabricated in this repository.

## 3. Create Context Viewer organization token and add an LLM key

Sanity organization settings → API → Tokens → create an appropriate Context Viewer/read scope. Store as server-only `SANITY_ORGANIZATION_TOKEN`. Add one provider key securely (`GOOGLE_GENERATIVE_AI_API_KEY`, `ANTHROPIC_API_KEY` or `OPENAI_API_KEY`); never send values through chat. Set `SANITY_ORGANIZATION_ID` for Insights. The real integration is wired in `src/lib/agent.ts`; deploy the scheduled classification function from the fetched official Insights guide if classifications are required. Do not claim classification from telemetry alone. No PII enters the agent/telemetry prompt.

## 4. Import repository into Vercel and set variables

Local commits have not been pushed. Publish the repository through your normal Git workflow, then import it into Vercel using the Next.js preset. Use Node 24, the frozen pnpm lockfile, and `pnpm build`. Set all server-only bindings from `env.example`, plus the actual `SANITY_PROJECT_ID` and `SANITY_DATASET=production`. Never use a `NEXT_PUBLIC_` prefix for secrets. Check public-read scope by loading the app: it must show **SANITY_LIVE**, not **LOCAL_SNAPSHOT**.

For durable gap documents, create a separate least-privilege project write token and bind `SANITY_WRITE_TOKEN`; read-only Context does not perform writes. Without that binding, local gap persistence is explicitly limited. Set `GAP_STORAGE_DIR=/tmp/disruption-desk-gaps` for serverless diagnostic fallback. The provided in-process IP limiter is adequate for a demo, not a distributed quota; use a shared limiter before high-volume production operation.

## 5. Run `pnpm eval` again in FULL mode

Set the complete bindings through your secure process environment. Confirm `getCapabilities()` selects FULL and the backend is SANITY_LIVE. Run tests, typecheck, build, and `pnpm eval`. B2 must perform both real Context retrievals plus code computation. B0 and B2 are not run in the checked-in local report. Every live error is reported as a failure; no silent mode switch is permitted. Check the newly timestamped raw run and EVAL_RESULTS.md. Preserve held-out expectations and do not tune on test. Runtime imports must contain all referenced metadata, bands and verified rules.

## 6. Spot-check these ten scenarios against primary text

| Scenario | Primary text to check | Expected reviewed behavior |
|---|---|---|
| 01 EU short route at three hours | EU Articles 3/7; Sturgeon official announcement (then full judgment) | €250, subject to supplied eligibility/defense facts |
| 06 Intra-EU flight over 3500 km | EU Article 7(1)(b) | €400 middle intra-EU band |
| 08 Weather defense and departure waiting | EU Articles 5/6/9 | No fixed award if defense proven; care still assessed |
| 09 Cancellation at fourteen days notice | EU Article 5(1)(c)(i) | No fixed compensation; refund/rerouting and care separate |
| 12 Ten-day notice, offered arrival exactly four hours late | EU Article 5(1)(c)(ii) | Exception requires less than four hours; fixed award still possible |
| 14 Denied boarding, rerouting within two hours | EU Articles 4/7(2) | Short-band 50% reduction (€125) |
| 15 Current UK short-distance flight | UK Articles 3/6(3)–(4)/7 | £220 based on fetched consolidated text |
| 20 US domestic rerouting exactly two hours | 14 CFR 250.5(a)(3) | Higher band: 400% fare, capped $2,150; table tension visible |
| 24 US cancellation, declined travel and benefits | 14 CFR 260.6; DOT refunds guidance | Refund entitlement; no general fixed cancellation award |
| 32 India-origin flight arriving EU on EU carrier | EU Article 3; current DGCA CAR still needed | EU finding may apply; Indian finding explicitly undetermined, no double recovery |

Also spot-check EU/UK overlap case 31 and Indian domestic case 26 when reviewing gaps. These checks are required before representing the result as a legal accuracy demonstration.

## 7. Upload agent session and publish

Save/share the session through the product's normal controls, insert its embed into **SUBMISSION.md**, replace `[DEMO_URL]`, `[CODE_URL]`, `[SANITY_PROJECT_ID]` and `[AGENT_SESSION_EMBED]`, and publish the DEV draft only after the real Sanity content path is verified. Include tags `devchallenge, sanitychallenge, sanity, ai`. Keep mode/backend labels, evaluation limits, Indian gaps, source-summary status and actual unrun modes visible. Product environment publication is a separate user action; saving configuration does not publish an app or snapshot.
