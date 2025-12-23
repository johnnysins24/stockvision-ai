# 🚀 Deployment Guide - StockVision AI

## Overview

StockVision AI consists of two parts:
1. **Frontend** (Next.js) → Deploy to **Vercel**
2. **Backend** (FastAPI) → Deploy to **Railway**

---

## 📦 Part 1: Deploy Backend to Railway

### Step 1: Prepare Backend Files

The backend folder already has everything needed:
- `main.py` - FastAPI server
- `requirements.txt` - Python dependencies
- `Procfile` - Railway startup command
- `railway.json` - Railway configuration

### Step 2: Create Railway Account
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub

### Step 3: Deploy Backend
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Connect your GitHub and select `image-stock-research` repo
4. Set the root directory to `/backend`
5. Railway will auto-detect Python and deploy

### Step 4: Get Backend URL
After deployment, Railway will give you a URL like:
```
https://stockvision-backend-xxxx.railway.app
```

---

## 🖥️ Part 2: Deploy Frontend to Vercel

### Step 1: Update API URL
Before deploying, update the API URL in your code.

Create `.env.production` file:
```
NEXT_PUBLIC_API_URL=https://your-railway-backend-url.railway.app
```

### Step 2: Create Vercel Account
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub

### Step 3: Deploy Frontend
1. Click "Add New Project"
2. Import your GitHub repo
3. Vercel auto-detects Next.js
4. Add Environment Variable:
   - Key: `NEXT_PUBLIC_API_URL`
   - Value: Your Railway backend URL
5. Click Deploy

### Step 4: Done!
Your app will be live at:
```
https://stockvision-xxxx.vercel.app
```

---

## 🔧 Environment Variables

### Frontend (.env.production)
```
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
```

### Backend (Railway Dashboard)
```
PORT=8001
PYTHON_VERSION=3.11
```

---

## 📝 Pre-Deployment Checklist

- [ ] Push code to GitHub
- [ ] Backend `requirements.txt` is complete
- [ ] Backend `Procfile` exists
- [ ] Frontend uses environment variable for API URL
- [ ] All API endpoints use relative paths

---

## 🆘 Troubleshooting

### CORS Error
Update `main.py` to allow your Vercel domain:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-app.vercel.app", "http://localhost:3000"],
    ...
)
```

### Backend Not Starting
Check Railway logs and ensure:
1. `requirements.txt` has all dependencies
2. `Procfile` has correct command
3. Port is set to `$PORT` (Railway assigns dynamically)

---

## 🎉 Success!

After deployment:
- Frontend: `https://stockvision.vercel.app`
- Backend API: `https://stockvision-api.railway.app`
- API Docs: `https://stockvision-api.railway.app/docs`
