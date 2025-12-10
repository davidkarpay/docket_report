# API SURFACE MAPPER REPORT
## Phase 3.2: CLI and Programmatic API Documentation

**Analysis Date:** 2025-11-24
**Repository:** Docket_Manager (github.com/davidkarpay/Docket_Manager.git)
**Agent:** API Surface Mapper
**Session:** Multi-Agent Instantiation Meta-Prompt (MAIMP)

---

## EXECUTIVE SUMMARY

The Docket_Manager provides **two primary interfaces**: an interactive CLI for end-users and a programmatic Python API for developers. The API surface is clean, well-structured, and follows async/await patterns throughout.

**API Surfaces Identified:**
- **1 CLI Interface:** Interactive menu-driven (case_extractor_cli.py)
- **4 Core Classes:** CaseData, LMStudioVisionClient, CasePageScraper, CaseDataExtractorApp
- **3 Example Functions:** Quick-start templates
- **1 Configuration API:** Court-specific settings (court_configs.py)

**Overall API Quality: B+** (good design, needs formal documentation)

---

## API SURFACE INVENTORY

### Level 1: User Interface

```
Command Line Interface (CLI)
└── python case_extractor_cli.py
    ├── Menu Option 1: Extract single case
    ├── Menu Option 2: Extract batch from CSV
    ├── Menu Option 3: Interactive search and extract
    ├── Menu Option 4: Configure settings
    ├── Menu Option 5: Check LM Studio connection
    └── Menu Option 6: Exit
```

### Level 2: Programmatic API

```
Python Import API
├── from case_data_extractor import:
│   ├── CaseData (dataclass)
│   ├── LMStudioVisionClient (class)
│   ├── CasePageScraper (class)
│   ├── CaseDataExtractorApp (class)
│   ├── example_single_case() (function)
│   ├── example_batch_from_csv() (function)
│   └── example_with_search() (function)
│
├── from case_extractor_cli import:
│   ├── InteractiveCLI (class)
│   └── main() (function)
│
└── from court_configs import:
    ├── PALM_BEACH_CONFIG (dict)
    ├── BROWARD_CONFIG (dict)
    ├── MY_COURT_CONFIG (dict)
    ├── get_config(court_name) (function)
    └── list_courts() (function)
```

---

## CLI INTERFACE DOCUMENTATION

### Interactive Menu System

**Entry Point:**
```bash
python case_extractor_cli.py
```

**Startup Sequence:**
1. Display header and branding
2. Check LM Studio connection (health check)
3. Present main menu
4. Process user selection
5. Execute selected workflow
6. Return to menu or exit

---

### CLI Menu Option 1: Extract Single Case

**Purpose:** Extract data from one case URL

**User Interaction Flow:**
```
1. Prompt: "Enter case number"
   Input: Case identifier (e.g., "2024CF001234")

2. Prompt: "Enter case details URL"
   Input: Full URL to case page

3. Prompt: "CSS selector to wait for (optional)"
   Input: CSS selector or press Enter to skip

4. Prompt: "Run browser in headless mode?"
   Input: Yes/No (default: No)

5. Processing: Extracts case data

6. Output: Displays extracted data in table format

7. Prompt: "Export to CSV?"
   Input: Yes/No, if Yes ask for filename

8. Prompt: "Export to JSON?"
   Input: Yes/No, if Yes ask for filename
```

**Example Session:**
```
Case Number: 2024CF001234
URL: https://court.example.com/case/2024CF001234
CSS Selector: .case-details
Headless: No

[Processing...]
✓ Extraction complete!

Extracted Data:
┌─────────────────┬──────────────────────┐
│ Field           │ Value                │
├─────────────────┼──────────────────────┤
│ Case Number     │ 2024CF001234         │
│ Client Name     │ John Doe             │
│ Next Date       │ 2025-02-15           │
│ Charges         │ Felony Theft         │
│ ...             │ ...                  │
└─────────────────┴──────────────────────┘

Export to CSV? [Y/n]: Y
CSV filename [2024CF001234.csv]:
✓ Exported to: extracted_cases/2024CF001234.csv
```

---

### CLI Menu Option 2: Batch Processing

**Purpose:** Extract data from multiple cases via CSV file

**User Interaction Flow:**
```
1. Prompt: "Enter CSV file path"
   Input: Path to CSV (must have case_number and url columns)

2. Validation: Check file exists and has required columns

3. Display: "Found N cases to process"

4. Prompt: "Process all N cases?"
   Input: Yes/No

5. Prompt: "CSS selector to wait for (optional)"
   Input: CSS selector or skip

6. Prompt: "Delay between cases (seconds)"
   Input: Integer (default: 3)

7. Prompt: "Run browser in headless mode?"
   Input: Yes/No (default: Yes for batch)

8. Processing: Iterates through cases with progress display

9. Output: "Successfully extracted M/N cases"

10. Auto-export: CSV and JSON files created automatically
```

**Input CSV Format:**
```csv
case_number,url
2024CF001234,https://court.example.com/case/2024CF001234
2024CF005678,https://court.example.com/case/2024CF005678
```

---

### CLI Menu Option 3: Interactive Search

**Purpose:** Search court website and extract first result

**User Interaction Flow:**
```
1. Prompt: "Enter court search page URL"
   Input: Search page URL

2. Prompt: "Enter case number to search"
   Input: Case identifier

3. Prompt: "Case number input field selector"
   Input: CSS selector (e.g., "#caseNumber")

4. Prompt: "Search button selector"
   Input: CSS selector (e.g., "#searchBtn")

5. Prompt: "Result link selector"
   Input: CSS selector (e.g., ".case-link")

6. Prompt: "Run browser in headless mode?"
   Input: Yes/No

7. Processing:
   - Navigate to search page
   - Fill search form
   - Click search
   - Click first result
   - Extract case data

8. Output: Discovered URL and extracted data

9. Prompt: "Export results?"
   Input: Yes/No
```

---

### CLI Menu Option 4: Configure Settings

**Purpose:** Update application settings

**Current Settings Configurable:**
- LM Studio URL (default: http://localhost:1234/v1)
- Output directory (default: extracted_cases)

**User Interaction:**
```
1. Display: Current LM Studio URL
2. Prompt: "New LM Studio URL (press Enter to keep current)"
3. Test: Connection to new URL
4. Display: Output directory setting
```

---

### CLI Menu Option 5: Check LM Studio Connection

**Purpose:** Test connection to LM Studio API

**Output:**
```
Checking LM Studio connection...

✓ Connected to LM Studio
  Model: llava-v1.6-mistral-7b-gguf
```

Or:

```
✗ Cannot connect to LM Studio: Connection refused

Make sure:
  1. LM Studio is running
  2. A vision model is loaded
  3. Local server is started
```

---

## PROGRAMMATIC API DOCUMENTATION

### API: CaseData (Dataclass)

**Purpose:** Structured data model for case information

**Module:** `case_data_extractor.py`

**Type:** Dataclass

**Definition:**
```python
@dataclass
class CaseData:
    """Structured case data extracted from court pages"""
    case_number: str
    client_name: str
    next_date: Optional[str] = None
    charges: Optional[str] = None
    attorney: Optional[str] = None
    judge: Optional[str] = None
    division: Optional[str] = None
    status: Optional[str] = None
    bond_amount: Optional[str] = None
    arrest_date: Optional[str] = None
    filing_date: Optional[str] = None
    disposition: Optional[str] = None
    plea: Optional[str] = None
    sentence: Optional[str] = None
    probation_info: Optional[str] = None
    prior_record: Optional[str] = None
    victim_info: Optional[str] = None
    notes: Optional[str] = None
    page_url: Optional[str] = None
    extracted_at: Optional[str] = None
    raw_extraction: Optional[Dict] = None
```

**Usage Example:**
```python
case = CaseData(
    case_number="2024CF001234",
    client_name="John Doe",
    next_date="2025-02-15",
    charges="Felony Theft",
    # ... other fields
)

# Convert to dict
case_dict = asdict(case)

# Convert to JSON
import json
json_str = json.dumps(asdict(case), default=str)
```

---

### API: LMStudioVisionClient

**Purpose:** Interface to LM Studio's OpenAI-compatible vision API

**Module:** `case_data_extractor.py`

#### Constructor

```python
def __init__(self, base_url: str = "http://localhost:1234/v1")
```

**Parameters:**
- `base_url` (str): LM Studio API endpoint
  - Default: "http://localhost:1234/v1"
  - Must be full URL including /v1

**Returns:** LMStudioVisionClient instance

**Example:**
```python
client = LMStudioVisionClient()
# or custom endpoint:
client = LMStudioVisionClient(base_url="http://192.168.1.10:1234/v1")
```

#### Method: extract_case_data()

```python
async def extract_case_data(
    self,
    screenshot_b64: str,
    case_number: str,
    additional_context: str = ""
) -> Dict[str, Any]
```

**Parameters:**
- `screenshot_b64` (str): Base64-encoded PNG screenshot
- `case_number` (str): Case identifier for context
- `additional_context` (str, optional): Extra context for AI

**Returns:**
- `Dict[str, Any]`: Extracted fields as dictionary

**Raises:**
- Exception: On API errors, network timeouts, or parsing failures

**Example:**
```python
import base64

# Read and encode screenshot
with open("case_screenshot.png", "rb") as f:
    screenshot_bytes = f.read()
screenshot_b64 = base64.b64encode(screenshot_bytes).decode('utf-8')

# Extract data
client = LMStudioVisionClient()
extracted = await client.extract_case_data(
    screenshot_b64=screenshot_b64,
    case_number="2024CF001234",
    additional_context="Palm Beach County Court"
)

print(extracted)
# {'client_name': 'John Doe', 'charges': '...', ...}
```

#### Method: close()

```python
async def close(self)
```

**Purpose:** Close HTTP client connection

**Returns:** None

**Example:**
```python
client = LMStudioVisionClient()
# ... use client ...
await client.cleanup()
```

---

### API: CasePageScraper

**Purpose:** Browser automation and screenshot capture

**Module:** `case_data_extractor.py`

#### Constructor

```python
def __init__(self, headless: bool = False, slow_mo: int = 100)
```

**Parameters:**
- `headless` (bool): Run browser without UI
  - Default: False (show browser)
  - True: Headless mode (faster, no UI)
- `slow_mo` (int): Milliseconds to slow down Playwright operations
  - Default: 100ms (helps with debugging)
  - 0: Full speed

**Returns:** CasePageScraper instance

**Example:**
```python
# Visible browser
scraper = CasePageScraper(headless=False)

# Headless mode
scraper = CasePageScraper(headless=True, slow_mo=0)
```

#### Context Manager Protocol

**Usage:**
```python
async with CasePageScraper(headless=False) as scraper:
    # Browser automatically launched
    screenshot, page = await scraper.navigate_and_screenshot(url)
    # Browser automatically closed on exit
```

#### Method: navigate_and_screenshot()

```python
async def navigate_and_screenshot(
    self,
    url: str,
    wait_selector: Optional[str] = None,
    wait_time: int = 2000
) -> tuple[bytes, Page]
```

**Parameters:**
- `url` (str): Target URL to navigate to
- `wait_selector` (Optional[str]): CSS selector to wait for before screenshot
  - If provided, waits for element to appear
  - If None, waits for networkidle
- `wait_time` (int): Additional wait time in milliseconds after page load
  - Default: 2000ms (2 seconds)

**Returns:**
- `tuple[bytes, Page]`: (screenshot PNG bytes, Playwright Page object)

**Raises:**
- Exception: On navigation timeout, selector not found, or network errors

**Example:**
```python
async with CasePageScraper() as scraper:
    screenshot_bytes, page = await scraper.navigate_and_screenshot(
        url="https://court.example.com/case/2024CF001234",
        wait_selector=".case-details",
        wait_time=2000
    )

    # Save screenshot
    with open("case.png", "wb") as f:
        f.write(screenshot_bytes)

    await page.close()
```

#### Method: extract_case_links()

```python
async def extract_case_links(
    self,
    page: Page,
    selector: str
) -> List[str]
```

**Parameters:**
- `page` (Page): Playwright Page object
- `selector` (str): CSS selector for case links

**Returns:**
- `List[str]`: List of absolute URLs

**Example:**
```python
async with CasePageScraper() as scraper:
    page = await scraper.browser.new_page()
    await page.goto("https://court.example.com/search-results")

    links = await scraper.extract_case_links(page, ".case-link")
    # ['https://court.example.com/case/1', 'https://court.example.com/case/2']
```

---

### API: CaseDataExtractorApp

**Purpose:** Main orchestrator for extraction workflows

**Module:** `case_data_extractor.py`

#### Constructor

```python
def __init__(
    self,
    output_dir: str = "extracted_cases",
    lm_studio_url: str = "http://localhost:1234/v1",
    headless: bool = False
)
```

**Parameters:**
- `output_dir` (str): Directory for exports and screenshots
  - Default: "extracted_cases"
  - Created if doesn't exist
  - Subdirectory "screenshots" created automatically
- `lm_studio_url` (str): LM Studio API endpoint
  - Default: "http://localhost:1234/v1"
- `headless` (bool): Run browser in headless mode
  - Default: False

**Returns:** CaseDataExtractorApp instance

**Example:**
```python
app = CaseDataExtractorApp(
    output_dir="my_cases",
    lm_studio_url="http://localhost:1234/v1",
    headless=True
)
```

#### Method: process_case_url()

```python
async def process_case_url(
    self,
    url: str,
    case_number: str,
    wait_selector: Optional[str] = None
) -> Optional[CaseData]
```

**Parameters:**
- `url` (str): Case details page URL
- `case_number` (str): Case identifier
- `wait_selector` (Optional[str]): CSS selector to wait for

**Returns:**
- `Optional[CaseData]`: Extracted case data, or None on error

**Side Effects:**
- Saves screenshot to output_dir/screenshots/
- Prints progress to console

**Example:**
```python
app = CaseDataExtractorApp()

case_data = await app.process_case_url(
    url="https://court.example.com/case/2024CF001234",
    case_number="2024CF001234",
    wait_selector=".case-details"
)

if case_data:
    print(f"Extracted: {case_data.client_name}")
    print(f"Charges: {case_data.charges}")
```

#### Method: process_batch()

```python
async def process_batch(
    self,
    cases: List[Dict[str, str]],
    wait_selector: Optional[str] = None,
    delay_between_cases: int = 2
)
```

**Parameters:**
- `cases` (List[Dict]): List of dicts with 'case_number' and 'url' keys
- `wait_selector` (Optional[str]): CSS selector to wait for on each page
- `delay_between_cases` (int): Seconds to wait between requests
  - Default: 2 seconds

**Returns:** None (results stored in app.results)

**Side Effects:**
- Processes cases sequentially
- Updates app.results list
- Prints progress to console

**Example:**
```python
app = CaseDataExtractorApp()

cases = [
    {'case_number': '2024CF001234', 'url': 'https://...'},
    {'case_number': '2024CF005678', 'url': 'https://...'},
]

await app.process_batch(
    cases,
    wait_selector=".case-details",
    delay_between_cases=3
)

print(f"Extracted {len(app.results)} cases")
```

#### Method: export_to_csv()

```python
def export_to_csv(self, filename: Optional[str] = None)
```

**Parameters:**
- `filename` (Optional[str]): Output filename
  - If None, uses timestamped filename
  - Saved to output_dir

**Returns:** None

**Side Effects:**
- Creates CSV file in output_dir
- Prints confirmation message

**Example:**
```python
app = CaseDataExtractorApp()
# ... extract cases ...

app.export_to_csv("my_cases.csv")
# Creates: extracted_cases/my_cases.csv

# Or auto-named:
app.export_to_csv()
# Creates: extracted_cases/extracted_cases_20251124_153045.csv
```

#### Method: export_to_json()

```python
def export_to_json(self, filename: Optional[str] = None)
```

**Parameters:**
- `filename` (Optional[str]): Output filename
  - If None, uses timestamped filename
  - Saved to output_dir

**Returns:** None

**Example:**
```python
app.export_to_json("my_cases.json")
# Creates: extracted_cases/my_cases.json
# Includes raw_extraction field
```

#### Method: cleanup()

```python
async def cleanup(self)
```

**Purpose:** Close vision client connection

**Returns:** None

**Example:**
```python
app = CaseDataExtractorApp()
try:
    await app.process_case_url(...)
finally:
    await app.cleanup()
```

---

## EXAMPLE FUNCTIONS

### Function: example_single_case()

**Purpose:** Template for extracting single case

**Module:** `case_data_extractor.py`

**Signature:**
```python
async def example_single_case()
```

**Usage:**
```python
import asyncio
from case_data_extractor import example_single_case

asyncio.run(example_single_case())
```

**What It Does:**
1. Creates CaseDataExtractorApp
2. Calls process_case_url() with example URL
3. Exports to CSV and JSON

**Customization:** Edit URLs and case numbers in function body

---

### Function: example_batch_from_csv()

**Purpose:** Template for batch processing

**Signature:**
```python
async def example_batch_from_csv()
```

**Usage:**
1. Create CSV file: cases_to_process.csv
2. Run: `asyncio.run(example_batch_from_csv())`

**CSV Format:**
```csv
case_number,url
2024CF001234,https://court.example.com/case/2024CF001234
```

---

### Function: example_with_search()

**Purpose:** Template for search automation

**Signature:**
```python
async def example_with_search()
```

**What It Does:**
1. Navigate to search page
2. Fill search form
3. Click search button
4. Click first result
5. Extract case data

**Customization:** Edit selectors for your court website

---

## CONFIGURATION API

### Court Configuration Dictionary

**Module:** `court_configs.py`

**Structure:**
```python
COURT_CONFIG = {
    'name': str,                    # Court name
    'base_url': str,                # Base URL
    'case_url_template': str,       # URL pattern with {case_number}
    'wait_selector': str,           # CSS selector to wait for
    'wait_timeout': int,            # Milliseconds
    'additional_wait': int,         # Extra wait milliseconds
    'rate_limit_seconds': int,      # Delay between requests
    'batch_size': int,              # Cases per batch
    'batch_pause_seconds': int,     # Pause between batches
    'search_url': str,              # Search page URL
    'search_selectors': dict,       # Search form selectors
    'custom_fields': list,          # Additional fields
    'output_dir': str,              # Output directory
    'csv_filename_template': str,   # CSV filename pattern
}
```

### Function: get_config()

**Signature:**
```python
def get_config(court_name: str) -> dict
```

**Parameters:**
- `court_name` (str): Court identifier (e.g., "palm_beach")

**Returns:**
- `dict`: Court configuration

**Example:**
```python
from court_configs import get_config

config = get_config('palm_beach')
url = config['case_url_template'].format(case_number="2024CF001234")
```

### Function: list_courts()

**Signature:**
```python
def list_courts() -> list
```

**Returns:**
- `list`: Available court names

**Example:**
```python
from court_configs import list_courts

courts = list_courts()
# ['palm_beach', 'broward', 'my_court']
```

---

## API USAGE PATTERNS

### Pattern 1: Simple Single Case Extraction

```python
import asyncio
from case_data_extractor import CaseDataExtractorApp

async def extract_one_case():
    app = CaseDataExtractorApp()

    try:
        case_data = await app.process_case_url(
            url="https://court.example.com/case/2024CF001234",
            case_number="2024CF001234"
        )

        if case_data:
            app.results.append(case_data)
            app.export_to_csv("output.csv")
    finally:
        await app.cleanup()

asyncio.run(extract_one_case())
```

### Pattern 2: Batch Processing with Configuration

```python
import asyncio
import csv
from case_data_extractor import CaseDataExtractorApp
from court_configs import get_config

async def batch_extract():
    config = get_config('palm_beach')
    app = CaseDataExtractorApp(output_dir=config['output_dir'])

    # Read cases from CSV
    cases = []
    with open('cases.csv', 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            cases.append({
                'case_number': row['case_number'],
                'url': config['case_url_template'].format(case_number=row['case_number'])
            })

    try:
        await app.process_batch(
            cases,
            wait_selector=config['wait_selector'],
            delay_between_cases=config['rate_limit_seconds']
        )

        app.export_to_csv()
        app.export_to_json()
    finally:
        await app.cleanup()

asyncio.run(batch_extract())
```

### Pattern 3: Custom Processing with Low-Level APIs

```python
import asyncio
import base64
from case_data_extractor import CasePageScraper, LMStudioVisionClient, CaseData

async def custom_extract():
    # Use low-level APIs
    async with CasePageScraper(headless=True) as scraper:
        screenshot_bytes, page = await scraper.navigate_and_screenshot(
            "https://court.example.com/case/2024CF001234"
        )
        await page.close()

    # Convert to base64
    screenshot_b64 = base64.b64encode(screenshot_bytes).decode('utf-8')

    # Extract with vision
    client = LMStudioVisionClient()
    extracted = await client.extract_case_data(
        screenshot_b64,
        "2024CF001234"
    )
    await client.close()

    # Build custom object
    case = CaseData(
        case_number="2024CF001234",
        client_name=extracted.get('client_name'),
        # ... map other fields
    )

    return case

result = asyncio.run(custom_extract())
```

---

## API DESIGN ASSESSMENT

### Strengths ✅

1. **Clean Async API**
   - All I/O operations are async
   - Consistent async/await usage

2. **Context Managers**
   - Automatic resource cleanup
   - Exception-safe

3. **Type Hints**
   - ~90% coverage
   - IDE autocomplete support

4. **Sensible Defaults**
   - Works out-of-box for common cases
   - Easy to customize

5. **Separation of Concerns**
   - Each class has clear purpose
   - Low coupling

### Weaknesses ⚠️

1. **No Formal API Docs**
   - Docstrings present but no API reference
   - Users must read code

2. **Limited Error Types**
   - Raises generic Exception
   - Hard to catch specific errors

3. **No Validation**
   - URLs not validated
   - Case numbers not validated

4. **Print-Based Logging**
   - No logging levels
   - Can't disable output

5. **No Progress Callbacks**
   - Batch processing prints only
   - No programmatic progress tracking

---

## API STABILITY ASSESSMENT

**Current Version:** 1.0.0 (inferred, no explicit versioning)

**Breaking Change Risk:** Medium
- No version numbers
- No deprecation warnings
- No changelog

**Recommendations:**
1. Add semantic versioning
2. Document API stability guarantees
3. Add deprecation decorators for future changes

---

## MISSING API FEATURES

### Feature 1: Progress Callbacks

**Need:** Programmatic progress tracking for batch operations

**Proposed API:**
```python
def progress_callback(completed: int, total: int, current_case: str):
    print(f"Progress: {completed}/{total} - {current_case}")

await app.process_batch(cases, progress_callback=progress_callback)
```

### Feature 2: Custom Exception Types

**Need:** Better error handling

**Proposed:**
```python
class ExtractionError(Exception): pass
class NavigationError(ExtractionError): pass
class VisionAPIError(ExtractionError): pass
class ParsingError(ExtractionError): pass

try:
    await app.process_case_url(...)
except NavigationError:
    # Handle page load issues
except VisionAPIError:
    # Handle LM Studio issues
```

### Feature 3: Validation API

**Need:** Input validation

**Proposed:**
```python
from case_data_extractor import validate_url, validate_case_number

url = "https://court.example.com/case/2024CF001234"
if validate_url(url):
    await app.process_case_url(url, ...)
```

---

## CONCLUSION

The Docket_Manager API surface is **well-designed and functional** but lacks formal documentation and some advanced features.

**API Quality Grade: B+**

**Strengths:**
- Clean async design
- Good separation of concerns
- Sensible defaults

**Priority Improvements:**
1. Add formal API reference documentation
2. Implement custom exception types
3. Add progress callback support
4. Add input validation
5. Implement semantic versioning

---

**End of API Surface Mapper Report**
**Next Agent:** Refactoring Strategist (Phase 4.1)
