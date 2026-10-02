# Reusable cloud startup instructions

Use the existing checkout at `/workspace/sanitychallenge`. Cloud tasks are already isolated; do not create a Git worktree unless the user asks. Read README.md, STATUS.md, DECISIONS.md and applicable AGENTS.md. Preserve user changes.

Node 24.19.0 and pnpm 11.19.0 were used. Installed dependencies and `.next` outputs may survive a snapshot; processes do not. To reproduce setup, execute `bash scripts/cloud-install.sh` from the checkout. It performs a frozen install, type check, 54 tests and production build without rewriting dependencies or legal facts.

For development, start `pnpm dev --port 3000` in a managed session. For the retained production build, use `pnpm start --port 3000`. Inspect startup output, then run `pnpm smoke` from the checkout. Verify the sourced EU ruling, Indian abstention, keyword results, gap persistence and invalid-input rejection. A PID or port alone is insufficient. If a port is occupied, identify its owner and reuse a healthy service or choose another port; stop only processes you started. `SMOKE_ORIGIN` can select another loopback port. Do not offer user-facing loopback preview links during onboarding.

`pnpm test`, `pnpm typecheck` and `pnpm eval` verify the selected workflow. The eval CLI loads an ignored `.env.local` when present. Inspect credential names/presence only; never print values or dump the environment.

No keys are needed for DETERMINISTIC / LOCAL_SNAPSHOT. Keep AI-off and local-content badges visible. `SANITY_PROJECT_ID` selects the live public dataset; live read failures must remain errors. Agent modes require a live project and a supported LLM key. FULL additionally requires both Context endpoint URLs and the organization token. Insights needs organization metadata and a separately deployed classification function. Use `env.example`; all `.env*` files are ignored.

No remote Sanity setup was performed in this session because its MCP tools were not exposed. Follow HANDOFF.md / KB_SETUP.md in an authenticated tool session. Sanity setup writes must use the MCP tools. Runtime controlled gap writes use the server-only project write binding through @sanity/client; otherwise local gaps are explicitly not durable. `GAP_STORAGE_DIR=/tmp/disruption-desk-gaps` is a serverless diagnostic fallback only.

Keep current India CAR, full-judgment and airline-coverage gaps explicit. Do not replace an abstention with an assertion without primary verification. Monetary awards come from code; overlapping regimes are not additive. Local commits were not pushed, and restoration of local-only commits in a fresh task has not been verified.

This file and `docs/environment-draft.json` preserve setup instructions locally. The platform draft save failed with a closed MCP session; persistence is unconfirmed. Local files do not substitute for a successful draft save, public deployment, or published environment snapshot. Retry the supported draft update when the service reconnects; preserve unrelated configuration.
