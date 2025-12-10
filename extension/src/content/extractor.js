/**
 * Client Docket Manager Extractor - Content Script
 * Runs on web pages to extract legal case data
 */

class DocketExtractor {
  constructor() {
    this.selectedElements = new Map();
    this.extractedData = {};
    this.isSelectionMode = false;
    this.currentField = null;
    this.extractionRules = null;
    this.overlay = null;
    this.pageType = null; // 'SINGLE_CASE_DETAIL' or 'MULTI_CASE_TABLE'
  }

  /**
   * Initialize the extractor
   */
  async init() {
    console.log('Docket Extractor initialized');

    // Load extraction rules for this domain
    await this.loadExtractionRules();

    // Listen for messages from popup/background
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender, sendResponse);
      return true; // Keep channel open for async response
    });

    // Auto-extract if rules exist for this domain - WAIT FOR DOM
    if (this.extractionRules) {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.autoExtract());
      } else {
        // DOM already loaded
        this.autoExtract();
      }
    }
  }

  /**
   * Load extraction rules for current domain
   */
  async loadExtractionRules() {
    let domain = window.location.hostname;

    // Handle file:// protocol (hostname is empty string)
    if (!domain || domain === '') {
      domain = 'localhost';
      console.log('Detected file:// protocol, using "localhost" for rules');
    }

    console.log('Loading extraction rules for domain:', domain);

    try {
      const response = await fetch(chrome.runtime.getURL(`rules/${domain}.json`));
      if (response.ok) {
        this.extractionRules = await response.json();
        console.log('✓ Successfully loaded extraction rules for', domain);
        console.log('  Rules contain', Object.keys(this.extractionRules.fields || {}).length, 'field definitions');
      } else {
        console.log('✗ No rules file found for domain:', domain, '(HTTP', response.status + ')');
      }
    } catch (error) {
      console.log('✗ Error loading rules for domain:', domain, '-', error.message);
    }
  }

  /**
   * Detect the type of page (calendar/table view vs case detail view)
   * Priority: Check for case details indicators FIRST, then calendar/table indicators
   */
  detectPageType() {
    console.log('Detecting page type...');

    // FIRST: Check for strong case details indicators (higher priority)
    // These take precedence because case details pages often contain DataTables
    const hasCaseDetailsSections = document.querySelector('section[id*="parties"]') ||
                                   document.querySelector('section[id*="charges"]') ||
                                   document.querySelector('section[id*="docket"]') ||
                                   document.querySelector('#courtevents') ||
                                   document.querySelector('#case-details') ||
                                   document.querySelector('.case-detail') ||
                                   document.querySelector('.case-information');

    // Check for case number in prominent position (header, title)
    const caseNumberPattern = /\d{2}-\d{4}-[A-Z]{2}-\d{6}/;
    const headerElement = document.querySelector('h1, h2, .case-header, .case-number');
    const headerText = headerElement?.textContent || '';
    const hasCaseNumberHeader = caseNumberPattern.test(headerText);

    // URL contains case number pattern or case-specific path
    const urlHasCaseNumber = caseNumberPattern.test(window.location.href) ||
                             window.location.href.includes('/case/') ||
                             window.location.href.includes('caseNumber=') ||
                             window.location.href.includes('case_number=') ||
                             window.location.hash.includes('casedetails');

    if (hasCaseDetailsSections || hasCaseNumberHeader || urlHasCaseNumber) {
      console.log('✓ Detected SINGLE_CASE_DETAIL page type (priority indicators found)');
      return 'SINGLE_CASE_DETAIL';
    }

    // SECOND: Check for calendar/table indicators
    const hasCalendarUrl = window.location.hash.includes('calendar') ||
                          window.location.pathname.includes('calendar') ||
                          window.location.search.includes('calendar');

    // Check for calendar page - only trust page title or main heading, not tab names in body text
    const hasCourtEventsList = document.querySelector('table') &&
                              (document.title.includes('Court Events') ||
                               document.title.includes('Calendar') ||
                               document.querySelector('h1, h2')?.textContent?.includes('Court Events') ||
                               document.querySelector('h1, h2')?.textContent?.includes('Calendar'));

    if (hasCalendarUrl || hasCourtEventsList) {
      console.log('✓ Detected MULTI_CASE_TABLE page type (calendar indicators found)');
      return 'MULTI_CASE_TABLE';
    }

    // THIRD: Check for DataTable with multiple rows (weaker indicator)
    const hasDataTable = document.querySelector('table[datatable]') ||
                        document.querySelector('table.dataTable') ||
                        document.querySelector('[datatable]');

    if (hasDataTable) {
      const rows = document.querySelectorAll('table[datatable] tbody tr, table.dataTable tbody tr');
      // Only treat as multi-case if there are multiple data rows
      if (rows.length > 1) {
        console.log(`✓ Detected MULTI_CASE_TABLE page type (DataTable with ${rows.length} rows)`);
        return 'MULTI_CASE_TABLE';
      } else {
        console.log('⚠ DataTable found but only 1 row, treating as SINGLE_CASE_DETAIL');
      }
    }

    console.log('✓ Defaulting to SINGLE_CASE_DETAIL page type');
    return 'SINGLE_CASE_DETAIL';
  }

  /**
   * Handle messages from popup or background script
   */
  async handleMessage(request, sender, sendResponse) {
    switch (request.action) {
      case 'startManualSelection':
        this.startManualSelection(request.field);
        sendResponse({ success: true });
        break;

      case 'stopSelection':
        this.stopManualSelection();
        sendResponse({ success: true });
        break;

      case 'extractData':
        const data = await this.extractData();
        sendResponse({ success: true, data });
        break;

      case 'getExtractedData':
        sendResponse({ success: true, data: this.extractedData });
        break;

      case 'clearData':
        this.clearExtractedData();
        sendResponse({ success: true });
        break;

      case 'autoExtract':
        await this.autoExtract();
        sendResponse({ success: true, data: this.extractedData });
        break;

      case 'highlightElement':
        this.highlightElement(request.selector);
        sendResponse({ success: true });
        break;

      case 'ping':
        // Health check - responds if content script is loaded and ready
        sendResponse({ success: true, ready: true });
        break;
    }
  }

  /**
   * Start manual element selection mode
   */
  startManualSelection(field) {
    this.isSelectionMode = true;
    this.currentField = field;

    // Create overlay
    this.createOverlay();

    // Add event listeners for selection
    document.addEventListener('mouseover', this.handleMouseOver);
    document.addEventListener('click', this.handleClick, true);
    document.addEventListener('keydown', this.handleKeyDown);

    this.showNotification(`Selecting: ${field}. Click element or press ESC to cancel.`);
  }

  /**
   * Stop manual selection mode
   */
  stopManualSelection() {
    this.isSelectionMode = false;
    this.currentField = null;

    document.removeEventListener('mouseover', this.handleMouseOver);
    document.removeEventListener('click', this.handleClick, true);
    document.removeEventListener('keydown', this.handleKeyDown);

    this.removeOverlay();
    this.hideNotification();
  }

  /**
   * Handle mouse over during selection
   */
  handleMouseOver = (event) => {
    if (!this.isSelectionMode) return;

    event.target.classList.add('docket-extractor-highlight');

    // Remove highlight from previous element
    const highlighted = document.querySelectorAll('.docket-extractor-highlight');
    highlighted.forEach(el => {
      if (el !== event.target) {
        el.classList.remove('docket-extractor-highlight');
      }
    });
  }

  /**
   * Handle click during selection
   */
  handleClick = (event) => {
    if (!this.isSelectionMode) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation(); // Prevent event from bubbling further

    const element = event.target;

    // Validate element isn't a large container
    if (this.isLikelyContainer(element)) {
      const childCount = element.children.length;
      const textLength = (element.innerText || element.textContent || '').trim().length;

      console.warn(`Selected element <${element.tagName.toLowerCase()}> appears to be a container with ${childCount} children and ${textLength} chars of text`);

      const confirmed = confirm(
        `⚠ Warning: Container Element Detected\n\n` +
        `You selected: <${element.tagName.toLowerCase()}>\n` +
        `Children: ${childCount} elements\n` +
        `Text length: ${textLength} characters\n\n` +
        `This might include more content than intended.\n\n` +
        `💡 Tip: Try clicking directly on the specific text,\n` +
        `not its surrounding container.\n\n` +
        `Continue with this selection anyway?`
      );

      if (!confirmed) {
        console.log('User cancelled container selection');
        return; // Cancel selection
      }
    }

    const selector = this.generateSelector(element);
    const value = this.extractElementValue(element);

    // Validate value isn't too large (possible parent container selected)
    if (value.length > 1000) {
      const confirmed = confirm(
        `The selected element contains ${value.length} characters.\n\n` +
        `This might include more content than intended.\n\n` +
        `Continue anyway?`
      );
      if (!confirmed) {
        return;
      }
    }

    // Store the selection
    this.selectedElements.set(this.currentField, {
      selector,
      value,
      element: element.outerHTML.substring(0, 200)
    });

    // Update extracted data
    this.setExtractedValue(this.currentField, value);

    // Show truncated value in notification
    const displayValue = value.length > 50 ? value.substring(0, 50) + '...' : value;
    this.showNotification(`Captured: ${this.currentField} = "${displayValue}"`);

    // Send update to popup
    chrome.runtime.sendMessage({
      action: 'fieldSelected',
      field: this.currentField,
      value: value
    });

    this.stopManualSelection();
  }

  /**
   * Check if element is likely a container rather than a specific data element
   */
  isLikelyContainer(element) {
    const containerTags = ['DIV', 'SECTION', 'ARTICLE', 'MAIN', 'BODY', 'HTML', 'HEADER', 'FOOTER', 'NAV', 'ASIDE'];

    // Non-container tags (SPAN, P, TD, LI, etc.) are fine
    if (!containerTags.includes(element.tagName)) {
      return false;
    }

    // DIV/SECTION with many children is definitely a container
    if (element.children.length > 3) {
      return true;
    }

    // Small containers (1-3 children) might be wrappers, check text length
    const textLength = (element.innerText || element.textContent || '').trim().length;
    if (textLength > 200) {
      return true; // Likely captured too much text
    }

    return false;
  }

  /**
   * Handle keyboard events during selection
   */
  handleKeyDown = (event) => {
    if (event.key === 'Escape' && this.isSelectionMode) {
      this.stopManualSelection();
    }
  }

  /**
   * Generate a unique CSS selector for an element
   */
  generateSelector(element) {
    if (element.id) {
      return `#${element.id}`;
    }

    if (element.className) {
      const classes = element.className.split(' ').filter(c => c).join('.');
      if (classes) {
        const selector = `${element.tagName.toLowerCase()}.${classes}`;
        if (document.querySelectorAll(selector).length === 1) {
          return selector;
        }
      }
    }

    // Generate path-based selector
    const path = [];
    let current = element;

    while (current && current.tagName) {
      let selector = current.tagName.toLowerCase();

      if (current.id) {
        selector += `#${current.id}`;
        path.unshift(selector);
        break;
      }

      let sibling = current;
      let nth = 1;
      while (sibling.previousElementSibling) {
        sibling = sibling.previousElementSibling;
        if (sibling.tagName === current.tagName) nth++;
      }

      if (nth > 1) selector += `:nth-of-type(${nth})`;

      path.unshift(selector);
      current = current.parentElement;
    }

    return path.join(' > ');
  }

  /**
   * Extract value from an element
   */
  extractElementValue(element) {
    // Form inputs
    if (element.value !== undefined && element.value !== '') {
      return element.value;
    }

    // Images
    if (element.alt) return element.alt;
    if (element.title) return element.title;

    // Links
    if (element.href && element.tagName === 'A') return element.href;
    if (element.src) return element.src;

    // Text content - prefer innerText (visible text) over textContent (includes hidden)
    if (element.innerText) {
      const text = element.innerText.trim();
      // If text is suspiciously long, it's probably a parent container
      if (text.length > 500) {
        console.warn(`Extracted text is very long (${text.length} chars), might be capturing parent element`);
        // Try to get just the direct text nodes
        return this.getDirectTextContent(element);
      }
      return text;
    }

    if (element.textContent) {
      const text = element.textContent.trim();
      if (text.length > 500) {
        console.warn(`Extracted text is very long (${text.length} chars), might be capturing parent element`);
        return this.getDirectTextContent(element);
      }
      return text;
    }

    return '';
  }

  /**
   * Get only direct text content, excluding nested elements
   */
  getDirectTextContent(element) {
    let text = '';
    for (let node of element.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        text += node.textContent;
      }
    }
    const direct = text.trim();
    // If still too long or empty, fallback to truncated innerText
    if (!direct || direct.length > 500) {
      return element.innerText.trim().substring(0, 500);
    }
    return direct;
  }

  /**
   * Auto-extract data using predefined rules
   */
  async autoExtract() {
    if (!this.extractionRules) {
      console.log('No extraction rules available for auto-extract');
      return;
    }

    // Detect page type
    this.pageType = this.detectPageType();
    console.log(`Page type detected: ${this.pageType}`);

    let extractedData = null;
    let recordCount = 0;

    // Use appropriate extraction method based on page type
    if (this.pageType === 'MULTI_CASE_TABLE' && this.extractionRules.tableExtraction) {
      // Extract table rows (returns array of cases)
      console.log('Using table extraction method...');
      const cases = await this.extractTableRows();

      extractedData = {
        data: cases,
        extractionMetadata: {
          pageType: 'MULTI_CASE_TABLE',
          recordCount: cases.length,
          extractedAt: new Date().toISOString(),
          sourceUrl: window.location.href,
          extractorVersion: '2.0.0'
        }
      };

      recordCount = cases.length;
      console.log(`✓ Table extraction complete: ${recordCount} cases extracted`);

    } else {
      // Extract single case details (traditional field-based extraction)
      console.log('Using field-based extraction method...');

      // Debug: Log DOM structure to help diagnose XPath issues
      this.logDomDiagnostics();

      const extracted = {};

      // Use recursive extraction to handle nested field structures
      this.extractFieldsRecursive(this.extractionRules.fields || {}, extracted, '');

      // Extract attorney info from #parties .contentbox elements (these aren't in the table)
      this.extractAttorneyInfo(extracted);

      const fieldCount = this.countExtractedFields(extracted);
      console.log(`Field extraction complete: ${fieldCount} field(s) extracted`);

      if (fieldCount === 0) {
        console.warn('⚠ Auto-extraction completed but no data was extracted. Check selectors in rules file.');
      }

      extractedData = {
        data: extracted,
        extractionMetadata: {
          pageType: 'SINGLE_CASE_DETAIL',
          recordCount: 1,
          extractedAt: new Date().toISOString(),
          sourceUrl: window.location.href,
          extractorVersion: '2.0.0'
        }
      };

      recordCount = 1;
    }

    // Store in instance variable (for backward compatibility)
    this.extractedData = extractedData;

    console.log('Extracted data structure:', extractedData);

    // Log full dockets array for inspection
    if (extractedData.data?.dockets) {
      console.log('📋 Full dockets data (' + extractedData.data.dockets.length + ' rows):');
      console.table(extractedData.data.dockets);
    }

    // Notify popup
    chrome.runtime.sendMessage({
      action: 'autoExtractionComplete',
      data: extractedData
    });
  }

  /**
   * Helper to set value in object with dot notation (for field-based extraction)
   */
  setExtractedValueInObject(obj, path, value) {
    const parts = path.split('.');
    let current = obj;

    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) {
        current[parts[i]] = {};
      }
      current = current[parts[i]];
    }

    current[parts[parts.length - 1]] = value;
  }

  /**
   * Extract data from table rows (for calendar/multi-case views)
   */
  async extractTableRows() {
    if (!this.extractionRules || !this.extractionRules.tableExtraction) {
      console.error('No table extraction rules available');
      return [];
    }

    const config = this.extractionRules.tableExtraction;
    const results = [];

    // Find all rows
    const rows = document.querySelectorAll(config.rowSelector);
    console.log(`Found ${rows.length} table rows to extract`);

    rows.forEach((row, rowIndex) => {
      const cells = row.querySelectorAll('td');
      const caseData = {};

      // Extract data for each column mapping
      config.columns.forEach(colConfig => {
        try {
          // Skip if this is the excluded "Proc'd" column
          if (colConfig.skip) {
            return;
          }

          if (cells[colConfig.index]) {
            const cell = cells[colConfig.index];

            // Extract value even if cell is hidden
            let value = '';

            // Check for links first (case numbers are often links)
            const link = cell.querySelector('a');
            if (link && colConfig.extractLink) {
              value = link.textContent.trim();
            } else {
              // Use innerText for visible content, textContent for hidden
              value = (cell.innerText || cell.textContent || '').trim();
            }

            // Apply transformation if specified
            if (value && colConfig.transform) {
              value = this.applyTransform(value, colConfig.transform);
            }

            // Only set non-empty values
            if (value) {
              caseData[colConfig.field] = value;
            }
          }
        } catch (error) {
          console.error(`Error extracting column ${colConfig.field} from row ${rowIndex}:`, error);
        }
      });

      // Only add if we extracted at least some data
      if (Object.keys(caseData).length > 0) {
        results.push(caseData);
      }
    });

    console.log(`Extracted ${results.length} cases from table`);
    return results;
  }

  /**
   * Apply transformation to extracted value
   */
  applyTransform(value, transform) {
    switch (transform) {
      case 'uppercase':
        return value.toUpperCase();
      case 'lowercase':
        return value.toLowerCase();
      case 'trim':
        return value.trim();
      case 'parseDate':
        return this.parseDate(value);
      case 'parseNumber':
        return parseFloat(value.replace(/[^0-9.-]/g, ''));
      default:
        return value;
    }
  }

  /**
   * Parse various date formats
   */
  parseDate(dateString) {
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return date.toISOString();
    }
    return dateString;
  }

  /**
   * Check if an object is a field rule (has selector, xpath, or regex)
   * vs a nested group of fields
   */
  isFieldRule(obj) {
    if (!obj || typeof obj !== 'object') return false;
    // A field rule has extraction properties
    return obj.selector || obj.xpath || obj.regex;
  }

  /**
   * Extract a single field value using its rule
   */
  extractSingleField(rule) {
    let value = null;

    // Try CSS selector
    if (rule.selector) {
      const element = document.querySelector(rule.selector);
      if (element) {
        value = this.extractElementValue(element);
      }
    }

    // Try XPath
    if (!value && rule.xpath) {
      try {
        const result = document.evaluate(
          rule.xpath,
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null
        );
        if (result.singleNodeValue) {
          value = this.extractElementValue(result.singleNodeValue);
        }
      } catch (e) {
        console.warn(`XPath error for ${rule.xpath}:`, e.message);
      }
    }

    // Try regex on page content
    if (!value && rule.regex) {
      const regex = new RegExp(rule.regex, 'i');
      const match = document.body.textContent.match(regex);
      if (match) {
        value = match[1] || match[0];
      }
    }

    // Apply transformation
    if (value && rule.transform) {
      value = this.applyTransform(value, rule.transform);
    }

    return value;
  }

  /**
   * Recursively extract fields from nested rule structure
   * Handles both flat and nested field definitions
   */
  extractFieldsRecursive(rules, output, parentPath) {
    for (const [key, rule] of Object.entries(rules)) {
      // Skip metadata keys that start with underscore
      if (key.startsWith('_')) continue;

      const fieldPath = parentPath ? `${parentPath}.${key}` : key;

      if (this.isFieldRule(rule)) {
        // This is a leaf field with extraction rules
        try {
          const value = this.extractSingleField(rule);
          if (value !== null && value !== undefined) {
            this.setExtractedValueInObject(output, fieldPath, value);
            const displayValue = typeof value === 'string' && value.length > 50
              ? value.substring(0, 50) + '...' : value;
            console.log(`✓ Extracted ${fieldPath}:`, displayValue);
          } else {
            console.log(`✗ Failed to extract ${fieldPath}`);
          }
        } catch (error) {
          console.error(`Error extracting ${fieldPath}:`, error);
        }
      } else if (typeof rule === 'object' && rule !== null) {
        // This is a nested group - check if it's an array/table extraction type
        if (rule._extractionType === 'array') {
          // Extract array data from table using XPath and column mapping
          const arrayData = this.extractArraySection(key, rule);
          if (arrayData && arrayData.length > 0) {
            this.setExtractedValueInObject(output, fieldPath, arrayData);
            console.log(`✓ Extracted ${fieldPath}: ${arrayData.length} row(s)`);
            // Log sample data for debugging
            if (arrayData.length > 0) {
              console.log(`  Sample ${fieldPath}[0]:`, arrayData[0]);
              if (arrayData.length > 1) {
                console.log(`  Sample ${fieldPath}[1]:`, arrayData[1]);
              }
            }
          } else {
            console.log(`⏭ ${fieldPath}: No rows found or table not rendered`);
          }
        } else if (rule._extractionType === 'multi_table') {
          // Extract multi-table section (e.g., arrests with separate bonds table)
          const multiTableData = this.extractMultiTableSection(key, rule);
          if (multiTableData && Object.keys(multiTableData).length > 0) {
            this.setExtractedValueInObject(output, fieldPath, multiTableData);
            console.log(`✓ Extracted ${fieldPath}: multi-table section`);
          } else {
            console.log(`⏭ ${fieldPath}: No data in multi-table section`);
          }
        } else {
          // Recurse into nested fields
          this.extractFieldsRecursive(rule, output, fieldPath);
        }
      }
    }
  }

  /**
   * Extract array section from table using XPath and column mapping
   * @param {string} sectionName - Name of the section (e.g., 'parties', 'charges')
   * @param {object} rule - Rule object containing _xpath and columns
   * @returns {array} Array of extracted row objects
   */
  extractArraySection(sectionName, rule) {
    const results = [];
    const columns = rule.columns;

    if (!columns) {
      console.log(`⚠ ${sectionName}: Missing columns definition`);
      return results;
    }

    // Try to find table rows using multiple strategies
    let rows = [];

    // Strategy 1: Try XPath if provided
    if (rule._xpath) {
      try {
        const xpathResult = document.evaluate(
          rule._xpath,
          document,
          null,
          XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
          null
        );
        for (let i = 0; i < xpathResult.snapshotLength; i++) {
          rows.push(xpathResult.snapshotItem(i));
        }
        if (rows.length > 0) {
          console.log(`  ${sectionName}: Found ${rows.length} rows via XPath`);
        }
      } catch (e) {
        console.log(`  ${sectionName}: XPath failed - ${e.message}`);
      }
    }

    // Strategy 2: CSS selector fallback using section ID
    if (rows.length === 0) {
      // Map section names to their section IDs
      const sectionIdMap = {
        'parties': 'parties',
        'charges': 'charges',
        'dockets': 'dockets',
        'linkedCases': 'relatedcases',
        'sentences': 'sentences',
        'warrants': 'warrants',
        'courtEvents': 'courtevents'
      };

      // Extract base section name (e.g., 'arrests.arrestsTable' -> 'arrests')
      const baseSectionName = sectionName.split('.')[0];
      const sectionId = sectionIdMap[baseSectionName] || baseSectionName;

      // Try CSS selector: #sectionId table tbody tr
      const cssSelector = `#${sectionId} table tbody tr`;
      const cssRows = document.querySelectorAll(cssSelector);

      if (cssRows.length > 0) {
        rows = Array.from(cssRows);
        console.log(`  ${sectionName}: Found ${rows.length} rows via CSS selector (#${sectionId})`);
      } else {
        console.log(`  ${sectionName}: No rows found via XPath or CSS selector`);
      }
    }

    if (rows.length === 0) {
      return results;
    }

    // Extract data from rows
    for (const row of rows) {
      const cells = row.querySelectorAll('td');

      // Skip "No records found" rows
      if (row.textContent.includes('No records found') || row.textContent.includes('No data available')) {
        continue;
      }

      const rowData = {};
      let hasData = false;

      for (const [fieldName, colDef] of Object.entries(columns)) {
        if (fieldName.startsWith('_')) continue;
        if (colDef.skip) continue;

        const colIndex = colDef.position - 1; // positions are 1-based
        if (colIndex >= 0 && colIndex < cells.length) {
          let value = cells[colIndex].textContent.trim();

          // Apply transform if specified
          if (value && colDef.transform) {
            value = this.applyTransform(value, colDef.transform);
          }

          if (value !== null && value !== undefined && value !== '') {
            rowData[fieldName] = value;
            hasData = true;
          }
        }
      }

      if (hasData) {
        results.push(rowData);
      }
    }

    return results;
  }

  /**
   * Extract multi-table section (e.g., arrests which has arrests table + bonds table)
   * @param {string} sectionName - Name of the section
   * @param {object} rule - Rule object containing sub-table definitions
   * @returns {object} Object with extracted data from each sub-table
   */
  extractMultiTableSection(sectionName, rule) {
    const result = {};

    // Map section names to their section IDs
    const sectionIdMap = {
      'arrests': 'arrests',
      'fees': 'fees'
    };
    const sectionId = sectionIdMap[sectionName] || sectionName;

    // Get all tables in this section
    const allTables = document.querySelectorAll(`#${sectionId} table`);
    console.log(`  ${sectionName}: Found ${allTables.length} tables in section`);

    let tableIndex = 0;
    for (const [subTableName, subTableDef] of Object.entries(rule)) {
      if (subTableName.startsWith('_')) continue;

      // Check if this sub-table has columns definition
      if (subTableDef.columns) {
        // Use _tableNumber if specified, otherwise use sequential index
        const targetTableNum = subTableDef._tableNumber || (tableIndex + 1);
        const targetTable = allTables[targetTableNum - 1]; // 1-based to 0-based

        if (targetTable) {
          const rows = targetTable.querySelectorAll('tbody tr');
          const subTableData = [];

          for (const row of rows) {
            // Skip "No records found" rows
            if (row.textContent.includes('No records found') || row.textContent.includes('No data available')) {
              continue;
            }

            const cells = row.querySelectorAll('td');
            const rowData = {};
            let hasData = false;

            for (const [fieldName, colDef] of Object.entries(subTableDef.columns)) {
              if (fieldName.startsWith('_')) continue;
              if (colDef.skip) continue;

              const colIndex = colDef.position - 1;
              if (colIndex >= 0 && colIndex < cells.length) {
                let value = cells[colIndex].textContent.trim();
                if (value && colDef.transform) {
                  value = this.applyTransform(value, colDef.transform);
                }
                if (value !== null && value !== undefined && value !== '') {
                  rowData[fieldName] = value;
                  hasData = true;
                }
              }
            }

            if (hasData) {
              subTableData.push(rowData);
            }
          }

          if (subTableData.length > 0) {
            result[subTableName] = subTableData;
            console.log(`  ${sectionName}.${subTableName}: Extracted ${subTableData.length} rows from table ${targetTableNum}`);
          }
        }
        tableIndex++;
      } else if (subTableDef._extractFrom === 'text_header') {
        // Handle text-based extraction (e.g., fees summary)
        const summaryData = this.extractTextSummary(sectionName, subTableDef);
        if (summaryData && Object.keys(summaryData).length > 0) {
          result[subTableName] = summaryData;
        }
      }
    }

    return result;
  }

  /**
   * Extract summary text using pattern matching (e.g., "Total Balance + Interest: $50.00")
   */
  extractTextSummary(sectionName, rule) {
    const result = {};

    if (rule._xpath) {
      try {
        const xpathResult = document.evaluate(
          rule._xpath,
          document,
          null,
          XPathResult.STRING_TYPE,
          null
        );
        const text = xpathResult.stringValue;

        if (text && rule._pattern) {
          const match = text.match(new RegExp(rule._pattern));
          if (match && match[1]) {
            result.value = this.applyTransform(match[1], 'parseNumber');
          }
        }
      } catch (error) {
        console.log(`  ${sectionName} summary: extraction failed`);
      }
    }

    return result;
  }

  /**
   * Extract attorney info from #parties .contentbox elements
   * These fields (Judge, State Attorney, Public Defender, Defense Attorney) are displayed
   * in contentbox divs above the parties table, not in the table itself
   */
  extractAttorneyInfo(extracted) {
    const partiesSection = document.querySelector('#parties');
    if (!partiesSection) return;

    // Initialize caseHeader if not exists
    if (!extracted.caseHeader) {
      extracted.caseHeader = {};
    }

    // Map of label text to field names
    const fieldMap = {
      'Judge:': 'judge',
      'Division:': 'division',
      'State Attorney:': 'stateAttorney',
      'Public Defender:': 'publicDefender',
      'Defense Attorney:': 'defenseAttorney'
    };

    // Find all contentbox divs in parties section
    const contentBoxes = partiesSection.querySelectorAll('.contentbox');

    for (const box of contentBoxes) {
      // Find the label (b element)
      const label = box.querySelector('b');
      if (!label) continue;

      const labelText = label.textContent.trim();
      const fieldName = fieldMap[labelText];

      if (fieldName) {
        // Find the value span (usually the span with ng-bind attribute after the b)
        // Structure: <span><b>Label:</b></span><span ng-bind="...">Value</span>
        // OR: <div><b>Label:</b></div><span ng-bind="...">Value</span>
        const valueSpan = box.querySelector('span[ng-bind], span.ng-binding');
        if (valueSpan) {
          const value = valueSpan.textContent.trim();
          if (value) {
            // Only set if not already extracted or if current value is empty
            if (!extracted.caseHeader[fieldName]) {
              extracted.caseHeader[fieldName] = value;
              console.log(`✓ Extracted caseHeader.${fieldName} (from contentbox):`, value);
            }
          }
        }
      }
    }
  }

  /**
   * Log DOM diagnostics to help debug XPath/selector issues
   */
  logDomDiagnostics() {
    console.group('🔍 DOM Diagnostics');

    // Check for h4 elements (section headers)
    const h4Elements = document.querySelectorAll('h4');
    console.log(`h4 elements found: ${h4Elements.length}`);
    h4Elements.forEach((el, i) => {
      console.log(`  h4[${i}]: "${el.textContent.trim().substring(0, 50)}"`);
    });

    // Check for section elements
    const sections = document.querySelectorAll('section');
    console.log(`section elements found: ${sections.length}`);
    sections.forEach((el, i) => {
      console.log(`  section[${i}]: id="${el.id}", class="${el.className}"`);
    });

    // Check for tables
    const tables = document.querySelectorAll('table');
    console.log(`table elements found: ${tables.length}`);
    tables.forEach((el, i) => {
      const rows = el.querySelectorAll('tbody tr');
      const caption = el.querySelector('caption')?.textContent || '';
      const prevH4 = el.previousElementSibling?.tagName === 'H4' ? el.previousElementSibling.textContent : '';
      console.log(`  table[${i}]: ${rows.length} rows, caption="${caption}", prevH4="${prevH4.trim().substring(0, 30)}"`);
    });

    // Check for bold labels (used in caseHeader extraction)
    const boldLabels = document.querySelectorAll('b');
    const labelTexts = Array.from(boldLabels).map(b => b.textContent.trim()).filter(t => t.endsWith(':'));
    console.log(`Bold labels found: ${labelTexts.length}`);
    if (labelTexts.length > 0) {
      console.log(`  Sample labels: ${labelTexts.slice(0, 10).join(', ')}`);
    }

    // Test specific XPath for parties table
    try {
      const partiesXpath = "//h4[text()='Parties']/following-sibling::table[1]//tbody/tr";
      const result = document.evaluate(partiesXpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
      console.log(`XPath test (Parties): ${result.snapshotLength} matches`);
    } catch (e) {
      console.log(`XPath test (Parties): error - ${e.message}`);
    }

    // Test alternative XPath patterns
    try {
      const altXpath = "//table//tbody/tr";
      const result = document.evaluate(altXpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
      console.log(`XPath test (all table rows): ${result.snapshotLength} matches`);
    } catch (e) {
      console.log(`XPath test (all table rows): error - ${e.message}`);
    }

    console.groupEnd();
  }

  /**
   * Count total extracted fields (including nested)
   */
  countExtractedFields(obj) {
    let count = 0;
    for (const value of Object.values(obj)) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        count += this.countExtractedFields(value);
      } else if (value !== null && value !== undefined) {
        count++;
      }
    }
    return count;
  }

  /**
   * Set extracted value in structured data
   */
  setExtractedValue(path, value) {
    const parts = path.split('.');
    let current = this.extractedData;

    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) {
        current[parts[i]] = {};
      }
      current = current[parts[i]];
    }

    current[parts[parts.length - 1]] = value;
  }

  /**
   * Extract all data and return structured object
   */
  async extractData() {
    // Ensure metadata is included
    if (!this.extractedData.extractionMetadata) {
      this.extractedData.extractionMetadata = {};
    }

    this.extractedData.extractionMetadata.extractedAt = new Date().toISOString();
    this.extractedData.extractionMetadata.sourceUrl = window.location.href;
    this.extractedData.extractionMetadata.extractorVersion = '1.0.0';

    return this.extractedData;
  }

  /**
   * Clear all extracted data
   */
  clearExtractedData() {
    this.extractedData = {};
    this.selectedElements.clear();
  }

  /**
   * Highlight an element on the page
   */
  highlightElement(selector) {
    // Remove previous highlights
    document.querySelectorAll('.docket-extractor-permanent-highlight').forEach(el => {
      el.classList.remove('docket-extractor-permanent-highlight');
    });

    // Add new highlight
    const element = document.querySelector(selector);
    if (element) {
      element.classList.add('docket-extractor-permanent-highlight');
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  /**
   * Create visual overlay
   */
  createOverlay() {
    if (this.overlay) return;

    this.overlay = document.createElement('div');
    this.overlay.id = 'docket-extractor-overlay';
    this.overlay.className = 'docket-extractor-overlay';
    document.body.appendChild(this.overlay);
  }

  /**
   * Remove visual overlay
   */
  removeOverlay() {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }

    // Clean up any highlights
    document.querySelectorAll('.docket-extractor-highlight').forEach(el => {
      el.classList.remove('docket-extractor-highlight');
    });
  }

  /**
   * Show notification to user
   */
  showNotification(message) {
    let notification = document.getElementById('docket-extractor-notification');

    if (!notification) {
      notification = document.createElement('div');
      notification.id = 'docket-extractor-notification';
      notification.className = 'docket-extractor-notification';
      document.body.appendChild(notification);
    }

    notification.textContent = message;
    notification.style.display = 'block';
  }

  /**
   * Hide notification
   */
  hideNotification() {
    const notification = document.getElementById('docket-extractor-notification');
    if (notification) {
      notification.style.display = 'none';
    }
  }
}

// Initialize extractor when page loads
const extractor = new DocketExtractor();
extractor.init();
