# Start Backend
Write-Host "Starting Backend..."
Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "& .\.venv\Scripts\Activate.ps1; python -m backend.main" -WorkingDirectory "$PSScriptRoot"

# Start Frontend
Write-Host "Starting Frontend..."
Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev" -WorkingDirectory "$PSScriptRoot"

Write-Host "Both services started in separate windows."
