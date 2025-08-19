# Health Tracker

A mobile-optimized web application for tracking personal health metrics including weight, waist measurements, and blood pressure over time.

🌐 **Live App:** [health.trevorwithdata.com](https://health.trevorwithdata.com)

## Features

- 📊 **Interactive Charts** - View health trends over 90 days, 6 months, or 1 year
- 📱 **Mobile Optimized** - Responsive design that works great on phones and tablets
- 🔄 **Real-time Sync** - Data synced across devices via Firebase Firestore
- 📈 **Three Key Metrics**:
  - Weight tracking (lbs)
  - Waist measurements (inches) 
  - Blood pressure (systolic/diastolic)
- 📝 **Optional Notes** - Add context to your measurements
- 🎯 **Smart Defaults** - Shows weight chart by default (most tracked metric)

## Technology Stack

- **Frontend**: Vanilla HTML/CSS/JavaScript (no frameworks)
- **Database**: Firebase Firestore
- **Hosting**: Firebase Hosting
- **Deployment**: GitHub Actions (automatic on push to main)
- **Charts**: Custom SVG-based rendering with tooltips

## Project Structure

```
/
├── index.html              # Single-page application
├── import-data.js          # Data import script
├── package.json           # Dependencies for import script
├── firebase.json          # Firebase hosting configuration
├── .firebaserc           # Firebase project configuration
├── firestore.rules       # Database security rules
├── firestore.indexes.json # Database indexes
└── .github/workflows/
    └── firebase-hosting.yml # Auto-deployment workflow
```

## Development

### Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/admoseremic/health_tracker.git
   cd health_tracker
   ```

2. Serve locally:
   ```bash
   python3 -m http.server 8000
   # Visit http://localhost:8000
   ```

### Data Import

To import historical health data from CSV:

1. Install dependencies:
   ```bash
   npm install
   ```

2. Place your CSV file named `Health Data_rows.csv` in the project root

3. Run the import script:
   ```bash
   node import-data.js
   ```

**CSV Format Expected:**
```csv
id,date,weight,waist,systolic,diastolic,notes
1,2023-01-01 00:00:00+00,215.4,39,,,
2,2023-01-02 00:00:00+00,214.8,39.5,120,80,
```

### Deployment

Deployment is automatic via GitHub Actions:

1. Push to `main` branch
2. GitHub Actions builds and deploys to Firebase Hosting
3. Changes are live within 1-2 minutes

## Configuration

### Firebase Setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Firestore Database
3. Update `firebaseConfig` in `index.html` with your project details
4. Update `.firebaserc` with your project ID

### Custom Domain

To use a custom domain:

1. Add domain in Firebase Console → Hosting → Add custom domain
2. Configure DNS records as provided by Firebase
3. SSL certificate is automatically provisioned

### API Key Security

Restrict your Firebase API key in Google Cloud Console:

- **Application restrictions**: HTTP referrers (web sites)
- **Allowed referrers**: 
  - `https://yourdomain.com/*`
  - `https://your-project.firebaseapp.com/*`
  - `http://localhost:*`
- **API restrictions**: Cloud Firestore API only

## Data Model

Each health record is stored in Firestore with this structure:

```javascript
{
  date: "2025-01-15",           // ISO date string
  weight: 220.5,               // Number or null
  waist: 36.5,                 // Number or null  
  systolic: 120,               // Number or null
  diastolic: 80,               // Number or null
  notes: "Feeling great!",     // String or null
  timestamp: serverTimestamp() // Auto-generated
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally
5. Submit a pull request

## Security

- Firebase API key is public (intended for client-side apps)
- Security enforced through Firestore rules
- All data is user-specific (single-user app)
- HTTPS enforced on custom domain

## License

This project is open source and available under the [MIT License](LICENSE).

---

**Built with ❤️ using Firebase and vanilla web technologies**