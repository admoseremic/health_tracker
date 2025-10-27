# Food Tracking & Calorie Estimation Requirements

## Overview
Add AI-powered food tracking that allows users to log meals via text description or photo upload, with automatic calorie estimation.

---

## 1. User Stories

### Primary User Story
**As a user**, I want to log what I ate by either describing it in text or uploading a photo, so that the app can automatically estimate and track my calorie intake.

### Secondary User Stories
- As a user, I want to see my daily calorie intake on a chart over time
- As a user, I want the food logging to be as quick and easy as possible
- As a user, I want to review what I ate alongside the calorie estimate

---

## 2. Input Methods

### 2.1 Text Input
- **Field Name:** "Food Description" or "What did you eat?"
- **Type:** Multi-line text area
- **Functionality:**
  - User describes food in natural language (e.g., "grilled chicken breast with brown rice and steamed broccoli")
  - AI analyzes text and estimates calories
  - User can be vague or detailed

### 2.2 Photo Upload
- **Field Name:** "Upload Photo" or "Take/Upload Picture"
- **Type:** File input (accept images)
- **Functionality:**
  - User uploads photo from device or camera
  - AI vision model analyzes image
  - AI estimates food items and calorie content
  - Store image reference (optional: show thumbnail in history)

### 2.3 Combined Approach
- User can use EITHER text OR photo OR BOTH
- At least one must be provided to log food
- If both provided, AI uses both for more accurate estimation

---

## 3. Database Schema Changes

### Current Structure (healthData collection)
```javascript
{
  date: "2025-01-15",
  weight: 180.5,
  waist: 32,
  systolic: 120,
  diastolic: 80,
  notes: "Feeling good",
  timestamp: Firestore.Timestamp
}
```

### Proposed New Fields

#### Option A: Add to existing healthData collection
**Pros:** Simple, keeps all daily health data together
**Cons:** Multiple meals per day becomes tricky (multiple documents per date)

```javascript
{
  date: "2025-01-15",
  weight: 180.5,
  waist: 32,
  // ... existing fields ...

  // NEW FIELDS:
  calories: 650,                    // Estimated calories (number)
  foodDescription: "grilled chicken...",  // User input or AI-generated (string)
  foodImageUrl: "gs://bucket/image.jpg",  // Optional (string)
  mealType: "lunch",                // Optional: breakfast/lunch/dinner/snack (string)
  calorieBreakdown: {               // Optional: detailed breakdown (object)
    protein: 45,
    carbs: 60,
    fat: 15
  }
}
```

#### Option B: Create separate foodLog collection
**Pros:** Supports multiple meals per day cleanly, cleaner separation of concerns
**Cons:** Need to query two collections for complete daily view

```javascript
// Collection: foodLog
{
  date: "2025-01-15",
  time: "12:30 PM",               // Time of meal
  timestamp: Firestore.Timestamp,
  calories: 650,
  foodDescription: "grilled chicken...",
  foodImageUrl: "gs://bucket/image.jpg",  // Optional
  mealType: "lunch",              // Optional
  aiConfidence: "high",           // Optional: low/medium/high
  calorieBreakdown: {
    protein: 45,
    carbs: 60,
    fat: 15
  }
}
```

### **RECOMMENDATION: Option B (separate foodLog collection)**
Reasons:
1. Supports multiple meals per day naturally
2. Cleaner data model
3. Easier to aggregate daily totals
4. Doesn't complicate existing health metrics

---

## 4. AI Integration

### 4.1 AI Service Options

#### Recommended: Anthropic Claude API
**Why Claude:**
- Excellent vision capabilities (can analyze food photos)
- Strong reasoning for text-based calorie estimation
- Can return structured JSON responses
- You're already using Claude Code!

**Alternative Options:**
- OpenAI GPT-4 Vision
- Google Gemini Vision
- Specialized nutrition APIs (Nutritionix, Edamam)

### 4.2 AI Processing Flow

#### For Text Input:
```
User Input: "Two eggs scrambled, whole wheat toast with butter, orange juice"
    ↓
Claude API Request
    ↓
Claude Response (JSON):
{
  "calories": 420,
  "confidence": "high",
  "breakdown": {
    "protein": 16,
    "carbs": 48,
    "fat": 18
  },
  "items": [
    {"item": "2 scrambled eggs", "calories": 180},
    {"item": "whole wheat toast with butter", "calories": 150},
    {"item": "orange juice (8oz)", "calories": 90}
  ],
  "description": "2 scrambled eggs, whole wheat toast with butter, orange juice (8oz)"
}
```

#### For Image Input:
```
User uploads photo
    ↓
Upload to Firebase Storage (get URL)
    ↓
Claude Vision API Request (with image)
    ↓
Claude Response (JSON):
{
  "calories": 650,
  "confidence": "medium",
  "breakdown": {...},
  "description": "Grilled chicken breast (~6oz), brown rice (~1 cup), steamed broccoli (~1 cup)",
  "note": "Portion sizes estimated from image"
}
```

### 4.3 API Implementation Location

**Option 1: Client-side API calls**
- Pros: Simpler, no backend needed
- Cons: API key exposed in browser (security risk)

**Option 2: Firebase Cloud Functions**
- Pros: Secure (API key hidden), can add validation/rate limiting
- Cons: More complex setup, costs for function invocations

**RECOMMENDATION: Firebase Cloud Functions**
- Keep API keys secure
- Can implement caching/rate limiting
- Can add preprocessing/validation

---

## 5. UI/UX Design

### 5.1 Form Updates

#### Add to Existing Modal
Update the "Add Measurement" modal to include food tracking section:

```
[Modal: Add Measurement]

Date: [Tue, Oct 27, 2025] (read-only)

Weight (lbs): [optional input]
Waist (inches): [optional input]
Blood Pressure: [optional inputs]

--- NEW SECTION ---
Food & Calories:

What did you eat?
[Text area: "Describe your meal or upload a photo"]

OR

[Photo Upload Button] Take/Upload Photo
[Thumbnail preview if photo selected]

[Estimate Calories Button] (triggers AI analysis)

Estimated Calories: [auto-filled by AI] (editable)
[Show breakdown if available]

Notes: [optional textarea]
---

[Save Measurement Button]
```

#### Alternative: Separate "Log Food" Button
Pros: Cleaner, dedicated food logging flow
Cons: Extra button, may fragment user experience

### 5.2 Chart Display

**Calories Chart Options:**

**Option A: Daily Total**
- Show total calories per day
- Simple line/bar chart
- Rolling 7-day average line

**Option B: Meal Breakdown**
- Stacked bar chart showing breakfast/lunch/dinner/snacks
- More detailed but complex

**Option C: Both**
- Toggle between views

**RECOMMENDATION: Start with Option A (Daily Total)**
- Simpler to implement
- Easier to understand
- Can add Option B later

### 5.3 Calories Card Display

The "Calories" metric card should show:
- **Value:** Today's total calories (or "No data")
- **Date:** Today's date (or last logged date)
- Example: "1,850 cal" / "Oct 27"

---

## 6. Technical Implementation Phases

### Phase 1: Basic Infrastructure (MVP)
- [ ] Create `foodLog` collection in Firestore
- [ ] Add food description textarea to modal
- [ ] Set up Firebase Cloud Function for AI calls
- [ ] Implement Claude API integration (text-only)
- [ ] Save calories to database
- [ ] Display daily total on calories card
- [ ] Create basic calories chart

### Phase 2: Image Upload
- [ ] Add Firebase Storage setup
- [ ] Add image upload UI component
- [ ] Update Cloud Function to handle images
- [ ] Implement Claude Vision API
- [ ] Store image URLs with food logs

### Phase 3: Enhanced Features
- [ ] Add meal type categorization
- [ ] Show calorie breakdown (protein/carbs/fat)
- [ ] Add food log history view
- [ ] Implement edit/delete food entries
- [ ] Add meal photos in history
- [ ] Weekly/monthly calorie summaries

### Phase 4: Polish
- [ ] Add calorie goals/targets
- [ ] Visual indicators (over/under goal)
- [ ] Export food log data
- [ ] Improve AI prompts for accuracy
- [ ] Add manual calorie override

---

## 7. Key Decisions Needed

### 7.1 Multiple Meals Per Day
**Question:** How should we handle logging multiple meals per day?

**Options:**
1. ✅ **Separate entries** - Each meal is a separate database entry, daily chart shows aggregate
2. ❌ Single entry per day - Append to existing day's data (complex)

**Recommendation:** Option 1

### 7.2 Calorie Editing
**Question:** Should users be able to edit AI-estimated calories?

**Options:**
1. ✅ **Yes, always editable** - Show AI estimate but allow manual override
2. ❌ AI-only - Trust AI completely

**Recommendation:** Option 1 - Users know their portions better

### 7.3 Image Storage
**Question:** Should we store uploaded food images?

**Options:**
1. ✅ **Yes, store in Firebase Storage** - Can review later, better UX
2. ❌ Process and discard - Saves storage costs

**Recommendation:** Option 1 - Storage is cheap, historical photos valuable

### 7.4 API Costs
**Question:** How to manage Claude API costs?

**Options:**
1. Free tier initially, monitor usage
2. Add rate limiting (e.g., 10 AI estimates per day)
3. Consider caching common foods
4. Allow manual entry as free alternative

**Recommendation:** Start with monitoring, add limits if needed

---

## 8. Success Criteria

### MVP Success (Phase 1)
- [ ] User can describe food in text
- [ ] AI returns calorie estimate within 5 seconds
- [ ] Calories saved to database correctly
- [ ] Daily calorie total displays on chart
- [ ] Food descriptions visible in history/notes

### Full Feature Success (Phase 2-3)
- [ ] User can upload food photos
- [ ] AI analyzes images accurately (±20% of actual calories)
- [ ] Multiple meals per day supported
- [ ] Complete food log history accessible
- [ ] Calorie trends visible over time

---

## 9. Estimated Effort

- **Phase 1 (MVP):** 4-6 hours
  - Firebase Cloud Function setup: 2 hours
  - UI updates: 1 hour
  - Claude API integration: 2 hours
  - Chart updates: 1 hour

- **Phase 2 (Images):** 3-4 hours
  - Firebase Storage setup: 1 hour
  - Image upload UI: 1 hour
  - Vision API integration: 2 hours

- **Phase 3 (Enhanced):** 6-8 hours
- **Phase 4 (Polish):** 4-6 hours

**Total for Full Implementation:** 17-24 hours

---

## 10. Open Questions

1. Should we track water intake too?
2. Should we add meal timing recommendations?
3. Should we integrate with fitness trackers (Apple Health, Google Fit)?
4. Should we add barcode scanning for packaged foods?
5. What's your daily calorie goal/target?
6. Do you want notifications/reminders to log meals?

---

## Next Steps

1. **Review this document** - Confirm approach and priorities
2. **API Setup** - Get Claude API key or choose AI provider
3. **Firebase Setup** - Enable Cloud Functions and Storage
4. **Start Phase 1** - Build MVP with text-based calorie tracking
5. **Test & Iterate** - Validate AI accuracy with real meals
6. **Expand** - Add image upload and enhanced features

---

## Notes

- Start simple (text-only MVP) and iterate based on usage
- AI calorie estimation is approximate - users should be able to override
- Consider adding disclaimer about estimation accuracy
- May want to add "Quick Add" for common meals (coffee, water, etc.)
