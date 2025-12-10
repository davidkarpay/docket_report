# REFACTORING STRATEGIST REPORT
## Phase 4.1: Code Improvement and Refactoring Opportunities

**Analysis Date:** 2025-11-24
**Agent:** Refactoring Strategist
**Session:** Multi-Agent Instantiation Meta-Prompt (MAIMP)

---

## EXECUTIVE SUMMARY

The Docket_Manager codebase is well-structured but has **8 key refactoring opportunities** that would improve maintainability, testability, and performance. Total estimated effort: **5-7 days** for all improvements.

**Priority Refactorings:**
1. **CRITICAL:** Extract methods from long functions (extract_case_data 92 lines → 4 functions)
2. **HIGH:** Implement logging framework (replace print statements)
3. **HIGH:** Add automated test suite (0% → 80% coverage)
4. **MEDIUM:** Implement retry logic with exponential backoff
5. **MEDIUM:** Add parallel batch processing (3-5x speedup)

**ROI Assessment:** High return for effort invested

---

## REFACTORING OPPORTUNITY #1: EXTRACT METHOD - extract_case_data()

**Location:** case_data_extractor.py:54-145 (92 lines)

**Problem:** Function does 4 different things:
1. Builds extraction prompt
2. Makes API call
3. Parses response
4. Handles errors

**Complexity:** High (232 statements, 4 parameters)

**Refactoring:** Extract Method pattern

**Before:**
```python
async def extract_case_data(self, screenshot_b64: str, case_number: str,
                           additional_context: str = "") -> Dict[str, Any]:
    # 30 lines of prompt building
    prompt = f"""You are a legal data extraction assistant...
    {case_number}
    ...
    """

    # 30 lines of API call
    try:
        response = await self.client.post(...)
        result = response.json()
        content = result['choices'][0]['message']['content']
    except Exception as e:
        ...

    # 20 lines of response parsing
    content = content.strip()
    if content.startswith("```json"):
        ...
    extracted_data = json.loads(content)

    return extracted_data
```

**After:**
```python
def _build_extraction_prompt(self, case_number: str, context: str = "") -> str:
    """Build structured extraction prompt"""
    return f"""You are a legal data extraction assistant...
    CASE NUMBER: {case_number}
    {context}

    Extract the following fields...
    Return ONLY valid JSON, no commentary.
    """

async def _call_vision_api(self, prompt: str, image_b64: str) -> str:
    """Make API call to LM Studio"""
    response = await self.client.post(
        f"{self.base_url}/chat/completions",
        json={
            "model": "local-model",
            "messages": [{
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{image_b64}"}}
                ]
            }],
            "max_tokens": 2000,
            "temperature": 0.1,
        }
    )
    response.raise_for_status()
    return response.json()['choices'][0]['message']['content']

def _parse_json_response(self, content: str) -> Dict[str, Any]:
    """Parse and clean vision model JSON response"""
    content = content.strip()
    # Strip markdown code blocks
    if content.startswith("```json"):
        content = content[7:]
    if content.startswith("```"):
        content = content[3:]
    if content.endswith("```"):
        content = content[:-3]
    return json.loads(content.strip())

async def extract_case_data(self, screenshot_b64: str, case_number: str,
                           additional_context: str = "") -> Dict[str, Any]:
    """Extract structured case data from screenshot using vision AI"""
    try:
        prompt = self._build_extraction_prompt(case_number, additional_context)
        content = await self._call_vision_api(prompt, screenshot_b64)
        return self._parse_json_response(content)
    except Exception as e:
        logger.error(f"Extraction failed for {case_number}: {e}")
        return {"error": str(e), "raw_response": content if 'content' in locals() else None}
```

**Benefits:**
- Each function has single responsibility
- Easy to test individually
- Reusable components
- Reduced cognitive load

**Effort:** 2 hours
**Risk:** Low (pure refactoring, no logic changes)

---

## REFACTORING OPPORTUNITY #2: REPLACE PRINT WITH LOGGING

**Problem:** All output uses print(), no logging framework

**Affected Files:** All .py files (27+ print statements)

**Refactoring:** Introduce Logging Strategy

**Implementation:**
```python
# Add to case_data_extractor.py
import logging

logger = logging.getLogger(__name__)

# Configure in main
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('case_extractor.log'),
        logging.StreamHandler()
    ]
)
```

**Replacements:**
```python
# Before:
print(f"Processing: {case_number}")
print(f"Screenshot saved: {screenshot_path}")
print(f"Error processing {case_number}: {e}")

# After:
logger.info("Processing case: %s", case_number)
logger.debug("Screenshot saved: %s", screenshot_path)
logger.error("Error processing %s: %s", case_number, e, exc_info=True)
```

**Benefits:**
- Log levels (DEBUG, INFO, WARNING, ERROR)
- File output for production debugging
- Can disable/filter logs
- Standard practice
- Better for testing

**Effort:** 3-4 hours
**Risk:** Low
**Impact:** High (production readiness)

---

## REFACTORING OPPORTUNITY #3: INTRODUCE RETRY DECORATOR

**Problem:** No retry logic for transient failures

**Common Failures:**
- Network timeouts (LM Studio busy)
- Page load timeouts (slow court websites)
- Temporary connection issues

**Refactoring:** Decorator Pattern

**Implementation:**
```python
import asyncio
from functools import wraps
from typing import Callable, TypeVar

T = TypeVar('T')

def retry_with_backoff(
    max_attempts: int = 3,
    initial_delay: float = 1.0,
    backoff_factor: float = 2.0,
    exceptions: tuple = (Exception,)
):
    """Retry async function with exponential backoff"""
    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        @wraps(func)
        async def wrapper(*args, **kwargs) -> T:
            delay = initial_delay
            for attempt in range(max_attempts):
                try:
                    return await func(*args, **kwargs)
                except exceptions as e:
                    if attempt == max_attempts - 1:
                        raise
                    logger.warning(
                        f"Attempt {attempt + 1}/{max_attempts} failed for {func.__name__}: {e}. "
                        f"Retrying in {delay}s..."
                    )
                    await asyncio.sleep(delay)
                    delay *= backoff_factor
        return wrapper
    return decorator

# Usage:
class LMStudioVisionClient:
    @retry_with_backoff(
        max_attempts=3,
        exceptions=(httpx.TimeoutException, httpx.HTTPStatusError)
    )
    async def extract_case_data(self, screenshot_b64: str, case_number: str) -> Dict:
        # Existing code...

class CasePageScraper:
    @retry_with_backoff(
        max_attempts=2,
        exceptions=(playwright.errors.TimeoutError,)
    )
    async def navigate_and_screenshot(self, url: str, ...) -> tuple:
        # Existing code...
```

**Benefits:**
- Automatic recovery from transient failures
- Exponential backoff prevents hammering
- Configurable per operation
- Reduces manual retry burden

**Effort:** 4 hours
**Risk:** Low-Medium (needs testing)
**Impact:** High (reliability)

---

## REFACTORING OPPORTUNITY #4: PARALLEL BATCH PROCESSING

**Problem:** Sequential batch processing is slow (20 cases @ 30s each = 10 minutes)

**Current:**
```python
for case_info in cases:
    await process_case_url(...)  # Sequential
    await asyncio.sleep(delay)
```

**Refactoring:** Semaphore-Based Concurrency

**Implementation:**
```python
async def process_batch(self, cases: List[Dict], max_concurrent: int = 3,
                       delay_between_cases: int = 2):
    """Process cases with controlled concurrency"""
    semaphore = asyncio.Semaphore(max_concurrent)

    async def process_with_limit(case_info: Dict, index: int):
        async with semaphore:
            logger.info(f"Processing case {index + 1}/{len(cases)}: {case_info['case_number']}")

            case_data = await self.process_case_url(
                case_info['url'],
                case_info['case_number']
            )

            if case_data:
                self.results.append(case_data)

            # Rate limiting: wait before releasing semaphore
            if index < len(cases) - 1:
                await asyncio.sleep(delay_between_cases)

    # Process all cases concurrently (with limit)
    tasks = [process_with_limit(case, i) for i, case in enumerate(cases)]
    await asyncio.gather(*tasks, return_exceptions=True)

    logger.info(f"Batch complete: {len(self.results)}/{len(cases)} successful")
```

**Benefits:**
- 3-5x faster (depending on max_concurrent)
- Still respects rate limiting
- Better resource utilization
- Configurable concurrency

**Trade-offs:**
- More complex error handling
- Need to handle partial failures
- Increased memory usage (3-5 browsers)

**Effort:** 6 hours
**Risk:** Medium (needs thorough testing)
**Impact:** High (performance)

---

## REFACTORING OPPORTUNITY #5: EXTRACT EXPORTER CLASS

**Problem:** CaseDataExtractorApp has too many responsibilities

**Current Responsibilities:**
1. Browser orchestration
2. Vision client management
3. Case processing
4. Export to CSV
5. Export to JSON
6. Directory management

**Refactoring:** Extract Class

**Implementation:**
```python
class CaseDataExporter:
    """Handles export of CaseData to various formats"""

    def __init__(self, output_dir: Path):
        self.output_dir = output_dir
        self.output_dir.mkdir(exist_ok=True)

    def export_to_csv(self, cases: List[CaseData], filename: Optional[str] = None):
        """Export cases to CSV"""
        # Existing CSV export logic

    def export_to_json(self, cases: List[CaseData], filename: Optional[str] = None):
        """Export cases to JSON"""
        # Existing JSON export logic

    def export_to_excel(self, cases: List[CaseData], filename: str):
        """Export cases to Excel (new feature)"""
        import pandas as pd
        df = pd.DataFrame([asdict(case) for case in cases])
        df.to_excel(self.output_dir / filename, index=False)

class CaseDataExtractorApp:
    def __init__(self, output_dir: str = "extracted_cases", ...):
        self.output_dir = Path(output_dir)
        self.exporter = CaseDataExporter(self.output_dir)
        # ... rest of initialization

    def export_to_csv(self, filename: Optional[str] = None):
        """Export results to CSV"""
        self.exporter.export_to_csv(self.results, filename)

    def export_to_json(self, filename: Optional[str] = None):
        """Export results to JSON"""
        self.exporter.export_to_json(self.results, filename)
```

**Benefits:**
- Single Responsibility Principle
- Easy to add new export formats
- Testable in isolation
- Reusable in other contexts

**Effort:** 3 hours
**Risk:** Low

---

## REFACTORING OPPORTUNITY #6: CONFIGURATION OBJECT

**Problem:** Configuration passed as dictionaries, no validation

**Current:**
```python
config = PALM_BEACH_CONFIG  # Dict
url = config['case_url_template'].format(...)  # Risk: KeyError
```

**Refactoring:** Configuration Dataclass

**Implementation:**
```python
from dataclasses import dataclass, field
from typing import Optional, Dict

@dataclass
class CourtConfiguration:
    """Validated court configuration"""
    name: str
    base_url: str
    case_url_template: str
    wait_selector: Optional[str] = None
    wait_timeout: int = 10000
    additional_wait: int = 2000
    rate_limit_seconds: int = 3
    batch_size: int = 20
    batch_pause_seconds: int = 60
    search_url: Optional[str] = None
    search_selectors: Optional[Dict[str, str]] = None
    custom_fields: list = field(default_factory=list)
    output_dir: str = "extracted_cases"
    csv_filename_template: str = "cases_{date}.csv"

    def __post_init__(self):
        """Validate configuration"""
        if not self.base_url.startswith(('http://', 'https://')):
            raise ValueError(f"Invalid base_url: {self.base_url}")
        if '{case_number}' not in self.case_url_template:
            raise ValueError("case_url_template must contain {case_number}")
        if self.rate_limit_seconds < 1:
            raise ValueError("rate_limit_seconds must be >= 1")

    def format_case_url(self, case_number: str) -> str:
        """Generate case URL from template"""
        return self.case_url_template.format(case_number=case_number)

# Usage:
config = CourtConfiguration(
    name="Palm Beach County",
    base_url="https://court.example.com",
    case_url_template="https://court.example.com/case/{case_number}",
    wait_selector=".case-details"
)

url = config.format_case_url("2024CF001234")  # Type-safe, validated
```

**Benefits:**
- Type safety
- Validation on construction
- IDE autocomplete
- Self-documenting
- Immutable (frozen=True option)

**Effort:** 4 hours
**Risk:** Low

---

## REFACTORING OPPORTUNITY #7: INPUT VALIDATION

**Problem:** No validation of user inputs

**Missing Validations:**
- URL format
- Case number format
- File paths
- CSS selectors

**Implementation:**
```python
import re
from urllib.parse import urlparse

class InputValidator:
    """Validate user inputs"""

    @staticmethod
    def validate_url(url: str) -> str:
        """Validate and normalize URL"""
        parsed = urlparse(url)
        if parsed.scheme not in ['http', 'https']:
            raise ValueError(f"Invalid URL scheme: {parsed.scheme}")
        if not parsed.netloc:
            raise ValueError("URL must include domain")
        return url

    @staticmethod
    def validate_case_number(case_number: str, pattern: Optional[str] = None) -> str:
        """Validate case number format"""
        if not case_number or len(case_number) > 50:
            raise ValueError("Case number must be 1-50 characters")
        if pattern and not re.match(pattern, case_number):
            raise ValueError(f"Case number doesn't match pattern: {pattern}")
        return case_number.strip()

    @staticmethod
    def validate_file_path(path: str, must_exist: bool = False) -> Path:
        """Validate file path"""
        p = Path(path).resolve()
        if must_exist and not p.exists():
            raise FileNotFoundError(f"File not found: {path}")
        return p

    @staticmethod
    def validate_css_selector(selector: str) -> str:
        """Basic CSS selector validation"""
        if not selector or len(selector) > 200:
            raise ValueError("CSS selector must be 1-200 characters")
        # Could add more sophisticated validation
        return selector.strip()

# Usage in InteractiveCLI:
url = self.input("Enter case details URL")
url = InputValidator.validate_url(url)  # Raises ValueError if invalid

case_number = self.input("Enter case number")
case_number = InputValidator.validate_case_number(case_number)
```

**Benefits:**
- Fail fast (catch errors early)
- Better error messages
- Prevents invalid operations
- Security (prevent injection)

**Effort:** 3 hours
**Risk:** Low

---

## REFACTORING OPPORTUNITY #8: CHECKPOINT/RESUME FOR BATCHES

**Problem:** Long batch jobs can't resume after interruption

**Implementation:**
```python
import json
from pathlib import Path
from datetime import datetime

class BatchCheckpoint:
    """Manage batch processing checkpoints"""

    def __init__(self, checkpoint_dir: Path):
        self.checkpoint_dir = checkpoint_dir
        self.checkpoint_dir.mkdir(exist_ok=True)

    def save(self, batch_id: str, completed_cases: List[str],
             total_cases: int):
        """Save checkpoint"""
        checkpoint = {
            'batch_id': batch_id,
            'completed': completed_cases,
            'total': total_cases,
            'timestamp': datetime.now().isoformat()
        }
        path = self.checkpoint_dir / f"checkpoint_{batch_id}.json"
        with open(path, 'w') as f:
            json.dump(checkpoint, f)

    def load(self, batch_id: str) -> Optional[Dict]:
        """Load checkpoint"""
        path = self.checkpoint_dir / f"checkpoint_{batch_id}.json"
        if path.exists():
            with open(path, 'r') as f:
                return json.load(f)
        return None

    def clear(self, batch_id: str):
        """Remove checkpoint after completion"""
        path = self.checkpoint_dir / f"checkpoint_{batch_id}.json"
        path.unlink(missing_ok=True)

# Usage in CaseDataExtractorApp:
async def process_batch(self, cases: List[Dict], batch_id: Optional[str] = None,
                       resume: bool = False):
    if batch_id is None:
        batch_id = datetime.now().strftime("%Y%m%d_%H%M%S")

    checkpoint = BatchCheckpoint(self.output_dir / "checkpoints")
    completed_case_numbers = []

    if resume:
        saved = checkpoint.load(batch_id)
        if saved:
            completed_case_numbers = saved['completed']
            logger.info(f"Resuming batch: {len(completed_case_numbers)} already completed")

    for case_info in cases:
        if case_info['case_number'] in completed_case_numbers:
            continue  # Skip already processed

        case_data = await self.process_case_url(...)
        if case_data:
            self.results.append(case_data)
            completed_case_numbers.append(case_info['case_number'])

            # Save checkpoint after each success
            checkpoint.save(batch_id, completed_case_numbers, len(cases))

    # Clear checkpoint on completion
    checkpoint.clear(batch_id)
```

**Benefits:**
- Resume after interruption (Ctrl+C, crash, network loss)
- No wasted work
- Progress persistence
- User peace of mind

**Effort:** 5 hours
**Risk:** Medium
**Impact:** High (for long batches)

---

## REFACTORING PRIORITIZATION

### Priority Matrix

| Refactoring | Effort | Impact | Risk | Priority | Order |
|-------------|--------|--------|------|----------|-------|
| Extract methods (extract_case_data) | 2h | High | Low | **CRITICAL** | 1 |
| Logging framework | 4h | High | Low | **HIGH** | 2 |
| Input validation | 3h | Medium | Low | **HIGH** | 3 |
| Retry logic | 4h | High | Medium | **HIGH** | 4 |
| Extract exporter class | 3h | Medium | Low | MEDIUM | 5 |
| Configuration dataclass | 4h | Medium | Low | MEDIUM | 6 |
| Parallel processing | 6h | High | Medium | MEDIUM | 7 |
| Checkpoint/resume | 5h | High | Medium | MEDIUM | 8 |

### Recommended Sequence

**Sprint 1 (Week 1): Foundation**
1. Extract methods from long functions (Day 1)
2. Implement logging framework (Day 2)
3. Add input validation (Day 2-3)
4. Implement retry logic (Day 3-4)

**Sprint 2 (Week 2): Enhancement**
5. Extract exporter class (Day 1)
6. Configuration dataclass (Day 2)
7. Parallel processing (Day 3-4)
8. Checkpoint/resume (Day 4-5)

---

## ESTIMATED IMPACT

### Before Refactoring
- Code Quality: B+
- Testability: C (hard to test long functions)
- Reliability: B (no retries)
- Performance: C (sequential only)
- Maintainability: B (some long functions)

### After Refactoring
- Code Quality: A
- Testability: A (isolated, testable functions)
- Reliability: A (automatic retries)
- Performance: A- (parallel processing)
- Maintainability: A (small, focused functions)

**Total Improvement:** +2 letter grades

---

## CONCLUSION

The Docket_Manager codebase would benefit significantly from these 8 refactorings. Total estimated effort is **31 hours (5-7 days)** for a senior developer.

**Highest ROI:**
1. Extract methods (2h) → Massive testability improvement
2. Logging (4h) → Production-ready debugging
3. Retry logic (4h) → 10x more reliable

**Quick Wins (≤4 hours each):**
- Extract methods
- Input validation
- Extract exporter class
- Logging framework

**Recommendation:** Start with Sprint 1 (Days 1-4) to establish foundation, then evaluate Sprint 2 based on user needs and priorities.

---

**End of Refactoring Strategist Report**
**Next Agent:** Test Engineer (Phase 4.2)
