# Well-Being Tracker Mobile - Single Page Application Requirements

## Application Overview
A mobile-optimized health tracking application that allows users to monitor three key health metrics: weight, waist measurements, and blood pressure. Users can add measurements with optional notes and view historical data through interactive charts.

## Technical Requirements

### Architecture
- **Single HTML file**: `index.html` containing the entire application structure
- **Single JavaScript file**: `app.js` containing all application logic
- **Firebase Integration**: 
  - Firebase Hosting for deployment
  - Firebase Firestore for data persistence
  - Firebase configuration embedded in JavaScript

### Data Model

#### Firestore Collection: `healthData`
Document structure:
```javascript
{
  id: auto-generated,
  date: string (ISO format YYYY-MM-DD),
  weight: number | null,
  waist: number | null,
  systolic: number | null,
  diastolic: number | null,
  notes: string | null,
  timestamp: serverTimestamp()
}
```

### User Interface Components

#### 1. Main Dashboard
**Purpose**: Primary view showing latest measurements and charts

**Components**:
- **Metric Cards Grid** (3 columns):
  - Weight Card: Shows latest weight in lbs
  - Waist Card: Shows latest waist measurement in inches
  - Blood Pressure Card: Shows latest BP as systolic/diastolic mmHg
  - Each card displays:
    - Icon indicator
    - Metric title
    - Current value or "No data"
    - Date of last measurement
    - Click handler to switch active chart view
    - Visual indicator when selected (highlighted border/background)

- **Chart Display Area**:
  - Shows one chart at a time based on selected metric card
  - Time range selector: 90 Days, 6 Months, 1 Year
  - Line chart with:
    - X-axis: Date (formatted as Month Day)
    - Y-axis: Measurement value with appropriate units
    - Responsive sizing (400px height)
    - Data points connected with smooth lines
    - Tooltips showing exact value and date on hover
  - Blood Pressure chart specifics:
    - Two lines: systolic (blue) and diastolic (darker blue)
    - Y-axis range: 60-150 mmHg
    - Reference lines at healthy ranges (70, 90, 110, 130)
    - Green shaded areas for healthy ranges

- **Add Measurement Button**:
  - Centered below chart
  - Opens modal for data entry
  - Context-aware (pre-selects currently viewed metric type)

#### 2. Add Measurement Modal
**Purpose**: Single form for entering any combination of measurements

**Fields**:
- **Date Display**: Shows current date in readable format (e.g., "Mon, Jan 15, 2025")
  - Read-only field
  - Always defaults to today's date
  
- **Weight Input**:
  - Number input, decimal allowed (step 0.1)
  - Range: 0-500 lbs
  - Placeholder: "Enter weight (optional)"
  - Auto-focus when modal opens

- **Waist Input**:
  - Number input, decimal allowed (step 0.5)
  - Range: 0-100 inches
  - Placeholder: "Enter waist measurement (optional)"

- **Blood Pressure Inputs**:
  - Two side-by-side number inputs
  - Systolic: Range 60-240, placeholder "120"
  - Diastolic: Range 40-150, placeholder "80"
  - Visual separator "/" between fields
  - Both must be filled or both empty (validation rule)

- **Notes Field**:
  - Multi-line text area
  - Placeholder: "Add any relevant details..."
  - Optional field

- **Save Button**:
  - Full width at bottom
  - Validates at least one measurement entered
  - Shows "Saving..." state during submission
  - Closes modal and refreshes data on success

#### 3. Data Display Rules

**Latest Measurements**:
- Query most recent document with non-null value for each metric type
- Each metric can have different "latest" dates
- Display "No data" if no measurements exist

**Chart Data**:
- Fetch all documents within selected time range
- Filter documents by metric type (exclude nulls)
- Sort by date ascending for chronological display
- Handle sparse data gracefully (connect available points)

**Time Calculations**:
- 90 Days: Current date minus 90 days
- 6 Months: Current date minus 180 days  
- 1 Year: Current date minus 365 days

### Firebase Configuration

#### Firestore Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /healthData/{document} {
      allow read, write: if true; // Simplified for single-user app
    }
  }
}
```

#### Required Firebase Services
- Firebase Core
- Firebase Firestore
- Firebase Hosting

### User Interactions

#### Adding Measurements
1. User clicks "Add New Measurement" button
2. Modal opens with today's date pre-filled
3. User enters one or more measurements
4. User optionally adds notes
5. User clicks Save
6. System validates input (at least one measurement, BP validation)
7. System saves to Firestore
8. Modal closes
9. Dashboard refreshes to show new data

#### Viewing Historical Data
1. User clicks on a metric card to select it
2. Chart updates to show selected metric
3. User can change time range using tab selector
4. Chart reloads with new date range
5. User can hover/tap data points for details

### Validation Rules

1. **Date**: Always today (no user modification in v1)
2. **Weight**: Optional, 0-500, decimals allowed
3. **Waist**: Optional, 0-100, decimals allowed
4. **Blood Pressure**: Both values or neither, systolic > diastolic
5. **At least one measurement**: Cannot save empty form
6. **Notes**: Optional, text only

### Error Handling

1. **Save Failures**: Display error message, keep form open for retry
2. **Load Failures**: Show "Unable to load data" message with retry option
3. **Invalid Input**: Inline validation messages, prevent form submission

### Mobile Optimizations

1. **Touch-friendly**: Minimum 44px touch targets
2. **Responsive Layout**: Stack cards vertically on narrow screens
3. **Input Types**: Use appropriate keyboard types (numeric for numbers)
4. **Viewport**: Set proper viewport meta tag for mobile scaling
5. **Performance**: Minimize chart re-renders, debounce user inputs

### Visual Design Guidelines

1. **Color Scheme**:
   - Primary: Blue (#0891b2)
   - Success: Green (#22c55e)
   - Background: White (#ffffff)
   - Text: Dark gray (#1f2937)
   - Muted: Light gray (#9ca3af)

2. **Typography**:
   - Use system fonts for performance
   - Clear hierarchy with size and weight
   - Minimum 14px for body text

3. **Spacing**:
   - Consistent padding/margins
   - Adequate whitespace between elements
   - Proper alignment of form fields

4. **Feedback**:
   - Loading states for all async operations
   - Success/error messages for user actions
   - Active states for interactive elements

### Implementation Notes

1. **No Framework**: Use vanilla JavaScript with modern ES6+ features
2. **No Build Process**: Direct browser-compatible code only
3. **Inline Styles**: Use style tags in HTML or inline styles
4. **Event Delegation**: Attach events to parent elements where possible
5. **State Management**: Simple object to track current view state
6. **Date Handling**: Use native JavaScript Date objects
7. **Chart Library**: Implement simple SVG-based charts or use lightweight library via CDN
8. **Modal**: CSS-based overlay with JavaScript show/hide logic

### Deployment via GitHub Actions

#### Repository Structure
```
/
├── index.html          # Single page application
├── .github/
│   └── workflows/
│       └── firebase-hosting.yml
├── firebase.json       # Firebase hosting configuration
└── .firebaserc        # Firebase project configuration
```

#### GitHub Actions Workflow
```yaml
name: Deploy to Firebase Hosting on merge
on:
  push:
    branches:
      - main
jobs:
  build_and_deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: live
          projectId: your-project-id
```

#### Setup Steps
1. Create Firebase project
2. Initialize Firebase Hosting locally
3. Set up GitHub repository
4. Add Firebase service account as GitHub secret
5. Push code to trigger automatic deployment