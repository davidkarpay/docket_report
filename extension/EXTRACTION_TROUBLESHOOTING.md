# Extraction System Troubleshooting Guide

**Document Version:** 1.0.0
**Date:** 2025-11-19
**Issue:** LLM Hallucination in Case Data Extraction

---

## Critical Issue Identified

**Problem:** Extraction system produced completely fabricated case data instead of extracting actual information.

**Affected Case:** Booking #2025015876 (Case 50-2025-MM-006375-AXXX-MB)

---

## Hallucinated Output Analysis

### What Was Extracted (INCORRECT):
```json
{
  "extractionMetadata": {
    "extractedAt": "2025-11-19T20:27:07.250Z",
    "sourceUrl": "https://jiswebprod.mypalmbeachclerk.com/ShowCaseWebSSO/print#!/preview",
    "extractorVersion": "1.0.0",
    "llmProcessed": true
  },
  "caseInfo": {
    "docketNumber": null,
    "caseTitle": "State v. John Doe",              // ❌ FABRICATED
    "caseType": "Criminal",
    "partyNamesAndRoles": [
      {"name": "State", "role": "Plaintiff"}       // ❌ GENERIC
    ],
    "dates": {
      "filingDate": "2025-11-19T20:27:07.250Z",    // ❌ MATCHES EXTRACTION TIME
      "hearings": [],
      "deadlines": []
    },
    "chargesAndStatutes": [
      {"charge": "Felony", "statute": null, "degree": "Felony"}  // ❌ VAGUE
    ],
    "bondInformation": {
      "amount": null,
      "type": null,
      "status": "Pending"                          // ❌ GUESSED
    },
    "courtAndJudgeDetails": {
      "courtName": "Palm Beach County Courthouse",  // ❌ GENERIC
      "state": "Florida",
      "county": "Palm Beach",
      "judgeName": null,
      "division": null
    }
  }
}
```

### What SHOULD Have Been Extracted (CORRECT):
```json
{
  "extractionMetadata": {
    "extractedAt": "2025-11-19T20:27:07.250Z",
    "sourceUrl": "https://jiswebprod.mypalmbeachclerk.com/ShowCaseWebSSO/print#!/preview",
    "extractorVersion": "1.0.0",
    "llmProcessed": true
  },
  "caseInfo": {
    "docketNumber": "50-2025-MM-006375-AXXX-MB",
    "caseTitle": "State of Florida v. ROPER, ANTONIO BERNARD",
    "caseType": "MM (Misdemeanor)",
    "partyNamesAndRoles": [
      {"name": "ROPER, ANTONIO BERNARD", "role": "Defendant"},
      {"name": "STATE, ATTORNEY", "role": "State Attorney"}
    ],
    "dates": {
      "filingDate": "01/29/2025",
      "arrestDate": "01/29/2025",
      "hearings": [
        {"date": "02/10/2025", "type": "Arraignment"},
        {"date": "03/19/2025", "type": "Calendar Call"}
      ]
    },
    "chargesAndStatutes": [
      {
        "charge": "BATTERY (DOMESTIC)",
        "statute": "784.03(1)",
        "degree": "MF",
        "level": "Misdemeanor of the First Degree"
      }
    ],
    "bondInformation": {
      "amount": "$1,000.00",
      "type": "Unknown - See Dockets",
      "status": "Unknown - See Dockets"
    },
    "courtAndJudgeDetails": {
      "courtName": "County Criminal",
      "state": "Florida",
      "county": "Palm Beach",
      "judgeName": "BURKE, LAUREN",
      "division": "MB"
    },
    "bookingNumber": "2025015876",
    "totalDocketEntries": 121,
    "relatedCases": [
      "50-2025-DR-001668-XXXX-MB",
      "50-2025-DC-000340-XXXX-MB"
    ]
  }
}
```

---

## Root Cause Analysis

### 1. Wrong File Type Used

**Problem:** System extracted from `2025015876.txt` instead of `2025015876.pdf`

**File Comparison:**

#### 2025015876.txt (What was used - WRONG):
- **Size:** 38,517 bytes
- **Content:** Angular.js application shell only
- **Key Indicators:**
  - Contains `ng-app="sc"` and `ui-view` directives
  - Has navigation menus, modal templates, search forms
  - **NO CASE DATA** - just UI framework code
  - No defendant names, charges, dates, or case numbers

**Sample from TXT file:**
```html
<div id="wrapper" ng-app="sc" ng-controller="mainController">
    <nav class="navbar navbar-default navbar-static-top">
        <div class="navbar-header">
            <button type="button" class="navbar-toggle" data-toggle="collapse">
                <span class="sr-only">Toggle navigation</span>
```

#### 2025015876.pdf (What should have been used - CORRECT):
- **Size:** 5 pages of rendered case data
- **Content:** Complete case information for ROPER, ANTONIO BERNARD
- **Contains:**
  - Case #: 50-2025-MM-006375-AXXX-MB
  - Defendant: ROPER, ANTONIO BERNARD
  - Charge: 784.03(1) BATTERY (DOMESTIC), MF level
  - Judge: BURKE, LAUREN
  - State Attorney: STATE, ATTORNEY
  - Booking: 2025015876
  - 121 docket entries with dates and descriptions
  - 2 related cases
  - $50.00 in fees

### 2. LLM Hallucination Pattern

When the LLM received HTML with **no case data**, it:
1. Recognized it was supposed to extract case information
2. Couldn't find actual data in the Angular shell
3. **Invented generic placeholder data** to fulfill the extraction request

**Hallucination Indicators:**
- Generic names ("John Doe", "State")
- Vague charges ("Felony" without statute)
- Null values everywhere
- Filing date matching extraction timestamp exactly
- Generic court name without specifics

---

## Complete Fix Implementation

### Fix #1: File Type Detection and Validation

```javascript
/**
 * Ensures we're working with the correct file type
 */
function getCorrectFilePath(bookingNumber) {
  // ALWAYS use PDF files for case data extraction
  const pdfPath = `Real_World_Data/${bookingNumber}.pdf`;
  const txtPath = `Real_World_Data/${bookingNumber}.txt`;

  // Check if PDF exists
  if (fs.existsSync(pdfPath)) {
    return {
      path: pdfPath,
      type: 'pdf',
      valid: true
    };
  }

  // If only TXT exists, warn that it won't have case data
  if (fs.existsSync(txtPath)) {
    return {
      path: null,
      type: 'txt',
      valid: false,
      error: 'TXT files contain only Angular shell - no case data available'
    };
  }

  return {
    path: null,
    type: null,
    valid: false,
    error: 'No file found for booking number'
  };
}

// Usage:
const fileInfo = getCorrectFilePath('2025015876');
if (!fileInfo.valid) {
  console.error(`Cannot extract: ${fileInfo.error}`);
  return null;
}
```

### Fix #2: HTML Content Validation

```javascript
/**
 * Validates that extracted HTML contains actual case data
 */
function validateExtractedHTML(html) {
  const validation = {
    valid: false,
    errors: [],
    warnings: []
  };

  // Check #1: Detect Angular shell without case data
  if (html.includes('ng-app="sc"') && !html.includes('Case #:')) {
    validation.errors.push('HTML contains only Angular application shell');
    validation.errors.push('No case data found - extraction will fail or hallucinate');
    return validation;
  }

  // Check #2: Verify essential case data elements exist
  const requiredElements = [
    { pattern: 'Case #:', name: 'Case Number' },
    { pattern: 'Party Type:', name: 'Parties Section' },
    { pattern: 'Statute', name: 'Charges Section' },
    { pattern: 'Date Filed:', name: 'Filing Date' }
  ];

  for (const element of requiredElements) {
    if (!html.includes(element.pattern)) {
      validation.errors.push(`Missing required element: ${element.name}`);
    }
  }

  // Check #3: Verify we have actual data, not just labels
  const caseNumberMatch = html.match(/Case #:\s*<\/b>\s*([0-9-A-Z]+)/);
  if (!caseNumberMatch || !caseNumberMatch[1]) {
    validation.errors.push('Case number label found but no actual case number value');
  }

  // Set validation status
  validation.valid = validation.errors.length === 0;

  // Warnings for incomplete sections
  if (!html.includes('Sentence Type:')) {
    validation.warnings.push('No sentence data found (may be expected for active cases)');
  }
  if (!html.includes('Warrant Type:')) {
    validation.warnings.push('No warrant data found (may be expected)');
  }

  return validation;
}

// Usage:
const validation = validateExtractedHTML(htmlContent);
if (!validation.valid) {
  console.error('HTML validation failed:');
  validation.errors.forEach(err => console.error(`  - ${err}`));
  return null;
}
if (validation.warnings.length > 0) {
  console.warn('HTML validation warnings:');
  validation.warnings.forEach(warn => console.warn(`  - ${warn}`));
}
```

### Fix #3: Pre-LLM Data Extraction

```javascript
/**
 * Extract basic case data BEFORE sending to LLM
 * This provides ground truth to validate LLM output against
 */
function extractGroundTruth(html) {
  const groundTruth = {};

  // Extract case number
  const caseNumberMatch = html.match(/Case #:\s*<\/b>\s*([0-9-A-Z]+)/);
  if (caseNumberMatch) {
    groundTruth.caseNumber = caseNumberMatch[1];
  }

  // Extract defendant name (first defendant listed)
  const defendantMatch = html.match(/Party Type:\s*<\/b>\s*Defendant[\s\S]*?Party Name:\s*<\/b>\s*([A-Z\s,]+)/);
  if (defendantMatch) {
    groundTruth.defendantName = defendantMatch[1].trim();
  }

  // Extract judge name
  const judgeMatch = html.match(/Judge:\s*<\/b>\s*([A-Z\s,]+)/);
  if (judgeMatch) {
    groundTruth.judgeName = judgeMatch[1].trim();
  }

  // Extract first charge statute
  const statuteMatch = html.match(/Statute:\s*<\/b>\s*([0-9.()A-Z]+)/);
  if (statuteMatch) {
    groundTruth.firstStatute = statuteMatch[1].trim();
  }

  // Count docket entries
  const docketMatches = html.match(/\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}\s+[AP]M/g);
  if (docketMatches) {
    groundTruth.docketEntryCount = docketMatches.length;
  }

  return groundTruth;
}

// Usage:
const groundTruth = extractGroundTruth(htmlContent);
console.log('Ground truth extracted:', groundTruth);
// Later: validate LLM output against this ground truth
```

### Fix #4: Enhanced LLM System Prompt

```javascript
const EXTRACTION_SYSTEM_PROMPT = `
You are a legal document data extraction system for Palm Beach County court cases.

CRITICAL INSTRUCTIONS:

1. DATA INTEGRITY:
   - Extract ONLY information that is explicitly present in the HTML
   - DO NOT invent, guess, or fabricate ANY data
   - DO NOT use placeholder names like "John Doe", "Jane Smith", or generic "State"
   - DO NOT use generic descriptions like "Felony" without specific statute numbers
   - If a field is not present in the HTML, set it to null

2. VALIDATION CHECKS:
   - Case numbers follow format: XX-YYYY-XX-XXXXXX-XXXX-XX (e.g., 50-2025-MM-006375-AXXX-MB)
   - Defendant names are in format: LASTNAME, FIRSTNAME MIDDLENAME (all uppercase)
   - Statute numbers follow format: XXX.XX(X) (e.g., 784.03(1), 893.13(1A1))
   - Dates are in MM/DD/YYYY format from the document (NOT extraction timestamp)

3. ERROR DETECTION:
   - If you cannot find case data in the HTML, return:
     {
       "error": "NO_CASE_DATA_FOUND",
       "reason": "HTML appears to contain only application framework without case information",
       "extractedData": null
     }
   - If HTML contains only navigation menus, Angular directives, or UI templates, return the above error

4. QUALITY CHECKS:
   - Verify extracted case number exists in HTML
   - Verify defendant name appears in parties section
   - Verify charge statutes match court record format
   - Verify filing dates are historical (not future dates or extraction timestamp)

Extract the following case information as JSON:
{
  "caseNumber": "string",          // Case # field
  "caseTitle": "string",           // Format: "State of Florida v. [DEFENDANT NAME]"
  "caseType": "string",            // MM, CF, etc.
  "partyNamesAndRoles": [...],     // All parties with exact names and roles
  "dates": {...},                  // All dates from document
  "chargesAndStatutes": [...],     // All charges with exact statute numbers
  "bondInformation": {...},        // Bond details if present
  "courtAndJudgeDetails": {...}    // Court, judge, division info
}
`;
```

### Fix #5: LLM Output Validation (Hallucination Detection)

```javascript
/**
 * Detects if LLM hallucinated data instead of extracting it
 */
function detectHallucination(extractedData, groundTruth) {
  const hallucinations = [];
  const warnings = [];

  // Check #1: Generic placeholder names
  const genericNames = ['John Doe', 'Jane Doe', 'John Smith', 'Jane Smith'];
  const caseTitle = extractedData.caseInfo?.caseTitle || '';

  for (const genericName of genericNames) {
    if (caseTitle.includes(genericName)) {
      hallucinations.push({
        severity: 'CRITICAL',
        field: 'caseTitle',
        issue: `Contains generic placeholder name: ${genericName}`,
        value: caseTitle
      });
    }
  }

  // Check #2: Vague charges without statutes
  const charges = extractedData.caseInfo?.chargesAndStatutes || [];
  for (const charge of charges) {
    if (!charge.statute || charge.statute === null) {
      if (charge.charge && !charge.charge.includes('NOLLE PROSSE')) {
        hallucinations.push({
          severity: 'CRITICAL',
          field: 'chargesAndStatutes',
          issue: 'Charge missing statute number',
          value: charge.charge
        });
      }
    }

    // Check for vague charge descriptions
    const vagueCharges = ['Felony', 'Misdemeanor', 'Criminal', 'Violation'];
    if (vagueCharges.includes(charge.charge)) {
      hallucinations.push({
        severity: 'CRITICAL',
        field: 'chargesAndStatutes',
        issue: 'Vague charge description without specifics',
        value: charge.charge
      });
    }
  }

  // Check #3: Filing date matches extraction timestamp
  const filingDate = extractedData.caseInfo?.dates?.filingDate;
  const extractedAt = extractedData.extractionMetadata?.extractedAt;

  if (filingDate && extractedAt) {
    const filingTime = new Date(filingDate).getTime();
    const extractionTime = new Date(extractedAt).getTime();

    // If timestamps match within 1 second, likely hallucinated
    if (Math.abs(filingTime - extractionTime) < 1000) {
      hallucinations.push({
        severity: 'CRITICAL',
        field: 'dates.filingDate',
        issue: 'Filing date matches extraction timestamp - likely fabricated',
        value: filingDate
      });
    }
  }

  // Check #4: Null values in critical fields
  if (!extractedData.caseInfo?.docketNumber) {
    hallucinations.push({
      severity: 'CRITICAL',
      field: 'docketNumber',
      issue: 'Docket number is null - should always be present',
      value: null
    });
  }

  // Check #5: Generic court name
  const courtName = extractedData.caseInfo?.courtAndJudgeDetails?.courtName;
  if (courtName === 'Palm Beach County Courthouse') {
    warnings.push({
      severity: 'WARNING',
      field: 'courtAndJudgeDetails.courtName',
      issue: 'Generic court name - should be specific (e.g., "County Criminal", "Circuit Civil")',
      value: courtName
    });
  }

  // Check #6: Validate against ground truth
  if (groundTruth.caseNumber && extractedData.caseInfo?.docketNumber !== groundTruth.caseNumber) {
    hallucinations.push({
      severity: 'CRITICAL',
      field: 'docketNumber',
      issue: 'Extracted case number does not match ground truth',
      expected: groundTruth.caseNumber,
      actual: extractedData.caseInfo?.docketNumber
    });
  }

  if (groundTruth.defendantName) {
    const parties = extractedData.caseInfo?.partyNamesAndRoles || [];
    const hasDefendant = parties.some(p =>
      p.name.includes(groundTruth.defendantName) ||
      groundTruth.defendantName.includes(p.name)
    );

    if (!hasDefendant) {
      hallucinations.push({
        severity: 'CRITICAL',
        field: 'partyNamesAndRoles',
        issue: 'Defendant name does not match ground truth',
        expected: groundTruth.defendantName,
        actual: parties.map(p => p.name).join(', ')
      });
    }
  }

  return {
    isHallucinated: hallucinations.length > 0,
    hallucinations,
    warnings
  };
}

// Usage:
const hallucinationCheck = detectHallucination(extractedData, groundTruth);

if (hallucinationCheck.isHallucinated) {
  console.error('HALLUCINATION DETECTED - Data is fabricated, not extracted:');
  hallucinationCheck.hallucinations.forEach(h => {
    console.error(`  [${h.severity}] ${h.field}: ${h.issue}`);
    if (h.expected) console.error(`    Expected: ${h.expected}`);
    if (h.actual) console.error(`    Actual: ${h.actual}`);
  });

  // DO NOT USE THIS DATA
  return null;
}

if (hallucinationCheck.warnings.length > 0) {
  console.warn('Extraction warnings:');
  hallucinationCheck.warnings.forEach(w => {
    console.warn(`  [${w.severity}] ${w.field}: ${w.issue}`);
  });
}
```

### Fix #6: Complete Extraction Pipeline

```javascript
/**
 * Complete extraction pipeline with all validation steps
 */
async function extractCaseData(bookingNumber) {
  console.log(`Starting extraction for booking ${bookingNumber}...`);

  // Step 1: Get correct file path (PDF, not TXT)
  const fileInfo = getCorrectFilePath(bookingNumber);
  if (!fileInfo.valid) {
    return {
      success: false,
      error: 'FILE_TYPE_ERROR',
      message: fileInfo.error
    };
  }

  console.log(`✓ Using file: ${fileInfo.path}`);

  // Step 2: Load HTML content
  const htmlContent = await loadHTMLFromPDF(fileInfo.path);

  // Step 3: Validate HTML contains case data
  const validation = validateExtractedHTML(htmlContent);
  if (!validation.valid) {
    return {
      success: false,
      error: 'HTML_VALIDATION_ERROR',
      message: 'HTML does not contain case data',
      details: validation.errors
    };
  }

  console.log(`✓ HTML validation passed`);
  if (validation.warnings.length > 0) {
    console.warn(`  Warnings: ${validation.warnings.join(', ')}`);
  }

  // Step 4: Extract ground truth for validation
  const groundTruth = extractGroundTruth(htmlContent);
  console.log(`✓ Ground truth extracted:`, groundTruth);

  // Step 5: Send to LLM for structured extraction
  const llmResponse = await sendToLLM(htmlContent, EXTRACTION_SYSTEM_PROMPT);

  // Check if LLM reported no data
  if (llmResponse.error === 'NO_CASE_DATA_FOUND') {
    return {
      success: false,
      error: 'NO_CASE_DATA',
      message: 'LLM could not find case data in HTML',
      reason: llmResponse.reason
    };
  }

  console.log(`✓ LLM extraction completed`);

  // Step 6: Validate LLM output for hallucinations
  const hallucinationCheck = detectHallucination(llmResponse, groundTruth);

  if (hallucinationCheck.isHallucinated) {
    return {
      success: false,
      error: 'HALLUCINATION_DETECTED',
      message: 'LLM fabricated data instead of extracting it',
      hallucinations: hallucinationCheck.hallucinations,
      extractedData: llmResponse // Include for debugging
    };
  }

  console.log(`✓ Hallucination check passed`);

  if (hallucinationCheck.warnings.length > 0) {
    console.warn(`  Warnings:`, hallucinationCheck.warnings);
  }

  // Step 7: Return validated data
  return {
    success: true,
    data: llmResponse,
    groundTruth,
    warnings: hallucinationCheck.warnings
  };
}

// Usage:
const result = await extractCaseData('2025015876');

if (!result.success) {
  console.error(`Extraction failed: ${result.error}`);
  console.error(`Message: ${result.message}`);

  if (result.hallucinations) {
    console.error('Hallucinations detected:');
    result.hallucinations.forEach(h => console.error(`  - ${h.field}: ${h.issue}`));
  }
} else {
  console.log('Extraction successful!');
  console.log('Case:', result.data.caseInfo.caseTitle);
  console.log('Defendant:', result.data.caseInfo.partyNamesAndRoles.find(p => p.role === 'Defendant')?.name);
}
```

---

## Testing Recommendations

### Test Case #1: Verify PDF vs TXT Detection

```javascript
// Test with TXT file (should fail gracefully)
const txtResult = await extractCaseData('2025015876'); // If .txt exists
// Expected: Error "TXT files contain only Angular shell"

// Test with PDF file (should succeed)
const pdfResult = await extractCaseData('2025015876'); // If .pdf exists
// Expected: Success with actual case data
```

### Test Case #2: Verify Ground Truth Extraction

```javascript
const html = loadHTMLFromPDF('Real_World_Data/2025015876.pdf');
const truth = extractGroundTruth(html);

console.log('Ground Truth Check:');
console.log('  Case Number:', truth.caseNumber); // Should be: 50-2025-MM-006375-AXXX-MB
console.log('  Defendant:', truth.defendantName); // Should be: ROPER, ANTONIO BERNARD
console.log('  Judge:', truth.judgeName);         // Should be: BURKE, LAUREN
console.log('  First Statute:', truth.firstStatute); // Should be: 784.03(1)
```

### Test Case #3: Verify Hallucination Detection

```javascript
// Create fake hallucinated data
const fakeData = {
  extractionMetadata: {
    extractedAt: "2025-11-19T20:27:07.250Z"
  },
  caseInfo: {
    docketNumber: null,
    caseTitle: "State v. John Doe",
    chargesAndStatutes: [
      {charge: "Felony", statute: null}
    ],
    dates: {
      filingDate: "2025-11-19T20:27:07.250Z" // Matches extraction time
    }
  }
};

const groundTruth = {
  caseNumber: "50-2025-MM-006375-AXXX-MB",
  defendantName: "ROPER, ANTONIO BERNARD"
};

const check = detectHallucination(fakeData, groundTruth);
console.log('Is Hallucinated:', check.isHallucinated); // Should be: true
console.log('Issues Found:', check.hallucinations.length); // Should be: 5+

// Expected hallucinations:
// 1. Generic "John Doe" name
// 2. Vague "Felony" charge without statute
// 3. Filing date matches extraction timestamp
// 4. Null docket number
// 5. Case number mismatch with ground truth
// 6. Defendant name mismatch with ground truth
```

---

## Prevention Checklist

Before deploying to production, ensure:

- [ ] File path resolution always uses `.pdf` extension for case data
- [ ] HTML validation runs before LLM processing
- [ ] Ground truth extraction captures at minimum: case number, defendant name, judge
- [ ] LLM system prompt includes error handling for missing data
- [ ] LLM output validation detects generic names, vague charges, null values
- [ ] Hallucination detection compares against ground truth
- [ ] Failed extractions return structured errors (not partial/fake data)
- [ ] Logging captures validation failures for debugging
- [ ] Test suite includes cases with missing sections to verify null handling
- [ ] Manual review of first 10-20 extractions to validate accuracy

---

## Known Edge Cases

### 1. Empty Sections
Some cases legitimately have no data in certain sections (warrants, sentences, arrests). This is expected and should NOT trigger errors.

**Handling:**
```javascript
// OK: Sentence section empty for active case
if (!html.includes('Sentence Type:')) {
  extractedData.sentences = []; // Empty array is correct
}
```

### 2. Multiple Defendants
Some cases have multiple defendants. Ensure all are captured.

**Validation:**
```javascript
const defendants = parties.filter(p => p.role === 'Defendant');
if (defendants.length === 0) {
  errors.push('No defendants found - data may be incomplete');
}
```

### 3. NOLLE PROSSE Charges
Dismissed charges have "NOLLE PROSSE" as statute - this is valid.

**Handling:**
```javascript
if (charge.statute === 'NOLLE PROSSE') {
  // This is valid - charge was dismissed
  charge.status = 'Dismissed';
}
```

---

## Support and Debugging

### Enable Debug Logging

```javascript
const DEBUG = true;

function extractCaseData(bookingNumber) {
  if (DEBUG) {
    console.log('[DEBUG] Starting extraction for:', bookingNumber);
    console.log('[DEBUG] File path resolution:', getCorrectFilePath(bookingNumber));
    // ... additional logging
  }
  // ... extraction logic
}
```

### Save Failed Extractions

```javascript
if (!result.success) {
  const debugDir = 'debug_failures';
  fs.mkdirSync(debugDir, {recursive: true});

  fs.writeFileSync(
    `${debugDir}/${bookingNumber}_failure.json`,
    JSON.stringify(result, null, 2)
  );

  console.log(`Debug data saved to ${debugDir}/${bookingNumber}_failure.json`);
}
```

---

## Summary

**Root Cause:** System extracted from TXT file (Angular shell only) instead of PDF file (actual case data), causing LLM to hallucinate generic placeholder data.

**Fix Summary:**
1. Always use PDF files for extraction
2. Validate HTML contains case data before LLM processing
3. Extract ground truth to validate against
4. Update LLM prompt to handle missing data gracefully
5. Detect hallucinations by checking for generic names, vague data, and mismatches

**Impact:** Critical - hallucinated data is worse than no data. Must be fixed before production use.

**Priority:** IMMEDIATE - This breaks the entire extraction pipeline.
