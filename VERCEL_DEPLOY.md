# Vercel Deployment Guide

## Problem Fixed

The frontend API calls were failing because the backend URL was hardcoded to use `/api` which only works in development with Vite proxy. In production, you need to configure the backend API URL.

## Solution

The API service has been updated to use environment variables. Now you need to:

### Step 1: Deploy Backend (Choose one option)

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

### Step 2: Configure Frontend Environment Variable in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add a new environment variable:
   - **Name**: `VITE_API_URL`
   - **Value**: Your backend URL + `/api` (e.g., `https://your-app.railway.app/api` or `https://your-app.onrender.com/api`)
   - **Environment**: Select all (Production, Preview, Development)
4. Click **Save**

### Step 3: Redeploy

After adding the environment variable:

1. Go to **Deployments** tab
2. Click the three dots (⋯) on the latest deployment
3. Click **Redeploy**

Or simply push a new commit to trigger a new deployment.

## Verification

After redeployment, test these features:
- ✅ Add Student
- ✅ Add Book  
- ✅ Issue Book
- ✅ View Reports

All API calls should now work correctly!

## Troubleshooting

### If API calls still fail:

1. **Check CORS**: Make sure your backend has CORS enabled (it should, as it's in `server.js`)
2. **Check Backend URL**: Verify the `VITE_API_URL` in Vercel matches your deployed backend URL
3. **Check Backend Logs**: Look at your backend deployment logs to see if requests are reaching it
4. **Network Tab**: Open browser DevTools → Network tab to see the actual API requests and errors

### Common Issues:

- **404 errors**: Backend URL might be incorrect or backend not deployed
- **CORS errors**: Backend CORS configuration issue
- **500 errors**: Backend server error - check backend logs

## Development vs Production

- **Development**: Uses Vite proxy (`/api` → `localhost:5000`)
- **Production**: Uses `VITE_API_URL` environment variable

The code automatically detects which environment to use, so no code changes needed when switching between dev and production!

