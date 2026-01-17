# 🔧 Complete Fix Instructions - Backend API Configuration

## ⚠️ Current Issue

The red warning banner appears because `VITE_API_URL` environment variable is not set in Vercel. This causes all API calls to fail with 404 errors.

## ✅ Complete Solution (Follow These Steps Exactly)

### Step 1: Deploy Backend on Railway (5 minutes)

1. **Go to Railway**: https://railway.app
2. **Sign up/Login** with your GitHub account
3. **Create New Project**:
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your LMS repository
4. **Configure Project**:
   - Click on the deployed service
   - Go to **Settings** tab
   - Find **Root Directory** setting
   - Set it to: `backend`
   - Save changes
5. **Wait for Deployment**:
   - Railway will automatically redeploy
   - Wait 2-3 minutes for deployment to complete
6. **Copy Your Backend URL**:
   - Go to **Settings** → **Domains**
   - Copy the Railway URL (e.g., `https://your-app-name.railway.app`)
   - **IMPORTANT**: Note this URL - you'll need it in Step 2

### Step 2: Set Environment Variable in Vercel (2 minutes)

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Select Your Project**: Click on `mpitlms` (or your project name)
3. **Navigate to Environment Variables**:
   - Click **Settings** (top menu)
   - Click **Environment Variables** (left sidebar)
4. **Add New Variable**:
   - Click **"Add New"** button
   - **Key**: Type exactly `VITE_API_URL` (case-sensitive)
   - **Value**: Type your Railway URL + `/api`
     - Example: `https://your-app-name.railway.app/api`
     - **CRITICAL**: Must include `/api` at the end!
   - **Environment**: Select all three checkboxes:
     - ✅ Production
     - ✅ Preview  
     - ✅ Development
   - Click **Save**

### Step 3: Redeploy Vercel Project (1 minute)

**⚠️ CRITICAL**: Environment variables only work on NEW deployments!

1. **Go to Deployments Tab**:
   - Click **Deployments** in top menu
2. **Redeploy**:
   - Find the latest deployment
   - Click the **⋯** (three dots) menu
   - Click **Redeploy**
   - Wait 2-3 minutes for deployment to complete

**OR** simply push a new commit to trigger automatic redeployment.

## ✅ Verification - How to Know It's Fixed

### Check 1: Warning Banner Disappears
- After redeployment, refresh your site
- The red warning banner should be **GONE**

### Check 2: Browser Console
1. Open your site: https://mpitlms.vercel.app
2. Press **F12** (open DevTools)
3. Go to **Console** tab
4. You should see: `🔗 API Base URL: https://your-backend.railway.app/api`
5. **If you see `/api` instead**, the environment variable is not set correctly

### Check 3: Test Features
Try these actions - they should all work:
- ✅ **Add Student** - Should save successfully
- ✅ **Add Book** - Should save successfully  
- ✅ **Issue Book** - Should work
- ✅ **View Reports** - Should show data

### Check 4: Backend Health Check
Visit your backend health endpoint:
- URL: `https://your-backend.railway.app/api/health`
- Should return: `{"status":"OK","message":"Library Management System API is running"}`

## ❌ Troubleshooting

### Problem: Warning Banner Still Shows

**Solution**:
1. Check if you redeployed after adding the variable
2. Verify the variable name is exactly `VITE_API_URL` (case-sensitive)
3. Make sure the value ends with `/api`
4. Check that all 3 environments are selected

### Problem: Still Getting 404 Errors

**Check**:
1. **Backend is Running**: Visit `https://your-backend.railway.app/api/health`
2. **Environment Variable**: Vercel → Settings → Environment Variables → Verify `VITE_API_URL` exists
3. **Redeployed**: Make sure you clicked "Redeploy" after adding the variable
4. **URL Format**: Should be `https://your-backend.railway.app/api` (with `/api`)

### Problem: CORS Errors

**Solution**: 
- Backend already has CORS enabled in `server.js`
- If you see CORS errors, check backend logs on Railway

### Problem: Environment Variable Not Working

**Common Mistakes**:
- ❌ Variable name is wrong (should be `VITE_API_URL`, not `API_URL`)
- ❌ Value doesn't include `/api` at the end
- ❌ Didn't redeploy after adding variable
- ❌ Only selected one environment instead of all three

## 📝 Quick Reference

**Environment Variable**:
- **Key**: `VITE_API_URL`
- **Value**: `https://your-backend.railway.app/api`
- **Environments**: Production, Preview, Development (all three)

**Backend Health Check**:
- `https://your-backend.railway.app/api/health`

**Vercel Dashboard**:
- https://vercel.com/dashboard

**Railway Dashboard**:
- https://railway.app

## 🎉 Success!

Once you complete all 3 steps and verify:
- ✅ Warning banner disappears
- ✅ Console shows correct API URL
- ✅ All features work (Add Student, Add Book, Issue Book, Reports)
- ✅ No 404 errors

Your LMS is now fully functional! 🚀

