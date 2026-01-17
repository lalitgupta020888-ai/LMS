Write-Host "🚀 GitHub Deployment Script" -ForegroundColor Cyan
Write-Host "==========================`n" -ForegroundColor Cyan

$repoUrl = Read-Host "Enter your GitHub repository URL (e.g., https://github.com/username/repo-name.git)"

if ([string]::IsNullOrWhiteSpace($repoUrl)) {
    Write-Host "❌ Repository URL is required!" -ForegroundColor Red
    exit 1
}

if (-not $repoUrl.StartsWith("http")) {
    Write-Host "❌ Invalid repository URL format!" -ForegroundColor Red
    Write-Host "Please use format: https://github.com/username/repo-name.git" -ForegroundColor Yellow
    exit 1
}

Write-Host "`n📦 Checking git status..." -ForegroundColor Yellow

$currentBranch = git branch --show-current 2>$null
if (-not $currentBranch) {
    Write-Host "❌ Not a git repository. Please run 'git init' first." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Current branch: $currentBranch" -ForegroundColor Green

Write-Host "`n🔗 Adding remote repository..." -ForegroundColor Yellow
$remoteExists = git remote get-url origin 2>$null
if ($remoteExists) {
    Write-Host "⚠️  Remote 'origin' already exists. Updating..." -ForegroundColor Yellow
    git remote set-url origin $repoUrl
} else {
    git remote add origin $repoUrl
}
Write-Host "✅ Remote added: $repoUrl" -ForegroundColor Green

Write-Host "`n🌿 Setting branch to 'main'..." -ForegroundColor Yellow
git branch -M main 2>$null
Write-Host "✅ Branch set to 'main'" -ForegroundColor Green

Write-Host "`n📤 Pushing code to GitHub..." -ForegroundColor Yellow
Write-Host "This may ask for your GitHub credentials..." -ForegroundColor Cyan

$pushResult = git push -u origin main 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Successfully deployed to GitHub!" -ForegroundColor Green
    Write-Host "`n🌐 Your repository: $repoUrl" -ForegroundColor Cyan
    Write-Host "`nYou can now view your code on GitHub!" -ForegroundColor Yellow
} else {
    Write-Host "`n❌ Error pushing to GitHub:" -ForegroundColor Red
    Write-Host $pushResult -ForegroundColor Red
    Write-Host "`n💡 Common issues:" -ForegroundColor Yellow
    Write-Host "1. Check if repository URL is correct" -ForegroundColor Yellow
    Write-Host "2. Make sure you have access to the repository" -ForegroundColor Yellow
    Write-Host "3. You may need to authenticate with GitHub" -ForegroundColor Yellow
    Write-Host "4. If repository is empty, try: git push -u origin main --force" -ForegroundColor Yellow
}

