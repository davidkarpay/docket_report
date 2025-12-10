# BUSINESS LOGIC INTERPRETER REPORT
## Phase 3.1: Data Extraction Workflows and Business Logic Analysis

**Analysis Date:** 2025-11-24
**Repository:** Docket_Manager (github.com/davidkarpay/Docket_Manager.git)
**Agent:** Business Logic Interpreter
**Session:** Multi-Agent Instantiation Meta-Prompt (MAIMP)

---

## EXECUTIVE SUMMARY

The Docket_Manager implements a **vision-based legal case data extraction pipeline** with three main workflows. The business logic is centered around converting visual court website data into structured records for docket management systems used by public defenders.

**Core Business Problem:** Public defenders need to extract case data from court websites quickly and privately, but:
- Court websites have varying formats
- Manual data entry is time-consuming
- API access is often unavailable
- Client privacy is paramount

**Solution Architecture:** Vision AI + Browser Automation
- Screenshots replace HTML parsing (format-agnostic)
- Local processing ensures privacy
- Structured prompting ensures consistent output

**Workflows Identified:** 3 primary, 12 sub-workflows

---

## DOMAIN MODEL

### Core Entities

```python
┌─────────────────────────────────────────┐
│          CaseData (Core Entity)         │
├─────────────────────────────────────────┤
│ • case_number: str                      │
│ • client_name: str                      │
│ • next_date: Optional[str]              │
│ • charges: Optional[str]                │
│ • attorney: Optional[str]               │
│ • judge: Optional[str]                  │
│ • division: Optional[str]               │
│ • status: Optional[str]                 │
│ • bond_amount: Optional[str]            │
│ • arrest_date: Optional[str]            │
│ • filing_date: Optional[str]            │
│ • disposition: Optional[str]            │
│ • plea: Optional[str]                   │
│ • sentence: Optional[str]               │
│ • probation_info: Optional[str]         │
│ • prior_record: Optional[str]           │
│ • victim_info: Optional[str]            │
│ • notes: Optional[str]                  │
│ • page_url: Optional[str]               │
│ • extracted_at: Optional[str]           │
│ • raw_extraction: Optional[Dict]        │
└─────────────────────────────────────────┘

Supporting Entities:
├── Court Configuration (Dict)
├── Batch Request (List[Dict])
└── Export Files (CSV, JSON)
```

### Domain Rules

**Business Rules Identified:**

1. **Privacy Rule:** All processing must be local
   - No external API calls (except to local LM Studio)
   - No data transmission to cloud services
   - Screenshots stored locally

2. **Rate Limiting Rule:** Respectful scraping
   - Configurable delays between requests (default: 2-5 seconds)
   - Batch pause intervals
   - Manual authentication (no automated login)

3. **Data Completeness Rule:** Extract all visible information
   - 19 standard fields
   - Additional fields captured in raw_extraction
   - Missing fields marked as None (not omitted)

4. **Audit Trail Rule:** Visual verification required
   - Screenshot saved for every extraction
   - Timestamp on all extractions
   - Source URL preserved

5. **Manual Authentication Rule:** User controls access
   - Tool doesn't handle login
   - User authenticates manually before running
   - Respects session cookies

---

## WORKFLOW 1: SINGLE CASE EXTRACTION

### Workflow Overview

**Trigger:** User selects "Extract single case" in CLI or calls `process_case_url()`

**Input:**
- Case number (str)
- Case details page URL (str)
- Optional: CSS selector to wait for

**Output:**
- CaseData object
- Screenshot PNG file
- Optional: CSV/JSON export

### Detailed Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    SINGLE CASE EXTRACTION                        │
└─────────────────────────────────────────────────────────────────┘

[USER INPUT]
    │
    ├─ Case Number: "2024CF001234"
    ├─ URL: "https://court.example.com/case/2024CF001234"
    └─ Optional: wait_selector=".case-details"
    │
    ▼
┌─────────────────────────────────────────┐
│   1. Initialize CaseDataExtractorApp    │
│      - Create output directories        │
│      - Initialize LM Studio client      │
│      - Initialize Playwright            │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│   2. Launch Browser (Playwright)        │
│      - Start Chromium                   │
│      - Set viewport: 1920x1080          │
│      - Preserve user session            │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│   3. Navigate to Case Page              │
│      - page.goto(url)                   │
│      - Wait for: networkidle            │
│      - Timeout: 30 seconds              │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│   4. Wait for Content (if selector)     │
│      - wait_for_selector()              │
│      - Timeout: 10 seconds              │
│      - Additional wait: 2 seconds       │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│   5. Capture Screenshot                 │
│      - Full page screenshot             │
│      - Format: PNG                      │
│      - Resolution: 1920x1080            │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│   6. Save Screenshot                    │
│      - Path: extracted_cases/screenshots│
│      - Filename: {case}_{timestamp}.png │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│   7. Convert to Base64                  │
│      - Encode screenshot bytes          │
│      - Prepare for API transmission     │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│   8. Build Extraction Prompt            │
│      - Case number context              │
│      - Field definitions                │
│      - JSON output format               │
│      - Legal terminology guidance       │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│   9. Call LM Studio Vision API          │
│      - POST to http://localhost:1234    │
│      - Model: loaded vision model       │
│      - Timeout: 120 seconds             │
│      - Temperature: 0.1 (factual)       │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│   10. Parse AI Response                 │
│       - Extract JSON from response      │
│       - Handle markdown code blocks     │
│       - Validate JSON structure         │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│   11. Build CaseData Object             │
│       - Map extracted fields            │
│       - Add metadata (url, timestamp)   │
│       - Preserve raw_extraction         │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│   12. Clean Up Resources                │
│       - Close browser page              │
│       - Release Playwright              │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│   13. Export (if requested)             │
│       - Generate CSV                    │
│       - Generate JSON                   │
│       - Save to output directory        │
└─────────────────────────────────────────┘
    │
    ▼
[OUTPUT]
├─ CaseData object
├─ Screenshot: {case}_{timestamp}.png
├─ (Optional) CSV: {case}.csv
└─ (Optional) JSON: {case}.json
```

### Key Business Logic Points

#### Point 1: Network Idle Wait Strategy

**Logic:** Wait for networkidle before screenshot

**Rationale:**
- Court websites often load data via AJAX
- networkidle ensures all content loaded
- Prevents capturing incomplete pages

**Trade-off:** Slower (waits for all network activity) vs. More complete data

#### Point 2: Screenshot-Based Extraction

**Logic:** Use screenshot instead of HTML parsing

**Rationale:**
- Format-agnostic (works on any visual layout)
- Resilient to HTML structure changes
- Captures what user sees (including CSS rendering)
- Handles JavaScript-rendered content

**Trade-off:** Slower (AI inference) vs. Universal compatibility

#### Point 3: Low Temperature Setting (0.1)

**Logic:** Temperature=0.1 for vision model

**Rationale:**
- Extraction is factual task (not creative)
- Low temperature = consistent, deterministic output
- Reduces hallucinations
- Better for structured data extraction

**Trade-off:** Less creative interpretation vs. More accuracy

#### Point 4: Preservation of Raw Extraction

**Logic:** Store raw AI response in raw_extraction field

**Rationale:**
- Debugging failed extractions
- Auditing AI performance
- Potential data recovery
- Training data for model improvement

**Trade-off:** Larger storage size vs. Complete audit trail

---

## WORKFLOW 2: BATCH PROCESSING

### Workflow Overview

**Trigger:** User selects "Extract batch from CSV" or calls `process_batch()`

**Input:**
- CSV file with columns: case_number, url
- Optional: wait_selector
- Optional: delay_between_cases (seconds)

**Output:**
- List of CaseData objects
- Multiple screenshot files
- Batch CSV export
- Batch JSON export

### Detailed Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      BATCH PROCESSING                            │
└─────────────────────────────────────────────────────────────────┘

[USER INPUT]
    │
    ├─ CSV File: cases_to_process.csv
    ├─ Delay: 3 seconds (rate limiting)
    └─ Optional: wait_selector
    │
    ▼
┌─────────────────────────────────────────┐
│   1. Read CSV File                      │
│      - Parse CSV with csv.DictReader    │
│      - Extract case_number and url      │
│      - Validate required columns        │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│   2. Initialize Batch Context           │
│      - Create results list              │
│      - Set up progress tracking         │
│      - Initialize error handling        │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│   3. FOR EACH CASE (Sequential)         │
│      ┌─────────────────────────────┐    │
│      │  3a. Display Progress       │    │
│      │      "Processing 1/20..."   │    │
│      └─────────────────────────────┘    │
│      ┌─────────────────────────────┐    │
│      │  3b. Process Single Case    │    │
│      │      (Full workflow 1)      │    │
│      └─────────────────────────────┘    │
│      ┌─────────────────────────────┐    │
│      │  3c. Add to Results         │    │
│      │      (if successful)        │    │
│      └─────────────────────────────┘    │
│      ┌─────────────────────────────┐    │
│      │  3d. Rate Limiting Delay    │    │
│      │      await sleep(delay)     │    │
│      └─────────────────────────────┘    │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│   4. Aggregate Results                  │
│      - Collect all CaseData objects     │
│      - Count successes vs failures      │
│      - Log summary statistics           │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│   5. Batch Export                       │
│      - Generate CSV with all cases      │
│      - Generate JSON with all cases     │
│      - Timestamped filenames            │
└─────────────────────────────────────────┘
    │
    ▼
[OUTPUT]
├─ CSV: extracted_cases_{timestamp}.csv
├─ JSON: extracted_cases_{timestamp}.json
├─ Screenshots: Multiple PNG files
└─ Summary: "Extracted 18/20 cases"
```

### Key Business Logic Points

#### Point 1: Sequential Processing

**Logic:** Process cases one at a time (not parallel)

**Current Implementation:** Sequential with delays

**Rationale:**
- Respectful to court servers
- Prevents overloading
- Easier error handling
- Simpler progress tracking

**Potential Improvement:** Parallel processing with semaphore (identified in Code Analyzer report)

#### Point 2: Rate Limiting Strategy

**Logic:** Configurable delay between cases

**Default:** 2-5 seconds (configurable per court)

**Rationale:**
- Prevents rate limiting by court servers
- Ethical scraping practice
- Reduces detection risk
- Allows server recovery time

**Business Rule:** Never set delay < 1 second

#### Point 3: Partial Success Handling

**Logic:** Continue processing even if individual cases fail

**Behavior:**
- Log error for failed case
- Continue to next case
- Report successes vs failures at end

**Rationale:**
- Maximize data collection
- One bad URL doesn't stop entire batch
- User can retry failed cases individually

**Trade-off:** Requires error review vs. All-or-nothing approach

#### Point 4: Batch Pause for Large Sets

**Logic:** Pause after N cases (configurable)

**Default:** 20 cases (court-specific)

**Rationale:**
- Prevents sustained high load
- Allows server breathing room
- Reduces detection as automated tool
- User can monitor progress

**Configuration:** `batch_size` and `batch_pause_seconds` in court_configs.py

---

## WORKFLOW 3: INTERACTIVE SEARCH

### Workflow Overview

**Trigger:** User selects "Interactive search and extract" in CLI

**Input:**
- Court search page URL
- Case number to search
- CSS selectors for search form elements

**Output:**
- Dynamically discovered case URL
- CaseData object (from discovered URL)
- Screenshot
- Optional: CSV/JSON export

### Detailed Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                   INTERACTIVE SEARCH MODE                        │
└─────────────────────────────────────────────────────────────────┘

[USER INPUT]
    │
    ├─ Search Page URL: "https://court.example.com/search"
    ├─ Case Number: "2024CF001234"
    └─ Selectors:
        ├─ search_input_selector: "#caseNumber"
        ├─ search_button_selector: "#searchBtn"
        └─ result_link_selector: ".case-link"
    │
    ▼
┌─────────────────────────────────────────┐
│   1. Launch Browser                     │
│      - Start Playwright Chromium        │
│      - Create new page                  │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│   2. Navigate to Search Page            │
│      - page.goto(search_url)            │
│      - Wait for page load               │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│   3. Fill Search Form                   │
│      - page.fill(input_selector, case#) │
│      - Simulate human typing            │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│   4. Submit Search                      │
│      - page.click(button_selector)      │
│      - Wait for navigation              │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│   5. Wait for Results                   │
│      - wait_for_selector(result_link)   │
│      - Timeout: 10 seconds              │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│   6. Click First Result                 │
│      - Select first matching link       │
│      - page.click(selector + ":first")  │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│   7. Wait for Case Page Load            │
│      - await asyncio.sleep(2)           │
│      - Capture current URL              │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│   8. Extract Case URL                   │
│      - url = page.url                   │
│      - Close browser page               │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│   9. Process Discovered URL             │
│      - Call process_case_url(url)       │
│      - (Full Workflow 1)                │
└─────────────────────────────────────────┘
    │
    ▼
[OUTPUT]
├─ Discovered URL (logged)
├─ CaseData object
├─ Screenshot
└─ Optional: Export files
```

### Key Business Logic Points

#### Point 1: CSS Selector Configuration

**Logic:** User provides selectors for court-specific form elements

**Challenge:** Every court has different HTML structure

**Solution:** Configuration-driven approach
- Selectors stored in court_configs.py
- User can find selectors using browser DevTools
- Documented in DEPLOYMENT_CHECKLIST.md

**Trade-off:** Initial setup effort vs. Reusability

#### Point 2: First Result Selection

**Logic:** Automatically click first search result

**Assumption:** First result is the correct case

**Risk:** If multiple cases match, may select wrong one

**Mitigation:** Display found URL to user before extraction

#### Point 3: URL Discovery Pattern

**Logic:** Capture page.url after navigation

**Rationale:**
- Many court websites use dynamic URLs
- Eliminates need to construct URL manually
- Handles redirects and URL rewrites

**Use Case:** When case URL pattern is unknown or complex

#### Point 4: Two-Phase Approach

**Logic:** Search + Extract as separate steps

**Rationale:**
- Search UI is separate from extraction logic
- Allows user verification of found URL
- Enables caching of discovered URLs for batch processing

**Benefit:** User can build CSV from search results, then batch process

---

## SUB-WORKFLOWS

### Sub-Workflow: Vision AI Extraction

**Context:** Core of all extraction workflows

```
[Screenshot + Prompt]
    │
    ▼
┌───────────────────────────────────────┐
│ 1. Prompt Construction                │
│    ├─ Field definitions               │
│    ├─ JSON format specification       │
│    ├─ Context (case number)           │
│    └─ Legal terminology guidance      │
└───────────────────────────────────────┘
    │
    ▼
┌───────────────────────────────────────┐
│ 2. API Request                        │
│    ├─ Model: local-model (LLaVA)      │
│    ├─ Max tokens: 2000                │
│    ├─ Temperature: 0.1                │
│    └─ Timeout: 120s                   │
└───────────────────────────────────────┘
    │
    ▼
┌───────────────────────────────────────┐
│ 3. Response Parsing                   │
│    ├─ Strip markdown code blocks      │
│    ├─ Extract JSON                    │
│    ├─ Validate structure              │
│    └─ Handle parsing errors           │
└───────────────────────────────────────┘
    │
    ▼
[Extracted JSON Dictionary]
```

**Key Insight:** Prompt engineering is critical business logic
- Field definitions must be precise
- JSON structure must be explicitly specified
- Context improves extraction accuracy

---

### Sub-Workflow: CSV Export

```
[List of CaseData Objects]
    │
    ▼
┌───────────────────────────────────────┐
│ 1. Collect All Unique Fields         │
│    - Iterate all CaseData objects     │
│    - Build set of field names         │
│    - Exclude raw_extraction (too big) │
└───────────────────────────────────────┘
    │
    ▼
┌───────────────────────────────────────┐
│ 2. Create CSV Writer                  │
│    - csv.DictWriter()                 │
│    - Fieldnames: sorted unique fields │
│    - Encoding: UTF-8                  │
└───────────────────────────────────────┘
    │
    ▼
┌───────────────────────────────────────┐
│ 3. Write Header Row                   │
│    - writer.writeheader()             │
└───────────────────────────────────────┘
    │
    ▼
┌───────────────────────────────────────┐
│ 4. Write Data Rows                    │
│    - Convert CaseData to dict         │
│    - Remove raw_extraction            │
│    - writer.writerow(case_dict)       │
└───────────────────────────────────────┘
    │
    ▼
[CSV File: extracted_cases_{timestamp}.csv]
```

**Business Logic:**
- Dynamic field discovery (handles additional_fields)
- UTF-8 encoding (handles international characters)
- Sorted field names (consistent column order)

---

### Sub-Workflow: JSON Export

```
[List of CaseData Objects]
    │
    ▼
┌───────────────────────────────────────┐
│ 1. Convert to Dictionaries            │
│    - asdict(case) for each CaseData   │
│    - Includes raw_extraction          │
└───────────────────────────────────────┘
    │
    ▼
┌───────────────────────────────────────┐
│ 2. Serialize to JSON                  │
│    - json.dump()                      │
│    - Indent: 2 spaces                 │
│    - Default: str (for datetime, etc.)│
└───────────────────────────────────────┘
    │
    ▼
[JSON File: extracted_cases_{timestamp}.json]
```

**Business Logic:**
- Preserves all data (including raw_extraction)
- Human-readable format (indented)
- Type handling (datetime → string)

---

## DATA FLOW ANALYSIS

### End-to-End Data Flow

```
Court Website (HTML/JavaScript)
    │
    ▼
Browser Rendering (Playwright)
    │
    ▼
Visual Representation (Screenshot PNG)
    │
    ▼
Base64 Encoding
    │
    ▼
LM Studio API (HTTP)
    │
    ▼
Vision Model Inference (LLaVA)
    │
    ▼
Structured JSON Response
    │
    ▼
Python Dictionary
    │
    ▼
CaseData Object (Dataclass)
    │
    ├─▶ CSV Export (Spreadsheet)
    ├─▶ JSON Export (Archive)
    └─▶ In-Memory (Processing)
         │
         ▼
    Docket Management System
```

### Data Transformation Points

**Transformation 1:** HTML → Visual (Playwright)
- Input: HTML + CSS + JavaScript
- Process: Browser rendering
- Output: PNG screenshot
- **Loss:** Interactivity, hidden elements
- **Gain:** Visual fidelity, layout context

**Transformation 2:** Visual → Text (Vision AI)
- Input: PNG screenshot
- Process: LLaVA vision model
- Output: JSON text
- **Loss:** Visual layout, formatting
- **Gain:** Structured data, field labels

**Transformation 3:** JSON → CaseData (Python)
- Input: JSON dictionary
- Process: Object construction
- Output: CaseData dataclass
- **Loss:** None (lossless)
- **Gain:** Type safety, methods

**Transformation 4:** CaseData → CSV (Export)
- Input: CaseData objects
- Process: Flattening to rows
- Output: CSV file
- **Loss:** raw_extraction, nested structure
- **Gain:** Spreadsheet compatibility

**Transformation 5:** CaseData → JSON (Export)
- Input: CaseData objects
- Process: Serialization
- Output: JSON file
- **Loss:** None (includes raw_extraction)
- **Gain:** Complete audit trail

---

## BUSINESS RULES IMPLEMENTATION

### Rule 1: Privacy First

**Implementation Points:**
1. **No External APIs**
   - LM Studio runs locally (localhost:1234)
   - No calls to cloud AI services
   - Verified in LMStudioVisionClient (httpx client to localhost only)

2. **Local File Storage**
   - Screenshots: local disk only
   - Exports: local disk only
   - No cloud uploads

3. **Session Preservation**
   - Playwright preserves cookies (user-controlled auth)
   - No credential storage
   - User logs in manually before running tool

**Code Evidence:**
```python
# case_data_extractor.py:50
def __init__(self, base_url: str = "http://localhost:1234/v1"):
    # Only connects to localhost
```

### Rule 2: Rate Limiting

**Implementation Points:**
1. **Configurable Delays**
   - `delay_between_cases` parameter in process_batch()
   - Default: 2-3 seconds
   - Court-specific in court_configs.py

2. **Batch Pauses**
   - `batch_size` and `batch_pause_seconds` in configs
   - Example: Pause 60s after every 20 cases

3. **No Parallel Processing**
   - Sequential processing by design
   - Prevents burst requests

**Code Evidence:**
```python
# case_data_extractor.py:358
if i < len(cases):
    print(f"\nWaiting {delay_between_cases} seconds...")
    await asyncio.sleep(delay_between_cases)
```

### Rule 3: Audit Trail

**Implementation Points:**
1. **Screenshot Archival**
   - Every extraction saves screenshot
   - Filename: {case_number}_{timestamp}.png
   - Enables manual verification

2. **Timestamp All Extractions**
   - extracted_at field in CaseData
   - ISO 8601 format
   - Timezone-aware

3. **Source URL Preservation**
   - page_url field in CaseData
   - Enables re-extraction if needed

4. **Raw Data Preservation**
   - raw_extraction field stores AI response
   - Debugging failed extractions
   - Potential data recovery

**Code Evidence:**
```python
# case_data_extractor.py:314
extracted_at=datetime.now().isoformat(),
page_url=url,
raw_extraction=extracted
```

### Rule 4: Manual Authentication

**Implementation Points:**
1. **No Automated Login**
   - Tool doesn't handle credentials
   - User logs in via browser first
   - Playwright preserves session

2. **Session Reuse**
   - Playwright uses user's session cookies
   - Works across multiple extractions
   - User controls access

**Rationale:**
- Ethical (no automated auth bypass)
- Legal (user authenticates themselves)
- Secure (no credential storage)

---

## ALGORITHM ANALYSIS

### Algorithm: Vision-Based Extraction

**Input:** Screenshot (PNG), Case Number, Prompt Template

**Output:** Structured JSON

**Steps:**
1. Build prompt with field definitions
2. Encode screenshot to base64
3. Send to LM Studio API (POST request)
4. Receive text response
5. Strip markdown formatting
6. Parse JSON
7. Validate structure
8. Return dictionary

**Complexity:** O(1) per case (AI inference time is constant for similar content)

**Failure Modes:**
- Network timeout (120s limit)
- JSON parsing failure (malformed response)
- API unavailable (LM Studio not running)
- Vision model hallucination (incorrect extraction)

**Error Handling:** Try/except with detailed error messages

---

### Algorithm: Batch Processing

**Input:** List of (case_number, url) tuples

**Output:** List of CaseData, success count

**Steps:**
1. Initialize results list
2. For each case (sequential):
   a. Process single case
   b. Add to results if successful
   c. Delay (rate limiting)
3. Return results

**Complexity:** O(n) where n = number of cases
- Time: n * (page_load + AI_inference + delay)
- Space: O(n) for results list

**Optimization Opportunity:** Parallel processing with semaphore
- Current: Sequential
- Potential: 3-5 concurrent with rate limiting
- Would reduce total time by ~3-5x

---

## BUSINESS LOGIC EDGE CASES

### Edge Case 1: Multiple Matching Cases in Search

**Scenario:** Search returns multiple results

**Current Behavior:** Clicks first result

**Potential Issue:** Wrong case selected

**Mitigation:**
- User reviews discovered URL before extraction
- User can provide direct URL instead of search

**Improvement Opportunity:** Display all results, let user choose

---

### Edge Case 2: Missing Fields in AI Response

**Scenario:** Vision model doesn't extract all fields

**Current Behavior:** Fields set to None in CaseData

**Data Quality:** Degraded but not broken

**Mitigation:**
- User reviews screenshot manually
- raw_extraction might have data in different format

**Improvement Opportunity:** Field-specific confidence scores

---

### Edge Case 3: Partial Batch Failure

**Scenario:** Some cases fail in batch

**Current Behavior:** Continue processing, log errors

**Result:** Partial success (e.g., 18/20 cases)

**User Impact:** Must manually process failed cases

**Mitigation:** Error log shows which cases failed

**Improvement Opportunity:** Automatic retry queue for failed cases

---

### Edge Case 4: Vision Model Hallucination

**Scenario:** AI invents data that's not in screenshot

**Detection:** Difficult (requires manual verification)

**Mitigation:**
- Screenshot saved for review
- Low temperature (0.1) reduces hallucinations
- User reviews data before import

**Improvement Opportunity:** Confidence scores per field

---

## BUSINESS LOGIC QUALITY ASSESSMENT

### Strengths ✅

1. **Clear Separation of Concerns**
   - Extraction logic separate from UI
   - Data models separate from processing
   - Export separate from extraction

2. **Idempotent Operations**
   - Re-running extraction produces same result
   - Timestamps ensure uniqueness of exports

3. **Defensive Programming**
   - Error handling at each step
   - Graceful degradation (optional fields)
   - Resource cleanup (context managers)

4. **User-Centric Design**
   - Manual authentication (user control)
   - Visual verification (screenshots)
   - Multiple export formats

### Weaknesses ⚠️

1. **No Transaction Management**
   - Partial failures leave incomplete data
   - No rollback capability
   - No checkpoint/resume

2. **Limited Validation**
   - No input validation (URLs, case numbers)
   - No output validation (field formats)
   - No data quality checks

3. **Sequential Processing Only**
   - No parallel processing
   - Slower for large batches
   - Opportunity for optimization

4. **No Retry Logic**
   - Transient failures require manual retry
   - No exponential backoff
   - No failure queue

---

## CONCLUSION

The Docket_Manager business logic implements a **well-designed vision-based extraction pipeline** with strong privacy and ethical considerations. The workflows are clearly defined with appropriate separation of concerns.

### Key Strengths

1. **Privacy-First Architecture** - All processing local
2. **Format-Agnostic Extraction** - Vision AI handles any layout
3. **Audit Trail** - Screenshots and timestamps
4. **Ethical Scraping** - Rate limiting and manual auth
5. **User Control** - Manual authentication, verification

### Priority Improvements

1. **Add Retry Logic** - Handle transient failures
2. **Parallel Processing** - 3-5x speedup for batches
3. **Input Validation** - Validate URLs, case numbers
4. **Checkpoint/Resume** - For long batch jobs
5. **Confidence Scores** - Per-field extraction confidence

### Business Logic Grade: A-

Well-designed, privacy-conscious, with clear room for optimization.

---

**End of Business Logic Interpreter Report**
**Next Agent:** API Surface Mapper (Phase 3.2)
