@echo off
rem Batch file to serve your test_index.html via a local HTTP server and open it in the default browser

rem 1. Change to your project directory
cd /d D:\PROJECT IK2

rem 2. Check if Node.js http-server is installed
where http-server >nul 2>&1
if errorlevel 1 (
    echo "http-server" not found. Installing globally via npm...
    npm install -g http-server
)

rem 3. Start HTTP server on port 8080 (runs in background)
start "" cmd /k "http-server . -p 8080 --cors"

rem 4. Give server a moment to start
timeout /t 2 /nobreak >nul

rem 5. Open test_index.html in default browser
start "" "http://localhost:8080/test_index.html"

rem 6. (Опционально) оставить окно открытым
pause
