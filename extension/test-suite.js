#!/usr/bin/env node

/**
 * Comprehensive Test Suite for Client Docket Manager Extractor
 * Tests all components that can be validated without browser
 */

const fs = require('fs');
const path = require('path');

// Test results tracking
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const results = [];

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function test(description, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    log(`✓ ${description}`, 'green');
    results.push({ test: description, status: 'PASS', error: null });
    return true;
  } catch (error) {
    failedTests++;
    log(`✗ ${description}`, 'red');
    log(`  Error: ${error.message}`, 'red');
    results.push({ test: description, status: 'FAIL', error: error.message });
    return false;
  }
}

function section(title) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(title, 'bright');
  log('='.repeat(60), 'cyan');
}

function fileExists(filepath) {
  if (!fs.existsSync(filepath)) {
    throw new Error(`File not found: ${filepath}`);
  }
}

function isValidJSON(filepath) {
  const content = fs.readFileSync(filepath, 'utf8');
  try {
    JSON.parse(content);
  } catch (e) {
    throw new Error(`Invalid JSON: ${e.message}`);
  }
}

function isValidJS(filepath) {
  // Basic syntax check by requiring/reading the file
  const content = fs.readFileSync(filepath, 'utf8');

  // Check for basic syntax issues
  if (content.includes('<<<<<<') || content.includes('>>>>>>')) {
    throw new Error('Contains merge conflict markers');
  }

  // Count brackets
  const openBraces = (content.match(/{/g) || []).length;
  const closeBraces = (content.match(/}/g) || []).length;
  if (openBraces !== closeBraces) {
    throw new Error(`Mismatched braces: ${openBraces} open, ${closeBraces} close`);
  }
}

// ===== FILE STRUCTURE TESTS =====
section('Test Suite 1: File Structure');

test('manifest.json exists', () => fileExists('manifest.json'));
test('package.json exists', () => fileExists('package.json'));
test('README.md exists', () => fileExists('README.md'));
test('QUICK_START.md exists', () => fileExists('QUICK_START.md'));

test('Icons directory exists', () => fileExists('icons'));
test('icon16.png exists', () => fileExists('icons/icon16.png'));
test('icon48.png exists', () => fileExists('icons/icon48.png'));
test('icon128.png exists', () => fileExists('icons/icon128.png'));

test('Source directory structure exists', () => {
  fileExists('src');
  fileExists('src/background');
  fileExists('src/content');
  fileExists('src/popup');
  fileExists('src/utils');
});

test('All JavaScript files exist', () => {
  fileExists('src/background/service-worker.js');
  fileExists('src/content/extractor.js');
  fileExists('src/popup/popup.js');
  fileExists('src/utils/validator.js');
});

test('All HTML/CSS files exist', () => {
  fileExists('src/popup/popup.html');
  fileExists('src/popup/popup.css');
  fileExists('src/content/overlay.css');
});

test('Schema files exist', () => {
  fileExists('schemas');
  fileExists('schemas/docket-schema.json');
});

test('Rules directory exists with examples', () => {
  fileExists('rules');
  fileExists('rules/README.md');
  fileExists('rules/example.com.json');
  fileExists('rules/localhost.json');
});

test('Test assets exist', () => {
  fileExists('test-page.html');
});

// ===== JSON VALIDATION TESTS =====
section('Test Suite 2: JSON Validation');

test('manifest.json is valid JSON', () => isValidJSON('manifest.json'));
test('package.json is valid JSON', () => isValidJSON('package.json'));
test('docket-schema.json is valid JSON', () => isValidJSON('schemas/docket-schema.json'));
test('example.com.json is valid JSON', () => isValidJSON('rules/example.com.json'));
test('localhost.json is valid JSON', () => isValidJSON('rules/localhost.json'));
test('sample-court.example.gov.json is valid JSON', () => isValidJSON('rules/sample-court.example.gov.json'));

// ===== MANIFEST VALIDATION =====
section('Test Suite 3: Manifest Validation');

test('Manifest has correct version', () => {
  const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
  if (manifest.manifest_version !== 3) {
    throw new Error(`Expected manifest_version 3, got ${manifest.manifest_version}`);
  }
});

test('Manifest has required fields', () => {
  const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
  const required = ['name', 'version', 'description', 'permissions', 'action'];
  required.forEach(field => {
    if (!manifest[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  });
});

test('Manifest has background service worker', () => {
  const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
  if (!manifest.background || !manifest.background.service_worker) {
    throw new Error('Missing background service worker configuration');
  }
  fileExists(manifest.background.service_worker);
});

test('Manifest has content scripts', () => {
  const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
  if (!manifest.content_scripts || manifest.content_scripts.length === 0) {
    throw new Error('No content scripts defined');
  }
});

test('Manifest has action popup', () => {
  const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
  if (!manifest.action || !manifest.action.default_popup) {
    throw new Error('Missing action popup');
  }
  fileExists(manifest.action.default_popup);
});

test('Manifest icons exist', () => {
  const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
  if (!manifest.icons) {
    throw new Error('No icons defined');
  }
  Object.values(manifest.icons).forEach(iconPath => {
    fileExists(iconPath);
  });
});

// ===== JAVASCRIPT VALIDATION =====
section('Test Suite 4: JavaScript Code Validation');

test('service-worker.js has valid syntax', () => isValidJS('src/background/service-worker.js'));
test('extractor.js has valid syntax', () => isValidJS('src/content/extractor.js'));
test('popup.js has valid syntax', () => isValidJS('src/popup/popup.js'));
test('validator.js has valid syntax', () => isValidJS('src/utils/validator.js'));

test('service-worker.js has BackgroundService class', () => {
  const content = fs.readFileSync('src/background/service-worker.js', 'utf8');
  if (!content.includes('class BackgroundService')) {
    throw new Error('BackgroundService class not found');
  }
});

test('extractor.js has DocketExtractor class', () => {
  const content = fs.readFileSync('src/content/extractor.js', 'utf8');
  if (!content.includes('class DocketExtractor')) {
    throw new Error('DocketExtractor class not found');
  }
});

test('popup.js has PopupController class', () => {
  const content = fs.readFileSync('src/popup/popup.js', 'utf8');
  if (!content.includes('class PopupController')) {
    throw new Error('PopupController class not found');
  }
});

// ===== SCHEMA VALIDATION =====
section('Test Suite 5: Database Schema Validation');

test('Schema has Case definition', () => {
  const schema = JSON.parse(fs.readFileSync('schemas/docket-schema.json', 'utf8'));
  if (!schema.definitions || !schema.definitions.Case) {
    throw new Error('Case definition not found in schema');
  }
});

test('Schema has all entity definitions', () => {
  const schema = JSON.parse(fs.readFileSync('schemas/docket-schema.json', 'utf8'));
  const required = ['Case', 'Party', 'Event', 'Document', 'Charge', 'Bond', 'Court', 'ExtractionMetadata'];
  required.forEach(entity => {
    if (!schema.definitions[entity]) {
      throw new Error(`Missing entity definition: ${entity}`);
    }
  });
});

test('Schema Case has required fields', () => {
  const schema = JSON.parse(fs.readFileSync('schemas/docket-schema.json', 'utf8'));
  const caseSchema = schema.definitions.Case;
  if (!caseSchema.required || !caseSchema.required.includes('docketNumber')) {
    throw new Error('Case schema missing required docketNumber field');
  }
});

// ===== EXTRACTION RULES VALIDATION =====
section('Test Suite 6: Extraction Rules Validation');

test('Example rules have correct structure', () => {
  const rules = JSON.parse(fs.readFileSync('rules/example.com.json', 'utf8'));
  if (!rules.domain || !rules.fields) {
    throw new Error('Rules missing domain or fields');
  }
});

test('Localhost rules configured for test page', () => {
  const rules = JSON.parse(fs.readFileSync('rules/localhost.json', 'utf8'));
  if (rules.domain !== 'localhost') {
    throw new Error('Localhost rules domain mismatch');
  }
  if (!rules.fields.docketNumber) {
    throw new Error('Localhost rules missing docketNumber field');
  }
});

test('Sample court rules have comprehensive fields', () => {
  const rules = JSON.parse(fs.readFileSync('rules/sample-court.example.gov.json', 'utf8'));
  const requiredFields = ['docketNumber', 'caseTitle', 'filingDate'];
  requiredFields.forEach(field => {
    if (!rules.fields[field]) {
      throw new Error(`Sample rules missing field: ${field}`);
    }
  });
});

// ===== HTML/CSS VALIDATION =====
section('Test Suite 7: HTML and CSS Validation');

test('popup.html is valid HTML', () => {
  const content = fs.readFileSync('src/popup/popup.html', 'utf8');
  if (!content.includes('<!DOCTYPE html>')) {
    throw new Error('Missing DOCTYPE declaration');
  }
  if (!content.includes('<html')) {
    throw new Error('Missing html tag');
  }
});

test('popup.html links to CSS and JS', () => {
  const content = fs.readFileSync('src/popup/popup.html', 'utf8');
  if (!content.includes('popup.css')) {
    throw new Error('popup.css not linked');
  }
  if (!content.includes('popup.js')) {
    throw new Error('popup.js not linked');
  }
});

test('popup.html has all required tabs', () => {
  const content = fs.readFileSync('src/popup/popup.html', 'utf8');
  const tabs = ['extract', 'data', 'history', 'settings'];
  tabs.forEach(tab => {
    if (!content.includes(`data-tab="${tab}"`)) {
      throw new Error(`Missing tab: ${tab}`);
    }
  });
});

test('popup.css has required styles', () => {
  const content = fs.readFileSync('src/popup/popup.css', 'utf8');
  const requiredClasses = ['.container', '.tab-button', '.btn-primary', '.section'];
  requiredClasses.forEach(className => {
    if (!content.includes(className)) {
      throw new Error(`Missing CSS class: ${className}`);
    }
  });
});

test('overlay.css has highlight styles', () => {
  const content = fs.readFileSync('src/content/overlay.css', 'utf8');
  if (!content.includes('.docket-extractor-highlight')) {
    throw new Error('Missing highlight style');
  }
});

// ===== TEST PAGE VALIDATION =====
section('Test Suite 8: Test Page Validation');

test('test-page.html has case data', () => {
  const content = fs.readFileSync('test-page.html', 'utf8');
  if (!content.includes('CR-2025-12345')) {
    throw new Error('Missing case number');
  }
  if (!content.includes('State of Example v. John Doe')) {
    throw new Error('Missing case title');
  }
});

test('test-page.html matches localhost rules', () => {
  const rules = JSON.parse(fs.readFileSync('rules/localhost.json', 'utf8'));
  const htmlContent = fs.readFileSync('test-page.html', 'utf8');

  // Check if selectors from rules exist in HTML
  if (rules.fields.docketNumber.selector) {
    const selector = rules.fields.docketNumber.selector;
    const id = selector.replace('#', '');
    if (!htmlContent.includes(`id="${id}"`)) {
      throw new Error(`Selector ${selector} not found in test page`);
    }
  }
});

// ===== DOCUMENTATION VALIDATION =====
section('Test Suite 9: Documentation Validation');

test('README.md has installation instructions', () => {
  const content = fs.readFileSync('README.md', 'utf8');
  if (!content.includes('Installation') && !content.includes('installation')) {
    throw new Error('Missing installation instructions');
  }
});

test('README.md documents all features', () => {
  const content = fs.readFileSync('README.md', 'utf8');
  const features = ['manual', 'auto', 'export', 'LLM'];
  features.forEach(feature => {
    if (!content.toLowerCase().includes(feature.toLowerCase())) {
      throw new Error(`Feature not documented: ${feature}`);
    }
  });
});

test('QUICK_START.md exists and has steps', () => {
  const content = fs.readFileSync('QUICK_START.md', 'utf8');
  if (!content.includes('Step') && !content.includes('step')) {
    throw new Error('Quick start guide missing steps');
  }
});

test('rules/README.md has examples', () => {
  const content = fs.readFileSync('rules/README.md', 'utf8');
  if (!content.includes('example') || !content.includes('Example')) {
    throw new Error('Rules README missing examples');
  }
});

// ===== ICON VALIDATION =====
section('Test Suite 10: Icon File Validation');

test('icon16.png is valid size', () => {
  const stats = fs.statSync('icons/icon16.png');
  if (stats.size === 0) {
    throw new Error('icon16.png is empty');
  }
  if (stats.size > 10000) {
    throw new Error('icon16.png is too large (should be ~180 bytes)');
  }
});

test('icon48.png is valid size', () => {
  const stats = fs.statSync('icons/icon48.png');
  if (stats.size === 0) {
    throw new Error('icon48.png is empty');
  }
  if (stats.size > 50000) {
    throw new Error('icon48.png is too large');
  }
});

test('icon128.png is valid size', () => {
  const stats = fs.statSync('icons/icon128.png');
  if (stats.size === 0) {
    throw new Error('icon128.png is empty');
  }
  if (stats.size > 100000) {
    throw new Error('icon128.png is too large');
  }
});

// ===== INTEGRATION CHECKS =====
section('Test Suite 11: Integration Checks');

test('Content script paths match manifest', () => {
  const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
  manifest.content_scripts.forEach(script => {
    script.js.forEach(jsFile => fileExists(jsFile));
    script.css.forEach(cssFile => fileExists(cssFile));
  });
});

test('Background script path matches manifest', () => {
  const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
  fileExists(manifest.background.service_worker);
});

test('Popup files match manifest', () => {
  const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
  fileExists(manifest.action.default_popup);
});

// ===== FINAL RESULTS =====
section('Test Results Summary');

log(`\nTotal Tests: ${totalTests}`, 'bright');
log(`Passed: ${passedTests}`, 'green');
log(`Failed: ${failedTests}`, failedTests > 0 ? 'red' : 'green');

const percentage = ((passedTests / totalTests) * 100).toFixed(1);
log(`\nSuccess Rate: ${percentage}%`, percentage === '100.0' ? 'green' : 'yellow');

if (failedTests === 0) {
  log('\n✓ ALL TESTS PASSED!', 'green');
  log('Extension is ready for browser testing.', 'green');
} else {
  log(`\n✗ ${failedTests} test(s) failed.`, 'red');
  log('Please fix the issues above before loading the extension.', 'red');
}

// Save results to file
const report = {
  timestamp: new Date().toISOString(),
  totalTests,
  passedTests,
  failedTests,
  successRate: percentage + '%',
  results
};

fs.writeFileSync('test-results.json', JSON.stringify(report, null, 2));
log('\nDetailed results saved to: test-results.json', 'cyan');

// Exit with appropriate code
process.exit(failedTests > 0 ? 1 : 0);
