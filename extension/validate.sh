#!/bin/bash
# Validation script for Client Docket Manager Extractor
# Run this before loading the extension in Chrome

set -e

echo "=================================="
echo "Extension Validation Script"
echo "Client Docket Manager Extractor"
echo "=================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0

# Function to print success
pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASSED++))
}

# Function to print failure
fail() {
    echo -e "${RED}✗${NC} $1"
    ((FAILED++))
}

# Function to print warning
warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

echo "1. Checking File Structure..."
echo "------------------------------"

# Check required files
test -f manifest.json && pass "manifest.json" || fail "manifest.json missing"
test -f package.json && pass "package.json" || fail "package.json missing"
test -f README.md && pass "README.md" || fail "README.md missing"

# Check icons
test -f icons/icon16.png && pass "icons/icon16.png" || fail "icons/icon16.png missing"
test -f icons/icon48.png && pass "icons/icon48.png" || fail "icons/icon48.png missing"
test -f icons/icon128.png && pass "icons/icon128.png" || fail "icons/icon128.png missing"

# Check source files
test -f src/background/service-worker.js && pass "service-worker.js" || fail "service-worker.js missing"
test -f src/content/extractor.js && pass "extractor.js" || fail "extractor.js missing"
test -f src/popup/popup.html && pass "popup.html" || fail "popup.html missing"
test -f src/popup/popup.js && pass "popup.js" || fail "popup.js missing"
test -f src/popup/popup.css && pass "popup.css" || fail "popup.css missing"
test -f src/content/overlay.css && pass "overlay.css" || fail "overlay.css missing"

# Check schemas
test -f schemas/docket-schema.json && pass "docket-schema.json" || fail "docket-schema.json missing"

echo ""
echo "2. Validating JavaScript Syntax..."
echo "-----------------------------------"

# Validate JavaScript files
if command -v node &> /dev/null; then
    for file in src/background/service-worker.js src/content/extractor.js src/popup/popup.js src/utils/validator.js; do
        if node --check "$file" 2>/dev/null; then
            pass "$file"
        else
            fail "$file (syntax error)"
        fi
    done
else
    warn "Node.js not found - skipping JavaScript validation"
fi

echo ""
echo "3. Validating JSON Files..."
echo "----------------------------"

# Validate JSON files
if command -v python3 &> /dev/null; then
    for file in manifest.json package.json schemas/docket-schema.json rules/example.com.json rules/localhost.json rules/sample-court.example.gov.json; do
        if python3 -m json.tool "$file" > /dev/null 2>&1; then
            pass "$file"
        else
            fail "$file (invalid JSON)"
        fi
    done
else
    warn "Python3 not found - skipping JSON validation"
fi

echo ""
echo "4. Checking Extension Structure..."
echo "-----------------------------------"

# Check manifest version
MANIFEST_VERSION=$(python3 -c "import json; print(json.load(open('manifest.json'))['manifest_version'])" 2>/dev/null)
if [ "$MANIFEST_VERSION" == "3" ]; then
    pass "Manifest V3 (required for Chrome)"
else
    fail "Invalid manifest version"
fi

# Check for required permissions
if grep -q '"activeTab"' manifest.json; then
    pass "Required permissions present"
else
    warn "Some permissions may be missing"
fi

echo ""
echo "5. File Size Checks..."
echo "----------------------"

# Check icon sizes
if [ -f icons/icon16.png ]; then
    SIZE=$(file icons/icon16.png | grep -o '[0-9]* x [0-9]*' | head -1)
    if [[ $SIZE == *"16 x 16"* ]]; then
        pass "icon16.png correct size"
    else
        warn "icon16.png may be wrong size (should be 16x16)"
    fi
fi

if [ -f icons/icon128.png ]; then
    SIZE=$(file icons/icon128.png | grep -o '[0-9]* x [0-9]*' | head -1)
    if [[ $SIZE == *"128 x 128"* ]]; then
        pass "icon128.png correct size"
    else
        warn "icon128.png may be wrong size (should be 128x128)"
    fi
fi

echo ""
echo "=================================="
echo "Validation Summary"
echo "=================================="
echo -e "${GREEN}Passed:${NC} $PASSED"
if [ $FAILED -gt 0 ]; then
    echo -e "${RED}Failed:${NC} $FAILED"
fi
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All validations passed!${NC}"
    echo ""
    echo "Extension is ready to load in Chrome:"
    echo "1. Open chrome://extensions/"
    echo "2. Enable 'Developer mode'"
    echo "3. Click 'Load unpacked'"
    echo "4. Select this directory: $(pwd)"
    echo ""
    exit 0
else
    echo -e "${RED}✗ Some validations failed!${NC}"
    echo "Please fix the errors above before loading the extension."
    echo ""
    exit 1
fi
