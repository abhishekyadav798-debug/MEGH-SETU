# 🚀 MeghSetu — Complete Cloud Deployment Guide
**Smart India Hackathon 2026 | Problem #26069 | Team CODEXAIV (182006)**

---

## 📌 Deployment Overview

MeghSetu is designed with a modern decoupled architecture:
1. **Backend (API + AI/ML Engine + Database connection)**: Deployed on **[Render.com](https://render.com)** (Free, zero-downtime, continuous deployment).
2. **Frontend (Vite + React + Leaflet Maps + Charts)**: Deployed on **[Vercel](https://vercel.com)** or **[Netlify](https://netlify.com)** (Global Edge CDN, automatic HTTPS, ultra-fast).
3. **Database**: **MongoDB Atlas** (Cloud Database).

---

## Step 1: Push Code to GitHub

Open terminal in the `MEGH-SETU` root folder and run:

```bash
git add .
git commit -m "MeghSetu v2.0 - SIH 2026 National Weather Big Data Analytics Platform"
git branch -M main
```

Now, create a new repository on [GitHub](https://github.com/new) named **`MEGH-SETU`**, then run:

```bash
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/MEGH-SETU.git
git push -u origin main
```

---

## Step 2: Ensure MongoDB Atlas Allows Cloud Connections

Cloud platforms (Render/Railway) use dynamic IP addresses. Ensure Atlas allows connections from anywhere:
1. Go to [MongoDB Atlas Console](https://cloud.mongodb.com/).
2. In the left sidebar under **Security**, click **Network Access**.
3. Check if `0.0.0.0/0` is present.
   - If not, click **Add IP Address** -> Select **Allow Access from Anywhere (`0.0.0.0/0`)** -> Click **Confirm**.

---

## Step 3: Deploy Backend on Render (Free)

1. Sign up / Log in to **[Render.com](https://render.com)**.
2. Click **New +** -> Select **Web Service**.
3. Select **Build and deploy from a Git repository** -> Connect your GitHub account and pick the `MEGH-SETU` repository.
4. Fill in the service configuration:
   - **Name**: `meghsetu-api` (or any unique name)
   - **Region**: Singapore or Frankfurt (closest to India)
   - **Root Directory**: `backend` ⚠️ *(Important: Set to `backend`)*
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Instance Type**: `Free`
5. Under **Environment Variables**, add:
   - `MONGODB_URI`: `mongodb+srv://abhishek798571_db_user:rW6zjoUL1KmE9dtr@meghsetu.wwv9xm9.mongodb.net/?appName=MeghSetu`
   - `PORT`: `5000`
   - `ALLOWED_ORIGINS`: `*`
6. Click **Deploy Web Service**.
7. Wait ~2 minutes until status shows **Live**.
8. Copy your backend URL (e.g., `https://meghsetu-api.onrender.com`).
   - Test it by visiting `https://meghsetu-api.onrender.com/` in your browser. It will respond with:
     ```json
     { "status": "MeghSetu Backend Running", "version": "2.0" }
     ```

---

## Step 4: Deploy Frontend on Vercel (Free)

1. Sign up / Log in to **[Vercel.com](https://vercel.com)**.
2. Click **Add New...** -> Select **Project**.
3. Import your `MEGH-SETU` GitHub repository.
4. In the **Configure Project** screen:
   - **Project Name**: `meghsetu`
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click **Edit** and select `frontend` ⚠️ *(Important: Set to `frontend`)*
   - **Build & Output Settings**: (Leave defaults: `npm run build` and `dist`)
5. Expand **Environment Variables** and add:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://meghsetu-api.onrender.com` *(Paste the Render backend URL from Step 3 without trailing slash)*
6. Click **Deploy**.
7. Within 30 seconds, Vercel will build and provide your live production URL (e.g. `https://meghsetu.vercel.app`)!

---

## 🎯 Verification Checklist

- [ ] Visit `https://<your-frontend>.vercel.app/` — Home page loads with live statistics and widgets.
- [ ] Visit `https://<your-frontend>.vercel.app/live-map` — Map displays with active weather markers.
- [ ] Visit `https://<your-frontend>.vercel.app/report` — Submit a citizen weather report; verify it is saved in MongoDB.
- [ ] Visit `https://<your-frontend>.vercel.app/admin` — View admin triage table, verify/reject/flag reports, test AI fake score analyzer.
- [ ] Refresh any page (e.g. `/analytics`) — SPA routing works seamlessly without 404 error (handled by `vercel.json`).
