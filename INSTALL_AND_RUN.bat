@echo off
echo ========================================
echo   Workflow Manager - Installation & Lancement
echo ========================================
echo.

echo [ETAPE 1/4] Verification des dependances...
if not exist node_modules (
    echo Installation des dependances npm...
    call npm install
    if errorlevel 1 (
        echo ERREUR: npm install a echoue
        pause
        exit /b 1
    )
) else (
    echo Dependances deja installees.
)

echo.
echo [ETAPE 2/4] Nettoyage...
if exist dist rmdir /s /q dist 2>nul
if exist node_modules\better-sqlite3\build rmdir /s /q node_modules\better-sqlite3\build 2>nul

echo.
echo [ETAPE 3/4] Reconstruction de better-sqlite3 pour Electron...
echo IMPORTANT: Cela peut prendre plusieurs minutes selon votre connexion.
call npm rebuild better-sqlite3 --runtime=electron --target=29.4.6 --disturl=https://electronjs.org/headers

if errorlevel 1 (
    echo.
    echo ERREUR: La reconstruction a echoue.
    echo Tentative de reinstallation complete...
    call npm install better-sqlite3 --save --runtime=electron --target=29.4.6 --disturl=https://electronjs.org/headers
    
    if errorlevel 1 (
        echo.
        echo ERREUR CRITIQUE: Impossible de reconstruire better-sqlite3.
        echo Solution: Essayez de mettre a jour Node.js ou utilisez une version differente.
        pause
        exit /b 1
    )
)

echo.
echo [ETAPE 4/4] Lancement de l'application...
echo.
echo L'application va s'ouvrir dans quelques instants...
echo Appuyez sur Ctrl+C pour arreter.
echo.
call npm run electron:dev

if errorlevel 1 (
    echo.
    echo L'application s'est arretee avec une erreur.
    echo Verifiez les messages ci-dessus pour plus de details.
    pause
)