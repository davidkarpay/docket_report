# Testing Guide - Client Docket Manager Extractor

This guide provides comprehensive testing instructions for the browser extension.

## Quick Test (5 Minutes)

### 1. Load Extension
```bash
# Open Chrome
chrome://extensions/

# Enable Developer Mode → Load unpacked
# Select: /mnt/c/Showcase_Scraper
```

### 2. Open Test Page
```bash
# In browser, open:
file:///mnt/c/Showcase_Scraper/test-page.html
```

### 3. Test Manual Selection
1. Click extension icon
2. Click "Docket Number" button
3. Click "CR-2025-12345" on the test page
4. Verify capture notification appears

### 4. View Data
1. Switch to "Data" tab
2. Verify extracted data shows
3. Click "Export JSON"
4. Verify file downloads

**If all steps work:** ✅ Extension is functional!

---

## Comprehensive Test Suite

### Test 1: Extension Installation ✓

**Steps:**
1. Navigate to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `/mnt/c/Showcase_Scraper` directory
5. Verify extension appears in list

**Expected Results:**
- [x] Extension loads without errors
- [x] Icon appears in toolbar
- [x] No permission warnings beyond standard extension needs
- [x] Extension shows as "Enabled"

**Validation:**
```bash
# Check console in extension inspect:
- "Background service worker initialized"
- No red errors
```

---

### Test 2: User Interface ✓

**Steps:**
1. Click extension icon in toolbar
2. Examine popup window

**Expected Results:**
- [x] Popup opens (420px × ~550px)
- [x] Header shows "Client Docket Manager"
- [x] Four tabs visible: Extract, Data, History, Settings
- [x] "Extract" tab active by default
- [x] All buttons render properly
- [x] Status bar shows "Ready"

**Validation:**
- Right-click popup → Inspect
- Check console for errors
- Verify CSS loads properly

---

### Test 3: Manual Field Selection ✓

**Prerequisites:** Load `test-page.html` in browser

**Steps:**
1. Click extension icon
2. Click "Docket Number" field button
3. Observe page overlay
4. Click case number "CR-2025-12345"
5. Verify notification

**Expected Results:**
- [x] Blue notification appears: "Click an element..."
- [x] Semi-transparent overlay covers page
- [x] Elements highlight on hover (green outline)
- [x] Click captures value
- [x] Success notification: "Captured: docketNumber"
- [x] Selection mode exits
- [x] Button shows as "selected"

**Validation:**
```javascript
// In content script console:
// Should see: "Captured: docketNumber = CR-2025-12345"
```

---

### Test 4: Multiple Field Capture ✓

**Steps:**
Select these fields in order:
1. Case Title → "State of Example v. John Doe"
2. Judge Name → "Hon. Jane Smith"
3. Filing Date → "01/15/2025"
4. Status → "Active"

**Expected Results:**
- [x] Each field captures successfully
- [x] Each button highlights after selection
- [x] Notifications appear for each
- [x] Data accumulates (doesn't overwrite)

---

### Test 5: Auto-Extraction ✓

**Prerequisites:** `localhost.json` rules file exists

**Steps:**
1. On test-page.html
2. Click "Auto Extract" button
3. Wait for completion
4. Check status message

**Expected Results:**
- [x] Status shows "Auto extracting..."
- [x] Multiple fields populated automatically
- [x] Success message: "Auto extraction complete!"
- [x] Data tab shows all extracted fields

**Validation:**
```javascript
// Content script console should show:
"Loaded extraction rules for localhost"
"Auto-extraction complete: {data...}"
```

---

### Test 6: Data Preview and Export ✓

#### Test 6a: Data Preview
**Steps:**
1. Extract some data
2. Switch to "Data" tab

**Expected Results:**
- [x] JSON formatted data displays
- [x] Data is properly indented
- [x] All captured fields visible
- [x] extractionMetadata included

#### Test 6b: JSON Export
**Steps:**
1. Click "Export JSON"
2. Check downloads folder

**Expected Results:**
- [x] File downloads: `docket-export-[timestamp].json`
- [x] File contains valid JSON
- [x] Schema matches database schema
- [x] Version and exportDate included

#### Test 6c: CSV Export
**Steps:**
1. Click "Export CSV"
2. Open in spreadsheet

**Expected Results:**
- [x] File downloads: `docket-export-[timestamp].csv`
- [x] Headers in first row
- [x] Data properly escaped
- [x] Nested fields flattened with dot notation

#### Test 6d: Copy to Clipboard
**Steps:**
1. Click "Copy to Clipboard"
2. Paste in text editor

**Expected Results:**
- [x] Success message appears
- [x] Clipboard contains JSON
- [x] Data matches preview

---

### Test 7: History Management ✓

**Steps:**
1. Extract data from test page
2. Wait a moment
3. Switch to "History" tab
4. Verify entry appears
5. Click entry to load

**Expected Results:**
- [x] History shows entry with:
  - Domain/hostname
  - Timestamp
  - Preview text (case number or title)
- [x] Clicking entry loads data
- [x] Switches to Data tab automatically
- [x] Loaded data matches original

**Test History Limits:**
1. Extract data 5 times
2. Check history count
3. Verify oldest entries at top

---

### Test 8: Clear Functionality ✓

**Steps:**
1. Extract some data
2. Click "Clear" in Data tab
3. Confirm dialog

**Expected Results:**
- [x] Confirmation dialog appears
- [x] After confirm: data cleared
- [x] Preview shows "No data extracted yet"
- [x] Field buttons reset (not highlighted)
- [x] Status shows "Data cleared"

---

### Test 9: Settings - LLM Configuration ✓

**Steps:**
1. Switch to Settings tab
2. Check "Enable LLM Processing"
3. Enter endpoint: `http://localhost:11434/api/generate`
4. Enter model: `llama2`
5. Click "Save Configuration"

**Expected Results:**
- [x] Settings save successfully
- [x] Success message appears
- [x] "Process with LLM" button enables on Extract tab
- [x] Settings persist after closing popup

**Test Persistence:**
1. Close popup
2. Reopen extension
3. Go to Settings
4. Verify config saved

---

### Test 10: LLM Processing ⚠️ (Requires Ollama)

**Prerequisites:**
```bash
# Install and run Ollama:
ollama serve
ollama pull llama2
```

**Steps:**
1. Enable LLM in Settings
2. Extract data from test page
3. Click "Process with LLM"
4. Wait for processing

**Expected Results:**
- [x] Status shows "Processing with LLM..."
- [x] Request sent to Ollama
- [x] Data enhanced/structured
- [x] extractionMetadata.llmProcessed = true
- [x] Success message appears

**If Ollama Not Installed:**
- Error message should appear
- Extension should not crash
- Can skip this test

---

### Test 11: Keyboard Shortcuts ✓

**Steps:**
1. Enter selection mode
2. Press ESC key

**Expected Results:**
- [x] Selection mode cancels
- [x] Overlay disappears
- [x] Notification disappears
- [x] Page returns to normal

---

### Test 12: Real Court Website 🌐

**Steps:**
1. Visit public court website (e.g., state court records)
2. Navigate to case details page
3. Test manual selection on real data
4. Export and verify

**Expected Results:**
- [x] Extension works on external sites
- [x] Manual selection captures real data
- [x] Export produces usable JSON
- [x] Data matches court information

**Suggested Test Sites:**
- Your local county court website
- Public PACER access (if available)
- State supreme court case search

---

### Test 13: Error Handling ✓

#### Test 13a: No Data Export
**Steps:**
1. Don't extract any data
2. Try to export

**Expected Result:**
- Error: "No data to export"

#### Test 13b: Invalid Selector
**Steps:**
1. Create rule with bad selector
2. Try auto-extract

**Expected Result:**
- No crash, fields empty
- Console shows error

#### Test 13c: LLM Connection Failed
**Steps:**
1. Configure invalid LLM endpoint
2. Try to process

**Expected Result:**
- Error message shown
- Extension continues working

---

### Test 14: Cross-Browser Compatibility

**Browsers to Test:**
- [x] Google Chrome (primary)
- [x] Chromium
- [ ] Microsoft Edge (Chromium-based)
- [ ] Brave Browser
- [ ] Opera

---

### Test 15: Performance Testing

**Steps:**
1. Extract data from complex page (100+ elements)
2. Monitor memory usage
3. Check response times

**Expected Results:**
- [ ] Auto-extract completes in <5 seconds
- [ ] Memory usage <100MB
- [ ] No UI lag or freezing
- [ ] Popup opens in <500ms

**Validation:**
```bash
# In Chrome Task Manager (Shift+Esc):
# Check extension memory usage
```

---

## Automated Test Commands

### Validate All Code
```bash
cd /mnt/c/Showcase_Scraper

# Check JavaScript syntax
for file in src/**/*.js; do
  node --check "$file" && echo "✓ $file"
done

# Validate JSON files
for file in *.json schemas/*.json rules/*.json; do
  python3 -m json.tool "$file" > /dev/null && echo "✓ $file"
done
```

### Verify File Structure
```bash
# Check all required files exist
test -f manifest.json && echo "✓ manifest.json"
test -f icons/icon16.png && echo "✓ icons present"
test -f src/background/service-worker.js && echo "✓ service worker"
test -f src/content/extractor.js && echo "✓ content script"
test -f src/popup/popup.html && echo "✓ popup"
```

---

## Test Checklist

### Pre-Release Testing
- [ ] All JavaScript validates
- [ ] All JSON validates
- [ ] Icons generated
- [ ] Extension loads in Chrome
- [ ] Popup UI renders correctly
- [ ] Manual selection works
- [ ] Auto-extraction works
- [ ] JSON export works
- [ ] CSV export works
- [ ] Copy to clipboard works
- [ ] History saves/loads
- [ ] Settings persist
- [ ] Clear function works
- [ ] Error handling graceful
- [ ] Works on real court sites
- [ ] Documentation accurate

### Optional Tests
- [ ] LLM integration (requires Ollama)
- [ ] Multiple browser testing
- [ ] Performance benchmarks
- [ ] Long-term history (100+ entries)
- [ ] Large data export (10+ cases)

---

## Bug Reporting Template

```markdown
### Bug Description
[Clear description of the issue]

### Steps to Reproduce
1. [First step]
2. [Second step]
3. [...]

### Expected Behavior
[What should happen]

### Actual Behavior
[What actually happened]

### Environment
- Browser: [Chrome/Chromium/Edge]
- OS: [Windows/Linux/Mac]
- Extension Version: 1.0.0

### Console Errors
[Paste any console errors]

### Screenshots
[If applicable]
```

---

## Test Results Template

```markdown
## Test Session: [Date]

**Tester:** [Name]
**Environment:** [Browser + OS]

### Results Summary
- Tests Passed: X / Y
- Tests Failed: X
- Tests Skipped: X

### Detailed Results

| Test # | Test Name | Status | Notes |
|--------|-----------|--------|-------|
| 1 | Extension Load | ✅ PASS | |
| 2 | UI Render | ✅ PASS | |
| ... | ... | ... | ... |

### Issues Found
1. [Issue description]
2. [Issue description]

### Recommendations
- [Recommendation]
```

---

## Continuous Testing

### After Code Changes
1. Validate syntax (JavaScript & JSON)
2. Reload extension in Chrome
3. Test affected features
4. Verify no regressions

### Before Release
1. Full test suite (Tests 1-13)
2. Cross-browser testing
3. Performance validation
4. Documentation review

---

## See Also

- **Test Results:** `TEST_RESULTS.md` - Pre-flight validation results
- **Test Page:** `test-page.html` - Sample court page for testing
- **Main Docs:** `README.md` - Full documentation
- **Quick Start:** `QUICK_START.md` - Getting started guide

---

**Happy Testing!** 🧪

*Report issues or contribute improvements via the project repository.*
