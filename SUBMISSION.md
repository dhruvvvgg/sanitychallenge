---
title: "Disruption Desk: flight rights with a paper trail"
tags: devchallenge, sanitychallenge, sanity, ai
published: false
---

<!-- Draft for DEV x Sanity Challenge, Path One. The supplied brief says Oct 4, 11:59 PM PDT. Verify the official deadline before submission. Do not publish this as a live-Sanity project until HANDOFF.md is completed. -->

## What I Built

Disruption Desk turns a flight disruption into a sourced, conditional ruling: the applicable jurisdictions, amounts calculated in code, assistance/refund choices, conditions met and unmet, and the places where evidence runs out. No login and no personal details.

The most useful answer is sometimes “not determined”. A vague weather claim is not proof of extraordinary circumstances; a carrier contract is not a substitute for current Indian law. The desk preserves those distinctions.

## Demo

[DEMO_URL]

Try the EU short-route example, the exact US two-hour oversales boundary, and an Indian domestic flight. The first yields a conditional computed award; the second puts the regulation beside the less precise consumer table; the third openly identifies the unverified CAR gap.

**Current validation:** local DETERMINISTIC / LOCAL_SNAPSHOT. The app runs and its prepared corpus is reviewed, but there is no public deployment yet. After handoff, replace this paragraph with the actual live Sanity mode/backend and a tested demo URL. Do not claim that the local snapshot queries Sanity.

## Code

[CODE_URL]

Next.js App Router and TypeScript; parameterized GROQ; a pure entitlement engine; primary-source references and distance/fare bands; guarded API routes; desktop/mobile accessible form; source drawer; controlled gap classifications; a real Context MCP adapter activated by environment variables.

The model cannot invent a displayed monetary amount. It reads content and calls the compute tool, then selects a number-free observation; the ruling card is built from code output. Live failures return errors instead of switching modes.

## How I Used Sanity

The content model connects `regime → rule → entitlementBand → source`, with `causeStance`, `caseLaw`, `airlinePolicy`, `scenario` and `gap` references. Legal scope, trigger, notice windows, route bands, causes and authority are independent structured dimensions. The evaluation's keyword baseline misses cases that the structured joins and code handle.

The intended live content path uses a public `production` dataset for structured facts and a private `corpus` dataset for covered legal provisions and own-words summaries. A Knowledge Base exposes prose/conflicts through a KB Context MCP; a second Context MCP exposes production through GROQ. In FULL mode, the agent must call both real endpoints and the compute tool. Insights is wired for anonymized structured conversations when organization metadata is configured; hosted classification remains a separate deployment.

**Honest session limit:** the Sanity plugin's MCP tools were not exposed in this cloud session. Prepared schemas/import payloads and exact KB setup instructions are included, but no project, schema, Studio, dataset, KB, endpoint or Issues decision was created remotely. Complete HANDOFF.md before claiming the Path One real-content requirement is met.

## Sanity Project Details

- Project: `disruption-desk` — `[SANITY_PROJECT_ID]`, not yet created in this session.
- `production`: public structured facts and short own-words summaries.
- `corpus`: private, covered legal article/section chunks.
- Payloads prepared: 57 public + 36 private + 40 golden scenarios = 133 documents. No tier-five crawl pages.
- Verified material includes EU/UK legal texts, current US regulation/guidance, labeled Sturgeon/Nelson official court summaries, and IndiGo/Delta contract excerpts.
- Current India revision, full judgments and requested airline breadth remain explicit gaps. No baggage coverage or invented remedy.
- Forty frozen 70/30 cases, twelve partial/total abstentions, 32 primary-evidence headline cases. D matched this finite suite; B1 did not. B0/STRUCTURED_AGENT/FULL were not run without bindings. This is not a general legal accuracy claim. See EVAL_RESULTS.md.

## Agent Session

[AGENT_SESSION_EMBED]

The session records unavailable tools, failed source fetches, fallback decisions, retrieved evidence, local commits, tests and honest mode labels. `DECISIONS.md`, `BLOCKERS.md` and `STATUS.md` preserve the decisions for review.
