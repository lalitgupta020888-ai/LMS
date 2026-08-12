Write-Host "🚀 Starting Library Management System Frontend..." -ForegroundColor Green
cd web
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Yellow
    npm install
}
Write-Host "✅ Starting development server on http://localhost:3000" -ForegroundColor Green
npm run dev
