# 🚀 Backend Setup - Quick Start

## What You Need to Do

1. **Deploy the backend to Google Cloud** (or any Node.js host)
2. **Tell the frontend where the backend is**
3. **Done!**

---

## Quickest Path (Cloud Run)

### Step 1: Install Google Cloud CLI
Download and install from: https://cloud.google.com/sdk/docs/install

### Step 2: Authenticate
```bash
gcloud auth login
gcloud config set project arjieos-sheets
```

### Step 3: Deploy Backend
Go to the `backend/` folder and run:
```bash
gcloud run deploy rahmans-backend \
  --source . \
  --runtime nodejs20 \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars OPENAI_API_KEY=<YOUR_OPENAI_API_KEY>
```

### Step 4: Get Your Backend URL
After deployment, you'll see output like:
```
Service URL: https://rahmans-backend-abc123xyz.run.app
```

Copy that URL!

### Step 5: Tell Frontend About Backend
Open the frontend (`index.html`) in a text editor and find this line (~line 1240):
```javascript
const backendUrl = localStorage.getItem('BACKEND_URL') || 'https://your-backend-url.com';
```

Replace `'https://your-backend-url.com'` with your actual backend URL from Step 4:
```javascript
const backendUrl = localStorage.getItem('BACKEND_URL') || 'https://rahmans-backend-abc123xyz.run.app';
```

### Step 6: Deploy Frontend
Upload your updated frontend folder to your hosting (Vercel, Netlify, etc.)

### Step 7: Done! 🎉
Rahman can now use voice commands!

---

## Testing the Backend (Optional)

```bash
# Test if backend is running
curl https://your-backend-url.com/health

# Should return:
# {"status":"ok","message":"Rahman's backend is running! 👑"}
```

---

## If You Get Stuck

Check the detailed setup guide in `backend/SETUP.md`

The key is:
- Backend runs on a server (Cloud Run, Compute Engine, etc.)
- Frontend calls the backend instead of OpenAI directly
- Backend has your API key (never exposed to Rahman's browser)

That's it!
