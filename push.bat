@echo off
cd /d "%~dp0"
echo ===== git pull =====
git pull --no-edit
echo ===== git add =====
git add .
echo ===== git commit =====
git commit -m "Update site content"
echo ===== git push =====
git push
echo.
echo ===== DONE =====
pause
