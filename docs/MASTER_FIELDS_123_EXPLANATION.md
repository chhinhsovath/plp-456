# Master Fields 123 - Evaluation Criteria Management

## Purpose

The `/dashboard/observations/master-fields-123` page is an **administrative tool** for managing the evaluation criteria (indicators) used in Grade 1-2-3 observation forms.

## What It Does

### 1. **Define Evaluation Indicators**
- Sets up the questions/criteria that teachers are evaluated on
- Each indicator belongs to a specific level (LEVEL-1, LEVEL-2, etc.)
- Indicators are grouped by activities (e.g., "ខ្លឹមសារមេរៀន" - Lesson Content)

### 2. **Configure Assessment Structure**
- Defines which indicators apply to which grades (G1, G2, G3)
- Sets up subjects (MATH, KH - Khmer)
- Configures field types (radio buttons, text inputs)

### 3. **Test Evaluation System**
- Allows administrators to test the evaluation fields
- Preview how the indicators will appear in actual observation forms
- Validate the scoring system

## Data Structure

```json
{
  "masterFields": [
    {
      "id": 105,
      "order": 1,
      "subject": "MATH",
      "grade": "G1,G2,G3",
      "level": "LEVEL-1",
      "activity": "១. ខ្លឹមសារមេរៀន",
      "indicator": "គ្រូមិនទាន់យល់ច្បាស់ពីខ្លឹមសារមេរៀនកំពុងបង្រៀន",
      "field_type_one": "radio",
      "field_type_four": "text"
    }
  ],
  "evaluationData": {
    "field_105": "yes",  // Response to indicator 105
    "field_106": "no"    // Response to indicator 106
  }
}
```

## How It Works

1. **Load Master Fields**: Fetches all evaluation indicators from the database
2. **Display Form**: Shows indicators grouped by level with radio buttons (Yes/No/N/A)
3. **Test Evaluation**: Admin can fill out the form to test the evaluation system
4. **Statistics**: Shows real-time statistics of responses (how many Yes/No/N/A)

## Current Issue

The page is trying to submit to `/api/observations` which expects observation data with:
- `sessionInfo` (teacher, school, date, etc.)
- `evaluationData` 
- `studentAssessment`

But this page only has:
- `masterFields` (the indicator definitions)
- `evaluationData` (test responses)

## Solution

This page should either:
1. **Not submit data** - Just be a preview/testing tool
2. **Have its own API** - `/api/master-fields-123` for managing indicators
3. **Transform data** - Add mock sessionInfo if testing real observation submission

## Who Should Use This

- **System Administrators** - To configure evaluation criteria
- **Education Officers** - To review and test indicators
- **Developers** - To test the evaluation system

## Navigation

Access via: http://localhost:3002/dashboard/observations/master-fields-123

This is NOT meant for regular teachers or observers - it's an admin tool.