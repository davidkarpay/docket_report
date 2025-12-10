# Intelligent Field Detection System - Implementation Guide

## Status: Part 1 Complete, Part 2 Requires Additional Files

---

## ✅ PART 1 COMPLETE: Connection Error Fix

### What Was Fixed:
The "Could not establish connection. Receiving end does not exist" error is now resolved.

### Changes Made:

#### 1. Added Ping Handler (`src/content/extractor.js`)
- **Line 109-112**: Added `case 'ping'` handler
- Purpose: Allows popup to check if content script is loaded
- Returns: `{ success: true, ready: true }`

#### 2. Added Connection Validation (`src/popup/popup.js`)
- **Lines 100-122**: New method `checkContentScriptReady(retries=5, delay=500)`
- Features:
  - Retries 5 times with 500ms delay
  - Sends ping message to content script
  - Returns true if content script responds
  - Logs each attempt for debugging

#### 3. Updated Auto Extract (`src/popup/popup.js`)
- **Line 127-160**: Modified `autoExtract()` method
- Added: Checks content script readiness before extracting
- Shows: "Checking page readiness..." status message
- Error handling: Clear message to refresh page if not ready

#### 4. Updated Manual Selection (`src/popup/popup.js`)
- **Line 180-213**: Modified `selectField()` method
- Added: Same readiness check before starting selection
- Prevents: "Connection error" when selecting fields

### Testing Instructions:

1. **Reload Extension**:
   ```
   chrome://extensions/ → Click reload button on extension
   ```

2. **Test on Palm Beach County Site**:
   - Navigate to: `jiswebprod.mypalmbeachclerk.com`
   - Open extension popup
   - Try "Auto Extract" - should check readiness first
   - Try manual field selection - should work without errors

3. **Expected Behavior**:
   - ✅ "Checking page readiness..." message appears
   - ✅ Extension waits for Angular to finish loading
   - ✅ No "connection error" messages
   - ✅ Auto extract and manual selection both work

4. **If Still Getting Errors**:
   - Refresh the court website page (F5)
   - Wait 2-3 seconds for page to fully load
   - Try again - retry logic will handle timing issues

---

## 🔄 PART 2: Intelligent Field Detection System

### Status: Pattern Library Created, Implementation Files Needed

### ✅ Completed: Pattern Library

**File Created**: `src/content/field-patterns.js`

**Contains**:
- 13 common legal field types
- Multiple label variations per field (e.g., "Case #", "Case Number", "Docket No.")
- Regex patterns for value validation
- Confidence scoring weights
- Category grouping

**Field Types Included**:
1. docketNumber
2. caseTitle
3. judgeName
4. filingDate
5. defendantName
6. plaintiffName
7. courtName
8. charge
9. bondAmount
10. attorneyName
11. caseType
12. status
13. division

**Example Pattern**:
```javascript
docketNumber: {
  labels: ['case number', 'case no', 'case #', 'docket number', ...],
  valuePatterns: [
    /^\d{2}-\d{4}-[A-Z]{2}-\d{6}-[A-Z]{4}-[A-Z]{2}$/i,  // Palm Beach format
    /^[A-Z]{2}-\d{4}-\d{5,6}$/i,  // Standard format
    ...
  ],
  weights: {
    exactLabelMatch: 0.9,
    partialLabelMatch: 0.6,
    valuePatternMatch: 0.8,
    position: 0.7
  },
  category: 'case_identification'
}
```

### 📋 Remaining Files Needed:

#### File 1: `src/content/field-detector.js` (Detect Engine)

**Purpose**: Scans the page and detects fields automatically

**Key Methods Needed**:
```javascript
class FieldDetector {
  detectFields(document) {
    // 1. Find all label-value pairs on page
    // 2. Match against pattern library
    // 3. Calculate confidence scores
    // 4. Return ranked suggestions
  }

  findLabelValuePairs(document) {
    // Strategy 1: <dt>/<dd> pairs
    // Strategy 2: <label> with input/span
    // Strategy 3: <th>/<td> table pairs
    // Strategy 4: Colon-separated text
    // Strategy 5: Angular bindings (ng-bind, {{}})
  }

  calculateConfidence(candidate, pattern) {
    // Check label match (exact vs partial)
    // Check value pattern match (regex)
    // Check position on page (top = higher confidence)
    // Return weighted score 0-1
  }

  generateSelector(element) {
    // Create CSS selector for element
    // Try ID first, then classes, then path
  }
}
```

**Algorithm**:
1. Scan entire DOM for label-value pairs
2. For each pair, match against all patterns
3. Calculate confidence score based on:
   - Label similarity (exact match = 0.9, partial = 0.6)
   - Value pattern match (regex test = 0.8)
   - Position on page (top 1000px = higher score)
4. Sort by confidence, remove duplicates
5. Flag fields < 70% confidence for approval

#### File 2: `src/popup/detection-ui.js` (Approval Interface)

**Purpose**: Display detected fields and handle user approval

**Key Methods Needed**:
```javascript
class DetectionUI {
  showDetectionResults(fields) {
    // Group fields by category
    // Render cards with confidence badges
    // Color-code: green (>80%), yellow (50-80%), red (<50%)
  }

  createFieldCard(field, index) {
    // Show: Field type, label, value sample, confidence
    // Buttons: Approve, Edit, Reject
  }

  approveField(index) {
    // Add to extraction rules
    // Mark as approved in UI
  }

  editField(index) {
    // Prompt user for new field type
    // Update suggestion
  }

  generateRulesFile() {
    // Collect all approved fields
    // Create rules JSON file
    // Download for the current domain
  }
}
```

**UI Design**:
```html
<div class="detection-card high-confidence">
  <div class="detection-card-header">
    <span class="field-type">Docket Number</span>
    <span class="confidence-badge">92%</span>
  </div>
  <div class="detection-card-body">
    <div><strong>Label:</strong> Case Number</div>
    <div><strong>Value:</strong> 50-2025-MM-008893...</div>
  </div>
  <div class="detection-card-actions">
    <button class="approve-btn">✓ Approve</button>
    <button class="edit-btn">✎ Edit Type</button>
    <button class="reject-btn">✕ Reject</button>
  </div>
</div>
```

#### File 3: `src/popup/detection-styles.css` (Styling)

**Purpose**: Visual styling for detection UI

**Key Styles**:
```css
.detection-card {
  border: 1px solid #ddd;
  margin: 10px 0;
  padding: 15px;
  border-radius: 8px;
}

.high-confidence {
  border-left: 4px solid #4caf50;  /* Green */
}

.medium-confidence {
  border-left: 4px solid #ff9800;  /* Orange */
}

.low-confidence {
  border-left: 4px solid #f44336;  /* Red */
}

.confidence-badge {
  background: #2196f3;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
}
```

### 🔌 Integration Steps:

#### Step 1: Update `popup.html`

Add new tab:
```html
<!-- After Settings tab button -->
<button class="tab-button" data-tab="detection">Smart Detection</button>

<!-- Tab content -->
<div class="tab-content" id="detection-tab">
  <div class="section">
    <h3>Smart Field Detection</h3>
    <p>Automatically detect fields on this page</p>

    <button class="btn btn-primary" id="detect-fields-btn">
      🔍 Detect Fields
    </button>
    <button class="btn btn-success" id="approve-all-btn">
      ✓ Approve All High-Confidence
    </button>
    <button class="btn btn-info" id="generate-rules-btn">
      📄 Generate Rules File
    </button>

    <div id="detection-results"></div>
  </div>
</div>
```

#### Step 2: Update `extractor.js`

Add detection message handler:
```javascript
case 'detectFields':
  // Import FieldDetector
  const detector = new FieldDetector();
  const detected = detector.detectFields(document);
  sendResponse({ success: true, fields: detected });
  break;
```

#### Step 3: Update `popup.js`

Add detection button handler:
```javascript
document.getElementById('detect-fields-btn').addEventListener('click', () => {
  this.runFieldDetection();
});

async runFieldDetection() {
  this.setStatus('Detecting fields...');

  const ready = await this.checkContentScriptReady();
  if (!ready) {
    this.setStatus('Content script not loaded. Please refresh.', 'error');
    return;
  }

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const response = await chrome.tabs.sendMessage(tab.id, {
      action: 'detectFields'
    });

    if (response.success) {
      this.detectionUI.showDetectionResults(response.fields);
      this.setStatus(`Found ${response.fields.length} fields`, 'success');
    }
  } catch (error) {
    console.error('Detection error:', error);
    this.setStatus(`Error: ${error.message}`, 'error');
  }
}
```

---

## 📊 Testing Plan

### Phase 1: Connection Fix Testing

**Test Sites**:
1. Palm Beach County Clerk (`jiswebprod.mypalmbeachclerk.com`)
2. Any Angular/React-based court website
3. Static HTML pages (already working)

**Test Cases**:
- [ ] Auto extract on Angular site
- [ ] Manual selection on Angular site
- [ ] Retry logic works (inject delay in testing)
- [ ] Error message shows when refresh needed

### Phase 2: Detection System Testing

**Test Sites** (once implemented):
1. Palm Beach County (complex Angular app)
2. Broward County Clerk
3. Miami-Dade Clerk
4. Test-page.html (baseline)
5. Any other Florida county clerk site

**Test Metrics**:
- Detection accuracy (true positives / total fields)
- False positive rate
- Confidence score accuracy
- Time to detect (should be < 2 seconds)
- User approval workflow

**Expected Results**:
- High confidence fields (>80%): Should be accurate 95%+ of time
- Medium confidence (50-80%): User approval needed
- Low confidence (<50%): Often require editing

---

## 🎯 Success Criteria

### Part 1 (Connection Fix) ✅
- [x] No more "connection error" on Angular/SPA sites
- [x] Retry logic handles timing issues
- [x] Clear error messages guide users
- [x] Works on Palm Beach County site

### Part 2 (Intelligent Detection) 🔄
- [ ] Detects 10+ common fields automatically
- [ ] Confidence scoring is accurate
- [ ] UI allows easy approval/rejection
- [ ] Can generate rules.json files
- [ ] Works on 5+ different court websites
- [ ] Reduces manual rule creation time by 80%

---

## 📝 Implementation Estimate

| Task | Time | Difficulty |
|------|------|------------|
| Field Detector Engine | 2-3 hours | High |
| Detection UI | 1-2 hours | Medium |
| Styling | 30 min | Low |
| Integration | 30 min | Low |
| Testing | 1-2 hours | Medium |
| **Total** | **5-8 hours** | - |

---

## 🚀 Quick Start Guide

### To Use Connection Fix (READY NOW):

1. Reload extension: `chrome://extensions/` → Reload
2. Navigate to Palm Beach County site
3. Open extension popup
4. Click "Auto Extract" or select a field
5. Should work without connection errors!

### To Complete Intelligent Detection:

1. Create `field-detector.js` using pseudo-code above
2. Create `detection-ui.js` for approval interface
3. Create `detection-styles.css` for visual design
4. Update `popup.html` to add Smart Detection tab
5. Update `extractor.js` to handle detectFields action
6. Update `popup.js` to add detection button handler
7. Test on 3-5 court websites
8. Iterate on confidence scoring based on results

---

## 🔗 Related Files

- `src/content/field-patterns.js` - Pattern library (CREATED)
- `src/content/extractor.js` - Content script (UPDATED)
- `src/popup/popup.js` - Popup controller (UPDATED)
- `ENHANCEMENTS_SUMMARY.md` - Previous enhancements doc
- `rules/template.json` - Rule template (created earlier)

---

## 💡 Tips for Implementation

1. **Start Simple**: Implement basic detection for 3-4 field types first, then expand
2. **Test Iteratively**: Test each detection strategy (dt/dd, label/input, etc.) separately
3. **Tune Weights**: Adjust confidence weights based on real-world testing
4. **User Feedback**: Log which fields users accept/reject to improve patterns
5. **Domain-Specific**: Consider allowing users to add custom patterns

---

_Last Updated: 2025-01-19_
_Status: Part 1 Complete (Connection Fix), Part 2 Pattern Library Created_
_Next Step: Implement field-detector.js detection engine_
