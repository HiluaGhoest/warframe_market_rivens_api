@echo off
setlocal
cd resources
cd app.asar.unpacked
cd server

:: Função para verificar se o Python está instalado
python --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo Python not found. Please install Python 3.13.
    start "" "https://www.python.org/ftp/python/3.13.0/python-3.13.0-amd64.exe"
    exit /b
)

echo Python is already installed.

:: Obter o diretório do script atual
set "scriptDir=%~dp0"
echo Current script directory: %scriptDir%

:: Instalar as dependências do Python
set "manageDependenciesPath=%scriptDir%manage_dependencies.py"
echo Installing dependencies by running: %manageDependenciesPath%
python "%manageDependenciesPath%"
if %ERRORLEVEL% neq 0 (
    echo Error installing dependencies.
    exit /b
)

:: Iniciar o servidor FastAPI
python -m uvicorn proxy:app --host 127.0.0.1 --port 8000
echo FastAPI server started.

endlocal
