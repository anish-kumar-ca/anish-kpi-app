# 🚀 Anish KPI App — Setup Guide

Your synced KPI tracker app is ready to deploy! Follow these steps to get it running with real-time sync across your devices.

**Total setup time: ~20 minutes**
**Cost: $0 forever**

---

## Step 1: Create a Firebase Project (5 min)

Firebase will store your data in the cloud and sync it across all your devices instantly.

### 1.1 Go to Firebase Console
- Visit **[console.firebase.google.com](https://console.firebase.google.com)**
- Sign in with your Google account (use the one from anish.kumar.ca.92@gmail.com or any Google account)

### 1.2 Create a New Project
- Click **"Add project"** (blue button)
- **Project name:** `anish-kpi` (or whatever you prefer)
- Click **"Continue"**
- Uncheck "Enable Google Analytics" (not needed)
- Click **"Create project"**
- Wait for it to complete (~30 seconds)

### 1.3 Set Up Realtime Database
- In the left sidebar, click **"Build"** → **"Realtime Database"**
- Click **"Create Database"**
- **Location:** Choose your region (Canada: `us-central1` is fine)
- **Security rules:** Select **"Start in test mode"**
- Click **"Enable"**
- You now have a live database! ✅

### 1.4 Enable Google Sign-In
- In the left sidebar, click **"Build"** → **"Authentication"**
- Click **"Get started"**
- Click **"Google"** (the second provider listed)
- Toggle **"Enable"** to ON
- **Project support email:** Your email (auto-filled)
- Click **"Save"**

### 1.5 Get Your Firebase Config
- Go to **Settings** (⚙️ icon in top left) → **Project Settings**
- Scroll down to **"Your apps"** section
- Click the **"</>"** (Web) button if no app exists
- Fill in **App nickname:** `anish-kpi-web`
- Check "Also set up Firebase Hosting"
- Click **"Register app"**
- Copy the config object shown (the `const firebaseConfig = {...}` part)

---

## Step 2: Update Firebase Config in Your App (2 min)

### 2.1 Edit `src/firebase.js`
- Open the file `src/firebase.js` in a text editor
- Replace this:
```javascript
const firebaseConfig = {
  apiKey: "REPLACE_WITH_YOUR_API_KEY",
  authDomain: "REPLACE_WITH_YOUR_PROJECT_ID.firebaseapp.com",
  databaseURL: "https://REPLACE_WITH_YOUR_PROJECT_ID.firebaseio.com",
  projectId: "REPLACE_WITH_YOUR_PROJECT_ID",
  storageBucket: "REPLACE_WITH_YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "REPLACE_WITH_YOUR_SENDER_ID",
  appId: "REPLACE_WITH_YOUR_APP_ID",
};
```

- With the actual config from your Firebase Console (from Step 1.5)
- It will look something like:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyDxX...",
  authDomain: "anish-kpi.firebaseapp.com",
  databaseURL: "https://anish-kpi.firebaseio.com",
  projectId: "anish-kpi",
  storageBucket: "anish-kpi.appspot.com",
  messagingSenderId: "123456...",
  appId: "1:123456:web:abc...",
};
```

- **Save the file**

---

## Step 3: Deploy to Vercel (10 min)

Vercel will host your app and give you a URL you can access from anywhere.

### 3.1 Create GitHub Account (if needed)
- Go to **[github.com](https://github.com)**
- Click **"Sign up"**
- Follow the steps (takes 2 min)
- **Note:** You MUST have a GitHub account to deploy to Vercel

### 3.2 Push Code to GitHub
- Create a new public repository on GitHub called `anish-kpi-app`
- Follow GitHub's instructions to push this folder to that repo

**Quick commands** (if you have Git installed):
```bash
cd anish-kpi-app
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/anish-kpi-app.git
git branch -M main
git push -u origin main
```

### 3.3 Deploy to Vercel
- Go to **[vercel.com](https://vercel.com)**
- Click **"Sign Up"** → choose **"Continue with GitHub"**
- Authorize Vercel to access your GitHub account
- You'll see your `anish-kpi-app` repo — click **"Import"**
- Leave all settings as default (Vercel auto-detects Vite)
- Click **"Deploy"**
- Wait ~2 minutes for deployment to complete
- You get a live URL! 🎉 Like: `anish-kpi-app.vercel.app`

---

## Step 4: Test It Out (2 min)

### 4.1 Open Your App
- Click the URL from Vercel (or find it in your Vercel dashboard)
- You should see the login screen with **"Sign in with Google"** button

### 4.2 Sign In
- Click the button
- Sign in with your Google account (same one you used for Firebase)
- You should be logged in and see the dashboard with the Life Score ring

### 4.3 Add Some Test Data
- Click on a goal card (e.g., Canadian PR)
- Enter some numbers in the metrics
- Watch the scores update in real-time
- Check the "LIFE SCORE" at the top — it updates based on all your metrics

### 4.4 Check Mobile
- Open the same Vercel URL on your phone
- Sign in with the same Google account
- The data should be **exactly the same** as your laptop ✅
- This is real-time sync in action!

---

## Step 5: Optional — Install as Phone App

If you want the app to live on your phone home screen like a native app:

### On iOS:
1. Open the app in Safari
2. Tap **Share** → **Add to Home Screen**
3. Name it `Life Score`
4. Tap **Add**
5. Now it's on your home screen!

### On Android:
1. Open the app in Chrome
2. Tap the **⋮** menu → **"Install app"**
3. Tap **"Install"**
4. It installs like a native app!

---

## Step 6: Security Rules (Optional but Recommended)

By default, your Firebase database is in "test mode" — anyone can read/write data. Let's lock it down:

### 6.1 Set Up Security Rules
- Go to **Firebase Console** → **Realtime Database** → **Rules** tab
- Replace all the code with:
```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "auth.uid == $uid",
        ".write": "auth.uid == $uid"
      }
    }
  }
}
```
- Click **"Publish"**

Now only YOU can read/write your data.

---

## Troubleshooting

### "Sign in failed: API key not valid"
- Your Firebase config in `src/firebase.js` is wrong
- Copy the config again from Firebase Console → Settings → Project Settings
- Make sure all 7 fields are filled in

### Data not syncing to phone
- Make sure you signed in with the **same Google account** on both devices
- Try refreshing the page (Ctrl+R / Cmd+R)
- Check internet connection

### Vercel deployment failed
- Make sure `src/firebase.js` has valid config
- Make sure all files are in the repo
- Check Vercel logs for specific errors

### App won't load on Vercel
- Wait 5 minutes after deploying (it can take time)
- Hard refresh (Ctrl+Shift+R / Cmd+Shift+R)
- Check the Vercel dashboard for build errors

---

## What You Now Have

✅ A **synced KPI dashboard** that works on phone, tablet, and laptop
✅ **Real-time data sync** — changes appear everywhere instantly
✅ **Google Sign-In** — only you can access your data
✅ **Cloud storage** — data is safe and backed up
✅ **PWA support** — install like a native app
✅ **Completely free** — Vercel free tier + Firebase free tier

---

## Next Steps

1. **Daily use:** Open on any device, sign in, add your weekly KPIs
2. **Export to Obsidian:** Use the "EXPORT" tab to copy markdown for Obsidian reviews
3. **Share with others (optional):** Add their Google accounts to your Firebase rules if you want them to see your data

---

## Support

If you run into any issues:
1. Check the troubleshooting section above
2. Look at browser console errors (F12 → Console tab)
3. Check Vercel deployment logs
4. Check Firebase project health in Firebase Console

**You're all set! Your data will sync everywhere from now on. Good luck with your KPIs!** 🚀
