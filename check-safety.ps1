# Pre-commit Safety Check
# Run this script before pushing to GitHub

Write-Host "🔍 Checking for sensitive files..." -ForegroundColor Cyan

# Check if .env files are tracked
$envFiles = git ls-files | Select-String "\.env$|\.env\.local|\.env\.development|\.env\.production"

if ($envFiles) {
    Write-Host "❌ DANGER: Environment files are tracked in git!" -ForegroundColor Red
    Write-Host $envFiles
    Write-Host "`nRun: git rm --cached FILE_NAME" -ForegroundColor Yellow
    exit 1
} else {
    Write-Host "✅ No environment files tracked" -ForegroundColor Green
}

# Check if node_modules is tracked
$nodeModules = git ls-files | Select-String "node_modules"

if ($nodeModules) {
    Write-Host "❌ WARNING: node_modules is tracked!" -ForegroundColor Red
    exit 1
} else {
    Write-Host "✅ node_modules is not tracked" -ForegroundColor Green
}

# Check if .next is tracked
$nextBuild = git ls-files | Select-String "\.next/"

if ($nextBuild) {
    Write-Host "❌ WARNING: .next build folder is tracked!" -ForegroundColor Red
    exit 1
} else {
    Write-Host "✅ Build folders not tracked" -ForegroundColor Green
}

# Verify .env.local is ignored
$envCheck = git check-ignore .env.local 2>&1

if ($envCheck -match ".env.local") {
    Write-Host "✅ .env.local is properly ignored" -ForegroundColor Green
} else {
    Write-Host "⚠️  WARNING: .env.local might not be ignored!" -ForegroundColor Yellow
}

Write-Host "`n✨ All checks passed! Safe to commit." -ForegroundColor Green
Write-Host "Remember to review your changes with git diff" -ForegroundColor Cyan
