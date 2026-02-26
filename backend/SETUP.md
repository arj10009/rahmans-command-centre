# Backend Setup Guide - Rahman's Command Centre

This backend handles OpenAI API calls (Whisper + GPT-4.1-mini) without CORS issues.

## Local Development

### 1. Install dependencies
```bash
cd backend
npm install
```

### 2. Create .env file
```bash
cp .env.example .env
```

Then edit `.env` and add your OpenAI API key:
```
OPENAI_API_KEY=<YOUR_OPENAI_API_KEY>
PORT=3001
NODE_ENV=development
```

### 3. Run the server
```bash
npm start
```

You should see:
```
👑 Rahman's Backend Server

✅ Running on http://localhost:3001
📝 Transcript endpoint: POST /api/voice/process
💚 Health check: GET /health
```

### 4. Test it
```bash
curl http://localhost:3001/health
```

Should return:
```json
{"status":"ok","message":"Rahman's backend is running! 👑"}
```

---

## Deploy to Google Cloud

You have several options. Pick one:

### Option A: Cloud Run (Easiest, Recommended)

1. **Install Google Cloud CLI**: https://cloud.google.com/sdk/docs/install

2. **Authenticate**:
   ```bash
   gcloud auth login
   gcloud config set project arjieos-sheets
   ```

3. **Create app.yaml** in backend folder:
   ```yaml
   runtime: nodejs20

   env: standard

   env_variables:
     OPENAI_API_KEY: "<YOUR_OPENAI_API_KEY>"
     NODE_ENV: "production"
   ```

4. **Deploy**:
   ```bash
   gcloud run deploy rahmans-backend \
     --source . \
     --runtime nodejs20 \
     --region us-central1 \
     --allow-unauthenticated \
     --set-env-vars OPENAI_API_KEY=<YOUR_OPENAI_API_KEY>
   ```

5. **Get your URL** from the output (something like `https://rahmans-backend-abc123.run.app`)

---

### Option B: Compute Engine (More control, persistent VM)

1. **Create a VM instance** in Google Cloud Console
2. **SSH into it**
3. **Clone your repo or copy files**
4. **Install Node.js** (if not already there):
   ```bash
   curl -sL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```
5. **Install dependencies**:
   ```bash
   npm install
   ```
6. **Create .env** with your API key
7. **Run the server**:
   ```bash
   npm start
   ```
8. **Get your VM's external IP** and use that as the backend URL

---

### Option C: App Engine

1. **Create app.yaml** in backend folder:
   ```yaml
   runtime: nodejs20

   env_variables:
     OPENAI_API_KEY: "<YOUR_OPENAI_API_KEY>"
   ```

2. **Deploy**:
   ```bash
   gcloud app deploy
   ```

3. Your app will be available at `https://arjieos-sheets.appspot.com`

---

## Update Frontend with Backend URL

Once deployed, you need to tell the frontend where your backend is. In the frontend HTML, find this section and update it:

```javascript
// In index.html, look for:
const backendUrl = localStorage.getItem('BACKEND_URL') || 'https://your-backend-url.com';
```

**Option 1: Set in localStorage (easiest for testing)**
- When Rahman opens the app, he can press F12 (Developer Tools)
- Go to Console tab and run:
  ```javascript
  localStorage.setItem('BACKEND_URL', 'https://your-actual-backend-url.com');
  ```
- Then refresh the page

**Option 2: Hardcode in HTML (permanent)**
- Edit `index.html` and replace `'https://your-backend-url.com'` with your actual backend URL

---

## API Endpoint

Your backend exposes one main endpoint:

### POST /api/voice/process

**Request body:**
```json
{
  "audio": "base64-encoded-audio-data",
  "context": "calendar" or "todo"
}
```

**Response:**
```json
{
  "transcript": "add meeting tomorrow at 2pm",
  "parsed": {
    "events": [
      {"title": "meeting", "date": "2026-02-27", "time": "14:00"}
    ]
  }
}
```

---

## Troubleshooting

**"Cannot find module 'express'"**
- Run `npm install`

**"API key not configured"**
- Make sure `OPENAI_API_KEY` is set in your `.env` or environment variables

**"CORS error from frontend"**
- The backend should handle this, but make sure the backend is actually running and accessible

**"Backend URL not found"**
- Update the frontend to point to your actual backend URL
- Make sure the backend is deployed and running

---

## My Recommendation

**Use Cloud Run** (Option A) - it's:
- Free tier friendly
- Auto-scales
- No server management
- Easy to deploy
- Gets you a public HTTPS URL

Just run the deploy command and you're done!

---

## Questions?

The backend is simple - it's just Express + OpenAI API calls. If something breaks, check:
1. Is the backend running? (`GET /health`)
2. Is the API key valid?
3. Is the frontend pointing to the right URL?
4. Check server logs for errors
