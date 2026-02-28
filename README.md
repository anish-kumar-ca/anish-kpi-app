# 🏆 Anish's Life Score — Weekly KPI Tracker

A beautiful, real-time synced personal operating system for tracking your weekly KPIs across 5 life domains:

- 🍁 **Canadian PR** — Study hours, practice tests, documents, CRS score
- 🏗️ **Business & Income** — Hours worked, revenue actions, build sessions, monthly revenue
- 📈 **Investments** — SIP done, research hours, income invested, portfolio value
- 💰 **Finance** — Budget adherence, expenses logged, impulse spend, savings rate
- 🧬 **Health** — Workouts, sleep, steps, energy score

## Features

✨ **Live Life Score Ring** — Weighted composite score (0-100) with visual feedback
✨ **Interactive Goal Cards** — Click to expand and enter metrics
✨ **Real-time Progress Bars** — See your progress to targets as you type
✨ **Milestone Tracking** — Checkboxes for key milestones per goal
✨ **8-Week Trends** — Visual charts and tables of your progress
✨ **Weekly Reflection** — Capture wins, blockers, and next week's commitment
✨ **Obsidian Export** — Copy markdown to your weekly review notes
✨ **Cloud Sync** — Data syncs instantly across phone, tablet, laptop
✨ **PWA Support** — Install on your home screen like a native app
✨ **Dark UI** — Sleek, focus-optimized interface

## Tech Stack

- **React 18** — UI framework
- **Vite** — Lightning-fast bundler
- **Firebase** — Authentication & Realtime Database for sync
- **Vercel** — Hosting & auto-deployments

## Quick Start

1. **Read [SETUP.md](./SETUP.md)** for complete deployment instructions
2. Create a Firebase project (5 min)
3. Push to GitHub
4. Deploy to Vercel (10 min)
5. Open on your phone + laptop
6. Sign in and start tracking!

**Total setup time: ~20 minutes**
**Cost: $0 forever**

## Project Structure

```
anish-kpi-app/
├── src/
│   ├── App.jsx              # Main app component
│   ├── firebase.js          # Firebase config
│   └── main.jsx             # Entry point
├── public/
│   ├── manifest.json        # PWA manifest
│   └── sw.js               # Service worker (offline)
├── index.html              # HTML entry
├── vite.config.js          # Vite config
├── vercel.json             # Vercel deployment config
├── package.json            # Dependencies
└── SETUP.md                # Detailed setup guide
```

## Data Structure

Each week's data is stored as:
```json
{
  "2024-02-26": {
    "pr": {
      "studyHrs": 8,
      "practiceTests": 1,
      "docsDone": 75,
      "crsScore": 450,
      "ms_celpipBooked": true,
      "pr_notes": "..."
    },
    "reflection_wins": "...",
    "reflection_blocks": "...",
    "reflection_commit": "..."
  }
}
```

## Development

### Local Development
```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### Build
```bash
npm run build
npm run preview
```

## Deployment

Deployed on **Vercel** with auto-deployments from GitHub.

To redeploy:
1. Push code to GitHub
2. Vercel auto-deploys
3. App is live in ~2 minutes

## Environment Setup

Update `src/firebase.js` with your Firebase config:
- Get credentials from Firebase Console → Settings → Project Settings
- Replace all `REPLACE_WITH_...` placeholders with actual values

## Security

- **Authentication:** Google Sign-In only
- **Data Privacy:** Only you can read/write your data (Firebase security rules)
- **Encryption:** HTTPS on Vercel
- **Storage:** Data stored in Firebase Realtime Database (Google's infrastructure)

## Features Breakdown

### Dashboard View
- 5 goal cards showing current week's progress
- Click any card to expand and enter metrics
- Real-time score calculations as you type
- Mini metric bars showing progress to target
- Weekly reflection section below

### History View
- 8-week trend chart of your Life Score
- Goal breakdown table (last 6 weeks)
- Click any bar to jump to that week

### Export View
- Markdown export for Obsidian
- Auto-formatted with your week's data
- Copy → paste into your Obsidian Weekly Review note

## Customization

Edit `GOALS` array in `App.jsx` to:
- Add/remove goals
- Change targets
- Modify metric labels
- Adjust weights (proportional %)

## Limitations

- No offline editing (needs internet to sync)
- Data is personal to each Google account
- Firebase free tier: 1GB storage (plenty for 10+ years of data)

## Future Enhancements

- [ ] Mobile app (React Native)
- [ ] Data export/import
- [ ] Shared goals (with family/team)
- [ ] AI insights ("You're doing great on health!")
- [ ] Calendar view
- [ ] Habits integration

## License

Personal use only.

---

Built with ❤️ by Anish. Data syncs everywhere. Success starts with tracking.
