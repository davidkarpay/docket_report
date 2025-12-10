# Palm Beach Print View - Complete Data Analysis

**Case**: 50-2025-MM-006375-AXXX-MB (ROPER, ANTONIO BERNARD)
**Date Analyzed**: 2025-01-19
**Source**: print_view.pdf (5 pages)

---

## 📊 Section-by-Section Breakdown

### **Page 1 - Case Header**

**Data Found**:
```
Case #: 50-2025-MM-006375-AXXX-MB         Status: Open
Full Name: ROPER, ANTONIO BERNARD         Party Type: DEFENDANT
AKA: ROPER, ANTONIO B                     DOB: 09/18/1986
Division: DVTD: Dom Battery...            Booking #: 2025015876
DLNumber: R160002863380                   MJ #: 0559082
Citation #: (empty)
```

**Additional Fields** (not in previous case):
```
Judge: BURKE, LAUREN
Division: DVTD: Dom Battery & DVRV Inj Hearings - DVTD
State Attorney: LYLE, CHAD AVERY
Public Defender: KARPAY, DAVID
```

✅ **Action**: Add selectors for Judge, State Attorney, Public Defender

---

### **Page 1 - Court Events Section**

**Status**: ❌ EMPTY (no table shown in print view)

**Note**: The print view doesn't show the Court Events table, even though the web view had 3 events. This suggests Court Events might not render in print view, or this case doesn't have upcoming events.

---

### **Page 1 - Parties Table**

**Table Structure**: 14 columns

| Column | Field Name | Example Value |
|--------|------------|---------------|
| 1 | Full Name | ROPER, ANTONIO BERNARD |
| 2 | Party Type | DEFENDANT |
| 3 | Date of Birth | 09/18/1986 |
| 4 | Sex | M |
| 5 | Race | Black |
| 6 | AKA | ROPER, ANTONIO B |
| 7 | Height | 5'08" |
| 8 | Weight | 150 |
| 9 | Hair | BROWN |
| 10 | Eyes | BROWN |
| 11 | License # | FL-R160002863380 |
| 12 | DL Exp Date | (empty) |
| 13 | Deceased | (empty) |
| 14 | Sheriffs # | 0559082 |

**Rows Found**: 1 (defendant only, no other parties listed)

✅ **Action**: Update Parties selectors with correct column positions (td[1] through td[14])

---

### **Page 1 - Charges Table**

**Table Structure**: 12 columns

| Column | Field Name | Example Value |
|--------|------------|---------------|
| 1 | Count | 1 |
| 2 | Statute # | 784.03(1) |
| 3 | Description | BATTERY (DOMESTIC) |
| 4 | Disposition | (empty) |
| 5 | Disposition Date | 06/16/2025 |
| 6 | Sentence | (empty) |
| 7 | Offense Date | (empty) |
| 8 | Sentence Status | (empty) |
| 9 | Citation # | (empty) |
| 10 | Offense Level | MF |
| 11 | Plea | NOT GUILTY |
| 12 | Plea Date | 08/04/2025 |

**Rows Found**: 1 charge

✅ **Action**: Update Charges selectors with 12 columns (not 6 as originally estimated)

---

### **Pages 1-4 - Dockets Table**

**Table Structure**: 7 columns

| Column | Field Name | Example Values |
|--------|------------|----------------|
| 1 | Image | (checkbox/icon) |
| 2 | Docket # | 2, 3, 4, 6, 8, 9, 10... |
| 3 | Effective Date | 06/17/2025, 06/18/2025... |
| 4 | Count | 0, 1 |
| 5 | Description | DIVISION ASSIGNMENT, ARREST RECORD, BOND SET AT... |
| 6 | Docket Text | S: Felony - S (Circuit), 1,000.00, FAP - FIRST APPEARANCE... |
| 7 | Book | (empty) |
| 8 | Page | (empty) |

**Rows Found**: 121 docket entries (from docket #2 to #121)

**Key Entries**:
- Docket #18: BOND SET AT 1,000.00
- Docket #34: RELEASE AS TO THIS COUNTY ONLY - SURETY BOND
- Docket #53: INFORMATION FILED 784.03(1) BATTERY (DOMESTIC)
- Docket #60: NOT GUILTY PLEA

✅ **Action**: Dockets table has 8 columns, extract all rows as array

---

### **Page 4 - Linked Cases Table**

**Table Structure**: 4 columns

| Column | Field Name | Example Value |
|--------|------------|---------------|
| 1 | Case # | 50-2025-CF-004857-AXXX-MB |
| 2 | Case Description | ROPER, ANTONIO BERNARD |
| 3 | Offense Date | 06/16/2025 |
| 4 | Status | Closed |

**Rows Found**: 2 linked cases
1. 50-2025-CF-004857-AXXX-MB - Same defendant, Closed
2. 50-2025-DR-006624-XXXA-MB - NEEDHAM, CAMILLE, Closed

✅ **Action**: Extract as array with 4 columns

---

### **Page 5 - Sentences Table**

**Table Structure**: 8 columns

| Column | Field Name |
|--------|------------|
| 1 | Date |
| 2 | Count |
| 3 | Sentence |
| 4 | Confinement |
| 5 | Term |
| 6 | Credit Time |
| 7 | Conditions |
| 8 | Status |

**Rows Found**: ❌ EMPTY ("No records found")

✅ **Action**: Handle empty state, return empty array []

---

### **Page 5 - Warrants/Service Docs Table**

**Table Structure**: 6 columns

| Column | Field Name |
|--------|------------|
| 1 | Warrant/Document Type |
| 2 | Warrant #/Document ID |
| 3 | Issue Date |
| 4 | Last Action Date |
| 5 | Status/Return Reason |
| 6 | Last Action |

**Rows Found**: ❌ EMPTY ("No records found")

✅ **Action**: Handle empty state, return empty array []

---

### **Page 5 - Arrests & Bonds Section**

**Contains TWO separate tables**:

#### **Table 1: Arrests**

**Table Structure**: 5 columns

| Column | Field Name | Example Value |
|--------|------------|---------------|
| 1 | Arrest/Offense Date | 06/16/2025 |
| 2 | Arresting Agency | PBSO - PALM BEACH COUNTY SHERIFF OFFICE |
| 3 | Agency Number | 06 |
| 4 | Booking # | 2025015876 |
| 5 | Incident # | 0625071129 |

**Rows Found**: 1 arrest record

✅ **Action**: Extract arrest info with 5 columns

#### **Table 2: Bonds**

**Table Structure**: 10 columns

| Column | Field Name |
|--------|------------|
| 1 | Bond # |
| 2 | Type |
| 3 | Count |
| 4 | Bondsman |
| 5 | Depositor |
| 6 | Surety Company |
| 7 | Closed Date |
| 8 | Amount |
| 9 | Forfeiture Date |
| 10 | Effective Date |
| 11 | Status |

**Rows Found**: ❌ EMPTY ("No records found")

**Note**: Bond info exists in Dockets (docket #18: "BOND SET AT 1,000.00", docket #34: "RELEASE...SURETY BOND"), but not in Bonds table

✅ **Action**: Extract bond from Dockets if Bonds table empty

---

### **Page 5 - Fees Section**

**Contains THREE separate tables**:

#### **Table 1: Fee Items**

**Header**: `Total Balance + Interest: $50.00`

**Table Structure**: 8 columns

| Column | Field Name | Example Value |
|--------|------------|---------------|
| 1 | Effective Date | 06/17/2025 |
| 2 | Due Date | 06/17/2025 |
| 3 | Description | Indigent PD Application Fee PB |
| 4 | Amount Due | $50.00 |
| 5 | Amount Paid | $0.00 |
| 6 | Balance | $50.00 |
| 7 | In Collections | (empty) |
| 8 | In Judgment | (empty) |
| 9 | Judgment Interest | $0.00 |

**Rows Found**: 1 fee item + 1 total row

✅ **Action**: Extract total from header text, extract rows as array

#### **Table 2: Payment Plans**

**Table Structure**: 4 columns

| Column | Field Name |
|--------|------------|
| 1 | Plan |
| 2 | Plan # |
| 3 | Scheduled Pay Amount |
| 4 | Balance Due |
| 5 | Partial Payment |

**Rows Found**: ❌ EMPTY ("No records found")

✅ **Action**: Handle empty state

---

## 🔍 Key Discoveries

### **1. Empty Sections**
- **Court Events**: No table in print view (even though web view had data)
- **Sentences**: Empty table with "No records found"
- **Warrants**: Empty table with "No records found"
- **Bonds table**: Empty (but bond info exists in Dockets)
- **Payment Plans**: Empty table

### **2. Data in Dockets**
Important case information appears in Dockets entries:
- Bond amounts (docket #18, #34)
- Charge filings (docket #53)
- Pleas (docket #60)
- Judge assignments (docket #56, #63, etc.)

**Implication**: Dockets is the most comprehensive data source - extract all entries

### **3. New Fields Discovered**
Previously not in rules file:
- **Judge** (shown in header)
- **State Attorney** (shown in header)
- **Public Defender** (shown in header)
- **Parties table**: Sex, Race, Height, Weight, Hair, Eyes, DL Exp Date, Deceased
- **Charges**: Disposition Date, Offense Date, Sentence, Sentence Status, Citation #, Offense Level
- **Arrests**: Arresting Agency, Agency Number, Incident #

### **4. Column Count Differences**
Original estimates vs. actual:
- Parties: Estimated 4 columns → **Actually 14 columns**
- Charges: Estimated 6 columns → **Actually 12 columns**
- Dockets: Estimated 3 columns → **Actually 8 columns**

---

## 📋 Updated Field Inventory

### **Total Fields Identified**: 80+

**By Category**:
- Case Header: 14 fields (including new Judge, State Attorney, Public Defender)
- Parties: 14 fields per party
- Charges: 12 fields per charge
- Dockets: 8 fields per entry
- Linked Cases: 4 fields per case
- Arrests: 5 fields
- Fees: 9 fields per item + 1 total

---

## 🎯 Extraction Strategy

### **Priority 1: Always Extract**
- Case Header (14 fields)
- Charges (12 columns, all rows)
- Dockets (8 columns, all rows) - **Most comprehensive data source**
- Parties (14 columns, all rows)

### **Priority 2: Extract if Present**
- Linked Cases (4 columns)
- Arrests (5 columns)
- Fees (9 columns + total)

### **Priority 3: Handle Empty State**
- Court Events (might not appear in print view)
- Sentences ("No records found")
- Warrants ("No records found")
- Bonds table (extract from Dockets instead)

---

## 🔧 Implementation Notes

### **Handling "No records found"**

When a table shows "No records found":
```javascript
const rows = document.querySelectorAll('section#sentences table tbody tr');
if (rows.length === 1 && rows[0].textContent.includes('No records found')) {
  return [];
}
```

### **Extracting Totals from Headers**

Fees section has total in text above table:
```
Total Balance + Interest: $50.00
```

Regex to extract: `/Total Balance \+ Interest:\s*\$?([\d,]+\.\d{2})/`

### **Multiple Tables in One Section**

Arrests & Bonds has 2 tables:
- Table 1 heading: "Arrests & Bonds" (arrests data)
- Table 2 heading: "Arrests & Bonds" (bonds data)

Fees has 3 tables:
- Table 1 heading: "Fees" (fee items)
- Table 2 heading: "Fees" (payment plans)
- Table 3: Not shown in this case

Use nth-of-type selectors:
```xpath
//section[@id='arrests']//table[1]  // First table (arrests)
//section[@id='arrests']//table[2]  // Second table (bonds)
```

---

## ✅ Next Steps

1. ✅ Update rules file with exact column positions
2. ✅ Add new fields (Judge, State Attorney, Public Defender, extended Parties/Charges columns)
3. ✅ Add logic for empty table handling
4. ✅ Add multi-table extraction for Arrests & Fees
5. ✅ Document Court Events missing from print view
6. ⏳ Test extraction with updated rules
7. ⏳ Implement array extraction in extractor.js

---

_Analysis Complete: 2025-01-19_
_Case: 50-2025-MM-006375-AXXX-MB_
_Total Sections: 9 | Non-Empty: 6 | Empty: 3_
