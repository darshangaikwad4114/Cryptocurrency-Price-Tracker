@echo off
echo Adding Live Update Indicator to your app...
echo.

cd /d "%~dp0"

powershell -Command "$content = Get-Content 'src\App.jsx'; $content[10] += \"`r`nimport LastUpdated from './components/LastUpdated';\"; Set-Content 'src\App.jsx' $content"

echo.
echo Now adding component to header...
echo.

powershell -Command "(Get-Content 'src\App.jsx') -replace '\"FAKE_LINE\"', \"^      ^<div style=\\{\\{\"textAlign: '\''center'\'', padding: '\''0.5rem'\''\\}\\}\\}\">^<LastUpdated /^>^</div^>\" | Set-Content 'src\App.jsx'"

echo.
echo Creating backup and modifying file...
echo.

REM Create backup
copy src\App.jsx src\App.jsx.bak

REM Read the file
setlocal enabledelayedexpansion

REM Add import after line 10
powershell -Command "$lines = Get-Content 'src\App.jsx'; $lines[10] = $lines[10] + \"`r`nimport LastUpdated from './components/LastUpdated';\"; $lines | Set-Content 'src\App.jsx'"

echo.
echo ========================================
echo IMPORT IN ADDED!
echo ========================================
echo.
echo NOW YOU NEED TO MANUALLY ADD THE COMPONENT:
echo.
echo 1. Open src\App.jsx
echo 2. Find line: ^</header^>
echo 3. Add this AFTER it:
echo.
echo     ^<div style=\{\{textAlign: '\''center'\'', padding: '\''0.5rem'\''\}\}\^>
echo       ^<LastUpdated /^>
echo     ^</div^>
echo.
echo 4. Save the file
echo.
echo Your browser will reload automatically!
echo.
pause
