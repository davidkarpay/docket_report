# Extraction Rules

This directory contains site-specific extraction rules for automatically extracting data from court websites.

## How It Works

When you visit a website, the extension automatically looks for a matching rules file (e.g., `pacer.gov.json` for PACER) and uses the defined rules to extract data.

## Creating Custom Rules

1. **Copy the template**: Start with `example.com.json` as a template
2. **Rename the file**: Use the website's domain name (e.g., `courtrecords.example.com.json`)
3. **Define extraction rules**: For each field you want to extract, specify how to find it

## Rule Format

```json
{
  "domain": "example.com",
  "description": "Site description",
  "version": "1.0",
  "fields": {
    "fieldName": {
      "selector": "CSS selector",
      "xpath": "XPath expression",
      "regex": "Regular expression pattern",
      "transform": "transformation to apply"
    }
  }
}
```

## Field Extraction Methods

The extractor tries each method in this order:

1. **CSS Selector** (`selector`): Standard CSS selector
   - Example: `"#case-number"`, `".defendant-name"`

2. **XPath** (`xpath`): XPath expression for more complex queries
   - Example: `"//table[@id='parties']//tr[1]/td[2]/text()"`

3. **Regex** (`regex`): Pattern to match against page text
   - Example: `"Case No[.:]?\\s*([A-Z0-9-]+)"`
   - The first capture group (in parentheses) is returned

## Available Transformations

- `uppercase`: Convert to uppercase
- `lowercase`: Convert to lowercase
- `trim`: Remove whitespace
- `parseDate`: Parse date to ISO format
- `parseNumber`: Extract numeric value

## Nested Fields

Use dot notation for nested data structures:

```json
"court.courtName": { ... },
"court.judgeName": { ... },
"bond.amount": { ... }
```

## Example Rules

### PACER (Federal Courts)

```json
{
  "domain": "pacer.uscourts.gov",
  "fields": {
    "docketNumber": {
      "xpath": "//table[@class='docket-header']//tr[1]/td[2]/text()"
    },
    "caseTitle": {
      "xpath": "//h2[@class='case-title']/text()"
    }
  }
}
```

### State Court Example

```json
{
  "domain": "statecourt.example.gov",
  "fields": {
    "docketNumber": {
      "regex": "Case\\s*#:\\s*([A-Z0-9-]+)"
    },
    "filingDate": {
      "selector": "#file-date",
      "transform": "parseDate"
    }
  }
}
```

## Tips

- Use your browser's Developer Tools (F12) to inspect elements and find selectors
- Test XPath expressions in the browser console: `$x("//your/xpath/here")`
- Test CSS selectors in the console: `document.querySelector("your-selector")`
- For complex cases, use regex to extract from surrounding text
- You can specify multiple methods - the first successful match is used

## Testing Rules

1. Create your rules file in this directory
2. Visit the target website
3. Click the extension icon
4. Click "Auto Extract" to test your rules
5. Check the Data tab to see what was extracted
6. Refine rules as needed

## Sharing Rules

If you create rules for public court websites, consider sharing them with the community!
