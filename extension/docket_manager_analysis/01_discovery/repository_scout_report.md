# REPOSITORY SCOUT REPORT
## Phase 1.1: Repository Discovery and Mapping

**Analysis Date:** 2025-11-24
**Repository:** Docket_Manager (github.com/davidkarpay/Docket_Manager.git)
**Agent:** Repository Scout
**Session:** Multi-Agent Instantiation Meta-Prompt (MAIMP)

---

## EXECUTIVE SUMMARY

The Docket_Manager repository is a **privacy-focused legal case data extraction tool** designed for public defenders. It uses local browser automation (Playwright) and local vision AI (LM Studio) to extract structured case data from court websites without sending any data to external APIs.

**Key Stats:**
- **Total Files:** 20
- **Python Code:** 3 files, 1,135 total lines
- **Documentation:** 8 Markdown files (~75KB)
- **Primary Language:** Python 3.8+
- **Architecture:** Async/await, class-based OOP
- **Dependencies:** 5 core libraries
- **Purpose:** Legal case data extraction for public defenders
- **Privacy Model:** 100% local processing

---

## FILE STRUCTURE

```
Docket_Manager-main/
├── Python Application Files (3 files, 1,135 lines)
│   ├── case_data_extractor.py        545 lines - Core extraction engine
│   ├── case_extractor_cli.py         382 lines - Interactive CLI interface
│   └── court_configs.py              208 lines - Court configuration templates
│
├── Documentation (8 files, ~75KB)
│   ├── START_HERE.md                 ~10KB - Entry point, quick start
│   ├── DEPLOYMENT_CHECKLIST.md       ~11KB - Step-by-step setup guide
│   ├── CASE_EXTRACTOR_GUIDE.md       ~18KB - Complete usage guide
│   ├── CASE_EXTRACTOR_README.md      ~4KB  - Quick overview
│   ├── PROJECT_SUMMARY.md            ~14KB - Project overview
│   ├── ARCHITECTURE.md               ~19KB - Technical deep dive
│   ├── CSV_TEST_AGENT_README.md      ~9KB  - Testing documentation
│   └── FILE_INDEX.txt                ~11KB - Complete file index
│
├── Configuration & Templates
│   ├── case_extractor_requirements.txt  Dependencies list
│   ├── cases_template.csv               Batch processing template
│   └── .gitignore                       Git ignore rules
│
├── Test & Development Files
│   ├── csv_rendering_test_agent.html    Testing tool
│   ├── morning_docket_manager_file_database.html  Reference file
│   ├── test_sample_docket.csv           Test data
│   └── test_sample_with_issues.csv      Test data
│
└── Output Structure (created at runtime)
    └── extracted_cases/
        ├── screenshots/                  Case screenshots
        ├── extracted_[timestamp].csv     CSV exports
        └── extracted_[timestamp].json    JSON exports
```

---

## TECHNOLOGY STACK

### Core Technologies

**Primary Language:**
- Python 3.8+ (required for modern async/await features)

**Browser Automation:**
- **playwright** 1.41.0
  - Chromium-based automation
  - Headless and headed modes
  - Full-page screenshots
  - Network idle detection
  - CSS selector-based interaction

**AI/ML Integration:**
- **LM Studio** (local vision models)
  - OpenAI-compatible API
  - Vision model support (LLaVA 1.6 Mistral 7B recommended)
  - Local inference (no cloud APIs)
  - HTTP client: **httpx** 0.26.0

**Terminal UI:**
- **rich** 13.7.0 - Beautiful terminal formatting
- **click** 8.1.7 - CLI argument parsing

**Utilities:**
- **python-dateutil** 2.8.2 - Date parsing and formatting

**Standard Library Usage:**
- `asyncio` - Asynchronous programming
- `json` - Data serialization
- `csv` - CSV file handling
- `base64` - Screenshot encoding
- `pathlib` - Path operations
- `dataclasses` - Structured data models
- `typing` - Type hints
- `datetime` - Timestamp handling

---

## CODE STRUCTURE ANALYSIS

### Architecture Pattern

**Design Pattern:** Async/Await Service-Oriented Architecture
- Separation of concerns across specialized classes
- Context manager pattern for resource management
- Async generators for efficient data streaming
- Dataclass-based data models

### Core Components

#### 1. Data Model Layer

**File:** `case_data_extractor.py:22-44`

```python
@dataclass
class CaseData
```

**Purpose:** Structured data model for extracted case information

**Fields (19 total):**
- Core: case_number, client_name, page_url, extracted_at
- Dates: next_date, arrest_date, filing_date
- Legal: charges, attorney, judge, division, status
- Financial: bond_amount
- Case details: disposition, plea, sentence, probation_info
- Additional: prior_record, victim_info, notes
- Metadata: raw_extraction (Dict)

#### 2. Vision AI Client Layer

**File:** `case_data_extractor.py:47-148`

```python
class LMStudioVisionClient
```

**Purpose:** Interface to LM Studio's OpenAI-compatible vision API

**Key Methods:**
- `extract_case_data()` - Send screenshot + prompt to vision model
- `close()` - Cleanup HTTP client

**Features:**
- Base64 screenshot encoding
- JSON response parsing
- Markdown code block handling
- Error handling with fallback
- Configurable temperature (0.1 for factual extraction)
- 120-second timeout for slow models

**Prompt Engineering:**
- Structured extraction instructions
- Field-specific guidance
- Format normalization (dates → YYYY-MM-DD)
- JSON-only output enforcement
- Legal terminology preservation

#### 3. Browser Automation Layer

**File:** `case_data_extractor.py:151-231`

```python
class CasePageScraper
```

**Purpose:** Playwright-based browser automation

**Key Methods:**
- `navigate_and_screenshot()` - Navigate + capture
- `extract_case_links()` - Link extraction from listings
- Context manager protocol (`__aenter__`, `__aexit__`)

**Features:**
- Configurable headless/headed mode
- Slow-mo for debugging
- Network idle waiting
- CSS selector waiting
- Full-page screenshots (PNG)
- Viewport: 1920x1080
- 30-second timeout
- Relative URL handling

#### 4. Orchestration Layer

**File:** `case_data_extractor.py:234-420`

```python
class CaseDataExtractorApp
```

**Purpose:** Main application orchestrator

**Key Methods:**
- `process_case_url()` - Single case extraction
- `process_batch()` - Multi-case processing
- `export_to_csv()` - CSV export
- `export_to_json()` - JSON export (includes raw_extraction)
- `cleanup()` - Resource cleanup

**Features:**
- Automatic directory creation
- Screenshot archiving
- Rate limiting (configurable delays)
- Progress logging
- Batch processing with pause intervals
- Dual export formats
- Error handling with traceback

#### 5. Interactive CLI Layer

**File:** `case_extractor_cli.py:26-370`

```python
class InteractiveCLI
```

**Purpose:** User-friendly menu-driven interface

**Modes:**
1. **Single case extraction** - One URL at a time
2. **Batch processing** - CSV input with case_number,url
3. **Interactive search** - Automated court website search
4. **Settings configuration** - LM Studio URL, output directory
5. **Connection testing** - LM Studio health check

**Features:**
- Rich terminal UI (with fallback to plain text)
- Interactive prompts with defaults
- Confirmation dialogs
- Progress indicators
- Connection health checks
- Model detection and display
- Keyboard interrupt handling
- Exception traceback display

**Menu Flow:**
```
Startup → Check LM Studio → Main Menu → Mode Selection → Processing → Export → Return to Menu
```

#### 6. Configuration Layer

**File:** `court_configs.py:1-209`

**Purpose:** Court-specific configuration templates

**Configurations:**
- PALM_BEACH_CONFIG
- BROWARD_CONFIG
- MY_COURT_CONFIG (template)

**Configuration Fields:**
- `base_url` - Court website base URL
- `case_url_template` - URL pattern with {case_number}
- `wait_selector` - CSS selector for page load detection
- `wait_timeout` - Milliseconds
- `rate_limit_seconds` - Delay between requests
- `batch_size` - Cases per batch
- `batch_pause_seconds` - Pause between batches
- `search_selectors` - Search form configuration
- `custom_fields` - Jurisdiction-specific fields
- `output_dir` - Export directory

**Helper Functions:**
- `get_config(court_name)` - Retrieve configuration
- `list_courts()` - List available courts

---

## DEPENDENCY ANALYSIS

### Direct Dependencies (5)

```txt
playwright==1.41.0      # Browser automation
httpx==0.26.0          # HTTP client for LM Studio API
rich==13.7.0           # Terminal UI
click==8.1.7           # CLI framework
python-dateutil==2.8.2 # Date parsing
```

### Dependency Purpose Matrix

| Dependency | Size | Purpose | Critical | Optional |
|------------|------|---------|----------|----------|
| playwright | ~300MB | Browser automation | ✅ Yes | No |
| httpx | ~200KB | LM Studio API client | ✅ Yes | No |
| rich | ~500KB | Terminal UI | No | ✅ Yes |
| click | ~100KB | CLI arguments | No | ✅ Yes |
| python-dateutil | ~300KB | Date handling | No | ✅ Yes |

**Critical Dependencies:** playwright, httpx (core functionality)
**Optional Dependencies:** rich, click, python-dateutil (UX enhancements)

### External Service Dependencies

1. **LM Studio** (required)
   - Local desktop application
   - Provides OpenAI-compatible API
   - Vision model hosting
   - Default port: 1234
   - No internet required

2. **Playwright Browsers** (required, installed separately)
   ```bash
   playwright install chromium
   ```

---

## CODE METRICS

### Lines of Code (LOC)

| File | Lines | Blank | Comments | Code |
|------|-------|-------|----------|------|
| case_data_extractor.py | 545 | ~50 | ~100 | ~395 |
| case_extractor_cli.py | 382 | ~40 | ~80 | ~262 |
| court_configs.py | 208 | ~20 | ~150 | ~38 |
| **Total** | **1,135** | **~110** | **~330** | **~695** |

**Documentation Ratio:** ~29% comments (excellent)

### File Size Distribution

```
Python Code:     ~34KB
Documentation:   ~75KB (69%)
Configuration:   ~6KB
Test Data:       ~2KB
Total Package:   ~115KB

Documentation is 2.2x larger than code (excellent documentation coverage)
```

### Complexity Indicators

**Classes:** 5 main classes
- CaseData (dataclass)
- LMStudioVisionClient (AI client)
- CasePageScraper (browser automation)
- CaseDataExtractorApp (orchestrator)
- InteractiveCLI (user interface)

**Async Functions:** ~15 async methods (extensive async usage)

**Context Managers:** 2 (CasePageScraper, scraper usage in app)

**Entry Points:** 3
1. `case_data_extractor.py` - Direct import/scripting
2. `case_extractor_cli.py` - Interactive CLI
3. Example functions - Quick start templates

---

## FEATURE CAPABILITIES

### Core Features ✅

1. **Single Case Extraction**
   - Direct URL input
   - Automated navigation
   - Screenshot capture
   - Vision AI extraction
   - Structured output

2. **Batch Processing**
   - CSV input (case_number, url)
   - Sequential processing
   - Rate limiting
   - Progress tracking
   - Bulk export

3. **Interactive Search**
   - Court website search automation
   - Form filling
   - Result navigation
   - Dynamic URL capture

4. **Data Export**
   - CSV format (for spreadsheets/docket managers)
   - JSON format (with raw extraction metadata)
   - Timestamped filenames
   - Screenshot archival

5. **Configuration Management**
   - Court-specific templates
   - Rate limiting presets
   - Search selector configuration
   - Custom field definitions

### User Experience Features ✅

1. **Interactive CLI**
   - Menu-driven interface
   - Rich terminal UI (optional)
   - Progress indicators
   - Confirmation dialogs

2. **Connection Testing**
   - LM Studio health check
   - Model detection
   - Startup validation

3. **Error Handling**
   - Graceful failures
   - Detailed error messages
   - Traceback display
   - Retry capabilities

4. **Privacy & Security**
   - 100% local processing
   - No external API calls
   - Manual authentication
   - Screenshot review

---

## ARCHITECTURAL PATTERNS

### 1. Async/Await Throughout

**Pattern:** Fully asynchronous architecture
- All I/O operations are async
- No blocking calls in hot paths
- Efficient resource utilization
- Concurrent batch processing potential

### 2. Separation of Concerns

**Layers:**
```
CLI Interface → App Orchestrator → Browser/AI Services → Data Models
```

**Benefits:**
- Modular and testable
- Easy to extend
- Clear responsibilities
- Reusable components

### 3. Context Manager Pattern

**Usage:**
```python
async with CasePageScraper() as scraper:
    # Automatic resource cleanup
```

**Benefits:**
- Guaranteed cleanup
- Exception-safe resource handling
- Clean API

### 4. Dataclass-Based Models

**Pattern:** Structured data with type hints
```python
@dataclass
class CaseData:
    case_number: str
    client_name: str
    # ... 17 more fields
```

**Benefits:**
- Type safety
- Auto-generated methods (__init__, __repr__, etc.)
- Easy serialization (asdict())
- IDE autocomplete

### 5. Configuration-Driven

**Pattern:** Court-specific configuration dictionaries
- Environment-specific settings
- No hardcoded values
- Easy court addition
- Template-based

---

## DESIGN DECISIONS

### 1. Local-First Architecture

**Decision:** Use local LM Studio instead of cloud APIs
**Rationale:**
- Client data privacy (public defender cases)
- No API costs
- No rate limits
- Works offline
- Ethical data handling

### 2. Vision AI Over CSS Selectors

**Decision:** Use vision models to extract data from screenshots
**Rationale:**
- Universal (works on any court website)
- Resilient to HTML changes
- No website-specific scraping code
- Handles complex layouts
- Extracts visible information

### 3. Playwright Over Selenium

**Decision:** Use Playwright for browser automation
**Rationale:**
- Modern async API
- Better performance
- Network idle detection
- Auto-waiting
- Cross-browser support
- Active development

### 4. Rich Terminal UI

**Decision:** Use 'rich' library for CLI (optional)
**Rationale:**
- Better user experience
- Progress indicators
- Colored output
- Tables and panels
- Graceful degradation

### 5. Dual Export Formats

**Decision:** Both CSV and JSON export
**Rationale:**
- CSV: Import to Excel/docket managers
- JSON: Preserve all metadata
- JSON: Includes raw extraction
- Flexibility for different workflows

---

## EXTENSIBILITY POINTS

### 1. Court Configuration

**How to Add New Court:**
```python
# In court_configs.py
NEW_COURT_CONFIG = {
    'name': 'Court Name',
    'base_url': '...',
    'case_url_template': '...',
    # ... configuration
}
```

### 2. Custom Fields

**How to Add Custom Fields:**
1. Add to court config: `custom_fields: ['new_field']`
2. Modify extraction prompt in LMStudioVisionClient
3. Fields automatically appear in CSV/JSON

### 3. Export Formats

**How to Add New Export Format:**
```python
# In CaseDataExtractorApp
def export_to_xml(self, filename):
    # Implementation
```

### 4. Additional Extraction Modes

**Extension Points:**
- New menu option in InteractiveCLI
- New method in CaseDataExtractorApp
- Reuse existing browser/AI services

### 5. Alternative AI Backends

**How to Add New AI Service:**
```python
class OpenAIVisionClient:
    async def extract_case_data(self, screenshot_b64, case_number):
        # OpenAI API implementation
```

---

## ENTRY POINTS & USAGE PATTERNS

### 1. Interactive CLI (Recommended for Users)

```bash
python case_extractor_cli.py
```

**Flow:**
- Startup health check
- Menu selection
- Guided input
- Automatic export
- Return to menu

### 2. Programmatic API (For Developers)

```python
from case_data_extractor import CaseDataExtractorApp

app = CaseDataExtractorApp()
await app.process_case_url(url, case_number)
await app.export_to_csv()
await app.cleanup()
```

### 3. Example Functions (Quick Start Templates)

- `example_single_case()` - Single case template
- `example_batch_from_csv()` - Batch processing template
- `example_with_search()` - Search automation template

**Usage:**
```python
# Uncomment in case_data_extractor.py
asyncio.run(example_single_case())
```

---

## REPOSITORY STATISTICS

### File Type Distribution

```
.py files:   3 (15%)
.md files:   8 (40%)
.csv files:  2 (10%)
.html files: 2 (10%)
.txt files:  2 (10%)
Other:       3 (15%)
Total:       20 files
```

### Code vs Documentation Ratio

```
Python Code:     ~34KB (31%)
Documentation:   ~75KB (69%)

Documentation:Code Ratio = 2.2:1
```

**Assessment:** Excellent documentation coverage

### Language Distribution

```
Python:    100% of code
Markdown:  100% of documentation
```

**Assessment:** Single-language codebase (Python), well-documented

---

## DEPENDENCIES ON EXTERNAL SYSTEMS

### Required External Systems

1. **LM Studio**
   - Type: Desktop application
   - Purpose: Local LLM hosting
   - Protocol: HTTP (OpenAI-compatible)
   - Default: http://localhost:1234/v1

2. **Court Websites**
   - Type: Web services
   - Purpose: Data source
   - Protocol: HTTPS
   - Access: Public (with authentication)

### Optional External Systems

None - System is fully self-contained once LM Studio is running

---

## CONFIGURATION FILES

### 1. case_extractor_requirements.txt

**Purpose:** Python package dependencies
**Format:** Standard pip requirements
**Lines:** 5 packages + comments

### 2. court_configs.py

**Purpose:** Court-specific configuration templates
**Format:** Python dictionaries
**Configs:** 3 templates (Palm Beach, Broward, generic)

### 3. cases_template.csv

**Purpose:** Batch processing template
**Format:** CSV with headers
**Columns:** case_number, url

### 4. .gitignore

**Purpose:** Git exclusions
**Includes:** Python cache, virtual environments, output directories

---

## OUTPUT STRUCTURE

### Generated Directories

```
extracted_cases/
├── screenshots/                    # Visual verification
│   └── {case_number}_{timestamp}.png
├── extracted_{timestamp}.csv       # Spreadsheet import
└── extracted_{timestamp}.json      # Full metadata
```

### CSV Export Format

**Headers:** All non-null CaseData fields (dynamic)
**Encoding:** UTF-8
**Delimiter:** Comma
**Excludes:** raw_extraction (too large)

### JSON Export Format

**Structure:** Array of CaseData objects
**Encoding:** UTF-8
**Indent:** 2 spaces
**Includes:** All fields + raw_extraction

---

## RECOMMENDATIONS

### Immediate Observations

✅ **Strengths:**
1. Excellent documentation (2.2:1 ratio)
2. Privacy-focused design
3. Clean async/await architecture
4. Modular and extensible
5. User-friendly CLI
6. Comprehensive error handling

⚠️ **Areas for Improvement:**
1. No automated tests
2. No logging framework (uses print statements)
3. No configuration file (settings hardcoded or prompted)
4. No retry logic for transient failures
5. No parallel batch processing
6. No progress persistence (crash = start over)

### Next Steps for Repository Scout

Findings have been documented. Ready for:
- **Phase 1.2:** Code Archaeologist (analyze patterns and evolution)
- **Phase 2:** Code Analysis (quality, security, documentation)

---

## CONCLUSION

The Docket_Manager repository is a **well-designed, privacy-focused tool** for legal case data extraction. It demonstrates:

- Strong architectural patterns (async/await, separation of concerns)
- Excellent documentation coverage (69% of repository)
- Clear extensibility points
- Ethical design (local-first, no cloud APIs)
- User-friendly interfaces (CLI + programmatic API)

**Primary Users:** Public defenders and legal professionals who need to extract case data from court websites while maintaining client privacy.

**Primary Purpose:** Automate the extraction of case details from court websites using local browser automation and local vision AI, with all processing happening on the user's machine.

**Maturity Level:** Production-ready for individual use; needs testing infrastructure for team deployment.

---

**End of Repository Scout Report**
**Next Agent:** Code Archaeologist (Phase 1.2)
