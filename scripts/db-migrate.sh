#!/bin/bash

# Usage:
#   ./scripts/db.sh generate        → generate auth schema + drizzle migration file
#   ./scripts/db.sh migrate         → generate auth schema + drizzle migration file + run migration

set -e

COMMAND=${1:-generate}

if [[ "$COMMAND" != "generate" && "$COMMAND" != "migrate" ]]; then
  echo "❌ Unknown command: $COMMAND"
  echo "Usage: ./scripts/db.sh [generate|migrate]"
  exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔐 Step 1: Generating Better Auth schema"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cd apps/api
pnpm run auth:generate
cd ../..

# better-auth's CLI writes with its own formatting (double quotes); normalize
# to the repo's prettier config so CI's drift check doesn't trip on quote style.
pnpm exec prettier --write packages/database/src/schema/auth.ts

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🗄️  Step 2: Generating Drizzle migration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cd packages/database
pnpm run db:generate
cd ../..

if [[ "$COMMAND" == "migrate" ]]; then
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "🚀 Step 3: Running migration"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  cd packages/database
  pnpm run db:migrate
  cd ../..
fi

echo ""
echo "✅ Done!"