# 🚨 Quick Fix - 404 Error Solution

## Problem
You're getting 404 errors because the backend API is not configured.

## ✅ Solution (3 Simple Steps)

### Step 1: Deploy Backend on Railway (2 minutes)

1. Go to https://railway.app
2. Sign up/Login with GitHub
3. Click **"New Project"** → **"Deploy from GitHub repo"**
4. Select your **LMS repository**
5. In project settings, set **Root Directory** to: `backend`
6. Railway will auto-deploy
7. Copy the URL (e.g., `https://your-app.railway.app`)

### Step 2: Set Environment Variable in Vercel (1 minute)

1. Go to https://vercel.com/dashboard
2. Click on your project (**mpitlms**)
3. Go to **Settings** → **Environment Variables**
4. Click **"Add New"**
5. Fill in:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://your-app.railway.app/api` (replace with your Railway URL + `/api`)
   - **Environment**: Select all 3 (Production, Preview, Development)
6. Click **Save**

### Step 3: Redeploy (30 seconds)

1. Go to **Deployments** tab
2. Click **⋯** (three dots) on latest deployment
3. Click **Redeploy**
4. Wait 2-3 minutes

## ✅ Done!

After redeployment, your site will work! Test by:
- Adding a student
- Adding a book
- Issuing a book
- Viewing reports

## 🔍 Verify It's Working

1. Open https://mpitlms.vercel.app
2. Press **F12** (DevTools)
3. Go to **Console** tab
4. You should see: `🔗 API Base URL: https://your-backend.railway.app/api`
5. If you see `/api` instead, the environment variable is not set correctly

## ❌ Still Not Working?

### Check 1: Environment Variable
- Go to Vercel → Settings → Environment Variables
- Make sure `VITE_API_URL` exists
- Make sure it ends with `/api`
- Example: `https://your-app.railway.app/api` ✅

### Check 2: Backend is Running
- Visit: `https://your-backend.railway.app/api/health`
- Should show: `{"status":"OK","message":"Library Management System API is running"}`
- If not, backend is not deployed correctly

### Check 3: Redeployed?
- Environment variables only work on NEW deployments
- Make sure you clicked "Redeploy" after adding the variable

## 📞 Need Help?

Check the detailed guide in `VERCEL_DEPLOY.md`

