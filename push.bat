@echo off
cd /d "%~dp0"
echo ===== git pull =====
git pull --no-edit
echo ===== git add =====
git add .
set "msg="
set /p msg=Commit message (press Enter to use default):
if "%msg%"=="" set "msg=Update site content"
echo ===== git commit =====
git commit -m "%msg%"
echo ===== git push =====
git push
echo.
echo ===== DONE =====
pause
