#!/usr/bin/env bash
set -euo pipefail
cd /workspace/sanitychallenge
node --version
pnpm --version
CI=true pnpm install --frozen-lockfile --store-dir /workspace/.pnpm-store
pnpm typecheck
pnpm test
pnpm build
