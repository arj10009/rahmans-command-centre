# Deployment Guide for Rahman's Command Centre

Choose one of these simple options to get the app live:

## Option 1: Vercel (Easiest) ⭐

1. Create a free account at [vercel.com](https://vercel.com)
2. Install Vercel CLI: `npm install -g vercel`
3. In the project folder, run: `vercel`
4. Follow the prompts (select the folder as root, say "Yes" to auto-detection)
5. Your app will be live at a URL like `https://rahmans-app-xyz.vercel.app`

**Pros**: Free, automatic HTTPS, one-command deploy, easy to update
**Cons**: Requires Node.js/npm installed

## Option 2: Netlify (Also Easy)

1. Create a free account at [netlify.com](https://netlify.com)
2. Drag and drop the entire project folder into Netlify's deploy area
3. Your app goes live instantly at `https://[random-name].netlify.app`

**Pros**: Super simple, no CLI needed, drag-and-drop
**Cons**: URL is auto-generated (not custom)

## Option 3: GitHub Pages (Free & Custom)

1. Create a new GitHub repository
2. Push the project folder to GitHub
3. In repository settings → Pages → Deploy from `main` branch
4. Your app will be at `https://[yourUsername].github.io/rahmans-app`

**Pros**: Free, custom domain possible, everything on GitHub
**Cons**: Slightly more steps, requires git knowledge

## Option 4: Google Firebase (Free Tier)

1. Go to [firebase.google.com](https://firebase.google.com)
2. Create a new project
3. Install Firebase CLI: `npm install -g firebase-tools`
4. Run `firebase login` then `firebase init hosting`
5. Deploy with `firebase deploy`

**Pros**: Free tier is generous, very fast global CDN
**Cons**: More setup steps

## Option 5: Simple HTTP Server (Local Testing Only)

If you just want to test locally before deploying:

```bash
cd /path/to/rahmans-app
python3 -m http.server 8080
```

Then open `http://localhost:8080` in your browser. **This won't work for Rahman on his phone** (only local network), but it's perfect for testing.

---

## My Recommendation

**Use Vercel or Netlify** — they're the fastest to get running and most reliable. Pick whichever you find easier.

After deployment:
1. Send Rahman the live URL
2. He opens it on his Android phone
3. Optionally: He taps "Add to Home Screen" to make it feel like a native app
4. Done! He starts using it immediately

---

## What Gets Uploaded

Only these files need to be hosted:
- `index.html` — The main app
- `manifest.json` — PWA configuration
- `images/` folder — All his photos

The API key is already baked in, so no environment variables needed.

---

## Updates

To update the app after it's live:
1. Make changes to `index.html` or add/update images
2. Re-upload to your hosting (Vercel/Netlify just redeploy, GitHub Pages auto-updates on git push)
3. Rahman's browser will fetch the new version (may need to refresh or clear cache)

---

Questions? The app is fully self-contained—no database, no backend, just pure HTML/CSS/JS + his photos!
