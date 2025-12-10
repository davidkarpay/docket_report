# Client Docket Manager Extractor

A powerful Chromium browser extension for extracting legal case data from court websites to build your client docket manager database.

## Features

- **🎯 Manual Element Selection**: Click-to-select interface for extracting any data from web pages
- **⚡ Auto-Extraction**: Configure rules for automatic data extraction from specific court websites
- **📊 Structured Data Export**: Export to JSON or CSV with predefined database schema
- **🤖 LLM Integration**: Optional local LLM processing for parsing complex or unstructured data
- **📝 Extraction History**: Keep track of all your data extractions
- **🎨 Visual Feedback**: Highlighted elements and intuitive UI
- **🔧 Customizable Rules**: Create site-specific extraction rules for automation

## What Can You Extract?

- Case/docket numbers and titles
- Party information (plaintiffs, defendants, attorneys)
- Dates and deadlines (filings, hearings, etc.)
- Document information
- Court and judge details
- Charges and statutes
- Bond information
- Booking and arrest details
- And more...

## Installation

### For Development

1. **Clone or download this repository**
   ```bash
   cd /path/to/Showcase_Scraper
   ```

2. **Load the extension in Chrome/Chromium**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right)
   - Click "Load unpacked"
   - Select the `/mnt/c/Showcase_Scraper` directory

3. **Verify installation**
   - You should see "Client Docket Manager Extractor" in your extensions
   - Click the extension icon to open the popup

### Icons

Note: This extension currently uses placeholder icons. To add custom icons:
- Create PNG images in the `icons/` directory
- Required sizes: 16x16, 48x48, and 128x128 pixels
- Name them: `icon16.png`, `icon48.png`, `icon128.png`

## Quick Start Guide

### Method 1: Auto-Extraction (with rules)

1. Create extraction rules for your target website (see `rules/README.md`)
2. Visit the court website
3. Click the extension icon
4. Click "Auto Extract"
5. View extracted data in the "Data" tab
6. Export as JSON or CSV

### Method 2: Manual Selection

1. Visit any court website
2. Click the extension icon
3. Click on a field button (e.g., "Docket Number")
4. Click the element on the page containing that data
5. Repeat for other fields
6. Export your data

### Method 3: Manual Selection Mode

1. Click "Manual Selection Mode"
2. Select field buttons as needed
3. Click corresponding elements on the page
4. Data is captured automatically

## Using LLM Integration

The extension supports local LLM processing to help parse and interpret complex data.

### Setup with Ollama (Recommended)

1. **Install Ollama**
   - Download from [ollama.ai](https://ollama.ai)
   - Install the application

2. **Start Ollama**
   ```bash
   ollama serve
   ```

3. **Pull a model** (if not already installed)
   ```bash
   ollama pull llama2
   ```

4. **Configure in Extension**
   - Go to Settings tab
   - Check "Enable LLM Processing"
   - Endpoint: `http://localhost:11434/api/generate`
   - Model: `llama2`
   - Click "Save Configuration"
   - Click "Test Connection" to verify

5. **Use LLM Processing**
   - Extract data using manual or auto methods
   - Click "Process with LLM" on the Extract tab
   - LLM will parse and structure the data

### Using Other LLM Providers

You can also use cloud-based LLMs:
- OpenAI API: `https://api.openai.com/v1/completions`
- Other OpenAI-compatible APIs

Remember to add your API key in the Settings tab.

## Creating Extraction Rules

Create custom rules for automatic extraction from specific websites:

1. Navigate to the `rules/` directory
2. Copy `example.com.json` as a template
3. Rename to match the domain (e.g., `pacer.gov.json`)
4. Define CSS selectors, XPath, or regex patterns for each field
5. See `rules/README.md` for detailed documentation

Example rule:
```json
{
  "domain": "courtwebsite.gov",
  "fields": {
    "docketNumber": {
      "selector": "#case-number",
      "transform": "uppercase"
    },
    "caseTitle": {
      "xpath": "//h1[@class='title']/text()",
      "transform": "trim"
    }
  }
}
```

## Data Schema

All extracted data follows a standardized JSON schema designed for legal case management. See `schemas/docket-schema.json` for the complete schema definition.

### Example Export

```json
{
  "version": "1.0",
  "exportDate": "2025-01-16T12:00:00Z",
  "cases": [
    {
      "docketNumber": "2025-CR-12345",
      "caseTitle": "State v. Defendant",
      "caseType": "criminal",
      "filingDate": "2025-01-01",
      "court": {
        "courtName": "Superior Court",
        "judgeName": "Hon. Jane Smith"
      },
      "parties": [...],
      "events": [...],
      "charges": [...],
      "extractionMetadata": {
        "extractedAt": "2025-01-16T12:00:00Z",
        "sourceUrl": "https://courtwebsite.gov/case/12345",
        "extractorVersion": "1.0.0"
      }
    }
  ]
}
```

## Usage Tips

- **Use Browser DevTools**: Inspect elements (F12) to find CSS selectors or XPath for custom rules
- **Test Selectors**: Use console commands like `document.querySelector()` to test selectors
- **Start Simple**: Begin with basic fields (case number, title) then add more complex data
- **Review Before Export**: Always check the Data preview before exporting
- **Save History**: The extension keeps your last 100 extractions for reference
- **LLM for Messy Data**: Use LLM processing when data is unstructured or poorly formatted

## Keyboard Shortcuts

- **ESC**: Cancel element selection mode

## Troubleshooting

### Extension doesn't load
- Ensure Developer mode is enabled in `chrome://extensions/`
- Check for errors in the Extensions page
- Try reloading the extension

### Auto-extraction doesn't work
- Check if rules file exists for the domain
- Verify rules file is valid JSON
- Check browser console for errors
- Try manual selection to verify selectors

### LLM processing fails
- Verify Ollama is running: `curl http://localhost:11434/api/tags`
- Check endpoint URL in Settings
- Try "Test Connection" in Settings tab
- Check browser console for error details

### Data not exporting
- Ensure data is extracted (check Data tab)
- Try copying to clipboard first
- Check browser's download settings
- Verify popup blockers aren't interfering

## Privacy & Security

- **Local Processing**: All data extraction happens locally in your browser
- **No Cloud Upload**: Data is never sent to external servers (unless you configure external LLM)
- **Storage**: Extraction history is stored locally in Chrome's storage
- **Permissions**: The extension requests minimal permissions needed for functionality

## Development

### Project Structure

```
Showcase_Scraper/
├── manifest.json              # Extension manifest
├── icons/                     # Extension icons
├── schemas/                   # JSON schemas
│   └── docket-schema.json     # Database schema definition
├── rules/                     # Extraction rules
│   ├── README.md              # Rules documentation
│   └── example.com.json       # Example rules template
├── src/
│   ├── background/
│   │   └── service-worker.js  # Background service worker
│   ├── content/
│   │   ├── extractor.js       # Content script for extraction
│   │   └── overlay.css        # Visual overlay styles
│   ├── popup/
│   │   ├── popup.html         # Popup UI
│   │   ├── popup.css          # Popup styles
│   │   └── popup.js           # Popup logic
│   └── utils/
│       └── validator.js       # Data validation utilities
└── README.md                  # This file
```

### Technologies Used

- **Manifest V3**: Latest Chrome extension standard
- **Vanilla JavaScript**: No framework dependencies
- **Chrome Extension APIs**: Storage, Tabs, Runtime, Scripting
- **CSS3**: Modern styling with animations
- **JSON Schema**: Data validation

## Contributing

Contributions are welcome! Areas for improvement:

- Additional extraction rules for public court websites
- UI/UX enhancements
- Additional export formats
- Improved LLM prompts
- Bug fixes and optimizations

## License

This project is provided as-is for personal and educational use.

## Support

For issues, questions, or feature requests, please check:
- The Troubleshooting section above
- Browser console for error messages
- `rules/README.md` for extraction rule help

## Roadmap

Future enhancements:
- [ ] Chrome Web Store publication
- [ ] Batch extraction for multiple cases
- [ ] OCR support for image-based court documents
- [ ] Pre-built rules for common court websites
- [ ] Data sync across devices
- [ ] Advanced data validation
- [ ] Custom field templates
- [ ] Export to additional formats (Excel, XML)

---

**Version**: 1.0.0
**Last Updated**: January 2025

Happy extracting! 🚀
