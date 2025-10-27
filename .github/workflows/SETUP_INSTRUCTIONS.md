# GitHub Actions Setup Instructions

To enable auto-deployment, you need to add these secrets to your GitHub repository:

## Step 1: Get Firebase Token

Run this command locally:
```bash
firebase login:ci
```

This will give you a token. Copy it.

## Step 2: Get Firebase Service Account

1. Go to Firebase Console: https://console.firebase.google.com/
2. Select your project: "Health Tracker"
3. Click the gear icon → Project settings
4. Go to "Service accounts" tab
5. Click "Generate new private key"
6. Download the JSON file

## Step 3: Add Secrets to GitHub

1. Go to your GitHub repository: https://github.com/admoseremic/health_tracker
2. Click "Settings" → "Secrets and variables" → "Actions"
3. Click "New repository secret"

Add these two secrets:

### Secret 1: FIREBASE_TOKEN
- Name: `FIREBASE_TOKEN`
- Value: Paste the token from Step 1

### Secret 2: FIREBASE_SERVICE_ACCOUNT
- Name: `FIREBASE_SERVICE_ACCOUNT`
- Value: Paste the entire contents of the JSON file from Step 2

### Secret 3: CLAUDE_API_KEY (for Cloud Functions)
- Name: `CLAUDE_API_KEY`
- Value: Your Claude API key

## Step 4: Update Cloud Function to Use Environment Variable

The workflow will automatically set the Claude API key when deploying.

## Step 5: Push and Test

Once secrets are added, every push to `main` will automatically deploy:
- Frontend (Hosting)
- Cloud Functions

You can monitor deployments in the "Actions" tab of your GitHub repo.
