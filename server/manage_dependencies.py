import subprocess
import sys
import os

script_dir = os.path.dirname(os.path.abspath(__file__))  # Get the directory of the current script
sys.path.append(script_dir)  # Add it to the system path

# Função para instalar pacotes com pip
def install(package):
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', package])

# Lista de pacotes que precisamos verificar e instalar
packages = ['fastapi', 'uvicorn', 'httpx']

# Verificar e instalar dependências
missing_packages = []

for package in packages:
    try:
        __import__(package)
    except ImportError:
        print(f"{package} Is not installed, adding to installing list.")
        missing_packages.append(package)

# Instalar todos os pacotes ausentes de uma vez
if missing_packages:
    print("Installing missing packages...")
    for package in missing_packages:
        install(package)

print("All dependencies are installed.")