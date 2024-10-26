@echo off
echo Trying to stop the FastAPI server...

:: Tentar parar o servidor Python
taskkill /F /IM python.exe >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo Error stopping the server.
) else (
    echo FastAPI server stopped successfully.
)
