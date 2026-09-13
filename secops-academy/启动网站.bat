@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ============================================
echo   SecOps Academy 安全运营学院
echo   正在启动本地服务器...
echo ============================================
start "" "http://127.0.0.1:8642/index.html"
py -m http.server 8642 --bind 127.0.0.1 2>nul || node serve.js 2>nul
echo.
echo 服务器已停止。重新双击本文件即可再次启动。
pause
