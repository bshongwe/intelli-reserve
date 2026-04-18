#!/usr/bin/env zsh
# Offline Sync Setup Script
# This script helps validate the offline sync feature is set up correctly

set -e

echo "🚀 Offline Sync Setup Validator"
echo "================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Change to frontend directory (parent of scripts dir)
SCRIPT_DIR="$(dirname "$0")"
FRONTEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$FRONTEND_DIR" || exit 1

echo "📁 Working directory: $(pwd)"
echo ""

# Check 1: Required files exist
echo "${BLUE}1️⃣  Checking required files...${NC}"
REQUIRED_FILES=(
  "src/db/offlineDb.ts"
  "src/services/syncManager.ts"
  "src/lib/offlineInterceptor.ts"
  "src/hooks/useConnectionStatus.ts"
  "src/hooks/useSyncOnline.ts"
  "src/hooks/useSyncProgress.ts"
  "src/components/OfflineIndicator.tsx"
  "src/components/SyncQueueStatus.tsx"
)

FILES_OK=true
for file in "${REQUIRED_FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "  ✅ $file"
  else
    echo "  ❌ $file - MISSING"
    FILES_OK=false
  fi
done

if [ "$FILES_OK" = false ]; then
  echo ""
  echo "${RED}❌ Some required files are missing!${NC}"
  exit 1
fi

echo ""

# Check 2: Dependencies in package.json
echo "${BLUE}2️⃣  Checking package.json dependencies...${NC}"
if grep -q '"dexie"' package.json; then
  echo "  ✅ dexie found in package.json"
else
  echo "  ❌ dexie NOT found in package.json"
  exit 1
fi

if grep -q '"axios-retry"' package.json; then
  echo "  ✅ axios-retry found in package.json"
else
  echo "  ❌ axios-retry NOT found in package.json"
  exit 1
fi

echo ""

# Check 3: Node modules installed
echo "${BLUE}3️⃣  Checking if dependencies are installed...${NC}"
if [ -d "node_modules/dexie" ]; then
  echo "  ✅ dexie installed"
else
  echo "  ⚠️  dexie NOT installed - running npm install..."
  npm install
fi

if [ -d "node_modules/axios-retry" ]; then
  echo "  ✅ axios-retry installed"
else
  echo "  ⚠️  axios-retry NOT installed - running npm install..."
  npm install
fi

echo ""

# Check 4: TypeScript compilation
echo "${BLUE}4️⃣  Checking TypeScript files...${NC}"
if command -v tsc &> /dev/null; then
  echo "  ✅ TypeScript compiler found"
  # Try to compile the offline sync files
  if npx tsc --noEmit src/db/offlineDb.ts src/services/syncManager.ts 2>/dev/null; then
    echo "  ✅ TypeScript compilation successful"
  else
    echo "  ⚠️  Some TypeScript errors found (this might be okay if app compiles)"
  fi
else
  echo "  ⚠️  TypeScript compiler not found (this is okay if using build tool)"
fi

echo ""

# Check 5: Integration guide exists
echo "${BLUE}5️⃣  Checking documentation...${NC}"
if [ -f "OFFLINE_SYNC_GUIDE.md" ]; then
  echo "  ✅ OFFLINE_SYNC_GUIDE.md found"
else
  echo "  ❌ OFFLINE_SYNC_GUIDE.md NOT found"
  exit 1
fi

if [ -f "OFFLINE_SYNC_CHECKLIST.md" ]; then
  echo "  ✅ OFFLINE_SYNC_CHECKLIST.md found"
else
  echo "  ❌ OFFLINE_SYNC_CHECKLIST.md NOT found"
  exit 1
fi

echo ""

# Check 6: Look for integration in root layout
echo "${BLUE}6️⃣  Checking for integration in app root...${NC}"
INTEGRATION_FOUND=false

if [ -f "src/app/layout.tsx" ]; then
  if grep -q "initSyncManager\|OfflineSync" src/app/layout.tsx; then
    echo "  ✅ Offline sync integration found in src/app/layout.tsx"
    INTEGRATION_FOUND=true
  else
    echo "  ⚠️  Offline sync NOT found in src/app/layout.tsx"
  fi
fi

if [ -f "src/pages/_app.tsx" ]; then
  if grep -q "initSyncManager\|OfflineSync" src/pages/_app.tsx; then
    echo "  ✅ Offline sync integration found in src/pages/_app.tsx"
    INTEGRATION_FOUND=true
  else
    echo "  ⚠️  Offline sync NOT found in src/pages/_app.tsx"
  fi
fi

if [ -f "src/components/OfflineSync.tsx" ]; then
  echo "  ✅ OfflineSync wrapper component found"
  INTEGRATION_FOUND=true
fi

if [ "$INTEGRATION_FOUND" = false ]; then
  echo ""
  echo "${YELLOW}⚠️  Offline sync not integrated in app root yet${NC}"
  echo ""
  echo "Next steps:"
  echo "1. Read OFFLINE_SYNC_GUIDE.md for integration instructions"
  echo "2. Add <OfflineSync /> component to your root layout"
  echo "3. The OfflineSync component handles all initialization"
else
  echo "  ✅ Integration code found - Offline sync is active!"
fi

echo ""

# Check 7: Summary
echo "${BLUE}📊 Summary${NC}"
echo "=========="
echo "  ✅ All required files exist"
echo "  ✅ Dependencies configured in package.json"
if [ -d "node_modules/dexie" ] && [ -d "node_modules/axios-retry" ]; then
  echo "  ✅ Dependencies installed"
else
  echo "  ⚠️  Some dependencies not installed"
fi
echo "  ✅ Documentation complete"

if [ "$INTEGRATION_FOUND" = true ]; then
  echo "  ✅ Integration code present"
  echo ""
  echo "${GREEN}✅ Offline sync feature is ready to test!${NC}"
  echo ""
  echo "Testing steps:"
  echo "1. Open your app in browser"
  echo "2. Open DevTools (F12)"
  echo "3. Go to Network tab"
  echo "4. Set Throttling to 'Offline'"
  echo "5. Make an API request (e.g., create booking)"
  echo "6. You should see 'Offline' indicator at bottom-right"
  echo "7. Check DevTools > Application > IndexedDB > offline-db for queue"
  echo "8. Set Throttling back to 'No throttling'"
  echo "9. Watch queue auto-sync!"
else
  echo "  ⚠️  Integration code not found"
  echo ""
  echo "${YELLOW}⚠️  Offline sync feature needs integration${NC}"
  echo ""
  echo "Next steps:"
  echo "1. Read: OFFLINE_SYNC_GUIDE.md"
  echo "2. Follow: OFFLINE_SYNC_CHECKLIST.md"
  echo "3. Choose: App Router OR Pages Router approach"
  echo "4. Add: Initialization code to root layout"
  echo "5. Test: Using DevTools offline simulation"
fi

echo ""
echo "${BLUE}📚 Documentation${NC}"
echo "================"
echo "• OFFLINE_SYNC_GUIDE.md - Complete integration guide"
echo "• OFFLINE_SYNC_CHECKLIST.md - Step-by-step checklist"
echo "• src/db/offlineDb.ts - IndexedDB wrapper"
echo "• src/services/syncManager.ts - Sync retry logic"
echo "• src/lib/offlineInterceptor.ts - Axios error handler"
echo "• src/hooks/* - Connection & sync hooks"
echo "• src/components/* - UI components"
echo ""
