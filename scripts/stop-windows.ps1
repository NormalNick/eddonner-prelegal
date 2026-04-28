$ErrorActionPreference = "Stop"

Get-NetTCPConnection -LocalPort 8000, 3000 -ErrorAction SilentlyContinue |
    ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }

Write-Output "Stopped processes on ports 8000 and 3000."
