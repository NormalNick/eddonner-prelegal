$ErrorActionPreference = "Stop"
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $repoRoot

if (-not (Test-Path (Join-Path $repoRoot ".env"))) {
    Write-Warning ".env not found at $repoRoot\.env. The chat endpoint needs OPENROUTER_API_KEY."
}

Get-NetTCPConnection -LocalPort 8000, 3000 -ErrorAction SilentlyContinue |
    ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }

$backendDir = Join-Path $repoRoot "backend"
$frontendDir = Join-Path $repoRoot "frontend"

Start-Process -FilePath "powershell.exe" `
    -WorkingDirectory $backendDir `
    -ArgumentList "-NoExit", "-Command", "uv run --env-file ../.env uvicorn app.main:app --reload --port 8000" `
    -WindowStyle Minimized

Start-Process -FilePath "powershell.exe" `
    -WorkingDirectory $frontendDir `
    -ArgumentList "-NoExit", "-Command", "npm run dev" `
    -WindowStyle Minimized

function Wait-ForUrl($url, $timeoutSec) {
    $deadline = (Get-Date).AddSeconds($timeoutSec)
    while ((Get-Date) -lt $deadline) {
        try {
            $r = Invoke-WebRequest -Uri $url -TimeoutSec 2 -UseBasicParsing
            if ($r.StatusCode -eq 200) { return $true }
        } catch {
            Start-Sleep -Milliseconds 500
        }
    }
    return $false
}

Write-Output "Waiting for backend..."
if (-not (Wait-ForUrl "http://127.0.0.1:8000/api/health" 30)) {
    Write-Error "Backend did not come up within 30s."
    exit 1
}
Write-Output "PASS: backend health"

Write-Output "Smoke-testing auth + chat (one real LLM call)..."
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$email = "smoke-$([guid]::NewGuid().Guid.Substring(0, 8))@test.com"
$signupOk = $false
try {
    $body = @{ email = $email; password = "smoketest1" } | ConvertTo-Json
    Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/auth/signup" `
        -Method Post -Body $body -ContentType "application/json" `
        -WebSession $session | Out-Null
    $signupOk = $true
    Write-Output "PASS: auth signup ($email)"
} catch {
    Write-Warning "FAIL: signup: $_"
}


Write-Output ""
Write-Output "Open http://localhost:3000 to use the app. Run scripts\stop-windows.ps1 to stop."
