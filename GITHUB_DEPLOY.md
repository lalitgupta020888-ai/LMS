# GitHub Deployment Guide

## Step 1: Create GitHub Repository

1. GitHub.com par jao aur login karo
2. Top right corner par **"+"** button click karo
3. **"New repository"** select karo
4. Repository details fill karo:
   - **Repository name**: `library-management-system` (ya koi bhi naam)
   - **Description**: "Library Management System with React and Node.js"
   - **Visibility**: Public ya Private (apne hisaab se)
   - **⚠️ Important**: README, .gitignore, ya license mat add karo (hamare paas already hai)
5. **"Create repository"** button click karo

## Step 2: Push Code to GitHub

GitHub repository create hone ke baad, waha par commands dikhenge. Ya phir neeche diye gaye commands use karo:

### Option 1: Using PowerShell Script (Easiest)

```powershell
.\deploy-to-github.ps1
```

Script aap se GitHub repository URL puchhega, phir automatically push kar dega.

### Option 2: Manual Commands

GitHub repository URL copy karo (example: `https://github.com/yourusername/library-management-system.git`)

Phir ye commands run karo:

```powershell
cd F:\project\LMS
git remote add origin https://github.com/yourusername/library-management-system.git
git branch -M main
git push -u origin main
```

## Step 3: Verify

GitHub repository page par jao aur verify karo ki sab files upload ho gayi hain.

## Important Notes

- Database file (`library.db`) automatically ignore ho jayega (.gitignore mein hai)
- `.env` files bhi ignore hongi (security ke liye)
- `node_modules` folder ignore ho jayega (size bahut bada hai)

## Future Updates

Jab bhi code update karo, ye commands use karo:

```powershell
cd F:\project\LMS
git add .
git commit -m "Your commit message"
git push
```

