# Food Tracking Implementation Plan

## Recommended Approach

Based on the requirements, here's the recommended implementation plan:

---

## Architecture Decision Summary

### ✅ Database Structure: Separate `foodLog` Collection
- Supports multiple meals per day naturally
- Clean separation from health metrics
- Easy daily aggregation

### ✅ AI Service: Claude API via Firebase Cloud Functions
- Secure (API key not exposed)
- Supports both text and vision
- Can add rate limiting

### ✅ Image Storage: Firebase Storage
- Store food photos for history
- Reference by URL in database

### ✅ User Flow: Single Modal with Food Section
- Keep existing "Add Measurement" flow
- Add food logging section
- All metrics stay optional

---

## Phase 1: MVP (Text-Based Food Tracking)

### Prerequisites
1. **Claude API Key**
   - Sign up at console.anthropic.com
   - Get API key with Vision capabilities
   - Estimated cost: ~$0.01-0.05 per estimate

2. **Firebase Setup**
   - Enable Cloud Functions (Blaze plan required - pay-as-you-go)
   - Enable Firebase Storage (for later image upload)
   - Install Firebase CLI: `npm install -g firebase-tools`

### Step 1.1: Set Up Firebase Cloud Function

**File Structure:**
```
health_tracker/
├── functions/
│   ├── index.js           # Cloud function code
│   ├── package.json       # Dependencies
│   └── .env              # API keys (gitignored)
├── index.html
└── ...existing files
```

**Cloud Function: `estimateCalories`**
- Input: `{ foodDescription: string, imageUrl?: string }`
- Process: Call Claude API with appropriate prompt
- Output: `{ calories: number, description: string, breakdown: object, confidence: string }`

**Claude API Prompt Template:**
```
You are a nutrition expert. Analyze the following food description and provide a calorie estimate.

Food: {userInput}

Return your response in this exact JSON format:
{
  "calories": <number>,
  "confidence": "low" | "medium" | "high",
  "breakdown": {
    "protein": <grams>,
    "carbs": <grams>,
    "fat": <grams>
  },
  "description": "<normalized description with portion sizes>",
  "items": [
    {"item": "<food item>", "calories": <number>}
  ]
}

Be realistic with portion sizes. If unspecified, assume standard portions.
```

### Step 1.2: Update Database Schema

**New Collection: `foodLog`**
```javascript
// Example document structure
{
  userId: "user123",           // For future multi-user support
  date: "2025-10-27",          // Date string (YYYY-MM-DD)
  timestamp: Timestamp,        // Firestore server timestamp
  time: "12:30 PM",           // Time of meal (optional)

  // User input
  foodDescription: "chicken sandwich with fries",
  foodImageUrl: null,         // Phase 2

  // AI response
  calories: 750,
  aiDescription: "Chicken sandwich (grilled, ~6oz) with french fries (~4oz serving)",
  confidence: "medium",
  breakdown: {
    protein: 45,
    carbs: 70,
    fat: 25
  },

  // Metadata
  mealType: "lunch",          // Optional: breakfast/lunch/dinner/snack
  manuallyEdited: false       // Track if user overrode AI
}
```

### Step 1.3: Update UI (index.html)

**Add to Modal Form (after Blood Pressure, before Notes):**
```html
<div class="form-group">
    <label class="form-label">Food & Calories</label>
    <textarea class="form-textarea" id="food-input"
              placeholder="What did you eat? (e.g., 'grilled chicken with rice and vegetables')"></textarea>
</div>

<div class="form-group" id="calorie-estimate-group" style="display: none;">
    <label class="form-label">Estimated Calories</label>
    <div style="display: flex; gap: 8px; align-items: center;">
        <input type="number" class="form-input" id="calories-input"
               placeholder="Calories" min="0" max="5000">
        <span id="ai-confidence" style="font-size: 12px; color: #6b7280;"></span>
    </div>
    <div id="calorie-breakdown" style="font-size: 12px; color: #6b7280; margin-top: 4px;"></div>
</div>

<button type="button" class="estimate-button" id="estimate-calories-btn" style="display: none;">
    Estimate Calories with AI
</button>
```

**Add CSS:**
```css
.estimate-button {
    width: 100%;
    padding: 12px;
    background: #8b5cf6;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    margin-bottom: 16px;
}

.estimate-button:hover {
    background: #7c3aed;
}

.estimate-button:disabled {
    background: #9ca3af;
    cursor: not-allowed;
}
```

**JavaScript Changes:**
1. Show "Estimate Calories" button when food input has text
2. On button click, call Cloud Function
3. Display results in calorie input (editable)
4. On form submit, save to both `healthData` (aggregated) and `foodLog` (detailed)

### Step 1.4: Update Chart Logic

**Calorie Chart Rendering:**
```javascript
// In loadChartData(), add handling for calories metric
else if (state.currentMetric === 'calories') {
    // Query foodLog collection
    // Group by date
    // Sum calories per day
    // Render as line/bar chart
}
```

**Calories Card Display:**
```javascript
// In loadCaloriesDisplay()
async function loadCaloriesDisplay() {
    const today = new Date().toISOString().split('T')[0];

    const snapshot = await db.collection('foodLog')
        .where('date', '==', today)
        .get();

    let totalCalories = 0;
    snapshot.forEach(doc => {
        totalCalories += doc.data().calories || 0;
    });

    const displayValue = totalCalories > 0 ? `${totalCalories} cal` : 'No data';
    document.getElementById('calories-value').textContent = displayValue;
    document.getElementById('calories-date').textContent = 'Today';
}
```

---

## Phase 2: Add Image Upload

### Step 2.1: Enable Firebase Storage

**Firebase Console:**
1. Go to Storage section
2. Enable Cloud Storage
3. Set security rules:
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /food-images/{userId}/{imageId} {
      allow write: if request.auth != null;  // Authenticated users only
      allow read: if true;  // Public read for now
    }
  }
}
```

### Step 2.2: Add Image Upload UI

**Update Modal:**
```html
<div class="form-group">
    <label class="form-label">Food & Calories</label>

    <div class="food-input-tabs">
        <button class="tab-button active" data-tab="text">Describe</button>
        <button class="tab-button" data-tab="photo">Photo</button>
    </div>

    <div id="text-tab" class="tab-content active">
        <textarea class="form-textarea" id="food-input"
                  placeholder="What did you eat?"></textarea>
    </div>

    <div id="photo-tab" class="tab-content" style="display: none;">
        <input type="file" id="food-photo-input" accept="image/*" capture="environment" />
        <div id="photo-preview"></div>
    </div>
</div>
```

### Step 2.3: Update Cloud Function

**Add image processing:**
```javascript
// If imageUrl provided, use Claude Vision API
// If both text and image, combine insights
// Return same JSON structure
```

---

## Phase 3: Enhanced Features (Optional)

### 3.1 Food Log History View
- Add "View Food Log" button
- Show list of recent meals with photos
- Allow edit/delete

### 3.2 Meal Type Selector
- Add dropdown: Breakfast, Lunch, Dinner, Snack
- Use for categorization and insights

### 3.3 Calorie Goals
- Add "Daily Goal" setting
- Show progress bar on calories card
- Visual indicators on chart

---

## Deployment Steps

### Initial Setup (One-time)
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in project
cd health_tracker
firebase init functions
# Select: Firestore, Functions, Storage
# Choose JavaScript
# Install dependencies

# Set up environment variables
cd functions
firebase functions:config:set claude.api_key="YOUR_API_KEY"
```

### Deploy Cloud Function
```bash
firebase deploy --only functions
```

### Deploy Frontend
```bash
git add .
git commit -m "Add food tracking with AI calorie estimation"
git push
```

---

## Cost Estimates

### Claude API (Anthropic)
- **Text analysis:** ~$0.01 per estimate
- **Image analysis:** ~$0.03-0.05 per image
- **Monthly estimate (3 meals/day):** ~$3-5/month

### Firebase
- **Cloud Functions:** Free tier covers ~2M invocations/month
- **Storage:** Free tier covers 5GB
- **Blaze plan:** Pay-as-you-go (should be minimal)

### Total Expected Cost
- **Light usage:** <$5/month
- **Heavy usage:** $10-15/month

---

## Testing Plan

### Manual Tests
1. Enter simple food ("apple") - verify ~100 calories
2. Enter complex meal - verify breakdown
3. Enter vague description - verify AI makes assumptions
4. Edit AI estimate manually - verify saved correctly
5. Log multiple meals same day - verify aggregation
6. View calories chart - verify daily totals

### Edge Cases
- Empty food description
- Very unusual foods
- Extremely large portions
- API timeout/error handling
- Offline functionality

---

## Security Considerations

### API Key Protection
- ✅ Store in Cloud Functions environment
- ❌ Never expose in client-side code

### Rate Limiting
- Add max 20 estimates per day per user
- Track in Firestore counter

### Image Upload Security
- Validate file type (images only)
- Limit file size (max 5MB)
- Sanitize filenames

### Data Privacy
- User data stays in their Firebase project
- No data sent to third parties except Claude API
- Add privacy policy if sharing publicly

---

## Rollback Plan

If something goes wrong:
1. Revert frontend changes (git revert)
2. Remove Cloud Function: `firebase functions:delete estimateCalories`
3. Old functionality remains intact (weight/waist/BP)

---

## Success Metrics

After 1 week:
- [ ] Successfully log 10+ meals
- [ ] AI accuracy feels reasonable (±20%)
- [ ] No errors or crashes
- [ ] Chart displays correctly

After 1 month:
- [ ] Regular daily usage
- [ ] Useful calorie trends visible
- [ ] Decision: Expand to Phase 2 or adjust

---

## Next Actions

**Before starting implementation:**
1. ✅ Review requirements doc
2. ⬜ Confirm approach (separate collection vs. same collection)
3. ⬜ Get Claude API key
4. ⬜ Upgrade Firebase to Blaze plan
5. ⬜ Decide on MVP scope (text-only first or include images?)

**To kick off Phase 1:**
1. Set up Firebase Functions
2. Create `estimateCalories` Cloud Function
3. Update modal UI with food input
4. Test end-to-end flow
5. Deploy to production

---

## Questions for You

1. **Do you have a Claude API key already?**
2. **Is your Firebase project on the Blaze plan?** (required for Cloud Functions)
3. **Should we start with text-only MVP or go straight to image support?**
4. **Any specific dietary preferences/restrictions to account for?** (vegetarian, keto, etc.)
5. **Do you want to track meal timing** (breakfast/lunch/dinner) **or just daily totals?**

Let me know your answers and we can start building! 🚀
