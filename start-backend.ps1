Write-Host "🚀 Starting Library Management System Backend..." -ForegroundColor Green
cd backend
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing backend dependencies..." -ForegroundColor Yellow
    npm install
}
if (-not (Test-Path ".env")) {
    Write-Host "📝 Creating .env file..." -ForegroundColor Yellow
    Copy-Item "env.example" ".env"
}
Write-Host "✅ Starting server on http://localhost:5000" -ForegroundColor Green
npm start

