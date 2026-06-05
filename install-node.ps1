[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
$nodeUrl = "https://nodejs.org/dist/v20.11.1/node-v20.11.1-x64.msi"
$installerPath = "$env:TEMP\node-installer.msi"

Write-Host "Downloading Node.js LTS v20.11.1..." -ForegroundColor Green
Invoke-WebRequest -Uri $nodeUrl -OutFile $installerPath

Write-Host "Running installer (this may take a minute)..." -ForegroundColor Green
Start-Process msiexec.exe -ArgumentList "/i","$installerPath","/quiet","/norestart" -Wait

Write-Host "Cleaning up..." -ForegroundColor Green
Remove-Item $installerPath -Force

Write-Host "Node.js installation complete!" -ForegroundColor Green
Write-Host "Please restart PowerShell to refresh PATH and use npm" -ForegroundColor Yellow
