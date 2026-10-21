@echo off
chcp 65001 >nul
cd /d "%~dp0"
set PORT=8123
set URL=http://localhost:%PORT%/

rem すでにサーバーが動いていれば、ブラウザを開くだけ
netstat -ano | findstr ":%PORT% " | findstr LISTENING >nul
if not errorlevel 1 (
  echo サーバーはすでに起動しています。ブラウザを開きます。
  start "" "%URL%"
  exit /b 0
)

where python >nul 2>nul
if errorlevel 1 (
  echo Python が見つかりません。Python をインストールしてください。
  pause
  exit /b 1
)

echo Gravity Flip を起動しています...
echo 遊び終わったら、このウィンドウを閉じてください。
echo.

rem サーバーの起動を2秒待ってからブラウザを開く
start "" /min cmd /c "timeout /t 2 /nobreak >nul & start "" "%URL%""
python -m http.server %PORT%
