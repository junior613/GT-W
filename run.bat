@echo off
chcp 65001 >nul
echo ========================================
echo   Workflow Manager - Streamlit
echo ========================================
echo.

echo [1/2] Verification des dependances Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo ERREUR: Python n'est pas installe ou n'est pas dans le PATH
    echo Veuillez installer Python 3.8 ou superieur depuis python.org
    pause
    exit /b 1
)

echo Python detecte!

echo.
echo [2/2] Lancement de l'application...
echo.
echo L'application va s'ouvrir dans votre navigateur par defaut.
echo Pour arreter l'application, appuyez sur Ctrl+C dans cette fenetre.
echo.

REM Installer les dependances si necessaire
if not exist "venv" (
    echo Creation d'un environnement virtuel...
    python -m venv venv
)

REM Activer l'environnement virtuel
call venv\Scripts\activate.bat

REM Installer/mettre a jour les dependances
echo Installation des dependances...
pip install -r requirements.txt -q

echo.
echo ========================================
echo   Lancement de Streamlit...
echo ========================================
echo.

streamlit run app.py --server.headless true --server.port 8501

if errorlevel 1 (
    echo.
    echo ERREUR: Streamlit n'a pas pu etre lance.
    echo Verifiez que les dependances sont correctement installees.
    pause
)