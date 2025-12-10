# Changelog

All notable changes to the Client Docket Manager Extractor will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-01-16

### Added
- Initial release of Client Docket Manager Extractor
- Manual element selection with click-to-select interface
- Auto-extraction using configurable site-specific rules
- Visual overlay and highlighting for selected elements
- Popup interface with Extract, Data, History, and Settings tabs
- Structured data export in JSON and CSV formats
- Comprehensive JSON schema for legal case data
- Extraction history with local storage (last 100 entries)
- LLM integration support for data parsing and interpretation
- Pre-configured for Ollama local LLM
- Support for external LLM APIs (OpenAI, etc.)
- Data validation utilities
- Example extraction rules template
- Sample court website extraction rules
- Detailed documentation and quick start guide
- Icon generator tool for easy setup
- Browser extension manifest v3 compliance

### Features
- Extract case/docket numbers, titles, and types
- Extract party information (plaintiffs, defendants, attorneys)
- Extract dates, deadlines, and events
- Extract document information and metadata
- Extract charges, statutes, and dispositions
- Extract bond and booking information
- Extract court and judge details
- Support for nested data structures
- CSS selector, XPath, and regex extraction methods
- Data transformation (uppercase, lowercase, date parsing, etc.)
- Copy to clipboard functionality
- Visual notification system
- Keyboard shortcuts (ESC to cancel selection)

### Developer Features
- Clean, modular code structure
- Vanilla JavaScript (no framework dependencies)
- Comprehensive inline documentation
- Example rule files for reference
- Data validation utilities
- Extensible architecture

### Documentation
- Comprehensive README with installation and usage instructions
- Quick Start Guide for new users
- Extraction rules documentation and examples
- Troubleshooting guide
- Privacy and security information
- Development documentation

### Known Limitations
- Extension requires manual icon creation before first use
- Auto-extraction requires site-specific rule configuration
- LLM processing requires local installation or API access
- History limited to 100 most recent extractions
- CSV export flattens nested structures

## [Unreleased]

### Planned Features
- Chrome Web Store publication
- Batch extraction for multiple cases
- OCR support for image-based documents
- Pre-built rules for common court websites (PACER, state courts)
- Data sync across devices
- Advanced data validation and error detection
- Custom field templates
- Export to additional formats (Excel, XML, PDF)
- Import existing extraction rules
- Rule testing and validation tools
- Extension settings backup/restore
- Dark mode UI
- Improved LLM prompt engineering
- Multi-language support
- Automated updates for extraction rules

### Future Considerations
- Firefox and Edge compatibility
- Mobile browser support
- Cloud storage integration
- Team collaboration features
- API for programmatic access
- Webhook integrations
- Custom database connectors
- Plugin system for extensions

---

For more information, see the [README](README.md) and [QUICK_START](QUICK_START.md) guides.
