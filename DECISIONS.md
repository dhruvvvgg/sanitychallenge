# Decisions

- 2026-10-03: The supplied mission authorizes creating application files in the empty checkout. The earlier onboarding restriction on source edits no longer defines this task.
- Sanity MCP tools are absent from the actual tool catalog. No organization/project/dataset/schema/Studio/KB operation can be performed here. Do not substitute unauthenticated REST writes or invent IDs. Prepare plain schemas, seed payloads and a handoff.
- No LLM or Context credentials requested. Default to DETERMINISTIC, with a separately labeled LOCAL_SNAPSHOT content backend until a public Sanity dataset is configured. Local GROQ uses the same structured documents and queries, not fabricated live Sanity results.
- Current environment: Node 24.19.0. npm cache is moved to /workspace because the home directory is not writable.
- Legal coverage is bounded by fetched primary evidence; unclear or uncovered facts cause abstention. No deadline or extraordinary-circumstances claim will be invented.
- No sub-agents: session instructions permit delegation only when explicitly requested; mission does not request it.
