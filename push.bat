@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ===== git pull =====
git pull --no-edit
echo ===== git add =====
git add .
set "msg="
set /p msg=Commit message，格式 type: 繁體中文說明（直接按 Enter 使用預設）:
if "%msg%"=="" set "msg=chore: 更新網站內容"
echo ===== git commit =====
git commit -m "%msg%"
echo ===== git push =====
git push
echo.
echo ===== DONE =====
pause
