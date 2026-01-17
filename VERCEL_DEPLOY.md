# Vercel Deployment Guide - Fix API Issues

## ⚠️ Current Problem

The frontend API calls are failing because:
1. Backend is not deployed yet
2. `VITE_API_URL` environment variable is not set in Vercel
3. Frontend is trying to call `/api` which doesn't exist in production

## ✅ Solution Applied

1. ✅ API service updated to use environment variables
2. ✅ Better error messages added to help debug issues
3. ✅ Console logging added to see what URL is being used

## 🚀 Quick Fix Steps

The API service has been updated to use environment variables. Now you need to:

### Step 1: Deploy Backend (REQUIRED - Choose one option)

**⚠️ IMPORTANT:** Without a deployed backend, the frontend cannot work. You MUST deploy the backend first.

#### Option A: Deploy on Railway (Recommended)

1. Go to [Railway.app](https://railway.app) and sign up/login
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your LMS repository
4. Set the root directory to `backend`
5. Railway will automatically detect Node.js and deploy
6. Copy the deployed URL (e.g., `https://your-app.railway.app`)

#### Option B: Deploy on Render

1. Go to [Render.com](https://render.com) and sign up/login
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Set:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Deploy and copy the URL (e.g., `https://your-app.onrender.com`)

#### Option C: Deploy on Vercel (Serverless - Advanced)

For Vercel, you'll need to convert the backend to serverless functions. This is more complex but keeps everything on one platform.

### Step 2: Configure Frontend Environment Variable in Vercel (REQUIRED)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project (`mpitlms` or your project name)
3. Go to **Settings** → **Environment Variables**
4. Click **Add New**
5. Add environment variable:
   - **Key**: `VITE_API_URL`
   - **Value**: Your backend URL + `/api`
     - Example for Railway: `https://your-app-name.railway.app/api`
     - Example for Render: `https://your-app-name.onrender.com/api`
   - **Environment**: Select **Production**, **Preview**, and **Development** (all three)
6. Click **Save**

**⚠️ CRITICAL:** Make sure to include `/api` at the end of the URL!

### Step 3: Redeploy (REQUIRED)

After adding the environment variable, you MUST redeploy:

1. Go to **Deployments** tab in Vercel
2. Find the latest deployment
3. Click the three dots (⋯) menu
4. Click **Redeploy**
5. Wait for deployment to complete

**OR** simply push a new commit to GitHub to trigger automatic redeployment.

**⚠️ IMPORTANT:** Environment variables only take effect on NEW deployments. Old deployments won't have the new variable!

## ✅ Verification

After redeployment, test these features on https://mpitlms.vercel.app:
- ✅ Add Student - Should work now
- ✅ Add Book - Should work now
- ✅ Issue Book - Should work now
- ✅ View Reports - Should work now

**How to verify it's working:**
1. Open browser DevTools (F12)
2. Go to Console tab
3. You should see: `🔗 API Base URL: https://your-backend-url/api`
4. Try adding a student - check Network tab to see if API calls succeed
5. If you see errors, they will now show helpful messages

## 🔧 Troubleshooting

### If API calls still fail after following all steps:

1. **Check Environment Variable:**
   - Go to Vercel → Settings → Environment Variables
   - Verify `VITE_API_URL` exists and has correct value
   - Make sure it includes `/api` at the end
   - Example: `https://your-backend.railway.app/api` ✅
   - Wrong: `https://your-backend.railway.app` ❌

2. **Check Backend is Running:**
   - Visit your backend URL directly: `https://your-backend.railway.app/api/health`
   - Should return: `{"status":"OK","message":"Library Management System API is running"}`
   - If it doesn't work, backend is not deployed correctly

3. **Check Browser Console:**
   - Open DevTools (F12) → Console
   - Look for: `🔗 API Base URL: ...`
   - If it shows `/api`, the environment variable is not set
   - If it shows your backend URL, check Network tab for actual errors

4. **Check Network Tab:**
   - Open DevTools → Network tab
   - Try adding a student
   - Look for failed requests (red)
   - Check the error message

5. **Check CORS:**
   - Backend should have CORS enabled (already in `server.js`)
   - If you see CORS errors, check backend logs

### Common Error Messages:

- **"Cannot connect to backend server"**: 
  - Backend not deployed OR
  - `VITE_API_URL` not set in Vercel OR
  - Wrong URL in environment variable

- **"404 Not Found"**: 
  - Backend URL is wrong OR
  - Missing `/api` at the end of URL

- **"Network Error"**: 
  - Backend server is down OR
  - CORS issue (check backend logs)

## Development vs Production

- **Development**: Uses Vite proxy (`/api` → `localhost:5000`)
- **Production**: Uses `VITE_API_URL` environment variable

The code automatically detects which environment to use, so no code changes needed when switching between dev and production!

