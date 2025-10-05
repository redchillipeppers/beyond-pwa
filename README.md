# Beyond — Coaching Companion (PWA)

This is your shippable Vite + React + TypeScript + Tailwind PWA with the UI you approved.

## Quick Start (Mac, non‑coder friendly)

1) Install Node.js (LTS): go to https://nodejs.org and download the **LTS** macOS installer. Run it.
2) Open **Terminal** (Spotlight → type `Terminal` → Enter).
3) In Terminal, go to your Downloads folder (or wherever you put this project):  
   `cd ~/Downloads/beyond-pwa`
4) Install packages:  
   `npm install`
5) Start the app (development):  
   `npm run dev`  
   Then open the shown URL (usually http://localhost:5173).

## Deploy to Vercel (free)

1) Create a **GitHub** account if you don’t have one.
2) In Terminal (inside the project folder):
   ```bash
   git init
   git add .
   git commit -m "First ship"
   git branch -M main
   # create a new GitHub repo in the browser, then follow their push instructions:
   # example:
   # git remote add origin https://github.com/YOURNAME/beyond-pwa.git
   # git push -u origin main
   ```
3) Go to https://vercel.com → **Import Project** → choose your GitHub repo.
4) Framework preset: **Vite** (auto-detected). Build command: `npm run build`. Output: `dist` (auto).
5) Click **Deploy**. Done. Your live URL will appear.

## PWA on your phone

- Visit your Vercel URL in Safari (iOS) or Chrome (Android).
- Use **Share → Add to Home Screen** (iOS) or **⋮ → Add to Home screen** (Android).
- Launch from your home screen like a native app.

## Notes

- Invite‑only login is a preview. Use a code starting with `ADMIN-` to unlock Admin in this demo.
- Data is stored in your browser’s local storage. A real database + auth will be added next.
