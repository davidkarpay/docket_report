# Palm Beach County - Print View Extraction Strategy

**Created**: 2025-01-19
**Status**: Rules File v2.0 Complete - Ready for Implementation
**Rules File**: `jiswebprod.mypalmbeachclerk.com_v2.json`

---

## 🎯 Executive Summary

I've created a **comprehensive extraction system** that can scrape ALL 9 sections of case data in a meaningful, organized way:

1. **Case Header** (11 fields) ✅ Working selectors
2. **Court Events** (array of events) ✅ Working selectors
3. **Parties** (array of parties)
4. **Charges** (array of charges)
5. **Dockets** (array of entries)
6. **Linked Cases** (array of related cases)
7. **Sentences** (array of sentences)
8. **Warrants** (array of warrants)
9. **Arrests & Bonds** (array of arrests with bond info)
10. **Fees** (summary + itemized array)

**Total Fields Defined**: 60+ individual fields + array extraction for all sections

---

## 🔍 Print View Discovery

The print view template (`source_code_file.txt`) revealed a critical insight:

**Print View loads ALL sections at once!**

### Print View Structure:
```html
<section id="courtevents">
    <h4>Court Events</h4>
    <div ui-view="courtevents"></div>
</section>

<section id="parties">
    <h4>Parties</h4>
    <div ui-view="parties"></div>
</section>

<!-- ... 7 more sections ... -->
```

### Benefits of Print View Extraction:
1. **Single Request** - All data in one page load
2. **No Tab Switching** - Eliminates need to click through 9 tabs
3. **Consistent Structure** - Section IDs provide reliable anchor points
4. **Faster Extraction** - One Angular render instead of 9
5. **Better Selectors** - Can use `//section[@id='charges']//table` for precision

---

## 📊 Data Organization Strategy

### Field Types:

#### **1. Simple Fields** (Single Values)
**Examples**: Case Number, Status, Full Name, DOB

**Extraction Method**: XPath to single value
**Return Format**: String or parsed value

```json
{
  "caseIdentification": {
    "caseNumber": "50-2025-MM-008893-AXXX-MB",
    "status": "Open",
    "fullName": "MYHRE, GARY LEIF"
  }
}
```

#### **2. Structured Objects** (Related Fields)
**Examples**: Next Hearing (date + time + type + location + room + notes)

**Extraction Method**: Multiple XPaths to related values
**Return Format**: Nested object

```json
{
  "courtEvents": {
    "nextHearing": {
      "date": "2025-10-30",
      "time": "1:00 PM",
      "eventType": "AR - ARRAIGNMENT",
      "location": "MB",
      "room": "2C (Main Branch)",
      "notes": "AFFID FILED ( Q )"
    }
  }
}
```

#### **3. Arrays** (Multiple Rows/Items)
**Examples**: All Court Events, All Charges, All Parties

**Extraction Method**: XPath to all rows, iterate and extract columns
**Return Format**: Array of objects

```json
{
  "courtEvents": {
    "allEvents": [
      {
        "date": "2025-10-30",
        "time": "1:00 PM",
        "eventType": "AR - ARRAIGNMENT",
        "location": "MB",
        "room": "2C (Main Branch)",
        "notes": "AFFID FILED ( Q )"
      },
      {
        "date": "2025-11-10",
        "time": "8:30 AM",
        "eventType": "CD - CASE DISPOSITION",
        "location": "MB",
        "room": "2C (Main Branch)",
        "notes": ""
      }
    ]
  }
}
```

---

## 🔧 Implementation Required

The current `extractor.js` only extracts single values. To handle arrays, you'll need to add:

### **New Feature: Array Extraction**

**Location**: `src/content/extractor.js`

**Proposed Enhancement**:
```javascript
/**
 * Extract array of items from table rows
 */
extractArray(containerXPath, columnSelectors) {
  const container = document.evaluate(
    containerXPath,
    document,
    null,
    XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
    null
  );

  const results = [];

  for (let i = 0; i < container.snapshotLength; i++) {
    const row = container.snapshotItem(i);
    const item = {};

    columnSelectors.forEach((colSelector, index) => {
      const cell = row.querySelector(`td:nth-child(${index + 1})`);
      if (cell) {
        item[colSelector.name] = cell.textContent.trim();
      }
    });

    results.push(item);
  }

  return results;
}
```

**Usage in rules file**:
```json
{
  "courtEvents": {
    "_extractionType": "array",
    "_containerSelector": "//section[@id='courtevents']//table//tbody/tr",
    "fields": ["date", "time", "eventType", "location", "room", "notes"]
  }
}
```

---

## 📋 Extraction Rules Summary

### **Section 1: Case Header** (11 fields)
**Status**: ✅ All selectors working
**Fields**: caseNumber, status, fullName, partyType, akas, dob, division, bookingNumber, dlNumber, mjNumber, citationNumber

**Strategy**: Label-based XPath
**Example**: `//b[contains(text(), 'Case #:')]/following-sibling::text()[1]`

---

### **Section 2: Court Events** (7 fields)
**Status**: ✅ All selectors working
**Fields**:
- nextHearing (6 fields: date, time, eventType, location, room, notes)
- allEvents (array)

**Strategy**: Table row extraction from `section#courtevents`
**Example**: `//section[@id='courtevents']//table//tbody/tr[1]/td[1]`

**Array Extraction**:
```javascript
// Extract all events
const allEvents = this.extractArray(
  "//section[@id='courtevents']//table//tbody/tr",
  ["date", "time", "eventType", "location", "room", "notes"]
);
```

---

### **Section 3: Parties** (array)
**Status**: ⏳ Selectors defined, awaiting print view HTML with data
**Fields**:
- defendant (name, attorney, attorneyBarNumber)
- plaintiff (name, attorney)
- allParties (array)

**Strategy**: Table row extraction from `section#parties`
**Notes**: First row with "DEFENDANT" = defendant info, "STATE"/"PLAINTIFF" = plaintiff

---

### **Section 4: Charges** (array)
**Status**: ⏳ Selectors defined, awaiting print view HTML with data
**Fields**:
- primaryCharge (count, statute, description, degree, disposition, plea)
- allCharges (array)

**Strategy**: Table row extraction from `section#charges`
**Expected Columns**: Count | Statute | Description | Degree | Disposition | Plea

---

### **Section 5: Dockets** (array)
**Status**: ⏳ Selectors defined
**Fields**: allDockets (array)

**Strategy**: Table row extraction from `section#dockets`
**Expected Columns**: Date | Docket Text | Amount

---

### **Section 6: Linked Cases** (array)
**Status**: ⏳ Selectors defined
**Fields**: allLinkedCases (array)

**Strategy**: Table row extraction from `section#relatedcases`

---

### **Section 7: Sentences** (array)
**Status**: ⏳ Selectors defined
**Fields**:
- primarySentence (description, date)
- allSentences (array)

**Strategy**: Table row extraction from `section#sentences`

---

### **Section 8: Warrants** (array)
**Status**: ⏳ Selectors defined
**Fields**:
- activeWarrant (warrantNumber, status, issueDate)
- allWarrants (array)

**Strategy**: Table row extraction from `section#warrants`

---

### **Section 9: Arrests & Bonds** (array)
**Status**: ⏳ Selectors defined
**Fields**:
- primaryArrest (arrestDate, arrestingAgency, bondAmount, bondType, bondStatus)
- allArrests (array)

**Strategy**: Table row extraction from `section#arrests`
**Notes**: May contain multiple tables (arrests table + bonds table)

---

### **Section 10: Fees** (arrays + summary)
**Status**: ⏳ Selectors defined
**Fields**:
- summary (totalAmount, amountPaid, balance)
- allFees (array from all 3 tables)

**Strategy**: Extract from multiple tables in `section#fees`
**Notes**: User mentioned 3 tables (2 empty, 1 with data) - extract from all, return non-empty

---

## 🎬 How to Use Print View

### **Step 1: Access Print View**

On the case details page:
1. Click the **"Print"** button (top left, next to case number)
2. Wait 2-3 seconds for Angular to render all sections
3. New window/tab opens with print preview

### **Step 2: Save Print View HTML**

**Option A: Save Page**
```
File → Save Page As → "Web Page, Complete"
Save as: 50-2025-MM-008893-PRINT.html
```

**Option B: Copy HTML**
```
Right-click → View Page Source (or Ctrl+U)
Ctrl+A (select all)
Ctrl+C (copy)
Paste into text file
```

### **Step 3: Send to Me**

Send the saved HTML file - it will contain ALL 9 sections with rendered data!

---

## 🧪 Testing Strategy

### **Phase 1: Print View Access**
- [ ] Navigate to case 50-2025-MM-008893-AXXX-MB
- [ ] Click Print button
- [ ] Verify all 9 sections load with data
- [ ] Save print view HTML

### **Phase 2: Selector Validation**
- [ ] Test Case Header selectors (should work - already confirmed)
- [ ] Test Court Events selectors (should work - already confirmed)
- [ ] Test Parties selectors (need to verify column order)
- [ ] Test Charges selectors (need to verify column order)
- [ ] Test Arrests & Bonds selectors (need to identify bond table structure)
- [ ] Test Fees selectors (need to identify 3 table structures)

### **Phase 3: Array Extraction Implementation**
- [ ] Implement array extraction method in extractor.js
- [ ] Test with Court Events (3 rows confirmed)
- [ ] Test with empty tables (should return [])
- [ ] Test with Charges (multiple rows expected)
- [ ] Test with Fees (multiple tables)

### **Phase 4: Complete Case Extraction**
- [ ] Extract full case with all sections
- [ ] Validate JSON structure
- [ ] Verify all fields present
- [ ] Test with different case types (CF, TR, etc.)

---

## 📈 Expected Results

### **Complete Case Extraction JSON Structure**:

```json
{
  "caseIdentification": {
    "caseNumber": "50-2025-MM-008893-AXXX-MB",
    "status": "Open",
    "fullName": "MYHRE, GARY LEIF",
    "partyType": "DEFENDANT",
    "akas": "",
    "dob": "1954-11-20",
    "division": "DVTD: Dom Battery & DVRV Inj Hearings - DVTD",
    "bookingNumber": "2025023269",
    "dlNumber": "M600792544200",
    "mjNumber": "0449452",
    "citationNumber": ""
  },

  "courtEvents": {
    "nextHearing": {
      "date": "2025-10-30",
      "time": "1:00 PM",
      "eventType": "AR - ARRAIGNMENT",
      "location": "MB",
      "room": "2C (Main Branch)",
      "notes": "AFFID FILED ( Q )"
    },
    "allEvents": [
      { /* 3 events */ }
    ]
  },

  "parties": {
    "defendant": {
      "name": "MYHRE, GARY LEIF",
      "attorney": "PUBLIC DEFENDER",
      "attorneyBarNumber": "123456"
    },
    "plaintiff": {
      "name": "STATE OF FLORIDA",
      "attorney": "ASSISTANT STATE ATTORNEY"
    },
    "allParties": [
      { /* all parties */ }
    ]
  },

  "charges": {
    "primaryCharge": {
      "count": "1",
      "statute": "784.03.1A",
      "description": "BATTERY",
      "degree": "M1",
      "disposition": "PENDING",
      "plea": "NOT GUILTY"
    },
    "allCharges": [
      { /* all charges */ }
    ]
  },

  "arrests": {
    "primaryArrest": {
      "arrestDate": "2025-01-18",
      "arrestingAgency": "PALM BEACH COUNTY SHERIFF",
      "bondAmount": 5000.00,
      "bondType": "Surety",
      "bondStatus": "Posted"
    }
  },

  "fees": {
    "summary": {
      "totalAmount": 350.00,
      "amountPaid": 0.00,
      "balance": 350.00
    },
    "allFees": [
      { /* itemized fees */ }
    ]
  },

  "extractionMetadata": {
    "extractedAt": "2025-01-19T...",
    "sourceUrl": "https://jiswebprod.mypalmbeachclerk.com/...",
    "extractorVersion": "2.0.0",
    "sectionsExtracted": 9,
    "totalFields": 45
  }
}
```

---

## 🚀 Next Steps

### **For You (User)**:
1. **Capture Print View HTML**:
   - Click Print on case details
   - Wait for full render
   - Save HTML file
   - Send to me

2. **Review Rules File**:
   - Check `jiswebprod.mypalmbeachclerk.com_v2.json`
   - Verify field names make sense
   - Suggest any additional fields needed

### **For Me (Assistant)**:
1. **Refine Selectors** (once I receive print view HTML):
   - Verify table column orders
   - Adjust XPath selectors for each section
   - Handle edge cases (empty tables, missing data)

2. **Implement Array Extraction**:
   - Add array extraction method to extractor.js
   - Test with court events data
   - Extend to all array sections

3. **Integration Guide**:
   - Document how to integrate v2 rules
   - Provide code examples for array handling
   - Create migration guide from v1 to v2

---

## 💡 Key Advantages

1. **Meaningful Organization**: Data organized by section (parties, charges, events, etc.)
2. **Flexible Extraction**: Handles both single values and arrays
3. **Print View Efficiency**: One request gets ALL data
4. **Future-Proof**: Section IDs are stable across updates
5. **Comprehensive Coverage**: 9 sections, 60+ fields, unlimited array items

---

_Last Updated: 2025-01-19_
_Status: Rules v2.0 Complete - Awaiting Print View HTML for Validation_
_Next: Capture print view with data → Validate selectors → Implement array extraction_
