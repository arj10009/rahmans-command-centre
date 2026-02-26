# 👑 Rahman's Command Centre - START HERE

Complete web app built just for Rahman with calendar, to-do list, and mood tracking!

## 📂 What You Have

```
rahmans-app/
├── index.html              ← Frontend (the app Rahman uses)
├── manifest.json           ← PWA setup
├── README.md              ← How to use the app
├── DEPLOYMENT.md          ← How to deploy frontend
├── BACKEND_SETUP_QUICKSTART.md  ← Deploy backend (read this!)
│
├── backend/               ← Backend server (handles OpenAI calls)
│   ├── server.js          ← Express server
│   ├── package.json       ← Dependencies
│   ├── .env.example       ← Template for API key
│   └── SETUP.md          ← Detailed backend setup
│
└── images/                ← Rahman's photos
    ├── mood_fire.jpg      ← Happy photo
    ├── mood_ass.jpg       ← Pensive photo
    └── bg_*.jpg          ← Rotating background photos
```

---

## 🚀 What to Do Next

### 1️⃣ Deploy the Backend (Required for voice commands)

**Read this**: `BACKEND_SETUP_QUICKSTART.md`

TL;DR:
```bash
gcloud run deploy rahmans-backend \
  --source backend \
  --runtime nodejs20 \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars OPENAI_API_KEY=<YOUR_OPENAI_API_KEY>
```

Get the backend URL and **update `index.html` line ~1240** with it.

### 2️⃣ Deploy the Frontend

**Read this**: `DEPLOYMENT.md`

Options:
- **Vercel** (easiest) - `vercel` command
- **Netlify** - Drag & drop
- **GitHub Pages** - Push to GitHub
- **Your Google Cloud** - Deploy alongside backend

### 3️⃣ Send Rahman the Link

He opens it on his Android phone and starts using it!

---

## 🎯 What Rahman Can Do

**📅 Calendar Tab**
- View monthly calendar
- Click dates to see/add events
- 🎙️ Use voice to create events ("Add meeting tomorrow at 2pm")
- Toggle rotating photo banners every 8 seconds

**✅ To Do List Tab**
- View active tasks (prioritized red/orange/green)
- Check off completed tasks
- 🎙️ Use voice to create tasks ("Add urgent: finish report")
- See completed tasks in a collapsible section
- Toggle rotating photo banners

**🎭 Mood Tab**
- Click "💀 ASS" or "🔥 FIRE" buttons
- Hears the word spoken out loud (TTS)
- Sees full-screen animation + confetti
- Mood logs to history
- See daily mood stats with fire/ass percentage

**💾 Everything is local**
- All data stored on his phone (no account needed)
- Works offline once loaded
- Clear browser cache to reset

---

## 🔧 Architecture

**Frontend** (index.html)
- ↓ sends audio blob
- **Backend** (server.js)
  - ↓ calls Whisper API to transcribe
  - ↓ calls GPT-4.1-mini to parse
  - ↑ returns transcript + parsed data
- Frontend adds to local storage

**Why backend?**
- Avoids CORS issues (browsers block direct OpenAI calls)
- API key stays on server (more secure)
- Cleaner, more reliable voice experience

---

## ⚡ Quick Reference

| What | Where |
|------|-------|
| Use the app | `index.html` |
| Change colors/styling | Edit CSS in `index.html` <style> section |
| Update Rahman's photos | Add to `images/` folder, update JS references |
| Add new features | Edit JavaScript in `index.html` |
| Backend API | `backend/server.js` |
| Backend endpoint | `POST /api/voice/process` |

---

## 🆘 If Something Breaks

1. **"Transcription failed"** → Backend not deployed or wrong URL
   - Check `localStorage.setItem('BACKEND_URL', '...')` in index.html
   - Make sure backend is running: `curl your-backend-url/health`

2. **"Microphone access denied"** → Permissions issue
   - On Android: Settings → Apps → Permissions → Microphone

3. **Photos not showing** → Wrong path
   - Make sure `images/` folder is uploaded with all photos
   - Check file names in JS match actual files

4. **Data disappeared** → Browser cache cleared
   - Data is stored in browser's localStorage
   - Clearing cache deletes it (but it's local-only, so not a privacy issue)

---

## 📝 Files to Update After Deployment

1. **index.html** (~line 1240)
   - Replace `'https://your-backend-url.com'` with actual backend URL

2. **Everything else** stays as-is!

---

## 🎉 Summary

You have:
- ✅ Frontend app (ready to deploy)
- ✅ Backend server (ready to deploy)
- ✅ All Rahman's photos
- ✅ Documentation

Next steps:
1. Deploy backend to Cloud Run (5 min)
2. Update frontend with backend URL
3. Deploy frontend to Vercel/Netlify (2 min)
4. Send Rahman the link
5. He starts using it immediately!

---

Questions? Everything is self-contained and well-documented. You've got this! 👑✨
