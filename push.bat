@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ===== git pull =====
git pull --no-edit
if errorlevel 1 goto :fail_pull

rem 有未解決的合併衝突就停止，避免把衝突標記當成已解決 commit 出去
git diff --name-only --diff-filter=U | findstr /r "." >nul
if not errorlevel 1 goto :fail_conflict

echo ===== git add =====
git add .
if errorlevel 1 goto :fail

git diff --cached --quiet
if not errorlevel 1 (
  echo 沒有需要提交的變更。
  goto :done
)

set "msg="
set /p msg=Commit message，格式 type: 繁體中文說明（直接按 Enter 使用預設）:
if "%msg%"=="" set "msg=chore: 更新網站內容"

echo ===== git commit =====
git commit -m "%msg%"
if errorlevel 1 goto :fail

echo ===== git push =====
git push
if errorlevel 1 goto :fail

:done
echo.
echo ===== DONE =====
pause
exit /b 0

:fail_pull
echo.
echo [錯誤] git pull 失敗，已停止。請先處理衝突或網路問題後再執行。
pause
exit /b 1

:fail_conflict
echo.
echo [錯誤] 仍有未解決的合併衝突，已停止。請先解決衝突再執行。
pause
exit /b 1

:fail
echo.
echo [錯誤] 上一個步驟失敗，已停止，未繼續後續動作。
pause
exit /b 1
