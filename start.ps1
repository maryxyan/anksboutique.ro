# ============================================================
# Anks Boutique - Startup Script (Windows / PowerShell)
# ============================================================

$ProjectRoot = "C:\P\2026\anks"
$PgDataDir   = "C:\Program Files\PostgreSQL\18\data"

# ── 1. Start PostgreSQL ─────────────────────────────────────
Write-Host "⏳ Starting PostgreSQL..." -ForegroundColor Cyan
pg_ctl start -D "$PgDataDir" -l "$ProjectRoot\pg.log" 2>$null
Start-Sleep -Seconds 2

# ── 2. Start API Server ─────────────────────────────────────
Write-Host "⏳ Starting API Server on :8080..." -ForegroundColor Cyan
$env:DATABASE_URL = "postgresql://anksboutique:password123@localhost:5432/anksboutique"
$env:PORT         = "8080"
$env:NODE_ENV     = "development"

$apiJob = Start-Job -Name "API-Server" -ScriptBlock {
    param($root)
    Set-Location $root
    $env:DATABASE_URL = $using:DATABASE_URL
    $env:PORT         = $using:PORT
    $env:NODE_ENV     = "development"

    # Ensure deps exist inside the workspace before running build/start.
    pnpm -r --filter @workspace/api-server install --frozen-lockfile

    pnpm --filter @workspace/api-server run dev
} -ArgumentList $ProjectRoot


Start-Sleep -Seconds 5

# ── 3. Start Frontend (Vite) ────────────────────────────────
Write-Host "⏳ Starting Frontend on :5173..." -ForegroundColor Cyan
$env:PORT     = "5173"
$env:BASE_PATH = "/"

$frontJob = Start-Job -Name "Frontend" -ScriptBlock {
    param($root)
    Set-Location $root
    $env:PORT     = $using:PORT
    $env:BASE_PATH = "/"
    pnpm --filter @workspace/ank-boutique run dev
} -ArgumentList $ProjectRoot

Start-Sleep -Seconds 3

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║   🚀  Anks Boutique is running!                  ║" -ForegroundColor Green
Write-Host "╠══════════════════════════════════════════════════╣" -ForegroundColor Green
Write-Host "║   Frontend   →  http://localhost:5173             ║" -ForegroundColor Green
Write-Host "║   API Server →  http://localhost:8080/api         ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "Press any key to stop all services..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# ── Stop everything ──────────────────────────────────────────
Write-Host "`n🛑 Stopping services..." -ForegroundColor Yellow
Stop-Job $apiJob; Stop-Job $frontJob
Remove-Job $apiJob; Remove-Job $frontJob
Write-Host "✅ Done. Goodbye!" -ForegroundColor Green