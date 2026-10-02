# Knowledge Base setup — not run here

The session has no Sanity MCP tools, organization ID, project ID or authenticated CLI. Nothing is deployed or built. Use an authenticated Sanity plugin session; never put returned tokens in the repository. The docs reviewed in this run are retained under `data/sources/docs-*.md`.

1. `list_organizations`; select the organization you own. `create_project` with title `disruption-desk`; create `production` with public read and `corpus` with private visibility using `create_dataset`.
2. Deploy the plain literal declarations from `schema/types.json` with `deploy_schema` to both datasets. There are no imports, spreads, previews, local Studio or `sanity.config.*`. Deploy Studio with `deploy_studio`.
3. For each `data/import/production-*.json` and `data/import/corpus-*.json`, pass its documents to `create_documents`, then `publish_documents` using the returned IDs. Batches are below 100 kB. Upload `data/import/scenarios-1.json` as public `scenario` documents too. Never treat draft IDs as published refs. Do not overwrite any existing user documents; the prepared IDs are only for this newly created project.
4. Verify with `query_documents`: counts by `_type`, reference integrity, verified flags, and privacy. The public dataset contains no copied airline prose or personal information.
5. Use `run_sanity_cli` for these commands (no `--file`; replace bracketed IDs with actual returned IDs):

```sh
context --help
context create --organization [ORG_ID] --title "Passenger rights corpus" --description "For passengers and the Disruption Desk agent: determine flight-disruption entitlements from primary evidence, distinguish jurisdiction and structured thresholds, and flag cross-source conflicts without guessing missing law."
context imports create [KB_ID] --query '*[_type=="corpusDoc"]' --sanity-project [PROJECT_ID] --sanity-dataset corpus
context build [KB_ID] --watch
context get [KB_ID] --json
context imports list [KB_ID] --json
```

CLI reference fetched in this run confirms these command forms. Omit `--watch` only if your installed CLI does not support it. Zero commercial pages were selected, so there are no tier-five URL imports to execute.

Dashboard alternative: Sanity Dashboard → Context → Knowledge Bases → create → name **Passenger rights corpus**, add the purpose above → add a dataset source → project **disruption-desk** / dataset **corpus**, with GROQ `*[_type=="corpusDoc"]` → Build → verify entry count → review Issues. Actual button wording may vary. See the fetched Create a Knowledge Base and Resolve Issues docs.

If the Context app cannot see schema after MCP schema deployment, record that error and redeploy through the supported authenticated schema flow; do not invent a local Studio to conceal it. The raw corpus import is 36 documents; KB entry count can differ after indexing/chunking. Persist conflict decisions through Issues, not only this repository.
